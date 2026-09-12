import { api } from '@/lib/api'

export interface IndexRecord {
    id: string
    project_id: string
    name: string
    description: string
    service_id: string
    service_name: string
    created_at: string
    updated_at: string
    document_count: number
}
export interface IndexInput {
    name: string
    description: string
    service_id: string
    service_name: string
}
export async function listIndices(projectId: string, signal?: AbortSignal) {
    return (await api.get<IndexRecord[]>(`/projects/${projectId}/indices`, { signal, timeout: 15000 })).data
}
export async function getIndex(projectId: string, id: string, signal?: AbortSignal) {
    return (await api.get<IndexRecord>(`/projects/${projectId}/indices/${id}`, { signal, timeout: 15000 })).data
}
export async function createIndex(projectId: string, input: IndexInput) {
    return (await api.post<IndexRecord>(`/projects/${projectId}/indices`, input)).data
}
export async function deleteIndex(projectId: string, id: string) {
    await api.delete(`/projects/${projectId}/indices/${id}`)
}

export async function updateIndex(projectId: string, id: string, input: IndexInput) {
    return (await api.put<IndexRecord>(`/projects/${projectId}/indices/${id}`, input)).data
}
