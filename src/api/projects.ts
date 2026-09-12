import { api } from '@/lib/api'

export interface ProjectMember {
    name: string
    email: string
    role?: 'admin' | 'member'
}

export interface Project {
    id: string
    name: string
    description: string
    created_at: string
    updated_at: string
    creator_email: string | null
    members: ProjectMember[]
}

export async function listProjects(): Promise<Project[]> {
    return (await api.get<Project[]>('/projects')).data
}

export async function saveProject(name: string, description: string, members: ProjectMember[], creator: { name: string; email: string }): Promise<Project> {
    return (await api.post<Project>('/projects', { name, description, members }, { headers: { 'X-User-Email': creator.email, 'X-User-Name': encodeURIComponent(creator.name) } })).data
}

export const isProjectAdmin = (project: Project, email?: string) => {
    const normalized = email?.trim().toLowerCase()
    return !!project.creator_email && !!normalized && (project.creator_email === normalized || project.members.some((member) => member.email === normalized && member.role === 'admin'))
}
export async function getProjectSettings(id: string, email: string, signal?: AbortSignal) {
    return (await api.get<Project>(`/projects/${id}/settings`, { headers: { 'X-User-Email': email }, signal })).data
}
export async function updateProjectSettings(id: string, email: string, input: { name: string; description: string; members: ProjectMember[] }) {
    return (await api.put<Project>(`/projects/${id}/settings`, input, { headers: { 'X-User-Email': email } })).data
}
