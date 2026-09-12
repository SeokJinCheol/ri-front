import { Link } from 'react-router-dom'
import { ArrowRight, Layers, FolderOpen, ShieldCheck, Plus } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { useServices } from '@/pages/services'
import { ServiceCards } from '@/pages/services/list'
import { serviceRole } from '@/pages/services/types'

export default function Dashboard() {
    const { services, email, loading, error, reload } = useServices()
    const stats = [
        { label: '참여 서비스', count: services.length, icon: Layers },
        { label: '하위 인덱스', count: services.reduce((sum, item) => sum + item.indices.length, 0), icon: FolderOpen },
        { label: '관리 중인 서비스', count: services.filter((item) => serviceRole(item, email) === 'admin').length, icon: ShieldCheck },
    ]
    return <section className="space-y-8 p-3">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold">대시보드</h1><p className="mt-2 text-sm text-muted-foreground">서비스와 인덱스 현황을 한눈에 확인하세요.</p></div><Button asChild><Link to="/service/new"><Plus />서비스 생성</Link></Button></div>
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">현재 프로젝트에서 참여 중인 서비스 기준입니다.</p>
        {loading && <p role="status">서비스 목록을 불러오는 중…</p>}
        {error && <div><p role="alert" className="text-destructive">{error}</p><Button variant="outline" onClick={reload}>다시 시도</Button></div>}
        {!loading && !error && <><div className="grid gap-4 sm:grid-cols-3">{stats.map(({ label, count, icon: Icon }) => <div key={label} className="rounded-xl border bg-card p-5"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>{label}</span><Icon className="size-5" /></div><p className="mt-4 text-3xl font-semibold tabular-nums">{count}<span className="ml-2 text-sm font-normal text-muted-foreground">개</span></p></div>)}</div>
        <div className="space-y-4"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">최근 서비스</h2><Button asChild variant="ghost" size="sm"><Link to="/service">전체 보기<ArrowRight /></Link></Button></div>
            {services.length ? <ServiceCards services={services.slice(0, 6)} email={email} /> : <div className="rounded-xl border border-dashed px-5 py-14 text-center"><Layers className="mx-auto mb-4 size-8 text-muted-foreground" /><h3 className="font-medium">첫 서비스를 만들어 보세요</h3><p className="mt-2 text-sm text-muted-foreground">서비스를 만들고 함께 사용할 사용자를 등록할 수 있습니다.</p><Button asChild variant="outline" className="mt-5"><Link to="/service/new"><Plus />서비스 생성</Link></Button></div>}
        </div>
        </>}
    </section>
}
