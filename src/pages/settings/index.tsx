import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { isProjectAdmin } from '@/api/projects'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { deleteModel, listModels, saveModel, type ModelConfig } from '@/api/models'
import { apiError } from '@/lib/api'
import { useProjectStore } from '@/stores/use-project-store'

const selectClass = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm'

function ModelSettings({ projectId }: { projectId: string }) {
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
    const [model, setModel] = useState('text-embedding-3-small')
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
        setModel('text-embedding-3-small')
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
                name: name.trim(), provider, model: model.trim(),
                ...(provider === 'openai' && apiKey.trim() ? { api_key: apiKey.trim() } : {}),
            }, editing?.id)
            setModels((items) => editing ? items.map((item) => item.id === saved.id ? saved : item) : [...items, saved])
            reset()
            setMessage('모델 설정을 저장했습니다. Documents에서 선택할 수 있습니다.')
        } catch (err) {
            setError(apiError(err))
        } finally {
            setApiKey('')
            setBusy(false)
            locked.current = false
        }
    }

    async function remove(item: ModelConfig) {
        if (locked.current || !window.confirm(`“${item.name}” 모델 설정과 저장된 API 키를 삭제할까요? 기존 문서는 유지됩니다.`)) return
        locked.current = true
        setBusy(true)
        setError('')
        setMessage('')
        try {
            await deleteModel(projectId, item.id)
            setModels((items) => items.filter((value) => value.id !== item.id))
            if (editing?.id === item.id) reset()
            setMessage('모델 설정을 삭제했습니다.')
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
            <h2 className="font-semibold">{editing ? '모델 수정' : '모델 등록'}</h2>
            <fieldset disabled={busy || loading} className="space-y-4">
                <div className="space-y-2"><label htmlFor="model-name" className="text-sm font-medium">이름</label>
                    <Input id="model-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required placeholder="예: 문서 검색용 모델" /></div>
                <div className="space-y-2"><label htmlFor="model-provider" className="text-sm font-medium">공급자</label>
                    <select id="model-provider" className={selectClass} value={provider} onChange={(event) => {
                        const value = event.target.value as ModelConfig['provider']
                        setProvider(value); setModel(value === 'openai' ? 'text-embedding-3-small' : 'embeddinggemma'); setApiKey('')
                    }}><option value="openai">OpenAI</option><option value="ollama">Ollama</option></select></div>
                <div className="space-y-2"><label htmlFor="model-id" className="text-sm font-medium">임베딩 모델 ID</label>
                    {provider === 'openai' ? <select id="model-id" className={selectClass} value={model} onChange={(event) => setModel(event.target.value)}>
                        <option value="text-embedding-3-small">text-embedding-3-small</option>
                        <option value="text-embedding-3-large">text-embedding-3-large</option>
                    </select> : <Input id="model-id" value={model} onChange={(event) => setModel(event.target.value)} required maxLength={100} placeholder="embeddinggemma" />}</div>
                {provider === 'openai' ? <div className="space-y-2"><label htmlFor="model-api-key" className="text-sm font-medium">API 키</label>
                    <Input id="model-api-key" type="password" autoComplete="new-password" spellCheck={false} value={apiKey} onChange={(event) => setApiKey(event.target.value)} required={keyRequired} maxLength={4096} placeholder={keyRequired ? 'API 키를 입력하세요' : '변경할 때만 새 키를 입력하세요'} />
                    <p className="text-xs text-muted-foreground">API 키는 암호화해 저장합니다. 저장된 키는 다시 표시하지 않습니다.</p>
                </div> : <p className="text-xs text-muted-foreground">실행 중인 Ollama에 설치된 임베딩 모델 ID를 입력하세요. API 키는 필요하지 않습니다.</p>}
                <div className="flex gap-2"><Button type="submit">{busy ? '처리 중…' : editing ? '변경 저장' : '모델 등록'}</Button>
                    {editing && <Button type="button" variant="outline" onClick={reset}>취소</Button>}</div>
            </fieldset>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {message && <p role="status" className="text-sm text-emerald-600">{message}</p>}
        </form>
        <div className="space-y-4 rounded-lg border p-6">
            <div className="flex items-center justify-between"><h2 className="font-semibold">등록한 모델</h2><Button variant="outline" size="sm" disabled={loading || busy} onClick={() => setRefresh((value) => value + 1)}>새로고침</Button></div>
            {listError && <p role="alert" className="text-sm text-destructive">{listError}</p>}
            {loading ? <p role="status">모델을 불러오는 중…</p> : models.length === 0 && <p className="text-sm text-muted-foreground">{listError ? '목록을 불러오지 못했습니다.' : '등록한 모델이 없습니다. 사용할 모델을 등록하세요.'}</p>}
            {models.map((item) => <div key={item.id} className="space-y-3 rounded-md border p-4">
                <div><p className="break-all font-medium">{item.name}</p><p className="break-all text-sm text-muted-foreground">{item.provider === 'openai' ? 'OpenAI' : 'Ollama'} · {item.model}</p>
                    <p className="text-xs text-muted-foreground">{item.has_api_key ? 'API 키 등록됨' : 'API 키 불필요'}</p></div>
                <div className="flex gap-2"><Button variant="outline" size="sm" disabled={busy || loading} onClick={() => {
                    setEditing(item); setName(item.name); setProvider(item.provider); setModel(item.model); setApiKey(''); setError(''); setMessage('')
                }}>수정</Button><Button variant="ghost" size="sm" disabled={busy || loading} onClick={() => void remove(item)}>삭제</Button></div>
            </div>)}
        </div>
    </div>
}

export default function SettingsPage() {
    const { user } = useAuth()
    const project = useProjectStore((state) => state.projects.find((item) => item.id === state.selectedProjectId))
    return <section className="space-y-6 p-3">
        <div className="space-y-2"><h1 className="text-2xl font-semibold">설정</h1>
            <p className="text-sm text-muted-foreground">이 프로젝트에서 문서 임베딩에 사용할 모델과 API 키를 관리합니다.</p></div>
        {project && isProjectAdmin(project, user?.email) && <Button asChild variant="outline"><Link to="/projects/settings">프로젝트 정보·관리자 설정</Link></Button>}
        {project && <div className="space-y-3 rounded-lg border p-5">
            <h2 className="font-semibold">프로젝트 사용자 <span className="text-muted-foreground">{project.members?.length ?? 0}명</span></h2>
            {project.members?.length ? <ul className="divide-y">{project.members.map((member) => <li key={member.email} className="py-3">
                <p className="break-words text-sm font-medium">{member.name}</p><p className="break-all text-sm text-muted-foreground">{member.email}</p>
            </li>)}</ul> : <p className="text-sm text-muted-foreground">등록된 사용자가 없습니다.</p>}
        </div>}
        {project && <ModelSettings key={project.id} projectId={project.id} />}
    </section>
}
