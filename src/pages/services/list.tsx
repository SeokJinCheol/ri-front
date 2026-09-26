import { useLocale } from '@/providers/locale-provider'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Layers, Plus, Search, FolderOpen, Users } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { roleLabel, serviceRole, type Service } from './types'

export function ServiceCards({ services, email }: { services: Service[]; email: string }) {
    const { t, dateLocale } = useLocale()
    return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{services.map((service) => <Link key={service.id} to={`/service/${service.id}`} className="group min-w-0 space-y-5 rounded-xl border bg-card p-5 transition-colors hover:border-ring/50 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="flex items-center justify-between"><div className="rounded-lg bg-muted p-2.5"><Layers className="size-5" /></div><span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">{roleLabel(serviceRole(service, email) ?? 'member')}</span></div>
        <div><h2 className="flex items-center justify-between gap-2 font-semibold"><span className="truncate">{service.name}</span><ArrowUpRight className="size-4 shrink-0 text-muted-foreground" /></h2><p className="mt-2 line-clamp-2 min-h-10 break-words text-sm text-muted-foreground">{service.description || t("pages.indices.index.005")}</p></div>
        <div className="flex flex-wrap gap-4 border-t pt-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><FolderOpen className="size-3.5" />{t("pages.services.list.001", { v0: service.indices.length })}</span><span className="flex items-center gap-1.5"><Users className="size-3.5" />{t('services.userCount', { count: service.members.length })}</span><span className="ml-auto">{new Date(service.created_at).toLocaleDateString(dateLocale)}</span></div>
    </Link>)}</div>
}

export default function ServiceList({ services, email }: { services: Service[]; email: string }) {
    const { t } = useLocale()
    const [query, setQuery] = useState('')
    const filtered = services.filter((service) => `${service.name} ${service.description}`.toLowerCase().includes(query.trim().toLowerCase()))
    return <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold">{t("pages.chat.index.032")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("pages.services.list.002")}</p></div><Button asChild><Link to="/service/new"><Plus />{t("pages.home.dashboard.006")}</Link></Button></div>
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="relative w-full sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label={t("pages.services.list.003")} className="pl-9" placeholder={t("pages.services.list.004")} value={query} onChange={(e) => setQuery(e.target.value)} /></div><p className="text-sm text-muted-foreground">{t("pages.services.list.005", { v0: filtered.length })}</p></div>
        {filtered.length ? <ServiceCards services={filtered} email={email} /> : <div className="rounded-xl border border-dashed py-16 text-center"><Layers className="mx-auto mb-4 size-8 text-muted-foreground" /><h2 className="font-medium">{query ? t("pages.services.list.006") : t("pages.services.list.007")}</h2><p className="mt-2 text-sm text-muted-foreground">{query ? t("pages.services.list.008") : t("pages.services.list.009")}</p>{!query && <Button asChild variant="outline" className="mt-5"><Link to="/service/new"><Plus />{t("pages.services.list.010")}</Link></Button>}</div>}
    </div>
}
