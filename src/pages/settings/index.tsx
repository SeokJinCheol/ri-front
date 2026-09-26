import { useLocale } from '@/providers/locale-provider'
import { Select } from '@/components/atoms/select'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { isProjectAdmin } from '@/api/projects'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { deleteModel, listModels, saveModel, testModel, type ModelConfig } from '@/api/models'
import { apiError } from '@/lib/api'
import { useProjectStore } from '@/stores/use-project-store'

const selectClass = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm'
const ollamaModels = ['embeddinggemma:300m-qat-q8_0', 'embeddinggemma']

function ModelSettings({ projectId }: { projectId: string }) {
    const { t } = useLocale()
    const [models, setModels] = useState<ModelConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [listError, setListError] = useState('')
    const [message, setMessage] = useState('')
    const [refresh, setRefresh] = useState(0)
    const [editing, setEditing] = useState<ModelConfig | null>(null)
    const [name, setName] = useState('')
    const [provider, setProvider] = useState<ModelConfig['provider']>('openai')
    const [purpose, setPurpose] = useState<ModelConfig['purpose']>('embedding')
    const [model, setModel] = useState('text-embedding-3-small')
    const [customOllama, setCustomOllama] = useState(false)
    const [apiKey, setApiKey] = useState('')
    const locked = useRef(false)

    useEffect(() => {
        const controller = new AbortController()
        setLoading(true)
        setListError('')
        listModels(projectId, controller.signal)
            .then((items) => { if (!controller.signal.aborted) setModels(items) })
            .catch((err) => { if (!controller.signal.aborted) setListError(apiError(err)) })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [projectId, refresh])

    function reset() {
        setEditing(null)
        setName('')
        setProvider('openai')
        setPurpose('embedding')
        setModel('text-embedding-3-small')
        setCustomOllama(false)
        setApiKey('')
        setError('')
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (locked.current) return
        locked.current = true
        setBusy(true)
        setError('')
        setMessage('')
        try {
            const saved = await saveModel(projectId, {
                name: name.trim(), provider, purpose, model: model.trim(),
                ...(provider === 'openai' && apiKey.trim() ? { api_key: apiKey.trim() } : {}),
            }, editing?.id)
            setModels((items) => editing ? items.map((item) => item.id === saved.id ? saved : item) : [...items, saved])
            reset()
            setMessage(t("pages.settings.index.001"))
        } catch (err) {
            setError(apiError(err))
        } finally {
            setApiKey('')
            setBusy(false)
            locked.current = false
        }
    }

    async function remove(item: ModelConfig) {
        if (locked.current || !window.confirm(t("pages.settings.index.002", { v0: item.name }))) return
        locked.current = true
        setBusy(true)
        setError('')
        setMessage('')
        try {
            await deleteModel(projectId, item.id)
            setModels((items) => items.filter((value) => value.id !== item.id))
            if (editing?.id === item.id) reset()
            setMessage(t("pages.settings.index.003"))
        } catch (err) {
            setError(apiError(err))
        } finally {
            setBusy(false)
            locked.current = false
        }
    }

    const keyRequired = provider === 'openai' && !(editing?.provider === 'openai' && editing.has_api_key)

    return <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={submit} className="space-y-4 rounded-lg border p-6">
            <h2 className="font-semibold">{editing ? t("pages.settings.index.004") : t("pages.settings.index.005")}</h2>
            <fieldset disabled={busy || loading} className="space-y-4">
                <div className="space-y-2"><label htmlFor="model-name" className="text-sm font-medium">{t("pages.indices.index.008")}</label>
                    <Input id="model-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required placeholder={t("pages.settings.index.006")} /></div>
                <div className="space-y-2"><label htmlFor="model-purpose" className="text-sm font-medium">{t("pages.settings.index.007")}</label>
                    <Select id="model-purpose" value={purpose} onValueChange={(value) => {
                        setPurpose(value as ModelConfig['purpose']); setModel(value === 'embedding' ? (provider === 'openai' ? 'text-embedding-3-small' : ollamaModels[0]) : ''); setCustomOllama(false)
                    }}><option value="embedding">{t("pages.settings.index.008")}</option><option value="generation">{t("pages.settings.index.009")}</option></Select></div>
                <div className="space-y-2"><label htmlFor="model-provider" className="text-sm font-medium">{t("pages.settings.index.010")}</label>
                    <Select id="model-provider" className={selectClass} value={provider} onValueChange={(selectedValue) => {
                        const value = selectedValue as ModelConfig['provider']
                        setProvider(value); setModel(purpose === 'generation' ? '' : value === 'openai' ? 'text-embedding-3-small' : ollamaModels[0]); setCustomOllama(false); setApiKey('')
                    }}><option value="openai">OpenAI</option><option value="ollama">Ollama</option></Select></div>
                <div className="space-y-2"><label htmlFor="model-id" className="text-sm font-medium">{purpose === 'embedding' ? t("pages.settings.index.011") : t("pages.settings.index.012")}</label>
                    {purpose === 'generation' ? <Input id="model-id" value={model} onChange={(event) => setModel(event.target.value)} required maxLength={100} placeholder={t("pages.settings.index.013")} /> : provider === 'openai' ? <Select id="model-id" className={selectClass} value={model} onValueChange={(selectedValue) => setModel(selectedValue)}>
                        <option value="text-embedding-3-small">text-embedding-3-small</option>
                        <option value="text-embedding-3-large">text-embedding-3-large</option>
                    </Select> : <>
                        <Select id="model-id" className={selectClass} value={customOllama ? 'custom' : model} onValueChange={(selectedValue) => {
                            const value = selectedValue
                            setCustomOllama(value === 'custom')
                            setModel(value === 'custom' ? '' : value)
                        }}>
                            {ollamaModels.map((id) => <option key={id} value={id}>{id}</option>)}
                            <option value="custom">{t("pages.settings.index.014")}</option>
                        </Select>
                        {customOllama && <><label htmlFor="custom-model-id" className="text-sm font-medium">{t("pages.settings.index.015")}</label>
                            <Input id="custom-model-id" value={model} onChange={(event) => setModel(event.target.value)} required maxLength={100} placeholder={t("pages.settings.index.016")} /></>}
                    </>}</div>
                {provider === 'openai' ? <div className="space-y-2"><label htmlFor="model-api-key" className="text-sm font-medium">{t("pages.settings.index.017")}</label>
                    <Input id="model-api-key" type="password" autoComplete="new-password" spellCheck={false} value={apiKey} onChange={(event) => setApiKey(event.target.value)} required={keyRequired} maxLength={4096} placeholder={keyRequired ? t("pages.settings.index.018") : t("pages.settings.index.019")} />
                    <p className="text-xs text-muted-foreground">{t("pages.settings.index.020")}</p>
                </div> : <p className="text-xs text-muted-foreground">{t("pages.settings.index.021")}</p>}
                <div className="flex gap-2"><Button type="submit">{busy ? t("pages.settings.index.022") : editing ? t("pages.documents.detail.008") : t("pages.settings.index.005")}</Button>
                    {editing && <Button type="button" variant="outline" onClick={reset}>{t("pages.documents.delete-dialog.004")}</Button>}</div>
            </fieldset>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {message && <p role="status" className="text-sm text-emerald-600">{message}</p>}
        </form>
        <div className="space-y-4 rounded-lg border p-6">
            <div className="flex items-center justify-between"><h2 className="font-semibold">{t("pages.settings.index.023")}</h2><Button variant="outline" size="sm" disabled={loading || busy} onClick={() => setRefresh((value) => value + 1)}>{t("pages.documents.detail.010")}</Button></div>
            {listError && <p role="alert" className="text-sm text-destructive">{listError}</p>}
            {loading ? <p role="status">{t("pages.documents.index.008")}</p> : models.length === 0 && <p className="text-sm text-muted-foreground">{listError ? t("pages.documents.index.035") : t("pages.settings.index.024")}</p>}
            {models.map((item) => <div key={item.id} className="space-y-3 rounded-md border p-4">
                <div><p className="break-all font-medium">{item.name}</p><p className="break-all text-sm text-muted-foreground">{item.provider === 'openai' ? 'OpenAI' : 'Ollama'} · {item.model}</p>
                    <p className="text-xs text-muted-foreground">{item.purpose === 'generation' ? t("pages.settings.index.025") : t("pages.settings.index.026")} · {item.has_api_key ? t("pages.settings.index.027") : t("pages.settings.index.028")}</p></div>
                <div className="flex gap-2"><Button variant="outline" size="sm" disabled={busy || loading} onClick={() => {
                    setEditing(item); setPurpose(item.purpose); setName(item.name); setProvider(item.provider); setModel(item.model); setCustomOllama(item.provider === 'ollama' && !ollamaModels.includes(item.model)); setApiKey(''); setError(''); setMessage('')
                }}>{t("pages.indices.index.018")}</Button><Button variant="outline" size="sm" disabled={busy || loading} onClick={async () => {
                    if (locked.current) return
                    locked.current = true; setBusy(true); setError(''); setMessage('')
                    try { const result = await testModel(projectId, item.id); setMessage(`${item.name}: ${result.detail} (${result.elapsed_ms}ms)`) }
                    catch (err) { setError(apiError(err)) }
                    finally { locked.current = false; setBusy(false) }
                }}>{t("pages.settings.index.029")}</Button><Button variant="ghost" size="sm" disabled={busy || loading} onClick={() => void remove(item)}>{t("pages.documents.delete-dialog.006")}</Button></div>
            </div>)}
        </div>
    </div>
}

export default function SettingsPage() {
    const { t } = useLocale()
    const { user } = useAuth()
    const project = useProjectStore((state) => state.projects.find((item) => item.id === state.selectedProjectId))
    return <section className="space-y-6 p-3">
        <div className="space-y-2"><h1 className="text-2xl font-semibold">{t("pages.settings.index.030")}</h1>
            <p className="text-sm text-muted-foreground">{t("pages.settings.index.031")}</p></div>
        {project && isProjectAdmin(project, user?.email) && <Button asChild variant="outline"><Link to="/projects/settings">{t("pages.settings.index.032")}</Link></Button>}
        {project && <div className="space-y-3 rounded-lg border p-5">
            <h2 className="font-semibold">{t("pages.settings.index.033")}<span className="text-muted-foreground">{t("pages.services.form.018", { v0: project.members?.length ?? 0 })}</span></h2>
            {project.members?.length ? <ul className="divide-y">{project.members.map((member) => <li key={member.email} className="py-3">
                <p className="break-words text-sm font-medium">{member.name}</p><p className="break-all text-sm text-muted-foreground">{member.email}</p>
            </li>)}</ul> : <p className="text-sm text-muted-foreground">{t("pages.settings.index.034")}</p>}
        </div>}
        <details className="rounded-lg border p-5">
            <summary className="cursor-pointer font-semibold">{t("pages.settings.index.035")}</summary>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                <li>{t("pages.settings.index.036")}</li>
                <li>{t("pages.settings.index.037")}</li>
                <li>{t("pages.settings.index.038")}</li>
                <li>{t("pages.settings.index.039")}</li>
            </ol>
            <p className="mt-3 text-sm text-muted-foreground">{t("pages.settings.index.040")}</p>
        </details>
        {project && <ModelSettings key={project.id} projectId={project.id} />}
    </section>
}
