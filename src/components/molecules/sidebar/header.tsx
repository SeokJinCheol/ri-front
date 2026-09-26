import { useLocale } from '@/providers/locale-provider'
import { ChevronsUpDown, FolderKanban, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import GradientIcon from '@/components/atoms/gradient-icon'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/atoms/dropdown-menu'
import { SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/atoms/sidebar'
import { useAuth } from '@/providers/auth-provider'
import { isProjectAdmin } from '@/api/projects'
import { useProjectStore } from '@/stores/use-project-store'

const Header = () => {
    const { t } = useLocale()
    const { projects, selectedProjectId, selectProject, loadProjects, isLoading, error } = useProjectStore()
    const { user } = useAuth()
    const project = projects.find((item) => item.id === selectedProjectId)
    const { isMobile, setOpenMobile } = useSidebar()
    const navigate = useNavigate()

    return (
        <SidebarHeader className="border-b border-sidebar-border">
            <SidebarMenu><SidebarMenuItem>
                <DropdownMenu onOpenChange={(open) => { if (open) void loadProjects() }}>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton size="lg" tooltip={project?.name ?? t("components.molecules.sidebar.header.001")} aria-label={t('common.projectSelection', { name: project?.name ?? t("components.molecules.sidebar.header.003") })}>
                            <div className="icon-gradient-badge flex size-8 aspect-square shrink-0 items-center justify-center rounded-md"><FolderKanban className="size-4" /></div>
                            <div className="flex h-8 min-w-0 flex-1 flex-col justify-center text-left group-data-[collapsible=icon]:hidden">
                                <span className="truncate text-sm font-semibold leading-4">{project?.name ?? t("components.molecules.sidebar.header.001")}</span>
                                <span className="truncate text-xs leading-4 text-muted-foreground">{project?.description || t("components.molecules.sidebar.header.004")}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-60 rounded-lg" align="start" side="right" sideOffset={8}>
                        <DropdownMenuLabel className="text-xs text-muted-foreground">{t("components.molecules.sidebar.header.001")}</DropdownMenuLabel>
                        {isLoading && <p role="status" className="p-3 text-sm text-muted-foreground">{t("components.molecules.sidebar.header.005")}</p>}
                        {error && <DropdownMenuItem onSelect={(event) => { event.preventDefault(); void loadProjects() }} className="text-destructive">{t("components.molecules.sidebar.header.006", { v0: error })}</DropdownMenuItem>}
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={selectedProjectId} onValueChange={(id) => {
                            selectProject(id)
                            navigate('/home')
                            if (isMobile) setOpenMobile(false)
                        }}>
                            {projects.map((item) => (
                                <DropdownMenuRadioItem
                                    key={item.id}
                                    value={item.id}
                                    className="gap-2 rounded-md py-2 pl-2 [&>span:first-child]:hidden data-[state=checked]:bg-indigo-50 data-[state=checked]:text-indigo-700 dark:data-[state=checked]:bg-indigo-500/20 dark:data-[state=checked]:text-indigo-300"
                                >
                                    <div className="flex size-8 aspect-square shrink-0 items-center justify-center rounded-md border bg-background">
                                        <GradientIcon icon={FolderKanban} className="size-4" />
                                    </div>
                                    <div className="flex h-8 min-w-0 flex-1 flex-col justify-center">
                                        <span className="truncate text-sm font-medium leading-4">{item.name}</span>
                                        <span className={`truncate text-xs leading-4 ${item.id === selectedProjectId ? 'text-indigo-600 dark:text-indigo-300' : 'text-muted-foreground'}`}>{item.description || t("components.molecules.sidebar.header.007")}</span>
                                    </div>
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSeparator />
                        {project && isProjectAdmin(project, user?.email) && <DropdownMenuItem onSelect={() => { navigate('/projects/settings'); if (isMobile) setOpenMobile(false) }}>{t("pages.projects.settings.011")}</DropdownMenuItem>}
                        <DropdownMenuItem onSelect={() => { navigate('/projects/new'); if (isMobile) setOpenMobile(false) }}>
                            <Plus className="size-4" />{t("pages.projects.create.004")}</DropdownMenuItem>
                        {projects.length === 0 && <p className="p-3 text-sm text-muted-foreground">{t("components.molecules.sidebar.header.008")}</p>}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem></SidebarMenu>
        </SidebarHeader>
    )
}
export default Header
