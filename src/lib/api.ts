import { t } from '@/i18n'
import axios from 'axios'

export const api = axios.create({
    baseURL: window.api?.backendUrl || import.meta.env.VITE_API_BASE_URL || 'http://true-iron.co.kr/ri-rag/api/v1/',
})

export function apiError(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail
        if (typeof detail === 'string') return detail
        if (error.response?.status === 422) return t("lib.api.001")
        if (!error.response) return t("lib.api.002")
        return t("lib.api.003")
    }
    return error instanceof Error ? error.message : t("lib.api.004")
}
