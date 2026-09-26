export type ServiceRole = 'admin' | 'member'

export interface ServiceMember {
    email: string
    role: ServiceRole
}

export interface ServiceInput {
    name: string
    description: string
    members: ServiceMember[]
    embedding_model_id?: string | null
    generation_model_id?: string | null
    search_top_k?: number
    system_prompt?: string
    index_limit?: number
}

export interface ServiceIndex {
    id: string
    name: string
    description: string
}

export interface Service extends ServiceInput {
    id: string
    project_id: string
    created_at: string
    updated_at: string
    indices: ServiceIndex[]
}

export const roleLabel = (role: ServiceRole) => role === 'admin' ? '관리자' : '멤버'
export const normalizeEmail = (email: string) => email.trim().toLowerCase()
export const serviceRole = (service: Service, email: string) =>
    service.members.find((member) => normalizeEmail(member.email) === normalizeEmail(email))?.role
