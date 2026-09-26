import { api } from '@/lib/api'

export interface Citation {
    number: number
    document_id: string
    chunk_index: number
    filename: string
    content: string
    score: number
    available: boolean
}
export interface Conversation { id: string; title: string; index_ids: string[]; updated_at: string }
export interface ChatMessage {
    id: string
    question: string
    answer: string
    status: 'completed' | 'no_sources' | 'insufficient_evidence' | 'unavailable'
    citations: Citation[]
    created_at: string
}
const options = (email: string, signal?: AbortSignal) => ({ headers: { 'X-User-Email': email }, signal, timeout: 450000 })
const base = (project: string, service: string) => `/projects/${project}/services/${service}`
export async function listConversations(project: string, service: string, email: string, signal?: AbortSignal) {
    return (await api.get<Conversation[]>(`${base(project, service)}/conversations`, options(email, signal))).data
}
export async function createConversation(project: string, service: string, email: string, indexIds: string[]) {
    return (await api.post<Conversation>(`${base(project, service)}/conversations`, { index_ids: indexIds }, options(email))).data
}
export async function getMessages(id: string, email: string, signal?: AbortSignal) {
    return (await api.get<ChatMessage[]>(`/conversations/${id}/messages`, options(email, signal))).data
}
export async function sendQuestion(id: string, email: string, question: string, requestId: string) {
    return (await api.post<ChatMessage>(`/conversations/${id}/messages`, { question, client_request_id: requestId }, options(email))).data
}
export async function deleteConversation(id: string, email: string) {
    await api.delete(`/conversations/${id}`, options(email))
}
export async function searchDocuments(project: string, service: string, email: string, question: string, indexIds: string[]) {
    return (await api.post<{ sources: Citation[] }>(`${base(project, service)}/search`, { question, index_ids: indexIds }, options(email))).data.sources
}
