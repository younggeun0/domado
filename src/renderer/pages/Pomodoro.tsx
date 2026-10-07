import { useCallback, useEffect, useState } from 'react'

import BackgroundTimer from '../components/BackgroundTimer'
import Footer from '../components/Footer'
import PlaybackFeedback from '../components/PlaybackFeedback'
import RemainingTimeDisplay from '../components/RemainingTimeDisplay'
import ResizeHandle from '../components/ResizeHandle'
import Domado3DScene from '../components/scene/Domado3DScene'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { usePomodoroSettings, useWidgetOpacity } from '../hooks/usePomodoroSettings'
import { usePomodoroTimer } from '../hooks/usePomodoroTimer'
import { useI18n } from '../i18n'

const ipc = () => window.electron?.ipcRenderer

export default function Pomodoro() {
  const { m } = useI18n()
  const { pomodoroMinutes, restMinutes } = usePomodoroSettings()
  const [opacity] = useWidgetOpacity()
  const [playbackFeedback, setPlaybackFeedback] = useState<{
    id: number
    mode: 'play' | 'pause'
  } | null>(null)

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
    if (!window.confirm(m.confirm.increment)) {
      return
    }

    incrementCount()
  }, [incrementCount, m])

  const canSkipRest = isRest && status === 'paused'

  const handleSkipRest = useCallback(() => {
    if (!canSkipRest) {
      return
    }

    if (!window.confirm(m.confirm.skipRest)) {
      return
    }

    setStatus('finish')
  }, [canSkipRest, setStatus, m])

  const handleReload = useCallback(() => {
    if (!window.confirm(m.confirm.reload)) {
      return
    }

    window.location.reload()
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

  return (
    <main className="group fixed inset-0 overflow-hidden text-gray-600" style={{ opacity: opacity / 100 }}>
      <BackgroundTimer
        isRest={isRest}
        pomodoroDuration={durations.pomodoro}
        restDuration={durations.rest}
        status={status === 'running' ? 'running' : 'paused'}
      />

      <Domado3DScene isRest={isRest} paused={status === 'paused'} onTogglePlay={handleTogglePlay} />

      {/* 프레임 없는 창을 옮기는 손잡이. 드래그 영역 안에서는 hover가 잡히지 않아 하단 버튼과 분리해 상단에 둔다 */}
      <div className="drag-region absolute inset-x-0 top-0 z-20 h-5" />

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

      {/* 휴식 중에는 전체화면이라 크기 조절이 필요 없다 */}
      {!isRest && <ResizeHandle />}
    </main>
  )
}
