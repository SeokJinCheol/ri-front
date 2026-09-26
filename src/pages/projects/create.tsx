import { useLocale } from '@/providers/locale-provider'
import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderPlus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { useProjectStore } from '@/stores/use-project-store'
import type { ProjectMember } from '@/api/projects'
import { apiError } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'

const CreateProjectPage = () => {
    const { t } = useLocale()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const { projects, createProject } = useProjectStore()
    const { logout, user } = useAuth()
    const [members, setMembers] = useState<(ProjectMember & { key: string })[]>([])
    const busy = useRef(false)

    const updateMember = (key: string, field: 'name' | 'email', value: string) => {
        setMembers((items) => items.map((item) => item.key === key ? { ...item, [field]: value } : item))
        setError('')
    }
    const navigate = useNavigate()

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (busy.current || !user) return
        if (!name.trim()) {
            setError(t("stores.use-project-store.001"))
            return
        }
        const normalized = members.map(({ name, email, role }) => ({ name: name.trim(), email: email.trim().toLowerCase(), role: role ?? 'member' }))
        if (normalized.some((member) => !member.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email))) {
            setError(t("pages.projects.create.001"))
            return
        }
        if (new Set(normalized.map((member) => member.email)).size !== normalized.length) {
            setError(t("pages.projects.create.002"))
            return
        }
        busy.current = true
        setIsSaving(true)
        setError('')
        try {
            await createProject(name, description, normalized, user)
            navigate('/home', { replace: true })
        } catch (error) {
            setError(apiError(error))
        } finally {
            busy.current = false
            setIsSaving(false)
        }
    }

    return (
        <section className="my-auto w-full max-w-md space-y-6" aria-labelledby="create-project-title">
            <div className="space-y-3">
                <div className="icon-gradient-badge flex size-12 items-center justify-center rounded-xl"><FolderPlus aria-hidden="true" /></div>
                <h1 id="create-project-title" className="text-2xl font-semibold">{projects.length === 0 ? t("pages.projects.create.003") : t("pages.projects.create.004")}</h1>
                <p className="text-sm text-muted-foreground">{t("pages.projects.create.005")}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-card p-6 shadow-sm">
                <fieldset disabled={isSaving} className="space-y-5">
                <div className="space-y-2">
                    <label htmlFor="project-name" className="text-sm font-medium">{t("pages.projects.create.006")}</label>
                    <Input id="project-name" value={name} onChange={(event) => { setName(event.target.value); setError('') }} placeholder={t("pages.projects.create.007")} maxLength={80} required aria-invalid={!!error} aria-describedby={error ? 'project-error' : undefined} />
                </div>
                <div className="space-y-2">
                    <label htmlFor="project-description" className="text-sm font-medium">{t("pages.indices.index.020")}<span className="text-muted-foreground">{t("pages.projects.create.008")}</span></label>
                    <Input id="project-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t("pages.projects.create.009")} maxLength={200} />
                </div>
                <div className="space-y-3 border-t pt-5">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-medium">{t("pages.projects.create.010")}<span className="text-muted-foreground">{t("pages.projects.create.008")}</span></h2>
                        <Button type="button" size="sm" variant="outline" disabled={members.length >= 99} onClick={() => setMembers((items) => [...items, { key: crypto.randomUUID(), name: '', email: '' }])}><Plus />{t("pages.projects.create.011")}</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{t("pages.projects.create.012")}</p>
                    <p className="rounded-md bg-muted p-3 text-sm">{t("pages.projects.create.013", { v0: user?.name, v1: user?.email })}</p>
                    {members.map((member, index) => <div key={member.key} className="space-y-3 rounded-lg border p-3">
                        <div className="flex items-center justify-between"><span className="text-sm font-medium">{t("pages.projects.create.014", { v0: index + 1 })}</span>
                            <Button type="button" size="icon" variant="ghost" aria-label={t("pages.projects.create.015", { v0: index + 1 })} onClick={() => { setMembers((items) => items.filter((item) => item.key !== member.key)); setError('') }}><Trash2 /></Button></div>
                        <div className="space-y-2"><label htmlFor={`member-name-${member.key}`} className="text-sm">{t("pages.indices.index.008")}</label>
                            <Input id={`member-name-${member.key}`} value={member.name} onChange={(event) => updateMember(member.key, 'name', event.target.value)} maxLength={80} required placeholder={t("pages.projects.create.016")} /></div>
                        <div className="space-y-2"><label htmlFor={`member-email-${member.key}`} className="text-sm">{t("pages.login.index.004")}</label>
                            <Input id={`member-email-${member.key}`} type="email" value={member.email} onChange={(event) => updateMember(member.key, 'email', event.target.value)} maxLength={254} required placeholder="name@example.com" /></div>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={member.role === 'admin'} onChange={(event) => setMembers((items) => items.map((item) => item.key === member.key ? { ...item, role: event.target.checked ? 'admin' : 'member' } : item))} />{t("pages.projects.create.017")}</label>
                    </div>)}
                </div>
                </fieldset>
                {error && <p id="project-error" role="alert" className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isSaving}>{isSaving ? t("pages.indices.index.014") : t("pages.projects.create.004")}</Button>
            </form>
            <div className="flex justify-center gap-2">
                {projects.length > 0 && <Button variant="ghost" onClick={() => navigate('/home')}>{t("pages.projects.create.018")}</Button>}
                <Button variant="ghost" onClick={logout}>{t("pages.projects.create.019")}</Button>
            </div>
        </section>
    )
}

export default CreateProjectPage
