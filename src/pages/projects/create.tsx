import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderPlus } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { useProjectStore } from '@/stores/use-project-store'
import { useAuth } from '@/providers/auth-provider'

const CreateProjectPage = () => {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')
    const { projects, createProject } = useProjectStore()
    const { logout } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!name.trim()) {
            setError('프로젝트 이름을 입력하세요.')
            return
        }
        try {
            createProject(name, description)
            navigate('/home', { replace: true })
        } catch {
            setError('프로젝트를 저장하지 못했습니다. 다시 시도해 주세요.')
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
                <div className="space-y-2">
                    <label htmlFor="project-name" className="text-sm font-medium">프로젝트 이름</label>
                    <Input id="project-name" value={name} onChange={(event) => { setName(event.target.value); setError('') }} placeholder="예: 고객 지원 지식 베이스" maxLength={80} required aria-invalid={!!error} aria-describedby={error ? 'project-error' : undefined} />
                </div>
                <div className="space-y-2">
                    <label htmlFor="project-description" className="text-sm font-medium">설명 <span className="text-muted-foreground">(선택)</span></label>
                    <Input id="project-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="프로젝트를 간단히 소개해 주세요" maxLength={200} />
                </div>
                {error && <p id="project-error" role="alert" className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full">프로젝트 만들기</Button>
                <p className="text-xs text-muted-foreground">프로젝트는 현재 기기에 저장됩니다.</p>
            </form>
            <div className="flex justify-center gap-2">
                {projects.length > 0 && <Button variant="ghost" onClick={() => navigate('/home')}>돌아가기</Button>}
                <Button variant="ghost" onClick={logout}>로그아웃</Button>
            </div>
        </section>
    )
}

export default CreateProjectPage
