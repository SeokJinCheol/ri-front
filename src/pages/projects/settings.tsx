import { useLocale } from '@/providers/locale-provider'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { getProjectSettings, updateProjectSettings, isProjectAdmin, type Project, type ProjectMember } from '@/api/projects'
import { useProjectStore } from '@/stores/use-project-store'
import { useAuth } from '@/providers/auth-provider'
import { apiError } from '@/lib/api'

type MemberRow = ProjectMember & { key: string }

function SettingsForm({ project, email }: { project: Project; email: string }) {
    const { t, dateLocale } = useLocale()
    const [name, setName] = useState(project.name)
    const [description, setDescription] = useState(project.description)
    const [members, setMembers] = useState<MemberRow[]>(project.members.map((member) => ({ ...member, key: crypto.randomUUID() })))
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [allowed, setAllowed] = useState(true)
    const [updatedAt, setUpdatedAt] = useState(project.updated_at)
    const busy = useRef(false)
    const replaceProject = useProjectStore((state) => state.replaceProject)
    async function submit(event: FormEvent) {
        event.preventDefault()
        if (busy.current) return
        const normalized = members.map(({ name, email, role }) => ({ name: name.trim(), email: email.trim().toLowerCase(), role: role ?? 'member' }))
        if (!name.trim() || normalized.some((member) => !member.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email))) { setError(t("pages.projects.settings.001")); return }
        if (new Set(normalized.map((member) => member.email)).size !== normalized.length) { setError(t("pages.projects.create.002")); return }
        busy.current = true; setSaving(true); setError(''); setMessage('')
        try {
            const saved = await updateProjectSettings(project.id, email, { name, description, members: normalized })
            replaceProject(saved)
            setUpdatedAt(saved.updated_at)
            setAllowed(isProjectAdmin(saved, email))
            setMessage(t("pages.projects.settings.002"))
        } catch (err) { setError(apiError(err)) }
        finally { busy.current = false; setSaving(false) }
    }
    if (!allowed) return <p role="status">{t("pages.projects.settings.003")}</p>
    return <form onSubmit={submit} className="max-w-3xl space-y-5"><fieldset disabled={saving} className="space-y-5">
        <div className="space-y-4 rounded-xl border bg-card p-5">
            <h2 className="font-semibold">{t("pages.projects.settings.004")}</h2>
            <label htmlFor="project-settings-name" className="block text-sm">{t("pages.projects.create.006")}</label><Input id="project-settings-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} />
            <label htmlFor="project-settings-description" className="block text-sm">{t("pages.indices.index.020")}</label><textarea id="project-settings-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={200} rows={3} className="w-full rounded-md border bg-background p-3 text-sm" />
            <p className="text-xs text-muted-foreground">{t("pages.documents.detail.003", { v0: new Date(project.created_at).toLocaleString(dateLocale), v1: new Date(updatedAt).toLocaleString(dateLocale) })}</p>
        </div>
        <div className="space-y-4 rounded-xl border bg-card p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{t("pages.projects.settings.005", { v0: members.length })}</h2><Button type="button" variant="outline" size="sm" disabled={members.length >= 100} onClick={() => setMembers((items) => [...items, { key: crypto.randomUUID(), name: '', email: '', role: 'member' }])}><Plus />{t("pages.projects.create.011")}</Button></div>
            <p className="text-sm text-muted-foreground">{t("pages.projects.settings.006")}</p>
            {members.map((member, position) => {
                const creator = member.email === project.creator_email
                return <div key={member.key} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between"><h3 className="text-sm font-medium">{creator ? t("pages.projects.settings.007") : t("pages.projects.create.014", { v0: position + 1 })}</h3><Button type="button" variant="ghost" size="icon" disabled={creator} aria-label={t("pages.projects.create.015", { v0: position + 1 })} onClick={() => setMembers((items) => items.filter((item) => item.key !== member.key))}><Trash2 /></Button></div>
                    <div className="grid gap-3 sm:grid-cols-2"><div><label className="text-sm" htmlFor={`name-${member.key}`}>{t("pages.indices.index.008")}</label><Input id={`name-${member.key}`} value={member.name} required maxLength={80} onChange={(event) => setMembers((items) => items.map((item) => item.key === member.key ? { ...item, name: event.target.value } : item))} /></div>
                        <div><label className="text-sm" htmlFor={`email-${member.key}`}>{t("pages.login.index.004")}</label><Input id={`email-${member.key}`} type="email" value={member.email} required readOnly={creator} maxLength={254} onChange={(event) => setMembers((items) => items.map((item) => item.key === member.key ? { ...item, email: event.target.value } : item))} /></div></div>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={creator} checked={creator || member.role === 'admin'} onChange={(event) => setMembers((items) => items.map((item) => item.key === member.key ? { ...item, role: event.target.checked ? 'admin' : 'member' } : item))} />{t("pages.projects.settings.008")}</label>
                </div>
            })}
        </div>
        <Button type="submit">{saving ? t("pages.indices.index.014") : t("pages.documents.detail.008")}</Button>
    </fieldset>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status" className="text-sm text-emerald-600">{message}</p>}</form>
}

function SettingsLoader({ id, email }: { id: string; email: string }) {
    const { t } = useLocale()
    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [refresh, setRefresh] = useState(0)
    useEffect(() => {
        const controller = new AbortController()
        setLoading(true); setError(''); setProject(null)
        getProjectSettings(id, email, controller.signal)
            .then((value) => { if (!controller.signal.aborted) setProject(value) })
            .catch((err) => { if (!controller.signal.aborted) setError(apiError(err)) })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [id, email, refresh])
    return <>{loading ? <p role="status">{t("pages.projects.settings.009")}</p> : error ? <div className="space-y-3"><p role="alert">{error}</p><Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>{t("pages.projects.settings.010")}</Button></div> : project && <SettingsForm key={project.id} project={project} email={email} />}</>
}

export default function ProjectSettingsPage() {
    const { t } = useLocale()
    const id = useProjectStore((state) => state.selectedProjectId)
    const { user } = useAuth()
    return <section className="space-y-6 p-3"><div className="space-y-2"><h1 className="text-2xl font-semibold">{t("pages.projects.settings.011")}</h1><p className="text-sm text-muted-foreground">{t("pages.projects.settings.012")}</p><Link to="/setting" className="inline-block text-sm underline">{t("pages.projects.settings.013")}</Link></div>
        {user && id && <SettingsLoader key={`${id}:${user.email}`} id={id} email={user.email} />}
    </section>
}
