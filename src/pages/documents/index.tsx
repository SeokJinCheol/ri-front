import { useLocale } from '@/providers/locale-provider'
import { Select } from '@/components/atoms/select'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useIndices } from '@/hooks/use-indices'
import { listModels, type ModelConfig } from '@/api/models'
import { AlertTriangle, FileText, FolderOpen, Loader2, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { listDocuments, uploadDocument, type DocumentRecord, type EmbeddingSelection } from '@/api/documents'
import { apiError } from '@/lib/api'
import { useProjectStore } from '@/stores/use-project-store'
import { DeleteDocumentDialog } from './delete-dialog'

const DocumentsPage = () => {
    const { t, dateLocale } = useLocale()
    const project = useProjectStore((state) => state.projects.find((item) => item.id === state.selectedProjectId))
    const [documents, setDocuments] = useState<DocumentRecord[]>([])
    const [deleteTarget, setDeleteTarget] = useState<DocumentRecord | null>(null)
    const [deleteMessage, setDeleteMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [listError, setListError] = useState('')
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [embedding, setEmbedding] = useState<EmbeddingSelection>('')
    const [models, setModels] = useState<ModelConfig[]>([])
    const [modelsLoading, setModelsLoading] = useState(true)
    const [modelsError, setModelsError] = useState('')
    const [progress, setProgress] = useState(0)
    const [refresh, setRefresh] = useState(0)
    const [search] = useSearchParams()
    const requestedIndex = search.get('index_id')
    const { indices, loading: indicesLoading, error: indicesError } = useIndices(project?.id, refresh)
    const selectionKey = `${project?.id ?? ''}:${requestedIndex ?? ''}`
    const [selection, setSelection] = useState({ key: '', indexId: '' })
    const indexId = selection.key === selectionKey ? selection.indexId : requestedIndex ?? ''
    const setIndexId = (value: string) => setSelection({ key: selectionKey, indexId: value })
    const selectedIndex = indices.find((item) => item.id === indexId)
    const validIndex = !!selectedIndex
    const fileSelectionDisabled = !project || !validIndex || indicesLoading || uploading
    const visibleDocuments = documents.filter((document) => document.project_id === project?.id && (!selectedIndex || document.index_id === selectedIndex.id))
    const input = useRef<HTMLInputElement>(null)
    const activeProject = useRef(project?.id)
    activeProject.current = project?.id
    const mounted = useRef(true)
    const busy = useRef(false)

    useEffect(() => {
        mounted.current = true
        return () => { mounted.current = false }
    }, [])

    useEffect(() => {
        const controller = new AbortController()
        setDocuments([])
        setDeleteTarget(null)
        setDeleteMessage('')
        setListError('')
        setError('')
        setMessage('')
        setFile(null)
        if (input.current) input.current.value = ''
        if (!project) { setLoading(false); return }
        setLoading(true)
        listDocuments(project.id, controller.signal)
            .then((result) => { if (!controller.signal.aborted) setDocuments(result) })
            .catch((err: unknown) => { if (!controller.signal.aborted) setListError(apiError(err)) })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [project?.id, refresh])

    useEffect(() => {
        const controller = new AbortController()
        setModels([])
        setEmbedding('')
        setModelsError('')
        if (!project) { setModelsLoading(false); return }
        setModelsLoading(true)
        listModels(project.id, controller.signal)
            .then((items) => {
                if (!controller.signal.aborted) { const embeddings = items.filter((item) => item.purpose === 'embedding'); setModels(embeddings); setEmbedding(embeddings[0]?.id ?? '') }
            })
            .catch((err) => { if (!controller.signal.aborted) setModelsError(apiError(err)) })
            .finally(() => { if (!controller.signal.aborted) setModelsLoading(false) })
        return () => controller.abort()
    }, [project?.id, refresh])

    async function upload() {
        if (!file || !project || !embedding || !validIndex || indicesLoading || modelsLoading || loading || busy.current) return
        const projectId = project.id
        const projectName = project.name
        busy.current = true
        setUploading(true)
        setProgress(0)
        setError('')
        setMessage('')
        try {
            const result = await uploadDocument(projectId, file, (value) => {
                if (mounted.current) setProgress(value)
            }, embedding, indexId)
            if (!mounted.current) return
            if (activeProject.current === projectId) {
                setDocuments((current) => [result, ...current.filter((item) => item.id !== result.id)])
                setFile(null)
                if (input.current) input.current.value = ''
            }
            setMessage(t("pages.documents.index.001", { v0: projectName, v1: result.filename, v2: result.chunk_count }))
        } catch (err) {
            if (mounted.current) setError(`${projectName}: ${apiError(err)}`)
        } finally {
            busy.current = false
            if (mounted.current) setUploading(false)
        }
    }

    return (
        <section className="space-y-6 p-3">
            <div className="space-y-2">
                <h1 className="text-2xl font-semibold">{t('nav.documents')}</h1>
                <p className="text-sm text-muted-foreground">{t("pages.documents.index.002")}</p>
            </div>
            <div className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
                <label htmlFor="document-index" className="block text-sm font-medium">{t("pages.documents.detail.006")}</label>
                <Select id="document-index" value={validIndex ? indexId : ''} disabled={uploading || indicesLoading} onValueChange={(selectedValue) => setIndexId(selectedValue)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">{indicesLoading ? t("pages.chat.index.012") : t("pages.documents.index.003")}</option>
                    {indices.map((item) => <option key={item.id} value={item.id}>{item.service_name} · {item.name}</option>)}
                </Select>
                <p className="text-xs text-muted-foreground">{t("pages.documents.index.004")}</p>
                {indicesError && <p role="alert" className="text-sm text-destructive">{indicesError} <button type="button" className="underline" onClick={() => setRefresh((value) => value + 1)}>{t("routes.index.001")}</button></p>}
                {!indicesLoading && !indices.length && <p className="text-sm text-muted-foreground">{t("pages.documents.index.005")}<Link to="/index/new" className="underline">{t("pages.documents.index.006")}</Link></p>}
                <label htmlFor="embedding-model" className="block text-sm font-medium">{t("pages.documents.index.007")}</label>
                <Select id="embedding-model" value={embedding} disabled={uploading || modelsLoading}
                    onValueChange={(selectedValue) => setEmbedding(selectedValue as EmbeddingSelection)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="" disabled>{modelsLoading ? t("pages.documents.index.008") : t("pages.documents.index.009")}</option>
                    {models.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.model}</option>)}
                </Select>
                {modelsError && <p role="alert" className="text-sm text-destructive">{modelsError} <button type="button" className="underline" onClick={() => setRefresh((value) => value + 1)}>{t("routes.index.001")}</button></p>}
                <Link to="/setting" className="inline-block text-sm underline">{t("pages.documents.index.010")}</Link>
                {models.find((item) => item.id === embedding)?.provider === 'openai' && <p className="text-xs text-muted-foreground">{t("pages.documents.index.011")}</p>}
                <div className="space-y-3 border-t pt-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-sm font-semibold">{t("pages.documents.index.012")}</h2>
                        {selectedIndex && <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"><FolderOpen className="size-3.5 shrink-0" /><span className="break-all">{t("pages.documents.index.013", { v0: selectedIndex.name })}</span></span>}
                    </div>
                    {!validIndex && !indicesLoading && <div role="alert" id="upload-index-warning" className="flex items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        <div className="space-y-1"><p className="text-sm font-medium">{t("pages.documents.index.014")}</p>
                            <p className="text-xs">{t("pages.documents.index.015")}</p></div>
                    </div>}
                    <input ref={input} id="document-file" type="file" accept=".txt,.md,.pdf" aria-label={t("pages.documents.index.016")}
                        disabled={fileSelectionDisabled} className="hidden" tabIndex={-1}
                        onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(''); setMessage('') }} />
                    <button type="button" disabled={fileSelectionDisabled} onClick={() => input.current?.click()}
                        aria-describedby={!validIndex && !indicesLoading ? 'upload-index-warning' : 'document-file-help'}
                        className="group flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-input bg-muted/20 px-5 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input disabled:hover:bg-muted/20">
                        <span className="flex size-12 items-center justify-center rounded-xl border bg-background text-muted-foreground"><Upload className="size-6" aria-hidden="true" /></span>
                        <span className="space-y-1"><span className="block text-sm font-medium">{indicesLoading ? t("pages.chat.index.012") : !validIndex ? t("pages.documents.index.017") : file ? t("pages.documents.index.018") : t("pages.documents.index.019")}</span>
                            <span id="document-file-help" className="block text-xs text-muted-foreground">{t("pages.documents.index.020")}</span></span>
                        <span className="rounded-md border bg-background px-4 py-2 text-xs font-medium">{t("pages.documents.index.021")}</span>
                    </button>
                    {file && <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                        <span className="rounded-lg bg-background p-2 text-primary"><FileText className="size-5" aria-hidden="true" /></span>
                        <div className="min-w-0 flex-1"><p className="break-all text-sm font-medium">{file.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{file.size >= 1_000_000 ? `${(file.size / 1_000_000).toFixed(1)} MB` : `${(file.size / 1024).toFixed(1)} KB`} · {validIndex ? t("pages.documents.index.022") : t("pages.documents.index.023")}</p></div>
                        <Button type="button" variant="ghost" size="icon" disabled={uploading} aria-label={t("pages.documents.index.024")} onClick={() => { setFile(null); if (input.current) input.current.value = ''; setError(''); setMessage('') }}><X /></Button>
                    </div>}
                    <p className="text-xs text-muted-foreground">{t("pages.documents.index.025")}</p>
                </div>
                <Button onClick={upload} disabled={!project || !file || !embedding || !validIndex || indicesLoading || modelsLoading || uploading || loading}>
                    {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                    {uploading ? (progress < 100 ? t("pages.documents.index.026", { v0: progress }) : t("pages.documents.index.027")) : t("pages.documents.index.012")}
                </Button>
                {uploading && <div role="status" className="space-y-2 text-sm text-muted-foreground">
                    <progress className="w-full" value={progress} max={100} aria-label={t("pages.documents.index.028")} />
                    <p>{t("pages.documents.index.029")}</p>
                </div>}
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                {message && <p role="status" className="text-sm text-emerald-600">{message}</p>}
            </div>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold">{t("pages.documents.detail.001")}</h2>
                    <Button variant="outline" size="sm" disabled={loading || uploading || !project} onClick={() => setRefresh((value) => value + 1)}>{t("pages.documents.detail.010")}</Button>
                </div>
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm" role="status">
                    <span className="text-muted-foreground">{t("pages.documents.index.030")}</span>
                    <span className="min-w-0 break-all font-medium">{selectedIndex ? `${selectedIndex.service_name} · ${selectedIndex.name}` : t("pages.documents.index.031")}</span>
                    {!loading && !listError && <span className="text-muted-foreground">{t("pages.documents.index.032", { v0: visibleDocuments.length })}</span>}
                    {selectedIndex && <Button variant="ghost" size="sm" className="ml-auto" disabled={uploading} onClick={() => setIndexId('')}>{t("pages.documents.index.033")}</Button>}
                </div>
                {listError && <p role="alert" className="text-sm text-destructive">{listError}</p>}
                {deleteMessage && <p role="status" className="text-sm text-emerald-600">{deleteMessage}</p>}
                {loading ? <p role="status" className="text-sm text-muted-foreground">{t("pages.documents.index.034")}</p> :
                    visibleDocuments.length === 0 ? <p className="rounded-lg border p-8 text-center text-sm text-muted-foreground">{listError ? t("pages.documents.index.035") : selectedIndex ? t("pages.documents.index.036") : t("pages.documents.index.037")}</p> :
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted"><tr><th className="p-3">{t("pages.documents.index.038")}</th><th className="p-3">{t("pages.documents.detail.006")}</th><th className="p-3">{t("pages.documents.index.039")}</th><th className="p-3">{t("pages.documents.index.040")}</th><th className="p-3">{t("pages.documents.index.041")}</th><th className="p-3">{t("pages.documents.index.042")}</th><th className="p-3">{t("pages.documents.index.043")}</th></tr></thead>
                            <tbody>{visibleDocuments.map((document) => <tr key={document.id} className="border-t">
                                <td className="max-w-xs break-all p-3"><Link to={`/documents/${document.id}`} className="underline">{document.filename}</Link><p className="text-xs text-muted-foreground">{t("pages.documents.index.044", { v0: document.embedding_provider === 'openai' ? 'OpenAI' : 'Ollama', v1: document.embedding_model, v2: document.embedding_dimensions })}</p></td>
                                <td className="p-3">{document.index_id ? <Link className="underline" to={`/index/${document.index_id}`}>{indices.find((item) => item.id === document.index_id)?.name ?? t("pages.documents.index.045")}</Link> : t("pages.documents.detail.007")}</td>
                                <td className="whitespace-nowrap p-3">{(document.size_bytes / 1024).toFixed(1)} KB<p className="text-xs text-muted-foreground">{t("pages.documents.index.046", { v0: (document.embedding_size_bytes / 1_000_000).toFixed(2) })}</p></td>
                                <td className="p-3"><Link className="underline" to={`/documents/${document.id}`}>{t("pages.documents.index.047", { v0: document.chunk_count })}</Link></td><td className="whitespace-nowrap p-3">{t("pages.documents.index.048")}</td>
                                <td className="whitespace-nowrap p-3">{new Date(document.created_at).toLocaleString(dateLocale)}<p className="text-xs text-muted-foreground">{t("pages.documents.index.049", { v0: new Date(document.updated_at).toLocaleString(dateLocale) })}</p></td>
                                <td className="p-3"><Button variant="outline" size="sm" className="text-destructive" disabled={uploading} aria-label={t("pages.chat.index.008", { v0: document.filename })} onClick={() => { setDeleteMessage(''); setDeleteTarget(document) }}><Trash2 />{t("pages.documents.delete-dialog.006")}</Button></td>
                            </tr>)}</tbody>
                        </table>
                    </div>}
            </div>
            {deleteTarget && deleteTarget.project_id === project?.id && <DeleteDocumentDialog key={deleteTarget.id} document={deleteTarget}
                onClose={() => setDeleteTarget(null)} onDeleted={() => {
                    setDocuments((current) => current.filter((item) => item.id !== deleteTarget.id))
                    setDeleteMessage(t("pages.documents.index.050", { v0: deleteTarget.filename }))
                    setDeleteTarget(null)
                }} />}
        </section>
    )
}
export default DocumentsPage
