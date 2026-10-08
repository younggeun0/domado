import { useEffect } from 'react'

interface UseKeyboardShortcutsProps {
  onTogglePlay: () => void
  onIncrementCount: () => void
  onSkipToRest: () => void
  onReload: () => void
}

export function useKeyboardShortcuts({
  onTogglePlay,
  onIncrementCount,
  onSkipToRest,
  onReload,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    function keydownHandler(e: KeyboardEvent) {
      // 확인 창이 떠 있으면 키 입력은 확인 창 버튼 몫이다
      if (document.querySelector('dialog[open]')) return
      switch (e.key) {
        case ' ':
          e.preventDefault()
          onTogglePlay()
          break
        case 'a':
          onIncrementCount()
          break
        case 's':
          onSkipToRest()
          break
        case 'r':
          onReload()
          break
        default:
          break
      }
    }

    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  }, [onTogglePlay, onIncrementCount, onSkipToRest, onReload])
}
