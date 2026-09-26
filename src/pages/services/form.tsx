import { useLocale } from '@/providers/locale-provider'
import { Select } from '@/components/atoms/select'
import { listModels, type ModelConfig } from '@/api/models'
import { useProjectStore } from '@/stores/use-project-store'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Trash2, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { apiError } from '@/lib/api'
import { normalizeEmail, roleLabel, type ServiceInput, type ServiceMember, type ServiceRole } from './types'
import UserPicker, { type SelectableUser } from './user-picker'

export default function ServiceForm({ initial, email, users, onSave, onCancel }: {
    initial?: ServiceInput
    email: string
    users: SelectableUser[]
    onSave: (input: ServiceInput) => Promise<void>
    onCancel: () => void
}) {
    const { t } = useLocale()
    const [name, setName] = useState(initial?.name ?? '')
    const [description, setDescription] = useState(initial?.description ?? '')
    const [members, setMembers] = useState<ServiceMember[]>(initial?.members ?? [{ email, role: 'admin' }])
    const [indexLimit, setIndexLimit] = useState(initial?.index_limit ?? 5)
    const projectId = useProjectStore((state) => state.selectedProjectId)
    const [models, setModels] = useState<ModelConfig[]>([])
    const [modelError, setModelError] = useState('')
    const [embeddingModel, setEmbeddingModel] = useState(initial?.embedding_model_id ?? '')
    const [generationModel, setGenerationModel] = useState(initial?.generation_model_id ?? '')
    const [topK, setTopK] = useState(initial?.search_top_k ?? 5)
    const [prompt, setPrompt] = useState(initial?.system_prompt ?? '')
    useEffect(() => {
        const controller = new AbortController()
        if (projectId) listModels(projectId, controller.signal).then(setModels).catch((err) => {
            if (!controller.signal.aborted) setModelError(apiError(err))
        })
        return () => controller.abort()
    }, [projectId])
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const locked = useRef(false)

    async function submit(event: FormEvent) {
        event.preventDefault()
        if (locked.current) return
        setError('')
        const normalized = members.map((member) => ({ ...member, email: normalizeEmail(member.email) }))
        if (!name.trim()) return setError(t("pages.services.form.001"))
        if (new Set(normalized.map((member) => member.email)).size !== normalized.length) return setError(t("stores.use-service-store.004"))
        if (!normalized.some((member) => member.role === 'admin')) return setError(t("stores.use-service-store.005"))
        locked.current = true
        setBusy(true)
        try {
            await onSave({ name: name.trim(), description: description.trim(), members: normalized, index_limit: indexLimit, embedding_model_id: embeddingModel || null, generation_model_id: generationModel || null, search_top_k: topK, system_prompt: prompt.trim() })
        } catch (err) {
            setError(apiError(err))
        } finally {
            locked.current = false
            setBusy(false)
        }
    }

    return <form onSubmit={submit} className="max-w-3xl space-y-6">
        <fieldset disabled={busy} className="space-y-6">
            <div className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
                <div><h2 className="font-semibold">{t("pages.projects.settings.004")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("pages.services.form.002")}</p></div>
                <div className="space-y-2"><label htmlFor="service-name" className="text-sm font-medium">{t("pages.services.form.003")}<span className="text-destructive">*</span></label>
                    <Input id="service-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} placeholder={t("pages.services.form.004")} /></div>
                <div className="space-y-2"><label htmlFor="service-index-limit" className="text-sm font-medium">{t("pages.services.form.005")}</label>
                    <Input id="service-index-limit" type="number" min={1} max={10000} step={1} required value={indexLimit} onChange={(event) => setIndexLimit(Number(event.target.value))} />
                    <p className="text-xs text-muted-foreground">{t("pages.services.form.006")}</p></div>
                <div className="space-y-2"><label htmlFor="service-description" className="text-sm font-medium">{t("pages.indices.index.020")}</label>
                    <textarea id="service-description" className="min-h-28 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder={t("pages.services.form.007")} /></div>
            </div>
            <div className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
                <h2 className="font-semibold">{t("pages.services.form.008")}</h2>
                <p className="text-sm text-muted-foreground">{t("pages.services.form.009")}</p>
                {modelError && <p role="alert" className="text-destructive">{modelError}</p>}
                {(['embedding', 'generation'] as const).map((purpose) => <div key={purpose} className="space-y-2">
                    <label htmlFor={`service-${purpose}`} className="text-sm font-medium">{purpose === 'embedding' ? t("pages.services.form.010") : t("pages.services.form.011")}</label>
                    <Select id={`service-${purpose}`} value={(purpose === 'embedding' ? embeddingModel : generationModel) || 'none'} onValueChange={(value) => (purpose === 'embedding' ? setEmbeddingModel : setGenerationModel)(value === 'none' ? '' : value)}>
                        <option value="none">{t("pages.services.form.012")}</option>
                        {models.filter((item) => item.purpose === purpose).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.model}</option>)}
                    </Select>
                </div>)}
                <div className="space-y-2"><label htmlFor="search-top-k" className="text-sm font-medium">{t("pages.services.form.013")}</label><Input id="search-top-k" type="number" min={1} max={20} required value={topK} onChange={(e) => setTopK(Number(e.target.value))} /></div>
                <div className="space-y-2"><label htmlFor="answer-style" className="text-sm font-medium">{t("pages.services.form.014")}</label><textarea id="answer-style" className="min-h-24 w-full rounded-md border bg-background p-3 text-sm" maxLength={2000} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t("pages.services.form.015")} /></div>
            </div>
            <div className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
                <div><h2 className="font-semibold">{t("pages.services.form.016")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("pages.services.form.017")}</p></div>
                <div className="grid gap-4 sm:grid-cols-2">{(['admin', 'member'] as ServiceRole[]).map((role) => {
                    const assigned = members.filter((member) => member.role === role)
                    const Icon = role === 'admin' ? ShieldCheck : Users
                    return <section key={role} className="min-w-0 rounded-lg border p-4" aria-labelledby={`service-${role}-title`}>
                        <div className="mb-4 space-y-3"><div className="flex items-center gap-2"><Icon className="size-4 text-muted-foreground" /><h3 id={`service-${role}-title`} className="font-medium">{roleLabel(role)}</h3><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{t("pages.services.form.018", { v0: assigned.length })}</span></div>
                            <p className="text-xs text-muted-foreground">{role === 'admin' ? t("pages.services.form.019") : t("pages.services.form.020")}</p>
                            <UserPicker role={role} users={users} members={members} onAdd={(emails) => {
                                setMembers((current) => [...current, ...emails.filter((value) => !current.some((member) => normalizeEmail(member.email) === value)).map((value) => ({ email: value, role }))])
                                setError('')
                            }} />
                        </div>
                        <div className="space-y-2">{assigned.map((member) => {
                            const creator = !initial && normalizeEmail(member.email) === normalizeEmail(email)
                            const required = creator || (role === 'admin' && assigned.length === 1)
                            const user = users.find((item) => normalizeEmail(item.email) === normalizeEmail(member.email))
                            return <div key={member.email} className="flex items-center gap-2 rounded-md bg-muted/50 p-2.5"><div className="min-w-0 flex-1">{user?.name && <p className="text-sm font-medium">{user.name}</p>}<p className="break-all text-sm">{member.email}</p>{creator && <p className="mt-1 text-xs text-muted-foreground">{t("pages.services.form.021")}</p>}</div>
                                <Button type="button" variant="ghost" size="icon" className="shrink-0" disabled={required} title={required ? t("pages.services.form.022") : t("pages.services.form.023")} aria-label={t("pages.services.form.024", { v0: member.email, v1: roleLabel(role) })} onClick={() => setMembers((current) => current.filter((item) => item.email !== member.email))}><Trash2 /></Button></div>
                        })}</div>
                        {!assigned.length && <p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">{t("pages.services.form.025", { v0: roleLabel(role) })}</p>}
                    </section>
                })}</div>
                <p className="text-xs text-muted-foreground">{t("pages.services.form.026")}</p>
            </div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>{t("pages.documents.delete-dialog.004")}</Button><Button type="submit">{busy ? t("pages.indices.index.014") : initial ? t("pages.documents.detail.008") : t("pages.home.dashboard.006")}</Button></div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
}
