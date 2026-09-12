import { SidebarProvider, SidebarInset } from "@/components/atoms/sidebar"
import AppHeader from '@/components/organisms/layout/app-header.tsx'
import Header from '@/components/organisms/layout/header.tsx'
import Sidebar from '@/components/organisms/layout/sidebar.tsx'

const RootLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden">
            <div className="shrink-0"><AppHeader /></div>
            <div className="relative flex-1 min-h-0 overflow-hidden [transform:translateZ(0)]">
                <SidebarProvider className="flex flex-1 min-h-0 overflow-hidden">
                    <Sidebar />
                    <SidebarInset className="min-h-0 min-w-0">
                        <div className="shrink-0"><Header /></div>
                        <div className="min-h-0 flex-1 overflow-auto">
                            <div className="container px-3 py-3">
                                {children}
                            </div>
                        </div>
                    </SidebarInset>
                </SidebarProvider>
            </div>
        </div>
    )
}

export default RootLayout
