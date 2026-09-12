import { useRef, useState } from 'react'
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, FolderOpen } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { useAuth } from '@/providers/auth-provider'
import { useProjectStore } from '@/stores/use-project-store'
import { useServiceList } from '@/hooks/use-service-list'
import { useIndices } from '@/hooks/use-indices'
import { useServiceStore } from '@/stores/use-service-store'
import { apiError } from '@/lib/api'
import ServiceForm from './form'
import ServiceList from './list'
import { normalizeEmail, roleLabel, serviceRole, type Service } from './types'
import type { SelectableUser } from './user-picker'

export function useServices() {
    const { user } = useAuth()
    const project = useProjectStore((state) => state.projects.find((item) => item.id === state.selectedProjectId))
    const { indices, loading: indicesLoading, error: indicesError } = useIndices(project?.id)
    const email = user?.email ?? ''
    const { services: all, loading, error, reload } = useServiceList(project?.id, email)
    const services = all.map((item) => ({ ...item, indices: indices.filter((index) => index.service_id === item.id) })).sort((a, b) => b.created_at.localeCompare(a.created_at))
    return { email, project, services, loading, error, reload, indicesLoading, indicesError }
}

function ServiceEditor({ projectId, email, services, creating = false }: { projectId: string; email: string; services: Service[]; creating?: boolean }) {
    const { user } = useAuth()
    const { serviceId } = useParams()
    const navigate = useNavigate()
    const save = useServiceStore((state) => state.save)
    const service = services.find((item) => item.id === serviceId)
    const projectMembers = useProjectStore((state) => state.projects.find((item) => item.id === projectId)?.members)
    const directory = new Map<string, SelectableUser>()
    services.forEach((item) => item.members.forEach((member) => {
        const normalized = normalizeEmail(member.email)
        directory.set(normalized, { email: normalized })
    }))
    projectMembers?.forEach((member) => {
        const normalized = normalizeEmail(member.email)
        directory.set(normalized, { email: normalized, name: member.name })
    })
    directory.set(normalizeEmail(email), { email: normalizeEmail(email), name: user?.name })
    const users = [...directory.values()].sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email, 'ko'))
    if (!creating && (!service || serviceRole(service, email) !== 'admin')) return <Unavailable />
    return <div className="space-y-6"><Back /><div><h1 className="text-2xl font-semibold">{creating ? '서비스 생성' : '서비스 수정'}</h1><p className="mt-2 text-sm text-muted-foreground">기본 정보와 서비스에 접근할 사용자를 설정하세요.</p></div>
        <ServiceForm key={serviceId ?? 'new'} initial={creating ? undefined : service} email={email} users={users} onCancel={() => navigate(creating ? '/service' : `/service/${serviceId}`)} onSave={async (input) => {
            const saved = await save(projectId, email, input, creating ? undefined : serviceId)
            navigate(serviceRole(saved, email) ? `/service/${saved.id}` : '/service')
        }} /></div>
}

function Back() { return <Link to="/service" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />서비스 목록</Link> }
function Unavailable() { return <div className="space-y-4"><Back /><p role="alert">서비스가 없거나 접근 권한이 없습니다.</p></div> }

