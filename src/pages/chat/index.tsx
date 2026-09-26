import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Plus, Search, Send, Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Select } from '@/components/atoms/select'
import { useAuth } from '@/providers/auth-provider'
import { useProjectStore } from '@/stores/use-project-store'
import { useServiceList } from '@/hooks/use-service-list'
import { useIndices } from '@/hooks/use-indices'
import { apiError } from '@/lib/api'
import { createConversation, deleteConversation, getMessages, listConversations, searchDocuments, sendQuestion, type ChatMessage, type Citation, type Conversation } from '@/api/chat'

function Sources({ sources }: { sources: Citation[] }) {
    return <div className="mt-4 space-y-2">{sources.map((source) => <details key={`${source.document_id}:${source.chunk_index}`} className="rounded-lg border bg-background p-3">
        <summary className="cursor-pointer text-sm"><span className="font-medium">[{source.number}] {source.filename}</span><span className="ml-2 text-muted-foreground">청크 {source.chunk_index + 1}</span></summary>
        {source.available ? <><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{source.content}</p><Button asChild variant="link" className="px-0"><Link to={`/documents/${source.document_id}`}><FileText />문서 상세</Link></Button></> : <p className="mt-3 text-sm text-muted-foreground">삭제되거나 이동한 문서입니다.</p>}
    </details>)}</div>
}

