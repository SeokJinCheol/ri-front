import { api } from '@/lib/api'

export interface ModelConfig {
    id: string
    project_id: string
    name: string
    provider: 'openai' | 'ollama'
    model: string
    purpose: 'embedding' | 'generation'
    has_api_key: boolean
    created_at: string
}

export interface ModelInput {
    name: string
    provider: ModelConfig['provider']
    purpose?: ModelConfig['purpose']
    model: string
    api_key?: string
}

export async function listModels(projectId: string, signal?: AbortSignal) {
    return (await api.get<ModelConfig[]>(`/projects/${projectId}/models`, { signal, timeout: 15000 })).data
}

export async function saveModel(projectId: string, payload: ModelInput, id?: string) {
    const url = `/projects/${projectId}/models`
    return (id ? await api.put<ModelConfig>(`${url}/${id}`, payload) : await api.post<ModelConfig>(url, payload)).data
}

export async function deleteModel(projectId: string, id: string) {
    await api.delete(`/projects/${projectId}/models/${id}`)
}

export async function testModel(projectId: string, id: string) {
    return (await api.post<{ status: string; detail: string; elapsed_ms: number }>(`/projects/${projectId}/models/${id}/test`, {}, { timeout: 180000 })).data
}
