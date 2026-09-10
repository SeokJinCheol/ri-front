import { useState, type FormEvent } from 'react'
import { FolderKanban, LockKeyhole } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { useAuth } from '@/providers/auth-provider'

const LoginPage = () => {
    const [error, setError] = useState('')
    const { loginTemporary } = useAuth()

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        // Once the login API is available, pass its token and user to useAuth().login.
        setError('로그인 서비스 연결을 준비 중입니다. 연결 후 다시 시도해 주세요.')
    }

    return (
        <section className="my-auto w-full max-w-sm space-y-8" aria-labelledby="login-title">
            <div className="space-y-3 text-center">
                <div className="icon-gradient-badge mx-auto flex size-12 items-center justify-center rounded-xl">
                    <FolderKanban className="size-6" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold tracking-wide">REAL IRON</p>
                <h1 id="login-title" className="text-2xl font-semibold">로그인</h1>
                <p className="text-sm text-muted-foreground">계정에 로그인하고 프로젝트를 시작하세요.</p>
            </div>
            <form onSubmit={handleSubmit} onChange={() => setError('')} className="space-y-5 rounded-xl border bg-card p-6 shadow-sm">
                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">이메일</label>
                    <Input id="email" name="email" type="email" autoComplete="username" placeholder="name@example.com" required />
                </div>
                <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">비밀번호</label>
                    <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="비밀번호를 입력하세요" required />
                </div>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full"><LockKeyhole aria-hidden="true" />로그인</Button>
            </form>
            <div className="space-y-2 text-center">
                <Button type="button" variant="outline" className="w-full" onClick={loginTemporary}>임시 로그인</Button>
                <p className="text-xs text-muted-foreground">계정 없이 체험 사용자로 시작합니다.</p>
            </div>
        </section>
    )
}

export default LoginPage
