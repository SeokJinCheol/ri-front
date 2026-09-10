import type { LucideIcon } from 'lucide-react'
import GradientIcon from '@/components/atoms/gradient-icon'
import { NavLink, useMatch } from 'react-router-dom'
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/atoms/sidebar'

interface MenuItemProps { title: string; description: string; to: string; icon: LucideIcon }

const MenuItem = ({ title, description, to, icon: Icon }: MenuItemProps) => {
    const active = useMatch(to + '/*')
    const { isMobile, setOpenMobile } = useSidebar()
    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={!!active} tooltip={title + ' · ' + description} className="h-10">
                <NavLink to={to} aria-label={title + ' · ' + description} onClick={() => { if (isMobile) setOpenMobile(false) }}>
                    <GradientIcon icon={Icon} /><span>{title}</span>
                </NavLink>
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}
export default MenuItem
