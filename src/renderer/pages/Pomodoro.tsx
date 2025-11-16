import { useEffect } from 'react'
import BackgroundTimer from '../components/BackgroundTimer'
import Footer from '../components/Footer'
import RestTimeDisplay from '../components/RestTimeDisplay'
import Domado from '../components/Domado'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { usePomodoroSettings } from '../hooks/usePomodoroSettings'
import { usePomodoroTimer } from '../hooks/usePomodoroTimer'

export default function Pomodoro() {
  const { pomodoroMinutes, restMinutes } = usePomodoroSettings()

  const { status, isRest, todayInfo, remainingTime, togglePlay, setStatus, setIsRest, setTodayInfo, durations } =
    usePomodoroTimer({ pomodoroMinutes, restMinutes })

  useKeyboardShortcuts({
    onTogglePlay: togglePlay,
    onIncrementCount: () => setTodayInfo((prev) => ({ ...prev, count: prev.count + 1 })),
    onSkipToRest: () => {
      setIsRest(true)
      setStatus('finish')
    },
  })

  useDocumentTitle({
    count: todayInfo.count,
    remainingTime,
    isRest,
  })

  // Electron IPC: start_pomodoro 이벤트 리스너
  useEffect(() => {
    window.electron?.ipcRenderer.on('start_pomodoro', () => {
      togglePlay()
    })
  }, [togglePlay])

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-auto text-gray-600">
      <Domado isRest={isRest} paused={status === 'paused'} remainingTime={remainingTime} />

      <div className="p-3 flex flex-1 flex-col items-center justify-center">
        {isRest && <RestTimeDisplay remainingTime={remainingTime} />}

        <BackgroundTimer
          isRest={isRest}
          pomodoroDuration={durations.pomodoro}
          restDuration={durations.rest}
          status={status === 'running' ? 'running' : 'paused'}
        />
      </div>

      <Footer
        isRest={isRest}
        remainingTime={remainingTime}
        todayInfo={todayInfo}
        status={status}
        onTogglePlay={togglePlay}
      />
    </div>
  )
}
