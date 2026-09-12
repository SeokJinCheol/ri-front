import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderPlus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { useProjectStore } from '@/stores/use-project-store'
import type { ProjectMember } from '@/api/projects'
import { apiError } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'

const CreateProjectPage = () => {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const { projects, createProject } = useProjectStore()
    const { logout, user } = useAuth()
    const [members, setMembers] = useState<(ProjectMember & { key: string })[]>([])
    const busy = useRef(false)

    const updateMember = (key: string, field: 'name' | 'email', value: string) => {
        setMembers((items) => items.map((item) => item.key === key ? { ...item, [field]: value } : item))
        setError('')
    }
    const navigate = useNavigate()

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (busy.current || !user) return
        if (!name.trim()) {
            setError('프로젝트 이름을 입력하세요.')
            return
        }
        const normalized = members.map(({ name, email, role }) => ({ name: name.trim(), email: email.trim().toLowerCase(), role: role ?? 'member' }))
        if (normalized.some((member) => !member.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email))) {
            setError('사용자 이름과 올바른 이메일을 입력하세요.')
            return
        }
        if (new Set(normalized.map((member) => member.email)).size !== normalized.length) {
            setError('동일한 이메일을 중복 등록할 수 없습니다.')
            return
        }
        busy.current = true
        setIsSaving(true)
        setError('')
        try {
            await createProject(name, description, normalized, user)
            navigate('/home', { replace: true })
        } catch (error) {
            setError(apiError(error))
        } finally {
            busy.current = false
            setIsSaving(false)
        }
    }

    return (
        <section className="my-auto w-full max-w-md space-y-6" aria-labelledby="create-project-title">
            <div className="space-y-3">
                <div className="icon-gradient-badge flex size-12 items-center justify-center rounded-xl"><FolderPlus aria-hidden="true" /></div>
                <h1 id="create-project-title" className="text-2xl font-semibold">{projects.length === 0 ? '첫 프로젝트 만들기' : '프로젝트 만들기'}</h1>
                <p className="text-sm text-muted-foreground">문서와 인덱스를 관리할 프로젝트를 만들어 주세요.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-card p-6 shadow-sm">
                <fieldset disabled={isSaving} className="space-y-5">
                <div className="space-y-2">
                    <label htmlFor="project-name" className="text-sm font-medium">프로젝트 이름</label>
                    <Input id="project-name" value={name} onChange={(event) => { setName(event.target.value); setError('') }} placeholder="예: 고객 지원 지식 베이스" maxLength={80} required aria-invalid={!!error} aria-describedby={error ? 'project-error' : undefined} />
                </div>
                <div className="space-y-2">
                    <label htmlFor="project-description" className="text-sm font-medium">설명 <span className="text-muted-foreground">(선택)</span></label>
                    <Input id="project-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="프로젝트를 간단히 소개해 주세요" maxLength={200} />
                </div>
                <div className="space-y-3 border-t pt-5">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-medium">사용자 등록 <span className="text-muted-foreground">(선택)</span></h2>
                        <Button type="button" size="sm" variant="outline" disabled={members.length >= 99} onClick={() => setMembers((items) => [...items, { key: crypto.randomUUID(), name: '', email: '' }])}><Plus />사용자 추가</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">생성자는 자동으로 관리자가 됩니다. 추가 사용자 중 관리자를 지정할 수 있습니다.</p>
                    <p className="rounded-md bg-muted p-3 text-sm">생성자 · 관리자: {user?.name} ({user?.email})</p>
                    {members.map((member, index) => <div key={member.key} className="space-y-3 rounded-lg border p-3">
                        <div className="flex items-center justify-between"><span className="text-sm font-medium">사용자 {index + 1}</span>
                            <Button type="button" size="icon" variant="ghost" aria-label={`사용자 ${index + 1} 제거`} onClick={() => { setMembers((items) => items.filter((item) => item.key !== member.key)); setError('') }}><Trash2 /></Button></div>
                        <div className="space-y-2"><label htmlFor={`member-name-${member.key}`} className="text-sm">이름</label>
                            <Input id={`member-name-${member.key}`} value={member.name} onChange={(event) => updateMember(member.key, 'name', event.target.value)} maxLength={80} required placeholder="홍길동" /></div>
                        <div className="space-y-2"><label htmlFor={`member-email-${member.key}`} className="text-sm">이메일</label>
                            <Input id={`member-email-${member.key}`} type="email" value={member.email} onChange={(event) => updateMember(member.key, 'email', event.target.value)} maxLength={254} required placeholder="name@example.com" /></div>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={member.role === 'admin'} onChange={(event) => setMembers((items) => items.map((item) => item.key === member.key ? { ...item, role: event.target.checked ? 'admin' : 'member' } : item))} />프로젝트 관리자로 지정</label>
                    </div>)}
                </div>
                </fieldset>
                {error && <p id="project-error" role="alert" className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isSaving}>{isSaving ? '저장 중…' : '프로젝트 만들기'}</Button>
            </form>
            <div className="flex justify-center gap-2">
                {projects.length > 0 && <Button variant="ghost" onClick={() => navigate('/home')}>돌아가기</Button>}
                <Button variant="ghost" onClick={logout}>로그아웃</Button>
            </div>
        </section>
    )
}

export default CreateProjectPage
