import { useLocale } from '@/providers/locale-provider'
import { FileText, FolderOpen, Layers, LayoutDashboard, MessageSquare, Settings } from 'lucide-react'
import { Sidebar as SideBarComponent, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu } from '@/components/atoms/sidebar'
import Header from '@/components/molecules/sidebar/header'
import Footer from '@/components/molecules/sidebar/footer'
import MenuItem from '@/components/molecules/sidebar/menu-item'

const Sidebar = () => {
    const { t } = useLocale()
    const items = [
    { title: t('nav.home'), description: t('pages.home.dashboard.004'), to: '/home', icon: LayoutDashboard },
    { title: t('nav.services'), description: t("components.organisms.layout.sidebar.001"), to: '/service', icon: Layers },
    { title: t('nav.indices'), description: t("components.organisms.layout.sidebar.002"), to: '/index', icon: FolderOpen },
    { title: t('nav.documents'), description: t("components.organisms.layout.sidebar.003"), to: '/documents', icon: FileText },
    { title: t('nav.chat'), description: t("components.organisms.layout.sidebar.004"), to: '/chat', icon: MessageSquare },
]
    return (<SideBarComponent collapsible="icon">
        <Header />
        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupLabel>{t('nav.workspace')}</SidebarGroupLabel>
                <nav aria-label={t("components.organisms.layout.sidebar.005")}>
                    <SidebarMenu>{items.map((item) => <MenuItem key={item.to} {...item} />)}</SidebarMenu>
                </nav>
            </SidebarGroup>
        </SidebarContent>
        <SidebarGroup className="mt-auto shrink-0 border-t border-sidebar-border">
            <nav aria-label={t("components.organisms.layout.sidebar.006")}>
                <SidebarMenu>
                    <MenuItem title={t('nav.settings')} description={t("pages.settings.index.030")} to="/setting" icon={Settings} />
                </SidebarMenu>
            </nav>
        </SidebarGroup>
        <Footer />
    </SideBarComponent>)
}
export default Sidebar
