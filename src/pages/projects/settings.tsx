import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { getProjectSettings, updateProjectSettings, isProjectAdmin, type Project, type ProjectMember } from '@/api/projects'
import { useProjectStore } from '@/stores/use-project-store'
import { useAuth } from '@/providers/auth-provider'
import { apiError } from '@/lib/api'

type MemberRow = ProjectMember & { key: string }

function SettingsForm({ project, email }: { project: Project; email: string }) {
    const [name, setName] = useState(project.name)
    const [description, setDescription] = useState(project.description)
    const [members, setMembers] = useState<MemberRow[]>(project.members.map((member) => ({ ...member, key: crypto.randomUUID() })))
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [allowed, setAllowed] = useState(true)
    const [updatedAt, setUpdatedAt] = useState(project.updated_at)
    const busy = useRef(false)
    const replaceProject = useProjectStore((state) => state.replaceProject)
    async function submit(event: FormEvent) {
        event.preventDefault()
        if (busy.current) return
        const normalized = members.map(({ name, email, role }) => ({ name: name.trim(), email: email.trim().toLowerCase(), role: role ?? 'member' }))
        if (!name.trim() || normalized.some((member) => !member.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email))) { setError('프로젝트 이름과 사용자 이름·이메일을 확인하세요.'); return }
        if (new Set(normalized.map((member) => member.email)).size !== normalized.length) { setError('동일한 이메일을 중복 등록할 수 없습니다.'); return }
        busy.current = true; setSaving(true); setError(''); setMessage('')
        try {
            const saved = await updateProjectSettings(project.id, email, { name, description, members: normalized })
            replaceProject(saved)
            setUpdatedAt(saved.updated_at)
            setAllowed(isProjectAdmin(saved, email))
            setMessage('프로젝트 설정을 저장했습니다.')
        } catch (err) { setError(apiError(err)) }
        finally { busy.current = false; setSaving(false) }
    }
    if (!allowed) return <p role="status">설정을 저장했습니다. 관리자 지정이 해제되어 더 이상 프로젝트 설정을 변경할 수 없습니다.</p>
    return <form onSubmit={submit} className="max-w-3xl space-y-5"><fieldset disabled={saving} className="space-y-5">
        <div className="space-y-4 rounded-xl border bg-card p-5">
            <h2 className="font-semibold">기본 정보</h2>
            <label htmlFor="project-settings-name" className="block text-sm">프로젝트 이름</label><Input id="project-settings-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} />
            <label htmlFor="project-settings-description" className="block text-sm">설명</label><textarea id="project-settings-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={200} rows={3} className="w-full rounded-md border bg-background p-3 text-sm" />
            <p className="text-xs text-muted-foreground">생성 {new Date(project.created_at).toLocaleString('ko-KR')} · 수정 {new Date(updatedAt).toLocaleString('ko-KR')}</p>
        </div>
        <div className="space-y-4 rounded-xl border bg-card p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">사용자 및 관리자 · {members.length}명</h2><Button type="button" variant="outline" size="sm" disabled={members.length >= 100} onClick={() => setMembers((items) => [...items, { key: crypto.randomUUID(), name: '', email: '', role: 'member' }])}><Plus />사용자 추가</Button></div>
            <p className="text-sm text-muted-foreground">생성자는 항상 관리자입니다. 지정 관리자는 프로젝트 설정과 관리자 지정을 변경할 수 있습니다.</p>
            {members.map((member, position) => {
                const creator = member.email === project.creator_email
                return <div key={member.key} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between"><h3 className="text-sm font-medium">{creator ? '생성자 · 관리자' : `사용자 ${position + 1}`}</h3><Button type="button" variant="ghost" size="icon" disabled={creator} aria-label={`사용자 ${position + 1} 제거`} onClick={() => setMembers((items) => items.filter((item) => item.key !== member.key))}><Trash2 /></Button></div>
                    <div className="grid gap-3 sm:grid-cols-2"><div><label className="text-sm" htmlFor={`name-${member.key}`}>이름</label><Input id={`name-${member.key}`} value={member.name} required maxLength={80} onChange={(event) => setMembers((items) => items.map((item) => item.key === member.key ? { ...item, name: event.target.value } : item))} /></div>
                        <div><label className="text-sm" htmlFor={`email-${member.key}`}>이메일</label><Input id={`email-${member.key}`} type="email" value={member.email} required readOnly={creator} maxLength={254} onChange={(event) => setMembers((items) => items.map((item) => item.key === member.key ? { ...item, email: event.target.value } : item))} /></div></div>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={creator} checked={creator || member.role === 'admin'} onChange={(event) => setMembers((items) => items.map((item) => item.key === member.key ? { ...item, role: event.target.checked ? 'admin' : 'member' } : item))} />프로젝트 관리자</label>
                </div>
            })}
        </div>
        <Button type="submit">{saving ? '저장 중…' : '변경 저장'}</Button>
    </fieldset>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status" className="text-sm text-emerald-600">{message}</p>}</form>
}

function SettingsLoader({ id, email }: { id: string; email: string }) {
    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [refresh, setRefresh] = useState(0)
    useEffect(() => {
        const controller = new AbortController()
        setLoading(true); setError(''); setProject(null)
        getProjectSettings(id, email, controller.signal)
            .then((value) => { if (!controller.signal.aborted) setProject(value) })
            .catch((err) => { if (!controller.signal.aborted) setError(apiError(err)) })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [id, email, refresh])
    return <>{loading ? <p role="status">프로젝트 관리자 권한을 확인하고 있습니다…</p> : error ? <div className="space-y-3"><p role="alert">{error}</p><Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>다시 확인</Button></div> : project && <SettingsForm key={project.id} project={project} email={email} />}</>
}

export default function ProjectSettingsPage() {
    const id = useProjectStore((state) => state.selectedProjectId)
    const { user } = useAuth()
    return <section className="space-y-6 p-3"><div className="space-y-2"><h1 className="text-2xl font-semibold">프로젝트 설정</h1><p className="text-sm text-muted-foreground">프로젝트 정보와 사용자·관리자를 관리합니다.</p><Link to="/setting" className="inline-block text-sm underline">모델 설정</Link></div>
        {user && id && <SettingsLoader key={`${id}:${user.email}`} id={id} email={user.email} />}
    </section>
}
