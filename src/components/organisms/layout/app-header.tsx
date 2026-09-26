declare global {
    interface Window {
        api?: {
            platform: string;
            backendUrl?: string;
            windowControls?: {
                minimize: () => void;
                maximize: () => void;
                close: () => void;
            }
        }
    }
}

const AppHeader = () => {
    const handleMinimize = () => window.api?.windowControls?.minimize()
    const handleMaximize = () => window.api?.windowControls?.maximize()
    const handleClose = () => window.api?.windowControls?.close()

    // Electron 환경이 아니면 렌더링하지 않음
    if (!window.api?.windowControls) return null

    return (
        <div
            className="flex items-center justify-between bg-background border-b border-border h-8"
            style={{ WebkitAppRegion: 'drag' } as any}
        >
            <div className="px-3 flex" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <button onClick={handleMinimize} className="titlebar-btn">
                    <span className="material-icon-thin">home</span>
                </button>
                <button onClick={handleMinimize} className="titlebar-btn">
                    <span className="material-icon-thin">refresh</span>
                </button>
            </div>
            <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <button onClick={handleMinimize} className="titlebar-btn">
                    <span className="material-icon-thin">minimize</span>
                </button>
                <button onClick={handleMaximize} className="titlebar-btn">
                    <span className="material-icon-thin">crop_square</span>
                </button>
                <button onClick={handleClose} className="titlebar-btn titlebar-btn-close">
                    <span className="material-icon-thin">close</span>
                </button>
            </div>
        </div>
    )
}

export default AppHeader
