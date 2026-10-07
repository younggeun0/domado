import { type PointerEvent, useRef } from 'react'

// 투명 창은 OS 테두리로 크기를 바꿀 수 없어 우하단 손잡이로 직접 조절한다. 최소 크기는 메인 프로세스가 지킨다
export default function ResizeHandle() {
  const startRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null)

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    startRef.current = { x: event.screenX, y: event.screenY, width: window.innerWidth, height: window.innerHeight }
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = startRef.current
    if (!start) return
    window.domado?.ipc.sendMessage(
      'resize_widget',
      start.width + event.screenX - start.x,
      start.height + event.screenY - start.y,
    )
  }

  const handlePointerUp = () => {
    startRef.current = null
  }

  return (
    <div
      aria-hidden="true"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="pointer-events-auto absolute right-0 bottom-0 z-30 h-3 w-3 cursor-nwse-resize opacity-0 transition-opacity group-hover:opacity-100"
    >
      <span className="absolute right-0.5 bottom-0.5 h-2 w-2 rounded-br-sm border-r-2 border-b-2 border-white/60" />
    </div>
  )
}
