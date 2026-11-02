import { useEffect, useRef } from 'react'

import type { ReactNode } from 'react'

interface WebDialogProps {
  label: string
  onClose: () => void
  children: ReactNode
}

// 웹에서 설정·기록을 위젯 위에 띄우는 모달. 데스크톱은 같은 화면을 별도 창으로 연다.
// 네이티브 <dialog>가 포커스 가두기·Esc 닫기·배경 비활성을 맡고, 배경을 누르면 닫는다
export default function WebDialog({ label, onClose, children }: WebDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={event => event.target === ref.current && onClose()}
      className="m-auto w-[calc(100%-2.5rem)] max-w-sm overflow-hidden rounded-2xl border border-white/15 bg-neutral-900 p-0 shadow-2xl shadow-black/60 backdrop:bg-black/30"
    >
      {children}
    </dialog>
  )
}
