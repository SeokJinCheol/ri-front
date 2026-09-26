import { useLocale } from '@/providers/locale-provider'
import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus, Search, Users, X } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { normalizeEmail, roleLabel, type ServiceMember, type ServiceRole } from './types'

export interface SelectableUser {
    email: string
    name?: string
}

export default function UserPicker({ role, users, members, onAdd }: {
    role: ServiceRole
    users: SelectableUser[]
    members: ServiceMember[]
    onAdd: (emails: string[]) => void
}) {
    const { t } = useLocale()
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [selected, setSelected] = useState<string[]>([])
    const label = roleLabel(role)
    const search = query.trim().toLowerCase()
    const filtered = users.filter((user) => `${user.name ?? ''} ${user.email}`.toLowerCase().includes(search))

    return <Dialog.Root open={open} onOpenChange={(value) => {
        setOpen(value)
        if (value) { setQuery(''); setSelected([]) }
    }}>
        <Dialog.Trigger asChild><Button type="button" variant="outline" size="sm"><Plus />{t("pages.services.user-picker.001", { v0: label })}</Button></Dialog.Trigger>
        <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-xl border bg-background text-foreground shadow-xl">
                <div className="shrink-0 space-y-2 border-b p-5 pr-12">
                    <Dialog.Title className="text-lg font-semibold">{t("pages.services.user-picker.001", { v0: label })}</Dialog.Title>
                    <Dialog.Description className="text-sm text-muted-foreground">{role === 'admin' ? t("pages.services.user-picker.002") : t("pages.services.user-picker.003")}</Dialog.Description>
                    <Dialog.Close asChild><Button type="button" variant="ghost" size="icon" className="absolute right-3 top-3" aria-label={t("pages.services.user-picker.004")}><X /></Button></Dialog.Close>
                </div>
                <div className="shrink-0 space-y-2 p-5 pb-3"><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label={t("pages.services.user-picker.005")} placeholder={t("pages.services.user-picker.006")} className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} /></div><p className="text-xs text-muted-foreground">{t("pages.services.user-picker.007")}</p></div>
                <div className="min-h-24 flex-[1_1_auto] overflow-y-auto px-5 pb-3">
                    <p role="status" className="mb-2 text-xs text-muted-foreground">{t("pages.services.user-picker.008", { v0: filtered.length })}</p>
                    <div className="space-y-1">{filtered.map((user) => {
                        const email = normalizeEmail(user.email)
                        const existing = members.find((member) => normalizeEmail(member.email) === email)
                        return <label key={email} className={`flex items-center gap-3 rounded-lg border p-3 ${existing ? 'cursor-default border-transparent bg-muted/50 text-muted-foreground' : 'cursor-pointer border-transparent hover:bg-accent has-[:checked]:border-ring/40 has-[:checked]:bg-accent'}`}>
                            <input type="checkbox" className="size-4 shrink-0 accent-primary" disabled={!!existing} checked={!!existing || selected.includes(email)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, email] : current.filter((item) => item !== email))} />
                            <div className="min-w-0 flex-1">{user.name && <p className="break-words text-sm font-medium">{user.name}</p>}<p className="break-all text-sm">{email}</p></div>
                            {existing && <span className="shrink-0 text-xs">{t("pages.services.user-picker.009", { v0: roleLabel(existing.role) })}</span>}
                        </label>
                    })}</div>
                    {!filtered.length && <div className="py-10 text-center text-sm text-muted-foreground"><Users className="mx-auto mb-3 size-7" /><p>{t("pages.services.user-picker.010")}</p><p className="mt-1">{t("pages.services.user-picker.011")}</p></div>}
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t bg-background p-5"><p aria-live="polite" className="text-sm text-muted-foreground">{t("pages.services.user-picker.012", { v0: selected.length })}</p><div className="flex gap-2"><Dialog.Close asChild><Button type="button" variant="outline">{t("pages.documents.delete-dialog.004")}</Button></Dialog.Close><Button type="button" disabled={!selected.length} onClick={() => { onAdd(selected); setOpen(false) }}>{t("pages.services.user-picker.013")}</Button></div></div>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>
}
