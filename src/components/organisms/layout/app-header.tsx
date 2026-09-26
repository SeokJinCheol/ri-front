import { useNavigate } from 'react-router-dom'
import type { CSSProperties } from 'react'

type DragStyle = CSSProperties & { WebkitAppRegion: 'drag' | 'no-drag' }

declare global {
    interface Window {
        api?: {
            platform: string;
            backendUrl?: string;
            windowControls?: {
                minimize: () => void;
                maximize: () => void;
                toggleFullscreen: () => void;
                close: () => void;
            }
        }
    }
}

const AppHeader = () => {
    const navigate = useNavigate()
    const handleHome = () => navigate('/')
    const handleRefresh = () => window.location.reload()
    const handleMinimize = () => window.api?.windowControls?.minimize()
    const handleFullscreen = () => window.api?.windowControls?.toggleFullscreen()
    const handleClose = () => window.api?.windowControls?.close()

    // Electron 환경이 아니면 렌더링하지 않음
    if (!window.api?.windowControls) return null

    return (
        <div
            className="flex items-center justify-between bg-background border-b border-border h-8"
            style={{ WebkitAppRegion: 'drag' } as DragStyle}
        >
            <div className="px-3 flex" style={{ WebkitAppRegion: 'no-drag' } as DragStyle}>
                <button type="button" onClick={handleHome} className="titlebar-btn" aria-label="홈으로 이동" title="홈으로 이동">
                    <span aria-hidden="true" className="material-icon-thin">home</span>
                </button>
                <button type="button" onClick={handleRefresh} className="titlebar-btn" aria-label="새로고침" title="현재 화면 새로고침">
                    <span aria-hidden="true" className="material-icon-thin">refresh</span>
                </button>
            </div>
            <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as DragStyle}>
                <button type="button" onClick={handleMinimize} className="titlebar-btn" aria-label="창 최소화" title="창 최소화">
                    <span aria-hidden="true" className="material-icon-thin">minimize</span>
                </button>
                <button type="button" onClick={handleFullscreen} className="titlebar-btn" aria-label="전체화면 전환" title="전체화면 전환 (F11) · 나가기 (Esc)">
                    <span aria-hidden="true" className="material-icon-thin">fullscreen</span>
                </button>
                <button type="button" onClick={handleClose} className="titlebar-btn titlebar-btn-close" aria-label="창 닫기" title="창 닫기">
                    <span aria-hidden="true" className="material-icon-thin">close</span>
                </button>
            </div>
        </div>
    )
}

export default AppHeader
