import { api } from '@/lib/api'

export interface DocumentRecord {
    id: string
    project_id: string
    index_id: string | null
    filename: string
    size_bytes: number
    chunk_count: number
    embedding_provider: 'ollama' | 'openai'
    embedding_model: string
    embedding_dimensions: number
    created_at: string
    updated_at: string
    embedding_size_bytes: number
    status: 'completed'
}

export async function listDocuments(projectId: string, signal?: AbortSignal, indexId?: string) {
    const response = await api.get<DocumentRecord[]>('/documents', {
        params: { project_id: projectId, index_id: indexId }, signal, timeout: 15000,
    })
    return response.data
}

export type EmbeddingSelection = string

export async function uploadDocument(projectId: string, file: File, onProgress: (percent: number) => void, selection: EmbeddingSelection, indexId: string) {
    const form = new FormData()
    form.append('project_id', projectId)
    form.append('file', file)
    form.append('index_id', indexId)
    if (selection !== 'default') {
        form.append('model_config_id', selection)
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

export interface ChunkPage {
    document: DocumentRecord
    items: { chunk_index: number; content: string; embedding_size_bytes: number; embedding_dimensions: number }[]
    total: number
    offset: number
    limit: number
}
export async function listChunks(projectId: string, documentId: string, offset = 0, signal?: AbortSignal) {
    return (await api.get<ChunkPage>(`/documents/${documentId}/chunks`, { params: { project_id: projectId, offset, limit: 50 }, signal })).data
}
export async function updateDocument(projectId: string, documentId: string, filename: string, indexId: string) {
    return (await api.put<DocumentRecord>(`/documents/${documentId}`, { filename, index_id: indexId || null }, { params: { project_id: projectId } })).data
}
