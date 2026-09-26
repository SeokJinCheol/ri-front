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
            setMessage('모델 설정을 저장했습니다. 연결 확인 후 Documents 또는 서비스 설정에서 선택하세요.')
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
                <div className="space-y-2"><label htmlFor="model-purpose" className="text-sm font-medium">모델 용도</label>
                    <Select id="model-purpose" value={purpose} onValueChange={(value) => {
                        setPurpose(value as ModelConfig['purpose']); setModel(value === 'embedding' ? (provider === 'openai' ? 'text-embedding-3-small' : ollamaModels[0]) : ''); setCustomOllama(false)
                    }}><option value="embedding">임베딩 · 문서 업로드와 검색</option><option value="generation">답변 생성 · Chat</option></Select></div>
                <div className="space-y-2"><label htmlFor="model-provider" className="text-sm font-medium">공급자</label>
                    <Select id="model-provider" className={selectClass} value={provider} onValueChange={(selectedValue) => {
                        const value = selectedValue as ModelConfig['provider']
                        setProvider(value); setModel(purpose === 'generation' ? '' : value === 'openai' ? 'text-embedding-3-small' : ollamaModels[0]); setCustomOllama(false); setApiKey('')
                    }}><option value="openai">OpenAI</option><option value="ollama">Ollama</option></Select></div>
                <div className="space-y-2"><label htmlFor="model-id" className="text-sm font-medium">{purpose === 'embedding' ? '임베딩 모델 ID' : '답변 생성 모델 ID'}</label>
                    {purpose === 'generation' ? <Input id="model-id" value={model} onChange={(event) => setModel(event.target.value)} required maxLength={100} placeholder="사용 가능한 답변 모델 ID를 입력하세요" /> : provider === 'openai' ? <Select id="model-id" className={selectClass} value={model} onValueChange={(selectedValue) => setModel(selectedValue)}>
                        <option value="text-embedding-3-small">text-embedding-3-small</option>
                        <option value="text-embedding-3-large">text-embedding-3-large</option>
                    </Select> : <>
                        <Select id="model-id" className={selectClass} value={customOllama ? 'custom' : model} onValueChange={(selectedValue) => {
                            const value = selectedValue
                            setCustomOllama(value === 'custom')
                            setModel(value === 'custom' ? '' : value)
                        }}>
                            {ollamaModels.map((id) => <option key={id} value={id}>{id}</option>)}
                            <option value="custom">다른 모델 직접 입력</option>
                        </Select>
                        {customOllama && <><label htmlFor="custom-model-id" className="text-sm font-medium">Ollama 모델 ID 직접 입력</label>
                            <Input id="custom-model-id" value={model} onChange={(event) => setModel(event.target.value)} required maxLength={100} placeholder="예: embeddinggemma:300m-qat-q8_0" /></>}
                    </>}</div>
                {provider === 'openai' ? <div className="space-y-2"><label htmlFor="model-api-key" className="text-sm font-medium">API 키</label>
                    <Input id="model-api-key" type="password" autoComplete="new-password" spellCheck={false} value={apiKey} onChange={(event) => setApiKey(event.target.value)} required={keyRequired} maxLength={4096} placeholder={keyRequired ? 'API 키를 입력하세요' : '변경할 때만 새 키를 입력하세요'} />
                    <p className="text-xs text-muted-foreground">API 키는 암호화해 저장합니다. 저장된 키는 다시 표시하지 않습니다.</p>
                </div> : <p className="text-xs text-muted-foreground">백엔드가 연결하는 Ollama에 설치된 모델을 선택하세요. 임베딩 모델과 답변 모델은 별도로 등록하며 API 키는 필요하지 않습니다.</p>}
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
                    <p className="text-xs text-muted-foreground">{item.purpose === 'generation' ? '답변 생성' : '임베딩'} · {item.has_api_key ? 'API 키 등록됨' : 'API 키 불필요'}</p></div>
                <div className="flex gap-2"><Button variant="outline" size="sm" disabled={busy || loading} onClick={() => {
                    setEditing(item); setPurpose(item.purpose); setName(item.name); setProvider(item.provider); setModel(item.model); setCustomOllama(item.provider === 'ollama' && !ollamaModels.includes(item.model)); setApiKey(''); setError(''); setMessage('')
                }}>수정</Button><Button variant="outline" size="sm" disabled={busy || loading} onClick={async () => {
                    if (locked.current) return
                    locked.current = true; setBusy(true); setError(''); setMessage('')
                    try { const result = await testModel(projectId, item.id); setMessage(`${item.name}: ${result.detail} (${result.elapsed_ms}ms)`) }
                    catch (err) { setError(apiError(err)) }
                    finally { locked.current = false; setBusy(false) }
                }}>연결 확인</Button><Button variant="ghost" size="sm" disabled={busy || loading} onClick={() => void remove(item)}>삭제</Button></div>
            </div>)}
        </div>
    </div>
}

export default function SettingsPage() {
    const { user } = useAuth()
    const project = useProjectStore((state) => state.projects.find((item) => item.id === state.selectedProjectId))
    return <section className="space-y-6 p-3">
        <div className="space-y-2"><h1 className="text-2xl font-semibold">설정</h1>
            <p className="text-sm text-muted-foreground">문서 검색용 임베딩 모델과 Chat 답변 생성 모델을 관리합니다.</p></div>
        {project && isProjectAdmin(project, user?.email) && <Button asChild variant="outline"><Link to="/projects/settings">프로젝트 정보·관리자 설정</Link></Button>}
        {project && <div className="space-y-3 rounded-lg border p-5">
            <h2 className="font-semibold">프로젝트 사용자 <span className="text-muted-foreground">{project.members?.length ?? 0}명</span></h2>
            {project.members?.length ? <ul className="divide-y">{project.members.map((member) => <li key={member.email} className="py-3">
                <p className="break-words text-sm font-medium">{member.name}</p><p className="break-all text-sm text-muted-foreground">{member.email}</p>
            </li>)}</ul> : <p className="text-sm text-muted-foreground">등록된 사용자가 없습니다.</p>}
        </div>}
        <details className="rounded-lg border p-5">
            <summary className="cursor-pointer font-semibold">모델 설정 및 사용 방법</summary>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                <li>임베딩 모델을 등록하고 연결 확인을 누릅니다. Documents에서 같은 모델로 문서를 업로드하세요.</li>
                <li>답변 생성 용도로 별도 모델을 등록합니다. 공급자에서 사용 가능한 모델 ID를 입력하세요.</li>
                <li>서비스 수정에서 검색용 임베딩 모델과 답변 생성 모델을 각각 선택하고 저장합니다.</li>
                <li>Chat에서 서비스와 인덱스를 선택해 검색 결과를 확인하거나 질문하세요.</li>
            </ol>
            <p className="mt-3 text-sm text-muted-foreground">Ollama는 백엔드 서버에서 실행하고 필요한 모델을 미리 설치하세요. OpenAI 연결 확인·업로드·질문은 API 호출이며 비용이 발생할 수 있습니다. 문서의 관련 내용이 선택한 답변 모델 공급자에게 전송됩니다.</p>
        </details>
        {project && <ModelSettings key={project.id} projectId={project.id} />}
    </section>
}
