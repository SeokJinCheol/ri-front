import { api } from '@/lib/api'

export interface DocumentRecord {
    id: string
    project_id: string
    filename: string
    size_bytes: number
    chunk_count: number
    embedding_provider: 'ollama' | 'openai'
    embedding_model: string
    embedding_dimensions: number
    created_at: string
    status: 'completed'
}

export async function listDocuments(projectId: string, signal?: AbortSignal) {
    const response = await api.get<DocumentRecord[]>('/documents', {
        params: { project_id: projectId }, signal, timeout: 15000,
    })
    return response.data
}

export type EmbeddingSelection = 'default' | 'ollama' | 'text-embedding-3-small' | 'text-embedding-3-large'

export async function uploadDocument(projectId: string, file: File, onProgress: (percent: number) => void, selection: EmbeddingSelection = 'default') {
    const form = new FormData()
    form.append('project_id', projectId)
    form.append('file', file)
    if (selection !== 'default') {
        form.append('embedding_provider', selection === 'ollama' ? 'ollama' : 'openai')
        if (selection !== 'ollama') form.append('embedding_model', selection)
    }
    const response = await api.post<DocumentRecord>('/documents', form, {
        // Processing continues after upload; do not time out and encourage duplicate retries.
        timeout: 0,
        onUploadProgress: ({ loaded, total }) => {
            if (total) onProgress(Math.min(100, Math.round(loaded / total * 100)))
        },
    })
    return response.data
}