function ServiceChat({ projectId, serviceId, email, generationReady }: { projectId: string; serviceId: string; email: string; generationReady: boolean }) {
    const { indices, loading: indicesLoading, error: indicesError } = useIndices(projectId)
    const available = indices.filter((index) => index.service_id === serviceId)
    const [selected, setSelected] = useState<string[]>([])
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [active, setActive] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [question, setQuestion] = useState('')
    const [sources, setSources] = useState<Citation[] | null>(null)
    const [busy, setBusy] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [failed, setFailed] = useState<{ question: string; requestId: string; conversation: Conversation } | null>(null)
    const [pendingQuestion, setPendingQuestion] = useState('')
    const [refresh, setRefresh] = useState(0)
    const locked = useRef(false)
    const alive = useRef(true)
    useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
    useEffect(() => {
        const controller = new AbortController()
        setLoading(true)
        listConversations(projectId, serviceId, email, controller.signal).then((items) => {
            if (!controller.signal.aborted) setConversations(items)
        }).catch((err) => { if (!controller.signal.aborted) setError(apiError(err)) })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [projectId, serviceId, email, refresh])

    function newChat() {
        setActive(null); setMessages([]); setSources(null); setError(''); setFailed(null); setQuestion('')
    }
    async function openConversation(item: Conversation) {
        if (locked.current) return
        locked.current = true; setBusy(true); setError(''); setFailed(null); setSources(null); setMessages([]); setActive(item); setSelected(item.index_ids)
        try { const result = await getMessages(item.id, email); if (alive.current) setMessages(result) }
        catch (err) { if (alive.current) setError(apiError(err)) }
        finally { locked.current = false; if (alive.current) setBusy(false) }
    }
    async function submit(event?: FormEvent, retry = false, searchOnly = false) {
        event?.preventDefault()
        if (locked.current) return
        const text = retry && failed ? failed.question : question.trim()
        if (!text || !selected.length) return
        locked.current = true; setBusy(true); setError(''); setSources(null); setPendingQuestion(text)
        let conversation = retry && failed ? failed.conversation : active
        const requestId = retry && failed ? failed.requestId : crypto.randomUUID()
        try {
            if (searchOnly) {
                const found = await searchDocuments(projectId, serviceId, email, text, selected)
                if (alive.current) setSources(found)
            } else {
                if (!conversation) conversation = await createConversation(projectId, serviceId, email, selected)
                if (!alive.current) return
                setActive(conversation)
                const result = await sendQuestion(conversation.id, email, text, requestId)
                if (alive.current) {
                    setMessages((items) => [...items.filter((item) => item.id !== result.id), result]); setQuestion(''); setFailed(null); setRefresh((v) => v + 1)
                }
            }
        } catch (err) {
            if (alive.current) {
                setError(apiError(err))
                if (conversation && !searchOnly) { setFailed({ question: text, requestId, conversation }); setRefresh((v) => v + 1) }
            }
        } finally { locked.current = false; if (alive.current) { setBusy(false); setPendingQuestion('') } }
    }
    return <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="space-y-3 rounded-xl border bg-card p-4">
            <Button variant="outline" className="w-full" disabled={busy} onClick={newChat}><Plus />새 대화</Button>
            <h2 className="pt-2 text-sm font-semibold">최근 대화</h2>
            {loading && <p role="status" className="text-xs text-muted-foreground">기록을 불러오는 중…</p>}
            {!loading && !conversations.length && <p className="text-sm text-muted-foreground">저장된 대화가 없습니다.</p>}
            {conversations.map((item) => <div key={item.id} className={`flex items-center rounded-md ${active?.id === item.id ? 'bg-muted' : ''}`}>
                <button className="min-w-0 flex-1 truncate p-2 text-left text-sm hover:underline disabled:opacity-50" disabled={busy} onClick={() => void openConversation(item)}>{item.title}</button>
                <Button variant="ghost" size="icon" disabled={busy} aria-label={`${item.title} 삭제`} onClick={async () => {
                    if (locked.current || !window.confirm('이 대화와 질문 기록을 삭제할까요?')) return
                    locked.current = true; setBusy(true); setError('')
                    try { await deleteConversation(item.id, email); if (alive.current) { if (active?.id === item.id) newChat(); setRefresh((v) => v + 1) } }
                    catch (err) { if (alive.current) setError(apiError(err)) }
                    finally { locked.current = false; if (alive.current) setBusy(false) }
                }}><Trash2 className="size-4" /></Button>
            </div>)}
        </aside>
        <div className="min-w-0 space-y-5">
            <fieldset disabled={busy} className="rounded-xl border bg-card p-4">
                <legend className="px-1 text-sm font-semibold">검색 인덱스</legend>
                <p className="mb-3 text-xs text-muted-foreground">같은 임베딩 모델로 업로드한 인덱스를 선택하세요. 범위를 바꾸면 새 대화를 시작합니다.</p>
                {indicesLoading && <p role="status">인덱스를 불러오는 중…</p>}
                {indicesError && <p role="alert" className="text-destructive">{indicesError}</p>}
                {!indicesLoading && !available.length && <p className="text-sm text-muted-foreground">서비스에 인덱스가 없습니다. <Link className="underline" to="/index">인덱스 만들기</Link></p>}
                <div className="flex flex-wrap gap-2">{available.map((index) => <label key={index.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${selected.includes(index.id) ? 'border-primary bg-primary/5' : ''}`}>
                    <input type="checkbox" checked={selected.includes(index.id)} onChange={(e) => {
                        setSelected((ids) => e.target.checked ? [...ids, index.id] : ids.filter((id) => id !== index.id)); newChat()
                    }} />{index.name}<span className="text-muted-foreground">{index.document_count}개 문서</span>
                </label>)}</div>
            </fieldset>
            {!generationReady && <p className="rounded-lg bg-muted p-4 text-sm">답변 모델이 연결되지 않았습니다. <Link className="underline" to={`/service/${serviceId}/edit`}>서비스 수정</Link>에서 모델을 선택하세요. 검색 결과 확인은 임베딩 모델만으로 사용할 수 있습니다.</p>}
            <div className="min-h-60 space-y-5 rounded-xl border bg-card p-5" aria-live="polite">
                {!messages.length && !busy && <div className="py-10 text-center"><MessageSquare className="mx-auto mb-3 size-8 text-muted-foreground" /><h2 className="font-medium">문서에 질문하세요</h2><p className="mt-2 text-sm text-muted-foreground">서비스 문서에서 답변을 찾고 출처 원문을 함께 확인합니다.</p></div>}
                {messages.map((message) => <article key={message.id} className="space-y-3 border-b pb-5 last:border-0">
                    <p className="whitespace-pre-wrap break-words rounded-lg bg-muted p-3 font-medium">{message.question}</p>
                    <p className="whitespace-pre-wrap break-words text-sm leading-7">{message.answer}</p>
                    <Sources sources={message.citations} />
                </article>)}
                {busy && <div role="status" className="space-y-2 text-sm"><p className="whitespace-pre-wrap break-words">{pendingQuestion}</p><p className="animate-pulse text-muted-foreground">요청을 처리하고 있습니다…</p></div>}
            </div>
            {sources !== null && <section className="rounded-xl border p-5"><h2 className="font-semibold">검색 결과 {sources.length}개</h2><p className="mt-1 text-xs text-muted-foreground">답변을 생성하지 않고 검색된 청크만 표시합니다.</p><Sources sources={sources} />{!sources.length && <p className="mt-3 text-sm">선택한 인덱스에 문서가 없습니다.</p>}</section>}
            {error && <div role="alert" className="space-y-2 rounded-lg border border-destructive/30 p-4 text-sm"><p className="text-destructive">{error}</p>{failed && <Button variant="outline" disabled={busy} onClick={() => void submit(undefined, true)}>같은 질문 다시 시도</Button>}</div>}
            <form onSubmit={(event) => void submit(event)} className="space-y-3">
                <label htmlFor="chat-question" className="text-sm font-medium">질문</label>
                <textarea id="chat-question" className="min-h-28 w-full resize-y rounded-xl border bg-background p-4 text-sm" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={4000} disabled={busy} required placeholder="예: 이 문서에서 설명하는 설치 절차는 무엇인가요?" />
                <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{question.length}/4,000 · 선택한 모델 공급자에게 질문과 문서 근거가 전송됩니다.</p><div className="flex gap-2">
                    <Button type="button" variant="outline" disabled={busy || !selected.length || !question.trim()} onClick={() => void submit(undefined, false, true)}><Search />검색만</Button>
                    <Button type="submit" disabled={busy || !selected.length || !question.trim() || !generationReady}><Send />질문하기</Button>
                </div></div>
            </form>
        </div>
    </div>
}

function ProjectChat({ projectId, email }: { projectId: string; email: string }) {
    const { services, loading, error, reload } = useServiceList(projectId, email)
    const [serviceId, setServiceId] = useState('')
    const selected = services.find((item) => item.id === serviceId) ?? services[0]
    return <section className="space-y-6 p-3">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold">Chat</h1><p className="mt-2 text-sm text-muted-foreground">프로젝트 문서를 검색하고 출처와 함께 답변을 확인하세요.</p></div>
            {!!services.length && <div className="w-full space-y-2 sm:w-64"><label htmlFor="chat-service" className="text-sm font-medium">서비스</label><Select id="chat-service" value={selected?.id ?? ''} onValueChange={setServiceId}>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</Select></div>}
        </div>
        {loading && <p role="status">서비스를 불러오는 중…</p>}
        {error && <div role="alert"><p className="text-destructive">{error}</p><Button variant="outline" onClick={reload}>다시 시도</Button></div>}
        {!loading && !error && !selected && <div className="rounded-xl border border-dashed p-10 text-center"><p>참여 중인 서비스가 없습니다.</p><Button asChild className="mt-4"><Link to="/service/new">서비스 만들기</Link></Button></div>}
        {selected && <ServiceChat key={selected.id} projectId={projectId} serviceId={selected.id} email={email} generationReady={!!selected.generation_model_id} />}
    </section>
}
export default function ChatPage() {
    const projectId = useProjectStore((state) => state.selectedProjectId)
    const { user } = useAuth()
    return projectId && user ? <ProjectChat key={`${projectId}:${user.email}`} projectId={projectId} email={user.email} /> : null
}
