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
        <Dialog.Trigger asChild><Button type="button" variant="outline" size="sm"><Plus />{label} 선택</Button></Dialog.Trigger>
        <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-xl border bg-background text-foreground shadow-xl">
                <div className="shrink-0 space-y-2 border-b p-5 pr-12">
                    <Dialog.Title className="text-lg font-semibold">{label} 선택</Dialog.Title>
                    <Dialog.Description className="text-sm text-muted-foreground">{role === 'admin' ? '서비스를 생성·조회·수정·삭제할 사용자를 선택하세요.' : '서비스를 조회할 사용자를 선택하세요.'}</Dialog.Description>
                    <Dialog.Close asChild><Button type="button" variant="ghost" size="icon" className="absolute right-3 top-3" aria-label="사용자 선택 닫기"><X /></Button></Dialog.Close>
                </div>
                <div className="shrink-0 space-y-2 p-5 pb-3"><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="사용자 이름 또는 이메일 검색" placeholder="이름 또는 이메일로 검색" className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} /></div><p className="text-xs text-muted-foreground">현재 로그인 사용자와 프로젝트에 등록된 사용자만 표시됩니다.</p></div>
                <div className="min-h-24 flex-[1_1_auto] overflow-y-auto px-5 pb-3">
                    <p role="status" className="mb-2 text-xs text-muted-foreground">검색 결과 {filtered.length}명</p>
                    <div className="space-y-1">{filtered.map((user) => {
                        const email = normalizeEmail(user.email)
                        const existing = members.find((member) => normalizeEmail(member.email) === email)
                        return <label key={email} className={`flex items-center gap-3 rounded-lg border p-3 ${existing ? 'cursor-default border-transparent bg-muted/50 text-muted-foreground' : 'cursor-pointer border-transparent hover:bg-accent has-[:checked]:border-ring/40 has-[:checked]:bg-accent'}`}>
                            <input type="checkbox" className="size-4 shrink-0 accent-primary" disabled={!!existing} checked={!!existing || selected.includes(email)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, email] : current.filter((item) => item !== email))} />
                            <div className="min-w-0 flex-1">{user.name && <p className="break-words text-sm font-medium">{user.name}</p>}<p className="break-all text-sm">{email}</p></div>
                            {existing && <span className="shrink-0 text-xs">{roleLabel(existing.role)} 등록됨</span>}
                        </label>
                    })}</div>
                    {!filtered.length && <div className="py-10 text-center text-sm text-muted-foreground"><Users className="mx-auto mb-3 size-7" /><p>검색 결과가 없습니다.</p><p className="mt-1">이름이나 이메일을 확인해 주세요.</p></div>}
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t bg-background p-5"><p aria-live="polite" className="text-sm text-muted-foreground">{selected.length}명 선택</p><div className="flex gap-2"><Dialog.Close asChild><Button type="button" variant="outline">취소</Button></Dialog.Close><Button type="button" disabled={!selected.length} onClick={() => { onAdd(selected); setOpen(false) }}>선택한 사용자 추가</Button></div></div>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>
}
