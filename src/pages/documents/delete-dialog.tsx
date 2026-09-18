import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useRef, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { deleteDocument, type DocumentRecord } from '@/api/documents'
import { apiError } from '@/lib/api'

export function DeleteDocumentDialog({ document, onClose, onDeleted }: {
    document: DocumentRecord
    onClose: () => void
    onDeleted: () => void
}) {
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState('')
    const busy = useRef(false)
    const mounted = useRef(true)
    const cancel = useRef<HTMLButtonElement>(null)
    useEffect(() => {
        mounted.current = true
        return () => { mounted.current = false }
    }, [])

    async function remove() {
        if (busy.current) return
        busy.current = true
        setDeleting(true)
        setError('')
        try {
            await deleteDocument(document.project_id, document.id)
            if (mounted.current) onDeleted()
        } catch (err) {
            if (mounted.current) setError(apiError(err))
        } finally {
            busy.current = false
            if (mounted.current) setDeleting(false)
        }
    }

    return <Dialog.Root open onOpenChange={(open) => { if (!open && !busy.current) onClose() }}>
        <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
            <Dialog.Content onOpenAutoFocus={(event) => { event.preventDefault(); cancel.current?.focus() }}
                className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-xl border bg-background p-6 shadow-lg">
                <Dialog.Title className="text-lg font-semibold">문서 삭제</Dialog.Title>
                <Dialog.Description className="break-words text-sm text-muted-foreground">
                    “{document.filename}” 문서를 삭제할까요? 저장된 청크 {document.chunk_count}개와 임베딩도 함께 삭제됩니다. 삭제 후에는 복구할 수 없습니다.
                </Dialog.Description>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                {deleting && <p role="status" className="text-sm text-muted-foreground">문서를 삭제하고 있습니다…</p>}
                <div className="flex justify-end gap-2">
                    <Button ref={cancel} variant="outline" disabled={deleting} onClick={onClose}>취소</Button>
                    <Button variant="destructive" disabled={deleting} onClick={() => void remove()}>
                        {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />} {deleting ? '삭제 중…' : '삭제'}
                    </Button>
                </div>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>
}
