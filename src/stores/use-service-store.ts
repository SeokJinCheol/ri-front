import { api } from '@/lib/api'
import { create } from 'zustand'
import { normalizeEmail, serviceRole, type Service, type ServiceInput } from '@/pages/services/types'

function validate(input: ServiceInput) {
    if (!input.name.trim() || input.name.length > 80) throw new Error('서비스 이름은 1~80자로 입력하세요.')
    if (input.description.length > 500) throw new Error('설명은 500자 이하로 입력하세요.')
    const emails = input.members.map((member) => normalizeEmail(member.email))
    if (emails.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new Error('올바른 사용자 이메일을 입력하세요.')
    if (new Set(emails).size !== emails.length) throw new Error('동일한 사용자를 중복 등록할 수 없습니다.')
    if (!input.members.some((member) => member.role === 'admin')) throw new Error('관리자를 한 명 이상 등록하세요.')
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
        if (!projectId || !email) throw new Error('프로젝트와 로그인 정보를 확인하세요.')
        const existing = id ? get().services.find((item) => item.id === id && item.project_id === projectId) : undefined
        if (id && (!existing || serviceRole(existing, email) !== 'admin')) throw new Error('서비스를 수정할 권한이 없습니다.')
        const payload = validate(input)
        if (!id && !payload.members.some((member) => member.email === normalizeEmail(email) && member.role === 'admin')) throw new Error('서비스 생성자는 관리자로 등록해야 합니다.')
        const limit = input.index_limit ?? 5
        if (!Number.isInteger(limit) || limit < 1 || limit > 10000) throw new Error('인덱스 한도는 1~10000 사이 정수로 입력하세요.')
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
        if (!service || serviceRole(service, email) !== 'admin') throw new Error('서비스를 삭제할 권한이 없습니다.')
        await api.delete(`/projects/${projectId}/services/${id}`, { headers: { 'X-User-Email': email } })
        set((state) => ({ services: state.services.filter((item) => item.id !== id) }))
    },
}))
