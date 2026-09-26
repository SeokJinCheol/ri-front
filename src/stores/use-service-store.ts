import { t } from '@/i18n'
import { api } from '@/lib/api'
import { create } from 'zustand'
import { normalizeEmail, serviceRole, type Service, type ServiceInput } from '@/pages/services/types'

function validate(input: ServiceInput) {
    if (!input.name.trim() || input.name.length > 80) throw new Error(t("stores.use-service-store.001"))
    if (input.description.length > 500) throw new Error(t("stores.use-service-store.002"))
    const emails = input.members.map((member) => normalizeEmail(member.email))
    if (emails.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new Error(t("stores.use-service-store.003"))
    if (new Set(emails).size !== emails.length) throw new Error(t("stores.use-service-store.004"))
    if (!input.members.some((member) => member.role === 'admin')) throw new Error(t("stores.use-service-store.005"))
    return { ...input, name: input.name.trim(), description: input.description.trim(), members: input.members.map((member) => ({ ...member, email: normalizeEmail(member.email) })) }
}

interface ServiceState {
    services: Service[]
    load: (projectId: string, email: string, signal: AbortSignal) => Promise<void>
    save: (projectId: string, email: string, input: ServiceInput, id?: string) => Promise<Service>
    remove: (projectId: string, email: string, id: string) => Promise<void>
}

// 서버를 원본으로 사용하며 화면에서 필요한 목록만 메모리에 보관합니다.
export const useServiceStore = create<ServiceState>()((set, get) => ({
    services: [],
    load: async (projectId, email, signal) => {
        const response = await api.get<Service[]>(`/projects/${projectId}/services`, { headers: { 'X-User-Email': email }, signal })
        if (!signal.aborted) set((state) => ({ services: [
            ...state.services.filter((item) => item.project_id !== projectId),
            ...response.data.map((item) => ({ ...item, indices: [] })),
        ] }))
    },
    save: async (projectId, email, input, id) => {
        if (!projectId || !email) throw new Error(t("stores.use-service-store.006"))
        const existing = id ? get().services.find((item) => item.id === id && item.project_id === projectId) : undefined
        if (id && (!existing || serviceRole(existing, email) !== 'admin')) throw new Error(t("stores.use-service-store.007"))
        const payload = validate(input)
        if (!id && !payload.members.some((member) => member.email === normalizeEmail(email) && member.role === 'admin')) throw new Error(t("stores.use-service-store.008"))
        const limit = input.index_limit ?? 5
        if (!Number.isInteger(limit) || limit < 1 || limit > 10000) throw new Error(t("stores.use-service-store.009"))
        const serviceId = existing?.id ?? crypto.randomUUID()
        const response = await api.put<Service>(`/projects/${projectId}/services/${serviceId}`, {
            ...payload, index_limit: limit, ...(existing ? { created_at: existing.created_at } : {}),
        }, { headers: { 'X-User-Email': email } })
        const service: Service = { ...response.data, indices: existing?.indices ?? [] }
        set((state) => ({ services: existing ? state.services.map((item) => item.id === id ? service : item) : [service, ...state.services] }))
        return service
    },
    remove: async (projectId, email, id) => {
        const service = get().services.find((item) => item.id === id && item.project_id === projectId)
        if (!service || serviceRole(service, email) !== 'admin') throw new Error(t("stores.use-service-store.010"))
        await api.delete(`/projects/${projectId}/services/${id}`, { headers: { 'X-User-Email': email } })
        set((state) => ({ services: state.services.filter((item) => item.id !== id) }))
    },
}))
