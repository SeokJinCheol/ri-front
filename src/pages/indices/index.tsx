import { useLocale } from '@/providers/locale-provider'
import { Select } from '@/components/atoms/select'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, FolderOpen, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { createIndex, deleteIndex, getIndex, updateIndex, type IndexRecord } from '@/api/indices'
import { listDocuments, type DocumentRecord } from '@/api/documents'
import { useIndices } from '@/hooks/use-indices'
import { useProjectStore } from '@/stores/use-project-store'
import { useServiceList } from '@/hooks/use-service-list'
import { useAuth } from '@/providers/auth-provider'
import { serviceRole } from '@/pages/services/types'
import { apiError } from '@/lib/api'

function Back() {
    const { t } = useLocale()
    return <Link to="/index" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4" />{t("pages.indices.index.001")}</Link> }

function IndexList({ projectId }: { projectId: string }) {
    const { t, dateLocale } = useLocale()
    const [refresh, setRefresh] = useState(0)
    const { indices, loading, error } = useIndices(projectId, refresh)
    return <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">{t("pages.indices.index.001")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("pages.indices.index.002")}</p></div>
            <div className="flex gap-2"><Button variant="outline" disabled={loading} onClick={() => setRefresh((value) => value + 1)}>{t("pages.documents.detail.010")}</Button><Button asChild><Link to="/index/new"><Plus />{t("pages.documents.index.006")}</Link></Button></div></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {loading ? <p role="status">{t("pages.chat.index.012")}</p> : !error && !indices.length ? <div className="rounded-xl border p-12 text-center text-muted-foreground"><FolderOpen className="mx-auto mb-3 size-8" /><p>{t("pages.indices.index.003")}</p><Link className="mt-3 inline-block text-sm underline" to="/index/new">{t("pages.indices.index.004")}</Link></div> :
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{indices.map((item) => <Link key={item.id} to={`/index/${item.id}`} className="space-y-3 rounded-xl border bg-card p-5 transition-colors hover:bg-accent">
                <p className="break-words text-xs text-muted-foreground">{item.service_name}</p><h2 className="break-words font-semibold">{item.name}</h2><p className="line-clamp-2 break-words text-sm text-muted-foreground">{item.description || t("pages.indices.index.005")}</p>
                <div className="flex justify-between gap-2 border-t pt-3 text-xs text-muted-foreground"><span>{t("pages.indices.index.006", { v0: item.document_count })}</span><span>{new Date(item.created_at).toLocaleDateString(dateLocale)}</span></div>
            </Link>)}</div>}
    </div>
}

function IndexCreate({ projectId }: { projectId: string }) {
    const { t } = useLocale()
    const { user } = useAuth()
    const { services: allServices, loading: servicesLoading, error: servicesError, reload } = useServiceList(projectId, user?.email ?? '')
    const services = allServices.filter((item) => item.project_id === projectId && serviceRole(item, user?.email ?? '') === 'admin')
    const [search] = useSearchParams()
    const [serviceId, setServiceId] = useState(search.get('service_id') ?? '')
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const busy = useRef(false)
    const navigate = useNavigate()
    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (busy.current) return
        const service = services.find((item) => item.id === serviceId)
        if (!name.trim() || !service) { setError(t("pages.indices.index.007")); return }
        busy.current = true; setSaving(true); setError('')
        try {
            const saved = await createIndex(projectId, { name: name.trim(), description: description.trim(), service_id: service.id, service_name: service.name })
            navigate(`/index/${saved.id}`, { replace: true })
        } catch (err) { setError(apiError(err)) }
        finally { busy.current = false; setSaving(false) }
    }
    return <div className="space-y-6"><Back /><h1 className="text-2xl font-semibold">{t("pages.documents.index.006")}</h1>
        <p role="status" hidden={!servicesLoading}>{t("pages.home.dashboard.008")}</p>
        {servicesError && <div><p role="alert" className="text-destructive">{servicesError}</p><Button variant="outline" onClick={reload}>{t("routes.index.001")}</Button></div>}
        <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-xl border bg-card p-6"><fieldset disabled={saving || servicesLoading || !!servicesError} className="space-y-5">
            <div className="space-y-2"><label htmlFor="index-name" className="text-sm font-medium">{t("pages.indices.index.008")}</label><Input id="index-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required placeholder={t("pages.indices.index.009")} /></div>
            <div className="space-y-2"><label htmlFor="index-description" className="text-sm font-medium">{t("pages.indices.index.010")}</label><textarea id="index-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={4} className="w-full rounded-md border border-input bg-background p-3 text-sm" placeholder={t("pages.indices.index.011")} /></div>
            <div className="space-y-2"><label htmlFor="index-service" className="text-sm font-medium">{t("pages.chat.index.032")}</label><Select id="index-service" value={serviceId} onValueChange={(selectedValue) => setServiceId(selectedValue)} required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">{t("pages.indices.index.012")}</option>{services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
                {!servicesLoading && !servicesError && !services.length && <p className="text-sm text-muted-foreground">{t("pages.indices.index.013")}<Link to="/service/new" className="underline">{t("pages.home.dashboard.006")}</Link></p>}</div>
            <div className="flex gap-2"><Button type="submit" disabled={!services.length}>{saving ? t("pages.indices.index.014") : t("pages.documents.index.006")}</Button><Button type="button" variant="outline" onClick={() => navigate('/index')}>{t("pages.documents.delete-dialog.004")}</Button></div>
        </fieldset>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</form>
    </div>
}

