import { useCallback, useEffect, useState } from 'react'

import BackgroundTimer from '../components/BackgroundTimer'
import Footer, { type Panel } from '../components/Footer'
import PlaybackFeedback from '../components/PlaybackFeedback'
import RemainingTimeDisplay from '../components/RemainingTimeDisplay'
import ResizeHandle from '../components/ResizeHandle'
import Domado3DScene from '../components/scene/Domado3DScene'
import SceneErrorBoundary from '../components/scene/SceneErrorBoundary'
import WebDialog from '../components/WebDialog'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { usePomodoroSettings, useSkipRest, useWidgetOpacity } from '../hooks/usePomodoroSettings'
import { usePomodoroTimer } from '../hooks/usePomodoroTimer'
import { useWakeLock } from '../hooks/useWakeLock'
import { useI18n } from '../i18n'
import { notifyWeb, requestNotificationPermission } from '../webNotification'
import History from './History'
import Settings from './Settings'

const ipc = () => window.domado?.ipc

export default function Pomodoro() {
  const isDesktop = Boolean(window.domado)
  const { m } = useI18n()
  const { pomodoroMinutes, restMinutes } = usePomodoroSettings()
  const [opacity] = useWidgetOpacity()
  const [skipRest] = useSkipRest()
  // 트레이 메뉴 문구도 현재 언어로 맞춘다
  useEffect(() => {
    ipc()?.sendMessage('set_tray_labels', { reload: m.footer.reload, onTop: m.tray.onTop, quit: m.tray.quit })
  }, [m])

  // 웹에서 위젯 위에 띄운 설정·기록 모달. 데스크톱은 같은 화면을 별도 창으로 연다
  const [webPanel, setWebPanel] = useState<Panel | null>(null)
  const handleOpenPanel = useCallback((panel: Panel) => {
    if (window.domado) window.domado.ipc.sendMessage('open_window', panel)
    else setWebPanel(panel)
  }, [])

  const [playbackFeedback, setPlaybackFeedback] = useState<{
    id: number
    mode: 'play' | 'pause'
  } | null>(null)

  const { status, isRest, todayInfo, remainingTime, togglePlay, setStatus, incrementCount, durations } =
    usePomodoroTimer({ pomodoroMinutes, restMinutes, skipRest })

  const handleTogglePlay = useCallback(() => {
    setPlaybackFeedback(prev => ({
      id: (prev?.id ?? 0) + 1,
      mode: status === 'paused' ? 'play' : 'pause',
    }))
    togglePlay()
  }, [status, togglePlay])

  const confirmThen = useCallback(
    (message: string, action: () => void) => {
      const confirmed = window.domado
        ? window.domado.confirm(message, m.confirm.ok, m.confirm.cancel)
        : // eslint-disable-next-line no-alert -- 웹은 브라우저 확인 창을 쓴다
          Promise.resolve(window.confirm(message))
      void confirmed.then(ok => ok && action())
    },
    [m],
  )

  const handleIncrementCount = useCallback(() => {
    confirmThen(m.confirm.increment, incrementCount)
  }, [confirmThen, incrementCount, m])

  const canSkipRest = isRest && status === 'paused'

  const handleSkipRest = useCallback(() => {
    if (!canSkipRest) {
      return
    }

    confirmThen(m.confirm.skipRest, () => setStatus('finish'))
  }, [canSkipRest, confirmThen, setStatus, m])

  const handleReload = useCallback(() => {
    confirmThen(m.confirm.reload, () => window.location.reload())
  }, [confirmThen, m])

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
    paused: status === 'paused',
  })

  // 웹은 작업 중에 화면이 꺼지지 않게 한다. 데스크톱 위젯은 OS 절전 설정을 따른다
  useWakeLock(!isDesktop && status === 'running')

  // 전역 단축키(Cmd+Shift+D)
  useEffect(() => ipc()?.on('start_pomodoro', handleTogglePlay), [handleTogglePlay])

  // 휴식 중에는 전체화면으로 휴식을 강제한다 (휴식 스킵·설정 변경으로 휴식이 끝나도 풀린다)
  useEffect(() => {
    ipc()?.sendMessage('set_fullscreen', isRest)
  }, [isRest])

  // 타이머 완료 시 알림 (remainingTime이 0이고 running 상태였을 때)
  const isTimerFinished = remainingTime === 0 && status === 'running'
  useEffect(() => {
    if (!window.domado) requestNotificationPermission()
  }, [])
  useEffect(() => {
    if (!isTimerFinished) return
    const notification = isRest
      ? { title: m.notification.restEndTitle, body: m.notification.restEndBody }
      : { title: m.notification.pomodoroEndTitle, body: m.notification.pomodoroEndBody(todayInfo.count + 1, !skipRest) }
    if (window.domado) window.domado.ipc.sendMessage('notify', notification)
    else notifyWeb(notification.title, notification.body)
    // 완료 시점에 한 번만 보낸다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimerFinished])

  // 휴식 화면은 화면 전체를 덮으므로 위젯 불투명도와 상관없이 불투명하게 한다(뒤 앱이 비치지 않게)
  return (
    <main className="widget group fixed overflow-hidden text-gray-600" style={{ opacity: isRest ? 1 : opacity / 100 }}>
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
      {isDesktop && <div data-tauri-drag-region className="drag-region absolute inset-x-0 top-0 z-20 h-5" />}

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
          onOpenPanel={handleOpenPanel}
        />
      </div>

      {/* 휴식 중에는 전체화면이라 크기 조절이 필요 없다 */}
      {isDesktop && !isRest && <ResizeHandle />}

      {webPanel && (
        <WebDialog
          label={webPanel === 'settings' ? m.settings.title : m.history.title}
          onClose={() => setWebPanel(null)}
        >
          {webPanel === 'settings' ? <Settings onClose={() => setWebPanel(null)} /> : <History />}
        </WebDialog>
      )}
    </main>
  )
}
