import { useCallback, useEffect, useState } from 'react'

import BackgroundTimer from '../components/BackgroundTimer'
import ConfirmDialog from '../components/ConfirmDialog'
import Footer from '../components/Footer'
import PlaybackFeedback from '../components/PlaybackFeedback'
import RemainingTimeDisplay from '../components/RemainingTimeDisplay'
import ResizeHandle from '../components/ResizeHandle'
import Domado3DScene from '../components/scene/Domado3DScene'
import SceneErrorBoundary from '../components/scene/SceneErrorBoundary'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { usePomodoroSettings, useWidgetOpacity } from '../hooks/usePomodoroSettings'
import { usePomodoroTimer } from '../hooks/usePomodoroTimer'
import { useI18n } from '../i18n'

const ipc = () => window.domado?.ipc

export default function Pomodoro() {
  const { m } = useI18n()
  const { pomodoroMinutes, restMinutes } = usePomodoroSettings()
  const [opacity] = useWidgetOpacity()
  const [playbackFeedback, setPlaybackFeedback] = useState<{
    id: number
    mode: 'play' | 'pause'
  } | null>(null)
  const [confirming, setConfirming] = useState<{ message: string; onConfirm: () => void } | null>(null)

  const { status, isRest, todayInfo, remainingTime, togglePlay, setStatus, incrementCount, durations } =
    usePomodoroTimer({ pomodoroMinutes, restMinutes })

  const handleTogglePlay = useCallback(() => {
    setPlaybackFeedback(prev => ({
      id: (prev?.id ?? 0) + 1,
      mode: status === 'paused' ? 'play' : 'pause',
    }))
    togglePlay()
  }, [status, togglePlay])

  const handleIncrementCount = useCallback(() => {
    setConfirming({ message: m.confirm.increment, onConfirm: incrementCount })
  }, [incrementCount, m])

  const canSkipRest = isRest && status === 'paused'

  const handleSkipRest = useCallback(() => {
    if (!canSkipRest) {
      return
    }

    setConfirming({ message: m.confirm.skipRest, onConfirm: () => setStatus('finish') })
  }, [canSkipRest, setStatus, m])

  const handleReload = useCallback(() => {
    setConfirming({ message: m.confirm.reload, onConfirm: () => window.location.reload() })
  }, [m])

  useKeyboardShortcuts({
    onTogglePlay: handleTogglePlay,
    onIncrementCount: handleIncrementCount,
    onSkipToRest: handleSkipRest,
    onReload: handleReload,
  })

  useDocumentTitle({
    count: todayInfo.count,
    remainingTime,
    isRest,
  })

  // 전역 단축키(Cmd+Shift+D)
  useEffect(() => ipc()?.on('start_pomodoro', handleTogglePlay), [handleTogglePlay])

  // 휴식 중에는 전체화면으로 휴식을 강제한다 (휴식 스킵·설정 변경으로 휴식이 끝나도 풀린다)
  useEffect(() => {
    ipc()?.sendMessage('set_fullscreen', isRest)
  }, [isRest])

  // 타이머 완료 시 알림 (remainingTime이 0이고 running 상태였을 때)
  const isTimerFinished = remainingTime === 0 && status === 'running'
  useEffect(() => {
    if (!isTimerFinished) return
    ipc()?.sendMessage(
      'notify',
      isRest
        ? { title: m.notification.restEndTitle, body: m.notification.restEndBody }
        : { title: m.notification.pomodoroEndTitle, body: m.notification.pomodoroEndBody(todayInfo.count + 1) },
    )
    // 완료 시점에 한 번만 보낸다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimerFinished])

  // 휴식 화면은 화면 전체를 덮으므로 위젯 불투명도와 상관없이 불투명하게 한다(뒤 앱이 비치지 않게)
  return (
    <main className="group fixed inset-0 overflow-hidden text-gray-600" style={{ opacity: isRest ? 1 : opacity / 100 }}>
      <BackgroundTimer
        isRest={isRest}
        pomodoroDuration={durations.pomodoro}
        restDuration={durations.rest}
        status={status === 'running' ? 'running' : 'paused'}
      />

      {/* 작업·휴식이 바뀌면 다른 모델을 불러오므로 다시 시도한다 */}
      <SceneErrorBoundary key={String(isRest)}>
        <Domado3DScene isRest={isRest} paused={status === 'paused'} onTogglePlay={handleTogglePlay} />
      </SceneErrorBoundary>

      {/* 프레임 없는 창을 옮기는 손잡이. 드래그 영역 안에서는 hover가 잡히지 않아 하단 버튼과 분리해 상단에 둔다 */}
      <div data-tauri-drag-region className="drag-region absolute inset-x-0 top-0 z-20 h-5" />

      <div className="pointer-events-none relative z-10 flex h-full flex-col">
        <div className="flex flex-1 flex-col items-center justify-center p-3">
          <RemainingTimeDisplay remainingTime={remainingTime} />
        </div>

        {playbackFeedback && <PlaybackFeedback key={playbackFeedback.id} mode={playbackFeedback.mode} />}

        <Footer
          todayInfo={todayInfo}
          canSkipRest={canSkipRest}
          onIncrementCount={handleIncrementCount}
          onSkipRest={handleSkipRest}
          onReload={handleReload}
        />
      </div>

      {confirming && (
        <ConfirmDialog
          message={confirming.message}
          onClose={confirmed => {
            setConfirming(null)
            if (confirmed) confirming.onConfirm()
          }}
        />
      )}

      {/* 휴식 중에는 전체화면이라 크기 조절이 필요 없다 */}
      {!isRest && <ResizeHandle />}
    </main>
  )
}
