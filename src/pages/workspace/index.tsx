import { useLocale } from '@/providers/locale-provider'
const WorkspacePage = ({ title, description }: { title: string; description: string }) => {
    const { t } = useLocale()
    return (
        <section className="space-y-4 p-3">
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{t("pages.workspace.index.001")}</div>
        </section>
    )
}
export default WorkspacePage
