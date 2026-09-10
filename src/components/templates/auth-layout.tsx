import type { ReactNode } from 'react'
import AppHeader from '@/components/organisms/layout/app-header'

const AuthLayout = ({ children }: { children: ReactNode }) => (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
        <div className="shrink-0"><AppHeader /></div>
        <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-6">
            {children}
        </main>
    </div>
)

export default AuthLayout