function IndexDetail({ projectId }: { projectId: string }) {
    const { t, dateLocale } = useLocale()
    const { indexId = '' } = useParams()
    const [index, setIndex] = useState<IndexRecord | null>(null)
    const [documents, setDocuments] = useState<DocumentRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [editing, setEditing] = useState(false)
    const [editName, setEditName] = useState('')
    const [editDescription, setEditDescription] = useState('')
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [refresh, setRefresh] = useState(0)
    const navigate = useNavigate()
    useEffect(() => {
        const controller = new AbortController()
        setIndex(null); setDocuments([]); setLoading(true); setError('')
        Promise.all([getIndex(projectId, indexId, controller.signal), listDocuments(projectId, controller.signal, indexId)])
            .then(([record, docs]) => { if (!controller.signal.aborted) { setIndex(record); setDocuments(docs) } })
            .catch((err) => { if (!controller.signal.aborted) setError(apiError(err)) })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [projectId, indexId, refresh])
    async function remove() {
        if (!index || deleting || !window.confirm(t("pages.indices.index.015", { v0: index.name }))) return
        setDeleting(true); setError('')
        try { await deleteIndex(projectId, indexId); navigate('/index', { replace: true }) }
        catch (err) { setError(apiError(err)); setDeleting(false) }
    }
    return <div className="space-y-6"><Back />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {loading ? <p role="status">{t("pages.indices.index.016")}</p> : index && <>
            <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 space-y-2"><p className="break-words text-sm text-muted-foreground">{index.service_name}</p><h1 className="break-words text-2xl font-semibold">{index.name}</h1><p className="max-w-2xl whitespace-pre-wrap break-words text-sm text-muted-foreground">{index.description || t("pages.indices.index.005")}</p><p className="text-xs text-muted-foreground">{t("pages.indices.index.017", { v0: new Date(index.created_at).toLocaleString(dateLocale), v1: new Date(index.updated_at).toLocaleString(dateLocale) })}</p></div>
                <Button variant="outline" disabled={deleting || saving} onClick={() => { setEditing(true); setEditName(index.name); setEditDescription(index.description) }}>{t("pages.indices.index.018")}</Button>
                <Button variant="destructive" disabled={deleting || saving} onClick={() => void remove()}><Trash2 />{deleting ? t("pages.documents.delete-dialog.005") : t("pages.indices.index.019")}</Button></div>
            {editing && <form className="space-y-3 rounded-xl border p-5" onSubmit={async (event) => {
                event.preventDefault(); if (saving) return; setSaving(true); setError('')
                try { const updated = await updateIndex(projectId, index.id, { name: editName, description: editDescription, service_id: index.service_id, service_name: index.service_name }); setIndex(updated); setEditing(false) }
                catch (err) { setError(apiError(err)) } finally { setSaving(false) }
            }}><label className="block text-sm" htmlFor="edit-index-name">{t("pages.indices.index.008")}</label><Input id="edit-index-name" value={editName} onChange={(event) => setEditName(event.target.value)} required maxLength={80} disabled={saving} />
                <label className="block text-sm" htmlFor="edit-index-description">{t("pages.indices.index.020")}</label><Input id="edit-index-description" value={editDescription} onChange={(event) => setEditDescription(event.target.value)} maxLength={500} disabled={saving} /><div className="flex gap-2"><Button disabled={saving}>{t("pages.documents.detail.008")}</Button><Button type="button" variant="outline" disabled={saving} onClick={() => setEditing(false)}>{t("pages.documents.delete-dialog.004")}</Button></div></form>}
            <div className="space-y-4 rounded-xl border p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{t("pages.indices.index.021", { v0: documents.length })}</h2><Button asChild disabled={deleting}><Link to={`/documents?index_id=${index.id}`}><Plus />{t("pages.documents.index.012")}</Link></Button></div>
                {!documents.length ? <p className="py-8 text-center text-sm text-muted-foreground">{t("pages.indices.index.022")}</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-muted"><tr><th className="p-3">{t("pages.documents.index.038")}</th><th className="p-3">{t("pages.indices.index.023")}</th><th className="p-3">{t("pages.documents.index.040")}</th><th className="p-3">{t("pages.indices.index.024")}</th></tr></thead><tbody>{documents.map((doc) => <tr key={doc.id} className="border-t"><td className="break-all p-3"><Link to={`/documents/${doc.id}`} className="underline">{doc.filename}</Link><p className="text-xs text-muted-foreground">{doc.embedding_model}</p></td><td className="whitespace-nowrap p-3">{(doc.size_bytes / 1024).toFixed(1)} KB</td><td className="p-3">{doc.chunk_count}</td><td className="whitespace-nowrap p-3">{new Date(doc.created_at).toLocaleString(dateLocale)}<p className="text-xs text-muted-foreground">{t("pages.documents.index.049", { v0: new Date(doc.updated_at).toLocaleString(dateLocale) })}</p></td></tr>)}</tbody></table></div>}
            </div>
        </>}
        <Button variant="outline" disabled={loading || deleting} onClick={() => setRefresh((value) => value + 1)}>{t("pages.documents.detail.010")}</Button>
    </div>
}

export default function IndicesPage() {
    const projectId = useProjectStore((state) => state.selectedProjectId)
    return <section key={projectId} className="space-y-6 p-3"><Routes>
        <Route index element={<IndexList projectId={projectId} />} />
        <Route path="new" element={<IndexCreate projectId={projectId} />} />
        <Route path=":indexId" element={<IndexDetail projectId={projectId} />} />
        <Route path="*" element={<Back />} />
    </Routes></section>
}
