import { Select } from '@/components/atoms/select'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, FolderOpen, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { createIndex, deleteIndex, getIndex, updateIndex, type IndexRecord } from '@/api/indices'
import { listDocuments, type DocumentRecord } from '@/api/documents'
import { useIndices } from '@/hooks/use-indices'
import { useProjectStore } from '@/stores/use-project-store'
import { useServiceList } from '@/hooks/use-service-list'
import { useAuth } from '@/providers/auth-provider'
import { serviceRole } from '@/pages/services/types'
import { apiError } from '@/lib/api'

function Back() { return <Link to="/index" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4" />인덱스 목록</Link> }

function IndexList({ projectId }: { projectId: string }) {
    const [refresh, setRefresh] = useState(0)
    const { indices, loading, error } = useIndices(projectId, refresh)
    return <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">인덱스 목록</h1><p className="mt-2 text-sm text-muted-foreground">서비스별 인덱스와 연결된 문서를 관리합니다.</p></div>
            <div className="flex gap-2"><Button variant="outline" disabled={loading} onClick={() => setRefresh((value) => value + 1)}>새로고침</Button><Button asChild><Link to="/index/new"><Plus />인덱스 생성</Link></Button></div></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {loading ? <p role="status">인덱스를 불러오는 중…</p> : !error && !indices.length ? <div className="rounded-xl border p-12 text-center text-muted-foreground"><FolderOpen className="mx-auto mb-3 size-8" /><p>등록된 인덱스가 없습니다.</p><Link className="mt-3 inline-block text-sm underline" to="/index/new">첫 인덱스 생성</Link></div> :
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{indices.map((item) => <Link key={item.id} to={`/index/${item.id}`} className="space-y-3 rounded-xl border bg-card p-5 transition-colors hover:bg-accent">
                <p className="break-words text-xs text-muted-foreground">{item.service_name}</p><h2 className="break-words font-semibold">{item.name}</h2><p className="line-clamp-2 break-words text-sm text-muted-foreground">{item.description || '등록된 설명이 없습니다.'}</p>
                <div className="flex justify-between gap-2 border-t pt-3 text-xs text-muted-foreground"><span>문서 {item.document_count}개</span><span>{new Date(item.created_at).toLocaleDateString('ko-KR')}</span></div>
            </Link>)}</div>}
    </div>
}

function IndexCreate({ projectId }: { projectId: string }) {
    const { user } = useAuth()
    const { services: allServices, loading: servicesLoading, error: servicesError, reload } = useServiceList(projectId, user?.email ?? '')
    const services = allServices.filter((item) => item.project_id === projectId && serviceRole(item, user?.email ?? '') === 'admin')
    const [search] = useSearchParams()
    const [serviceId, setServiceId] = useState(search.get('service_id') ?? '')
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const busy = useRef(false)
    const navigate = useNavigate()
    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (busy.current) return
        const service = services.find((item) => item.id === serviceId)
        if (!name.trim() || !service) { setError('인덱스 이름과 서비스를 확인하세요.'); return }
        busy.current = true; setSaving(true); setError('')
        try {
            const saved = await createIndex(projectId, { name: name.trim(), description: description.trim(), service_id: service.id, service_name: service.name })
            navigate(`/index/${saved.id}`, { replace: true })
        } catch (err) { setError(apiError(err)) }
        finally { busy.current = false; setSaving(false) }
    }
    return <div className="space-y-6"><Back /><h1 className="text-2xl font-semibold">인덱스 생성</h1>
        <p role="status" hidden={!servicesLoading}>서비스 목록을 불러오는 중…</p>
        {servicesError && <div><p role="alert" className="text-destructive">{servicesError}</p><Button variant="outline" onClick={reload}>다시 시도</Button></div>}
        <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-xl border bg-card p-6"><fieldset disabled={saving || servicesLoading || !!servicesError} className="space-y-5">
            <div className="space-y-2"><label htmlFor="index-name" className="text-sm font-medium">이름</label><Input id="index-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required placeholder="예: 고객 지원 문서" /></div>
            <div className="space-y-2"><label htmlFor="index-description" className="text-sm font-medium">설명 (선택)</label><textarea id="index-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={4} className="w-full rounded-md border border-input bg-background p-3 text-sm" placeholder="인덱스에 담을 문서를 설명해 주세요" /></div>
            <div className="space-y-2"><label htmlFor="index-service" className="text-sm font-medium">서비스</label><Select id="index-service" value={serviceId} onValueChange={(selectedValue) => setServiceId(selectedValue)} required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">서비스를 선택하세요</option>{services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
                {!servicesLoading && !servicesError && !services.length && <p className="text-sm text-muted-foreground">관리자로 등록된 서비스가 필요합니다. <Link to="/service/new" className="underline">서비스 생성</Link></p>}</div>
            <div className="flex gap-2"><Button type="submit" disabled={!services.length}>{saving ? '저장 중…' : '인덱스 생성'}</Button><Button type="button" variant="outline" onClick={() => navigate('/index')}>취소</Button></div>
        </fieldset>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</form>
    </div>
}

