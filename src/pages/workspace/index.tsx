import { useProjectStore } from '@/stores/use-project-store'

const WorkspacePage = ({ title, description }: { title: string; description: string }) => {
    const project = useProjectStore((state) => state.projects.find((item) => item.id === state.selectedProjectId))
    return (
        <section className="space-y-4 p-3">
            <p className="text-sm text-muted-foreground">{project?.name ?? '프로젝트를 선택하세요'}</p>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">이 화면은 준비 중입니다.</div>
        </section>
    )
}
export default WorkspacePage
