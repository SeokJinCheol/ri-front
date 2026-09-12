import { useEffect, useState } from 'react'
import { listIndices, type IndexRecord } from '@/api/indices'
import { apiError } from '@/lib/api'

export function useIndices(projectId?: string, refresh = 0) {
    const [state, setState] = useState<{ projectId?: string; indices: IndexRecord[]; loading: boolean; error: string }>({ indices: [], loading: true, error: '' })
    useEffect(() => {
        const controller = new AbortController()
        setState({ projectId, indices: [], loading: !!projectId, error: '' })
        if (!projectId) return
        listIndices(projectId, controller.signal)
            .then((indices) => { if (!controller.signal.aborted) setState({ projectId, indices, loading: false, error: '' }) })
            .catch((error) => { if (!controller.signal.aborted) setState({ projectId, indices: [], loading: false, error: apiError(error) }) })
        return () => controller.abort()
    }, [projectId, refresh])
    return state.projectId === projectId ? state : { indices: [], loading: true, error: '' }
}
