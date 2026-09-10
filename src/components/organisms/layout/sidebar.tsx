import { FileText, FolderOpen, Layers, LayoutDashboard, MessageSquare, Settings } from 'lucide-react'
import { Sidebar as SideBarComponent, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu } from '@/components/atoms/sidebar'
import Header from '@/components/molecules/sidebar/header'
import Footer from '@/components/molecules/sidebar/footer'
import MenuItem from '@/components/molecules/sidebar/menu-item'

const items = [
    { title: 'Home', description: 'Dashboard', to: '/home', icon: LayoutDashboard },
    { title: 'Service', description: '인덱스 모음', to: '/service', icon: Layers },
    { title: 'Index', description: 'Document 모음', to: '/index', icon: FolderOpen },
    { title: 'Documents', description: '문서 관리', to: '/documents', icon: FileText },
    { title: 'Chat', description: '채팅', to: '/chat', icon: MessageSquare },
]
const Sidebar = () => (
    <SideBarComponent collapsible="icon">
        <Header />
        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                <nav aria-label="주 메뉴">
                    <SidebarMenu>{items.map((item) => <MenuItem key={item.to} {...item} />)}</SidebarMenu>
                </nav>
            </SidebarGroup>
        </SidebarContent>
        <SidebarGroup className="mt-auto shrink-0 border-t border-sidebar-border">
            <nav aria-label="설정 메뉴">
                <SidebarMenu>
                    <MenuItem title="Setting" description="설정" to="/setting" icon={Settings} />
                </SidebarMenu>
            </nav>
        </SidebarGroup>
        <Footer />
    </SideBarComponent>
)
export default Sidebar
