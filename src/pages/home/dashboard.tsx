import { useLocale } from '@/providers/locale-provider'
import { Link } from 'react-router-dom'
import { ArrowRight, Layers, FolderOpen, ShieldCheck, Plus } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { useServices } from '@/pages/services'
import { ServiceCards } from '@/pages/services/list'
import { serviceRole } from '@/pages/services/types'

export default function Dashboard() {
    const { t } = useLocale()
    const { services, email, loading, error, reload } = useServices()
    const stats = [
        { label: t("pages.home.dashboard.001"), count: services.length, icon: Layers },
        { label: t("pages.home.dashboard.002"), count: services.reduce((sum, item) => sum + item.indices.length, 0), icon: FolderOpen },
        { label: t("pages.home.dashboard.003"), count: services.filter((item) => serviceRole(item, email) === 'admin').length, icon: ShieldCheck },
    ]
    return <section className="space-y-8 p-3">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold">{t("pages.home.dashboard.004")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("pages.home.dashboard.005")}</p></div><Button asChild><Link to="/service/new"><Plus />{t("pages.home.dashboard.006")}</Link></Button></div>
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{t("pages.home.dashboard.007")}</p>
        {loading && <p role="status">{t("pages.home.dashboard.008")}</p>}
        {error && <div><p role="alert" className="text-destructive">{error}</p><Button variant="outline" onClick={reload}>{t("routes.index.001")}</Button></div>}
        {!loading && !error && <><div className="grid gap-4 sm:grid-cols-3">{stats.map(({ label, count, icon: Icon }) => <div key={label} className="rounded-xl border bg-card p-5"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>{label}</span><Icon className="size-5" /></div><p className="mt-4 text-3xl font-semibold tabular-nums">{count}<span className="ml-2 text-sm font-normal text-muted-foreground">{t("pages.home.dashboard.009")}</span></p></div>)}</div>
        <div className="space-y-4"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{t("pages.home.dashboard.010")}</h2><Button asChild variant="ghost" size="sm"><Link to="/service">{t("pages.home.dashboard.011")}<ArrowRight /></Link></Button></div>
            {services.length ? <ServiceCards services={services.slice(0, 6)} email={email} /> : <div className="rounded-xl border border-dashed px-5 py-14 text-center"><Layers className="mx-auto mb-4 size-8 text-muted-foreground" /><h3 className="font-medium">{t("pages.home.dashboard.012")}</h3><p className="mt-2 text-sm text-muted-foreground">{t("pages.home.dashboard.013")}</p><Button asChild variant="outline" className="mt-5"><Link to="/service/new"><Plus />{t("pages.home.dashboard.006")}</Link></Button></div>}
        </div>
        </>}
    </section>
}
