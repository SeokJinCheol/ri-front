import { useEffect, useState } from 'react'
import { useServiceStore } from '@/stores/use-service-store'
import { serviceRole } from '@/pages/services/types'
import { apiError } from '@/lib/api'

export function useServiceList(projectId: string | undefined, email: string) {
    const all = useServiceStore((state) => state.services)
    const load = useServiceStore((state) => state.load)
    const [refresh, setRefresh] = useState(0)
    const [state, setState] = useState({ key: '', loading: true, error: '' })
    const key = `${projectId ?? ''}:${email}`
    useEffect(() => {
        const controller = new AbortController()
        setState({ key, loading: !!projectId && !!email, error: '' })
        if (projectId && email) {
            load(projectId, email, controller.signal)
                .then(() => { if (!controller.signal.aborted) setState({ key, loading: false, error: '' }) })
                .catch((error) => { if (!controller.signal.aborted) setState({ key, loading: false, error: apiError(error) }) })
        }
        return () => controller.abort()
    }, [projectId, email, key, load, refresh])
    const loading = state.key !== key || state.loading
    const error = state.key === key ? state.error : ''
    return {
        services: loading || error ? [] : all.filter((item) => item.project_id === projectId && serviceRole(item, email)),
        loading, error, reload: () => setRefresh((value) => value + 1),
    }
}
