import { useLocale } from '@/providers/locale-provider'
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
    const { t } = useLocale()
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
                <button type="button" onClick={handleHome} className="titlebar-btn" aria-label={t("components.organisms.layout.app-header.001")} title={t("components.organisms.layout.app-header.001")}>
                    <span aria-hidden="true" className="material-icon-thin">home</span>
                </button>
                <button type="button" onClick={handleRefresh} className="titlebar-btn" aria-label={t("pages.documents.detail.010")} title={t("components.organisms.layout.app-header.002")}>
                    <span aria-hidden="true" className="material-icon-thin">refresh</span>
                </button>
            </div>
            <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as DragStyle}>
                <button type="button" onClick={handleMinimize} className="titlebar-btn" aria-label={t("components.organisms.layout.app-header.003")} title={t("components.organisms.layout.app-header.003")}>
                    <span aria-hidden="true" className="material-icon-thin">minimize</span>
                </button>
                <button type="button" onClick={handleFullscreen} className="titlebar-btn" aria-label={t("components.organisms.layout.app-header.004")} title={t("components.organisms.layout.app-header.005")}>
                    <span aria-hidden="true" className="material-icon-thin">fullscreen</span>
                </button>
                <button type="button" onClick={handleClose} className="titlebar-btn titlebar-btn-close" aria-label={t("components.organisms.layout.app-header.006")} title={t("components.organisms.layout.app-header.006")}>
                    <span aria-hidden="true" className="material-icon-thin">close</span>
                </button>
            </div>
        </div>
    )
}

export default AppHeader
