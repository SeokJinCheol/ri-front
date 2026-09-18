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
    return <section className="space-y-6 p-3"><Link className="text-sm underline" to="/documents">문서 목록</Link>
        {error && <p role="alert" className="text-destructive">{error}</p>}
        {doc && <><div className="flex flex-wrap items-start justify-between gap-3"><div className="space-y-2"><h1 className="break-all text-2xl font-semibold">{doc.filename}</h1>
            <p className="text-sm text-muted-foreground">청크 {doc.chunk_count}개 · 임베딩 {(doc.embedding_size_bytes / 1_000_000).toFixed(2)} / 100 MB</p>
            <p className="text-xs text-muted-foreground">생성 {new Date(doc.created_at).toLocaleString('ko-KR')} · 수정 {new Date(doc.updated_at).toLocaleString('ko-KR')}</p></div>
            <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={loading || saving} onClick={() => { setFilename(doc.filename); setIndexId(doc.index_id ?? ''); setEditing(true) }}>문서 정보 수정</Button>
                <Button variant="destructive" disabled={loading || saving} onClick={() => setConfirmDelete(true)}><Trash2 />문서 삭제</Button></div></div>
            {editing && <form className="space-y-3 rounded-xl border p-5" onSubmit={save}><fieldset disabled={saving || indicesLoading} className="space-y-3">
                <label htmlFor="document-name" className="block text-sm">문서 이름</label><Input id="document-name" value={filename} onChange={(event) => setFilename(event.target.value)} required maxLength={255} />
                <label htmlFor="document-edit-index" className="block text-sm">인덱스</label><Select id="document-edit-index" className="h-10 w-full rounded-md border bg-background px-3" value={indexId} onValueChange={(selectedValue) => setIndexId(selectedValue)}><option value="">미지정</option>{indices.map((index) => <option key={index.id} value={index.id}>{index.name}</option>)}</Select>
                {indicesError && <p role="alert" className="text-destructive">{indicesError}</p>}
                <div className="flex gap-2"><Button disabled={!!indicesError}>변경 저장</Button><Button type="button" variant="outline" onClick={() => setEditing(false)}>취소</Button></div>
            </fieldset></form>}
        </>}
        <div className="flex items-center justify-between"><h2 className="font-semibold">청크 문서 목록</h2><Button variant="outline" disabled={loading || saving} onClick={() => setRefresh((value) => value + 1)}>새로고침</Button></div>
        {loading ? <p role="status">청크를 불러오는 중…</p> : page && <>
            <div className="space-y-3">{page.items.map((chunk) => <details key={chunk.chunk_index} className="rounded-lg border p-4"><summary className="cursor-pointer text-sm font-medium">청크 {chunk.chunk_index + 1} · 임베딩 {(chunk.embedding_size_bytes / 1024).toFixed(1)} KB · {chunk.embedding_dimensions}차원</summary><p className="mt-4 whitespace-pre-wrap break-words text-sm">{chunk.content}</p></details>)}</div>
            {!page.items.length && <p className="text-sm text-muted-foreground">저장된 청크가 없습니다.</p>}
            <div className="flex items-center justify-between gap-3"><Button variant="outline" disabled={offset === 0} onClick={() => setOffset((value) => Math.max(0, value - 50))}>이전</Button><span className="text-sm">{page.total ? offset + 1 : 0}–{Math.min(offset + page.items.length, page.total)} / {page.total}</span><Button variant="outline" disabled={offset + 50 >= page.total} onClick={() => setOffset((value) => value + 50)}>다음</Button></div>
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
