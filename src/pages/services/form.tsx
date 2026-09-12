import { useRef, useState, type FormEvent } from 'react'
import { Trash2, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { apiError } from '@/lib/api'
import { normalizeEmail, roleLabel, type ServiceInput, type ServiceMember, type ServiceRole } from './types'
import UserPicker, { type SelectableUser } from './user-picker'

export default function ServiceForm({ initial, email, users, onSave, onCancel }: {
    initial?: ServiceInput
    email: string
    users: SelectableUser[]
    onSave: (input: ServiceInput) => Promise<void>
    onCancel: () => void
}) {
    const [name, setName] = useState(initial?.name ?? '')
    const [description, setDescription] = useState(initial?.description ?? '')
    const [members, setMembers] = useState<ServiceMember[]>(initial?.members ?? [{ email, role: 'admin' }])
    const [indexLimit, setIndexLimit] = useState(initial?.index_limit ?? 5)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const locked = useRef(false)

    async function submit(event: FormEvent) {
        event.preventDefault()
        if (locked.current) return
        setError('')
        const normalized = members.map((member) => ({ ...member, email: normalizeEmail(member.email) }))
        if (!name.trim()) return setError('서비스 이름을 입력하세요.')
        if (new Set(normalized.map((member) => member.email)).size !== normalized.length) return setError('동일한 사용자를 중복 등록할 수 없습니다.')
        if (!normalized.some((member) => member.role === 'admin')) return setError('관리자를 한 명 이상 등록하세요.')
        locked.current = true
        setBusy(true)
        try {
            await onSave({ name: name.trim(), description: description.trim(), members: normalized, index_limit: indexLimit })
        } catch (err) {
            setError(apiError(err))
        } finally {
            locked.current = false
            setBusy(false)
        }
    }

    return <form onSubmit={submit} className="max-w-3xl space-y-6">
        <fieldset disabled={busy} className="space-y-6">
            <div className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
                <div><h2 className="font-semibold">기본 정보</h2><p className="mt-1 text-sm text-muted-foreground">서비스의 이름과 용도를 입력하세요.</p></div>
                <div className="space-y-2"><label htmlFor="service-name" className="text-sm font-medium">서비스 이름 <span className="text-destructive">*</span></label>
                    <Input id="service-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} placeholder="예: 고객 지원" /></div>
                <div className="space-y-2"><label htmlFor="service-index-limit" className="text-sm font-medium">인덱스 최대 개수</label>
                    <Input id="service-index-limit" type="number" min={1} max={10000} step={1} required value={indexLimit} onChange={(event) => setIndexLimit(Number(event.target.value))} />
                    <p className="text-xs text-muted-foreground">기본 5개 · 서비스 관리자가 변경할 수 있습니다.</p></div>
                <div className="space-y-2"><label htmlFor="service-description" className="text-sm font-medium">설명</label>
                    <textarea id="service-description" className="min-h-28 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="어떤 인덱스를 관리하는 서비스인가요?" /></div>
            </div>
            <div className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
                <div><h2 className="font-semibold">사용자 및 권한</h2><p className="mt-1 text-sm text-muted-foreground">관리자와 멤버를 각각 검색해 선택하세요.</p></div>
                <div className="grid gap-4 sm:grid-cols-2">{(['admin', 'member'] as ServiceRole[]).map((role) => {
                    const assigned = members.filter((member) => member.role === role)
                    const Icon = role === 'admin' ? ShieldCheck : Users
                    return <section key={role} className="min-w-0 rounded-lg border p-4" aria-labelledby={`service-${role}-title`}>
                        <div className="mb-4 space-y-3"><div className="flex items-center gap-2"><Icon className="size-4 text-muted-foreground" /><h3 id={`service-${role}-title`} className="font-medium">{roleLabel(role)}</h3><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{assigned.length}명</span></div>
                            <p className="text-xs text-muted-foreground">{role === 'admin' ? '생성 · 조회 · 수정 · 삭제' : '조회만 가능'}</p>
                            <UserPicker role={role} users={users} members={members} onAdd={(emails) => {
                                setMembers((current) => [...current, ...emails.filter((value) => !current.some((member) => normalizeEmail(member.email) === value)).map((value) => ({ email: value, role }))])
                                setError('')
                            }} />
                        </div>
                        <div className="space-y-2">{assigned.map((member) => {
                            const creator = !initial && normalizeEmail(member.email) === normalizeEmail(email)
                            const required = creator || (role === 'admin' && assigned.length === 1)
                            const user = users.find((item) => normalizeEmail(item.email) === normalizeEmail(member.email))
                            return <div key={member.email} className="flex items-center gap-2 rounded-md bg-muted/50 p-2.5"><div className="min-w-0 flex-1">{user?.name && <p className="text-sm font-medium">{user.name}</p>}<p className="break-all text-sm">{member.email}</p>{creator && <p className="mt-1 text-xs text-muted-foreground">생성자 · 필수 관리자</p>}</div>
                                <Button type="button" variant="ghost" size="icon" className="shrink-0" disabled={required} title={required ? '관리자는 최소 한 명이 필요하며 생성자는 관리자여야 합니다.' : '선택 해제'} aria-label={`${member.email} ${roleLabel(role)} 선택 해제`} onClick={() => setMembers((current) => current.filter((item) => item.email !== member.email))}><Trash2 /></Button></div>
                        })}</div>
                        {!assigned.length && <p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">선택된 {roleLabel(role)}가 없습니다.</p>}
                    </section>
                })}</div>
                <p className="text-xs text-muted-foreground">한 사용자는 하나의 역할만 가질 수 있습니다. 역할을 바꾸려면 기존 선택을 해제한 후 다시 추가하세요.</p>
            </div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>취소</Button><Button type="submit">{busy ? '저장 중…' : initial ? '변경 저장' : '서비스 생성'}</Button></div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
}
