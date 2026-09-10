import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Project { id: string; name: string; description: string }
interface ProjectState {
    projects: Project[]
    selectedProjectId: string
    selectProject: (id: string) => void
    createProject: (name: string, description: string) => void
}

// Local project storage until the project API is connected.
export const useProjectStore = create<ProjectState>()(persist((set) => ({
    projects: [],
    selectedProjectId: '',
    selectProject: (id) => set((state) => state.projects.some((item) => item.id === id) ? { selectedProjectId: id } : state),
    createProject: (name, description) => {
        const trimmedName = name.trim()
        if (!trimmedName) throw new Error('프로젝트 이름을 입력하세요.')
        const project = { id: crypto.randomUUID(), name: trimmedName, description: description.trim() }
        set((state) => ({ projects: [...state.projects, project], selectedProjectId: project.id }))
    },
}), { name: 'real-iron-local-projects' }))
