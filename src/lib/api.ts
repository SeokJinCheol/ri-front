import axios from 'axios'

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
})

export function apiError(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail
        if (typeof detail === 'string') return detail
        if (error.response?.status === 422) return '요청 정보를 확인해주세요.'
        if (!error.response) return '서버에 연결할 수 없습니다. 백엔드 실행 상태를 확인해주세요.'
        return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'
    }
    return error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
}
