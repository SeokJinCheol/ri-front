import { t } from '@/i18n'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { listProjects, saveProject, type Project, type ProjectMember } from '@/api/projects'
import { apiError } from '@/lib/api'

interface ProjectState {
    projects: Project[]
    selectedProjectId: string
    isLoading: boolean
    hasLoaded: boolean
    error: string
    loadProjects: () => Promise<void>
    selectProject: (id: string) => void
    replaceProject: (project: Project) => void
    createProject: (name: string, description: string, members: ProjectMember[], creator: { name: string; email: string }) => Promise<void>
}

export const useProjectStore = create<ProjectState>()(persist((set, get) => ({
    projects: [],
    selectedProjectId: '',
    isLoading: false,
    hasLoaded: false,
    error: '',
    loadProjects: async () => {
        if (get().isLoading) return
        set({ isLoading: true, error: '' })
        try {
            const projects = await listProjects()
            set((state) => ({
                projects,
                selectedProjectId: projects.some((item) => item.id === state.selectedProjectId)
                    ? state.selectedProjectId : projects[0]?.id ?? '',
                hasLoaded: true,
            }))
        } catch (error) {
            set({ error: apiError(error) })
        } finally {
            set({ isLoading: false })
        }
    },
    selectProject: (id) => set((state) => state.projects.some((item) => item.id === id) ? { selectedProjectId: id } : state),
    replaceProject: (project) => set((state) => ({ projects: state.projects.map((item) => item.id === project.id ? project : item) })),
    createProject: async (name, description, members, creator) => {
        const trimmedName = name.trim()
        if (!trimmedName) throw new Error(t("stores.use-project-store.001"))
        const project = await saveProject(trimmedName, description.trim(), members, creator)
        set((state) => ({ projects: [...state.projects, project], selectedProjectId: project.id }))
    },
}), {
    name: 'real-iron-project-selection',
    partialize: (state) => ({ selectedProjectId: state.selectedProjectId }),
}))
