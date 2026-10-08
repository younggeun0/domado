import { useEffect, useRef } from 'react'

import { useI18n } from '../i18n'

interface ConfirmDialogProps {
  message: string
  onClose: (confirmed: boolean) => void
}

// Tauri의 WKWebView는 window.confirm()을 띄우지 않고 바로 false를 돌려주므로 웹뷰 안에서 묻는다
export default function ConfirmDialog({ message, onClose }: ConfirmDialogProps) {
  const { m } = useI18n()
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog || dialog.open) return
    dialog.showModal()
    // showModal은 첫 버튼(취소)에 포커스를 준다. window.confirm처럼 Enter가 확인이 되게 한다
    dialog.querySelector<HTMLButtonElement>('button:last-child')?.focus()
  }, [])

  return (
    <dialog
      ref={ref}
      // Esc
      onCancel={event => {
        event.preventDefault()
        onClose(false)
      }}
      className="m-auto max-w-[90vw] rounded-lg bg-neutral-900/90 p-2 text-xs text-white backdrop:bg-black/40 min-[240px]:p-4 min-[240px]:text-sm"
    >
      <p>{message}</p>
      <div className="mt-2 flex justify-end gap-1">
        <button type="button" onClick={() => onClose(false)} className="whitespace-nowrap rounded px-1.5 py-1 text-white/60 hover:text-white">
          {m.confirm.cancel}
        </button>
        <button type="button" onClick={() => onClose(true)} className="whitespace-nowrap rounded bg-white/20 px-1.5 py-1 hover:bg-white/30">
          {m.confirm.ok}
        </button>
      </div>
    </dialog>
  )
}
