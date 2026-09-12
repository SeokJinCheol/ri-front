import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useIndices } from '@/hooks/use-indices'
import { listModels, type ModelConfig } from '@/api/models'
import { Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { listDocuments, uploadDocument, type DocumentRecord, type EmbeddingSelection } from '@/api/documents'
import { apiError } from '@/lib/api'
import { useProjectStore } from '@/stores/use-project-store'

const DocumentsPage = () => {
    const project = useProjectStore((state) => state.projects.find((item) => item.id === state.selectedProjectId))
    const [documents, setDocuments] = useState<DocumentRecord[]>([])
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
    const [indexId, setIndexId] = useState('')
    useEffect(() => {
        setIndexId(indices.some((item) => item.id === requestedIndex) ? requestedIndex! : '')
    }, [project?.id, requestedIndex, indices])
    const validIndex = indices.some((item) => item.id === indexId)
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
                if (!controller.signal.aborted) { setModels(items); setEmbedding(items[0]?.id ?? '') }
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
            setMessage(`${projectName}: ${result.filename} 처리 완료 (${result.chunk_count}개 청크)`)
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
                <h1 className="text-2xl font-semibold">Documents</h1>
                <p className="text-sm text-muted-foreground">문서를 업로드하면 텍스트를 추출하고 청킹·임베딩하여 저장합니다.</p>
            </div>
            <div className="space-y-4 rounded-lg border border-dashed p-6">
                <label htmlFor="document-index" className="block text-sm font-medium">인덱스</label>
                <select id="document-index" value={validIndex ? indexId : ''} disabled={uploading || indicesLoading} onChange={(event) => setIndexId(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">{indicesLoading ? '인덱스를 불러오는 중…' : '인덱스를 선택하세요'}</option>
                    {indices.map((item) => <option key={item.id} value={item.id}>{item.service_name} · {item.name}</option>)}
                </select>
                {indicesError && <p role="alert" className="text-sm text-destructive">{indicesError} <button type="button" className="underline" onClick={() => setRefresh((value) => value + 1)}>다시 시도</button></p>}
                {!indicesLoading && !indices.length && <p className="text-sm text-muted-foreground">문서를 업로드하려면 인덱스가 필요합니다. <Link to="/index/new" className="underline">인덱스 생성</Link></p>}
                <label htmlFor="embedding-model" className="block text-sm font-medium">임베딩 모델</label>
                <select id="embedding-model" value={embedding} disabled={uploading || modelsLoading}
                    onChange={(event) => setEmbedding(event.target.value as EmbeddingSelection)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="" disabled>{modelsLoading ? '모델을 불러오는 중…' : '설정에서 모델을 등록하세요'}</option>
                    {models.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.model}</option>)}
                </select>
                {modelsError && <p role="alert" className="text-sm text-destructive">{modelsError} <button type="button" className="underline" onClick={() => setRefresh((value) => value + 1)}>다시 시도</button></p>}
                <Link to="/setting" className="inline-block text-sm underline">모델 및 API 키 설정</Link>
                {models.find((item) => item.id === embedding)?.provider === 'openai' && <p className="text-xs text-muted-foreground">
                    문서 텍스트를 OpenAI로 전송하여 처리하며 API 사용 요금이 발생합니다.
                </p>}
                <label htmlFor="document-file" className="block text-sm font-medium">업로드할 문서</label>
                <input ref={input} id="document-file" type="file" accept=".txt,.md,.pdf"
                    disabled={!project || uploading} className="block w-full text-sm"
                    onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(''); setMessage('') }} />
                <p className="text-xs text-muted-foreground">TXT·Markdown(UTF-8), 텍스트 PDF · 기본 최대 10MB · 임베딩 결과 최대 100MB · 스캔 PDF는 OCR 필요</p>
                <Button onClick={upload} disabled={!project || !file || !embedding || !validIndex || indicesLoading || modelsLoading || uploading || loading}>
                    {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                    {uploading ? (progress < 100 ? `업로드 중 ${progress}%` : '청킹·임베딩 처리 중…') : 'Upload'}
                </Button>
                {uploading && <div role="status" className="space-y-2 text-sm text-muted-foreground">
                    <progress className="w-full" value={progress} max={100} aria-label="파일 전송 진행률" />
                    <p>처리가 끝날 때까지 이 화면을 유지해주세요. 문서 크기에 따라 시간이 걸릴 수 있습니다.</p>
                </div>}
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                {message && <p role="status" className="text-sm text-emerald-600">{message}</p>}
            </div>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold">문서 목록</h2>
                    <Button variant="outline" size="sm" disabled={loading || uploading || !project} onClick={() => setRefresh((value) => value + 1)}>새로고침</Button>
                </div>
                {listError && <p role="alert" className="text-sm text-destructive">{listError}</p>}
                {loading ? <p role="status" className="text-sm text-muted-foreground">문서를 불러오는 중…</p> :
                    documents.length === 0 ? <p className="rounded-lg border p-8 text-center text-sm text-muted-foreground">{listError ? '목록을 불러오지 못했습니다.' : '업로드된 문서가 없습니다.'}</p> :
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted"><tr><th className="p-3">문서</th><th className="p-3">인덱스</th><th className="p-3">원본 / 임베딩 크기</th><th className="p-3">청크</th><th className="p-3">상태</th><th className="p-3">업로드 일시</th></tr></thead>
                            <tbody>{documents.map((document) => <tr key={document.id} className="border-t">
                                <td className="max-w-xs break-all p-3"><Link to={`/documents/${document.id}`} className="underline">{document.filename}</Link><p className="text-xs text-muted-foreground">{document.embedding_provider === 'openai' ? 'OpenAI' : 'Ollama'} · {document.embedding_model} · {document.embedding_dimensions}차원</p></td>
                                <td className="p-3">{document.index_id ? <Link className="underline" to={`/index/${document.index_id}`}>{indices.find((item) => item.id === document.index_id)?.name ?? '인덱스 상세'}</Link> : '미지정'}</td>
                                <td className="whitespace-nowrap p-3">{(document.size_bytes / 1024).toFixed(1)} KB<p className="text-xs text-muted-foreground">임베딩 {(document.embedding_size_bytes / 1_000_000).toFixed(2)} MB</p></td>
                                <td className="p-3"><Link className="underline" to={`/documents/${document.id}`}>{document.chunk_count}개 보기</Link></td><td className="whitespace-nowrap p-3">완료</td>
                                <td className="whitespace-nowrap p-3">{new Date(document.created_at).toLocaleString('ko-KR')}<p className="text-xs text-muted-foreground">수정 {new Date(document.updated_at).toLocaleString('ko-KR')}</p></td>
                            </tr>)}</tbody>
                        </table>
                    </div>}
            </div>
        </section>
    )
}
export default DocumentsPage
