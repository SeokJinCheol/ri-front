import { useLocale } from '@/providers/locale-provider'
import { Select } from '@/components/atoms/select'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { listChunks, updateDocument, type ChunkPage } from '@/api/documents'
import { useProjectStore } from '@/stores/use-project-store'
import { useIndices } from '@/hooks/use-indices'
import { apiError } from '@/lib/api'
import { DeleteDocumentDialog } from './delete-dialog'

function Detail({ projectId, documentId }: { projectId: string; documentId: string }) {
    const { t, dateLocale } = useLocale()
    const [page, setPage] = useState<ChunkPage | null>(null)
    const [offset, setOffset] = useState(0)
    const [refresh, setRefresh] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const navigate = useNavigate()
    const [filename, setFilename] = useState('')
    const [indexId, setIndexId] = useState('')
    const { indices, loading: indicesLoading, error: indicesError } = useIndices(projectId)
    useEffect(() => {
        const controller = new AbortController()
        setLoading(true); setError('')
        listChunks(projectId, documentId, offset, controller.signal)
            .then((result) => { if (!controller.signal.aborted) setPage(result) })
            .catch((err) => { if (!controller.signal.aborted) setError(apiError(err)) })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [projectId, documentId, offset, refresh])
    async function save(event: FormEvent) {
        event.preventDefault(); if (saving) return
        setSaving(true); setError('')
        try { await updateDocument(projectId, documentId, filename, indexId); setEditing(false); setRefresh((value) => value + 1) }
        catch (err) { setError(apiError(err)) } finally { setSaving(false) }
    }
    const doc = page?.document
    return <section className="space-y-6 p-3"><Link className="text-sm underline" to="/documents">{t("pages.documents.detail.001")}</Link>
        {error && <p role="alert" className="text-destructive">{error}</p>}
        {doc && <><div className="flex flex-wrap items-start justify-between gap-3"><div className="space-y-2"><h1 className="break-all text-2xl font-semibold">{doc.filename}</h1>
            <p className="text-sm text-muted-foreground">{t("pages.documents.detail.002", { v0: doc.chunk_count, v1: (doc.embedding_size_bytes / 1_000_000).toFixed(2) })}</p>
            <p className="text-xs text-muted-foreground">{t("pages.documents.detail.003", { v0: new Date(doc.created_at).toLocaleString(dateLocale), v1: new Date(doc.updated_at).toLocaleString(dateLocale) })}</p></div>
            <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={loading || saving} onClick={() => { setFilename(doc.filename); setIndexId(doc.index_id ?? ''); setEditing(true) }}>{t("pages.documents.detail.004")}</Button>
                <Button variant="destructive" disabled={loading || saving} onClick={() => setConfirmDelete(true)}><Trash2 />{t("pages.documents.delete-dialog.001")}</Button></div></div>
            {editing && <form className="space-y-3 rounded-xl border p-5" onSubmit={save}><fieldset disabled={saving || indicesLoading} className="space-y-3">
                <label htmlFor="document-name" className="block text-sm">{t("pages.documents.detail.005")}</label><Input id="document-name" value={filename} onChange={(event) => setFilename(event.target.value)} required maxLength={255} />
                <label htmlFor="document-edit-index" className="block text-sm">{t("pages.documents.detail.006")}</label><Select id="document-edit-index" className="h-10 w-full rounded-md border bg-background px-3" value={indexId} onValueChange={(selectedValue) => setIndexId(selectedValue)}><option value="">{t("pages.documents.detail.007")}</option>{indices.map((index) => <option key={index.id} value={index.id}>{index.name}</option>)}</Select>
                {indicesError && <p role="alert" className="text-destructive">{indicesError}</p>}
                <div className="flex gap-2"><Button disabled={!!indicesError}>{t("pages.documents.detail.008")}</Button><Button type="button" variant="outline" onClick={() => setEditing(false)}>{t("pages.documents.delete-dialog.004")}</Button></div>
            </fieldset></form>}
        </>}
        <div className="flex items-center justify-between"><h2 className="font-semibold">{t("pages.documents.detail.009")}</h2><Button variant="outline" disabled={loading || saving} onClick={() => setRefresh((value) => value + 1)}>{t("pages.documents.detail.010")}</Button></div>
        {loading ? <p role="status">{t("pages.documents.detail.011")}</p> : page && <>
            <div className="space-y-3">{page.items.map((chunk) => <details key={chunk.chunk_index} className="rounded-lg border p-4"><summary className="cursor-pointer text-sm font-medium">{t("pages.documents.detail.012", { v0: chunk.chunk_index + 1, v1: (chunk.embedding_size_bytes / 1024).toFixed(1), v2: chunk.embedding_dimensions })}</summary><p className="mt-4 whitespace-pre-wrap break-words text-sm">{chunk.content}</p></details>)}</div>
            {!page.items.length && <p className="text-sm text-muted-foreground">{t("pages.documents.detail.013")}</p>}
            <div className="flex items-center justify-between gap-3"><Button variant="outline" disabled={offset === 0} onClick={() => setOffset((value) => Math.max(0, value - 50))}>{t("pages.documents.detail.014")}</Button><span className="text-sm">{page.total ? offset + 1 : 0}–{Math.min(offset + page.items.length, page.total)} / {page.total}</span><Button variant="outline" disabled={offset + 50 >= page.total} onClick={() => setOffset((value) => value + 50)}>{t("pages.documents.detail.015")}</Button></div>
        </>}
        {confirmDelete && doc && <DeleteDocumentDialog document={doc} onClose={() => setConfirmDelete(false)}
            onDeleted={() => navigate(doc.index_id ? `/documents?index_id=${doc.index_id}` : '/documents', { replace: true })} />}
    </section>
}
export default function DocumentDetail() {
    const projectId = useProjectStore((state) => state.selectedProjectId)
    const { documentId = '' } = useParams()
    return <Detail key={`${projectId}:${documentId}`} projectId={projectId} documentId={documentId} />
}
