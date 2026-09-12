import { api } from '@/lib/api'

export interface ModelConfig {
    id: string
    project_id: string
    name: string
    provider: 'openai' | 'ollama'
    model: string
    has_api_key: boolean
    created_at: string
}

export interface ModelInput {
    name: string
    provider: ModelConfig['provider']
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
