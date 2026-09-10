import { ChevronsUpDown, LogOut, UserRound } from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/atoms/dropdown-menu'
import { SidebarFooter, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/atoms/sidebar'

const Footer = () => {
    const { user, isLoading, logout } = useAuth()
    const name = isLoading ? '사용자 정보 불러오는 중' : user?.name ?? '로그인이 필요합니다'
    const details = (
        <>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-sm font-semibold">
                {user?.name.trim().slice(0, 2).toUpperCase() || <UserRound className="size-4" />}
            </div>
            <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">{name}</span>
                <span className="mt-1 truncate text-xs text-muted-foreground">{user?.email ?? (isLoading ? '잠시만 기다려 주세요' : '로그인한 사용자 정보가 표시됩니다')}</span>
            </div>
        </>
    )
    return (
        <SidebarFooter className="border-t border-sidebar-border">
            <SidebarMenu><SidebarMenuItem>
                {user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton size="lg" tooltip={name} aria-label={name + ' 계정 메뉴'}>
                                {details}<ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" sideOffset={8} align="end" className="min-w-60 rounded-lg">
                            <DropdownMenuLabel className="grid gap-1">
                                <span>{user.name}</span>
                                <span className="break-all text-xs font-normal text-muted-foreground">{user.email}</span>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={logout}><LogOut className="size-4" />로그아웃</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div role="status" aria-label={name} className="flex h-12 items-center gap-2 overflow-hidden rounded-md p-2 text-sm group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0">{details}</div>
                )}
            </SidebarMenuItem></SidebarMenu>
        </SidebarFooter>
    )
}
export default Footer
