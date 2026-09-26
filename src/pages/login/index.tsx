import { useLocale } from '@/providers/locale-provider'
import { useState, type FormEvent } from 'react'
import { FolderKanban, LockKeyhole } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { useAuth } from '@/providers/auth-provider'

const LoginPage = () => {
    const { t } = useLocale()
    const [error, setError] = useState('')
    const { loginTemporary } = useAuth()

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        // Once the login API is available, pass its token and user to useAuth().login.
        setError(t("pages.login.index.001"))
    }

    return (
        <section className="my-auto w-full max-w-sm space-y-8" aria-labelledby="login-title">
            <div className="space-y-3 text-center">
                <div className="icon-gradient-badge mx-auto flex size-12 items-center justify-center rounded-xl">
                    <FolderKanban className="size-6" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold tracking-wide">REAL IRON</p>
                <h1 id="login-title" className="text-2xl font-semibold">{t("pages.login.index.002")}</h1>
                <p className="text-sm text-muted-foreground">{t("pages.login.index.003")}</p>
            </div>
            <form onSubmit={handleSubmit} onChange={() => setError('')} className="space-y-5 rounded-xl border bg-card p-6 shadow-sm">
                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">{t("pages.login.index.004")}</label>
                    <Input id="email" name="email" type="email" autoComplete="username" placeholder="name@example.com" required />
                </div>
                <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">{t("pages.login.index.005")}</label>
                    <Input id="password" name="password" type="password" autoComplete="current-password" placeholder={t("pages.login.index.006")} required />
                </div>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full"><LockKeyhole aria-hidden="true" />{t("pages.login.index.002")}</Button>
            </form>
            <div className="space-y-2 text-center">
                <Button type="button" variant="outline" className="w-full" onClick={loginTemporary}>{t("pages.login.index.007")}</Button>
                <p className="text-xs text-muted-foreground">{t("pages.login.index.008")}</p>
            </div>
        </section>
    )
}

export default LoginPage