function ServiceDetail({ services, email, projectId }: { services: Service[]; email: string; projectId: string }) {
    const { serviceId } = useParams()
    const service = services.find((item) => item.id === serviceId)
    const navigate = useNavigate()
    const remove = useServiceStore((state) => state.remove)
    const [error, setError] = useState('')
    const [deleting, setDeleting] = useState(false)
    const deletingRef = useRef(false)
    if (!service) return <Unavailable />
    const admin = serviceRole(service, email) === 'admin'
    return <div className="space-y-6"><Back /><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><div className="mb-2 text-sm text-muted-foreground">서비스 상세 · {roleLabel(serviceRole(service, email)!)}</div><h1 className="break-all text-2xl font-semibold">{service.name}</h1><p className="mt-2 max-w-2xl whitespace-pre-wrap break-words text-sm text-muted-foreground">{service.description || '등록된 설명이 없습니다.'}</p></div>
        {admin && <div className="flex gap-2"><Button asChild variant="outline"><Link to={`/service/${service.id}/edit`}><Pencil />수정</Link></Button><Button variant="destructive" disabled={deleting} onClick={async () => {
            if (deletingRef.current) return
            if (!window.confirm(`“${service.name}” 서비스를 삭제할까요? 서비스 사용자 등록이 삭제됩니다. 인덱스와 문서는 인덱스 페이지에서 계속 확인할 수 있습니다.`)) return
            deletingRef.current = true; setDeleting(true); setError('')
            try { await remove(projectId, email, service.id); navigate('/service') } catch (err) { setError(apiError(err)) }
            finally { deletingRef.current = false; setDeleting(false) }
        }}><Trash2 />{deleting ? '삭제 중…' : '삭제'}</Button></div>}</div>
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="rounded-xl border bg-card p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">하위 인덱스 <span className="ml-2 text-muted-foreground">{service.indices.length} / {service.index_limit ?? 5}</span></h2>{admin && <Button asChild size="sm" variant="outline"><Link to={`/index/new?service_id=${service.id}`}>인덱스 생성</Link></Button>}</div>
                {service.indices.length ? <div className="mt-4 divide-y">{service.indices.map((index) => <Link to={`/index/${index.id}`} key={index.id} className="block py-4 hover:underline"><p className="break-all font-medium">{index.name}</p><p className="mt-1 break-words text-sm text-muted-foreground">{index.description}</p></Link>)}</div> : <div className="py-14 text-center text-muted-foreground"><FolderOpen className="mx-auto mb-3 size-8" /><p className="text-sm">등록된 인덱스가 없습니다.</p></div>}
            </div>
            <div className="space-y-6"><div className="rounded-xl border bg-card p-5"><h2 className="font-semibold">등록 사용자 <span className="ml-2 text-muted-foreground">{service.members.length}</span></h2><div className="mt-4 space-y-4">{service.members.map((member) => <div key={member.email} className="flex items-center justify-between gap-3"><span className="min-w-0 break-all text-sm">{member.email}{member.email === email && <span className="ml-1 text-muted-foreground">(나)</span>}</span><span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs">{roleLabel(member.role)}</span></div>)}</div></div>
            <dl className="space-y-3 rounded-xl border bg-card p-5 text-sm"><div className="flex flex-wrap justify-between gap-2"><dt className="text-muted-foreground">생성일</dt><dd>{new Date(service.created_at).toLocaleString('ko-KR')}</dd></div><div className="flex flex-wrap justify-between gap-2"><dt className="text-muted-foreground">최근 수정</dt><dd>{new Date(service.updated_at).toLocaleString('ko-KR')}</dd></div></dl></div>
        </div></div>
}

export default function ServicesPage() {
    const { project, services, email, loading, error, reload, indicesLoading, indicesError } = useServices()
    if (!project) return <p>프로젝트를 선택하세요.</p>
    if (loading) return <p role="status">서비스 목록을 불러오는 중…</p>
    if (error) return <div className="space-y-3 p-3"><p role="alert" className="text-destructive">{error}</p><Button variant="outline" onClick={reload}>다시 시도</Button></div>
    return <section key={project.id} className="space-y-5 p-3"><p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">서비스를 선택해 인덱스와 사용자를 관리하세요.</p>{indicesLoading && <p role="status" className="text-sm text-muted-foreground">인덱스 목록을 불러오는 중…</p>}{indicesError && <p role="alert" className="text-sm text-destructive">인덱스 목록: {indicesError}</p>}<Routes>
        <Route index element={<ServiceList services={services} email={email} />} />
        <Route path="new" element={<ServiceEditor creating projectId={project.id} email={email} services={services} />} />
        <Route path=":serviceId" element={<ServiceDetail projectId={project.id} email={email} services={services} />} />
        <Route path=":serviceId/edit" element={<ServiceEditor projectId={project.id} email={email} services={services} />} />
        <Route path="*" element={<Unavailable />} />
    </Routes></section>
}
