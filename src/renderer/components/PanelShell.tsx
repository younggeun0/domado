import type { ReactNode } from 'react'

interface PanelShellProps {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

// 설정·기록 화면의 틀. 데스크톱은 별도 창 하나를 채우고, 웹은 위젯 위의 WebDialog 안에 들어간다
export default function PanelShell({ title, description, children, footer }: PanelShellProps) {
  const isDesktop = Boolean(window.domado)

  return (
    <main
      className={`flex flex-col gap-4 bg-neutral-900 p-5 text-white ${isDesktop ? 'h-screen pt-10' : 'max-h-[calc(100dvh-2.5rem)]'}`}
    >
      {isDesktop && (
        <>
          {/* 숨긴 타이틀바 자리. 창을 끌어 옮기는 손잡이이자 신호등 버튼과 내용이 겹치지 않게 하는 여백 */}
          <div data-tauri-drag-region className="drag-region fixed inset-x-0 top-0 h-8" />
          <title>{title}</title>
        </>
      )}
      <header className="grid gap-1.5">
        <h1 className="text-lg font-semibold leading-none tracking-tight">{title}</h1>
        <p className="text-sm text-white/70">{description}</p>
      </header>
      {children}
      {footer}
    </main>
  )
}