function IndexDetail({ projectId }: { projectId: string }) {
    const { indexId = '' } = useParams()
    const [index, setIndex] = useState<IndexRecord | null>(null)
    const [documents, setDocuments] = useState<DocumentRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [editing, setEditing] = useState(false)
    const [editName, setEditName] = useState('')
    const [editDescription, setEditDescription] = useState('')
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [refresh, setRefresh] = useState(0)
    const navigate = useNavigate()
    useEffect(() => {
        const controller = new AbortController()
        setIndex(null); setDocuments([]); setLoading(true); setError('')
        Promise.all([getIndex(projectId, indexId, controller.signal), listDocuments(projectId, controller.signal, indexId)])
            .then(([record, docs]) => { if (!controller.signal.aborted) { setIndex(record); setDocuments(docs) } })
            .catch((err) => { if (!controller.signal.aborted) setError(apiError(err)) })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [projectId, indexId, refresh])
    async function remove() {
        if (!index || deleting || !window.confirm(`“${index.name}” 인덱스를 삭제할까요? 문서는 유지되고 인덱스 연결만 해제됩니다.`)) return
        setDeleting(true); setError('')
        try { await deleteIndex(projectId, indexId); navigate('/index', { replace: true }) }
        catch (err) { setError(apiError(err)); setDeleting(false) }
    }
    return <div className="space-y-6"><Back />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {loading ? <p role="status">인덱스와 문서를 불러오는 중…</p> : index && <>
            <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 space-y-2"><p className="break-words text-sm text-muted-foreground">{index.service_name}</p><h1 className="break-words text-2xl font-semibold">{index.name}</h1><p className="max-w-2xl whitespace-pre-wrap break-words text-sm text-muted-foreground">{index.description || '등록된 설명이 없습니다.'}</p><p className="text-xs text-muted-foreground">생성일 {new Date(index.created_at).toLocaleString('ko-KR')} · 수정일 {new Date(index.updated_at).toLocaleString('ko-KR')}</p></div>
                <Button variant="outline" disabled={deleting || saving} onClick={() => { setEditing(true); setEditName(index.name); setEditDescription(index.description) }}>수정</Button>
                <Button variant="destructive" disabled={deleting || saving} onClick={() => void remove()}><Trash2 />{deleting ? '삭제 중…' : '인덱스 삭제'}</Button></div>
            {editing && <form className="space-y-3 rounded-xl border p-5" onSubmit={async (event) => {
                event.preventDefault(); if (saving) return; setSaving(true); setError('')
                try { const updated = await updateIndex(projectId, index.id, { name: editName, description: editDescription, service_id: index.service_id, service_name: index.service_name }); setIndex(updated); setEditing(false) }
                catch (err) { setError(apiError(err)) } finally { setSaving(false) }
            }}><label className="block text-sm" htmlFor="edit-index-name">이름</label><Input id="edit-index-name" value={editName} onChange={(event) => setEditName(event.target.value)} required maxLength={80} disabled={saving} />
                <label className="block text-sm" htmlFor="edit-index-description">설명</label><Input id="edit-index-description" value={editDescription} onChange={(event) => setEditDescription(event.target.value)} maxLength={500} disabled={saving} /><div className="flex gap-2"><Button disabled={saving}>변경 저장</Button><Button type="button" variant="outline" disabled={saving} onClick={() => setEditing(false)}>취소</Button></div></form>}
            <div className="space-y-4 rounded-xl border p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">문서 목록 · {documents.length}개</h2><Button asChild disabled={deleting}><Link to={`/documents?index_id=${index.id}`}><Plus />문서 업로드</Link></Button></div>
                {!documents.length ? <p className="py-8 text-center text-sm text-muted-foreground">이 인덱스에 등록된 문서가 없습니다.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-muted"><tr><th className="p-3">문서</th><th className="p-3">크기</th><th className="p-3">청크</th><th className="p-3">등록일</th></tr></thead><tbody>{documents.map((doc) => <tr key={doc.id} className="border-t"><td className="break-all p-3"><Link to={`/documents/${doc.id}`} className="underline">{doc.filename}</Link><p className="text-xs text-muted-foreground">{doc.embedding_model}</p></td><td className="whitespace-nowrap p-3">{(doc.size_bytes / 1024).toFixed(1)} KB</td><td className="p-3">{doc.chunk_count}</td><td className="whitespace-nowrap p-3">{new Date(doc.created_at).toLocaleString('ko-KR')}<p className="text-xs text-muted-foreground">수정 {new Date(doc.updated_at).toLocaleString('ko-KR')}</p></td></tr>)}</tbody></table></div>}
            </div>
        </>}
        <Button variant="outline" disabled={loading || deleting} onClick={() => setRefresh((value) => value + 1)}>새로고침</Button>
    </div>
}

export default function IndicesPage() {
    const projectId = useProjectStore((state) => state.selectedProjectId)
    return <section key={projectId} className="space-y-6 p-3"><Routes>
        <Route index element={<IndexList projectId={projectId} />} />
        <Route path="new" element={<IndexCreate projectId={projectId} />} />
        <Route path=":indexId" element={<IndexDetail projectId={projectId} />} />
        <Route path="*" element={<Back />} />
    </Routes></section>
}
