import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Layers, Plus, Search, FolderOpen, Users } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { roleLabel, serviceRole, type Service } from './types'

export function ServiceCards({ services, email }: { services: Service[]; email: string }) {
    return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{services.map((service) => <Link key={service.id} to={`/service/${service.id}`} className="group min-w-0 space-y-5 rounded-xl border bg-card p-5 transition-colors hover:border-ring/50 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="flex items-center justify-between"><div className="rounded-lg bg-muted p-2.5"><Layers className="size-5" /></div><span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">{roleLabel(serviceRole(service, email) ?? 'member')}</span></div>
        <div><h2 className="flex items-center justify-between gap-2 font-semibold"><span className="truncate">{service.name}</span><ArrowUpRight className="size-4 shrink-0 text-muted-foreground" /></h2><p className="mt-2 line-clamp-2 min-h-10 break-words text-sm text-muted-foreground">{service.description || '등록된 설명이 없습니다.'}</p></div>
        <div className="flex flex-wrap gap-4 border-t pt-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><FolderOpen className="size-3.5" />인덱스 {service.indices.length}</span><span className="flex items-center gap-1.5"><Users className="size-3.5" />사용자 {service.members.length}</span><span className="ml-auto">{new Date(service.created_at).toLocaleDateString('ko-KR')}</span></div>
    </Link>)}</div>
}

export default function ServiceList({ services, email }: { services: Service[]; email: string }) {
    const [query, setQuery] = useState('')
    const filtered = services.filter((service) => `${service.name} ${service.description}`.toLowerCase().includes(query.trim().toLowerCase()))
    return <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold">서비스</h1><p className="mt-2 text-sm text-muted-foreground">서비스별 인덱스와 사용자 권한을 관리하세요.</p></div><Button asChild><Link to="/service/new"><Plus />서비스 생성</Link></Button></div>
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="relative w-full sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="서비스 검색" className="pl-9" placeholder="서비스 이름 또는 설명 검색" value={query} onChange={(e) => setQuery(e.target.value)} /></div><p className="text-sm text-muted-foreground">총 {filtered.length}개 · 최신 생성순</p></div>
        {filtered.length ? <ServiceCards services={filtered} email={email} /> : <div className="rounded-xl border border-dashed py-16 text-center"><Layers className="mx-auto mb-4 size-8 text-muted-foreground" /><h2 className="font-medium">{query ? '검색 결과가 없습니다' : '아직 등록된 서비스가 없습니다'}</h2><p className="mt-2 text-sm text-muted-foreground">{query ? '다른 검색어를 입력해 보세요.' : '첫 서비스를 만들고 인덱스를 한곳에서 관리하세요.'}</p>{!query && <Button asChild variant="outline" className="mt-5"><Link to="/service/new"><Plus />첫 서비스 만들기</Link></Button>}</div>}
    </div>
}
