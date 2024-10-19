/* eslint-disable consistent-return */
import { useEffect, useRef, useState } from 'react'
import { formatRemainingTime, getTimeInfo, updateTray } from '../components/pomodoro'
import Footer from '../components/Footer'
import Domado from '../components/Domado'

export default function Pomodoro() {
  const [todayInfo, setTodayInfo] = useState({ count: 0 })
  const [status, setStatus] = useState<'restart' | 'running' | 'finish' | 'paused'>('paused')
  const [isRest, setIsRest] = useState(false)
  const timeInfo = getTimeInfo(window.electron?.isDebug ?? true)
  const [durations] = useState({
    pomodoro: timeInfo.POMODORO_SEC,
    rest: timeInfo.REST_SEC,
  })
  const [remainingTime, setRemainingTime] = useState(durations.pomodoro)
  const countInterval = useRef<any>(null)
  const animationRef = useRef<Animation | null>(null)

  useEffect(() => {
    const bgTimer = document.getElementById('bg-timer')
    if (!bgTimer || !window.KeyframeEffect) return

    const animation = new Animation(
      new KeyframeEffect(bgTimer, [{ height: isRest ? '0%' : '100%' }, { height: isRest ? '100%' : '0%' }], {
        duration: isRest ? durations.rest * 1000 : durations.pomodoro * 1000,
        fill: 'forwards',
        easing: 'linear',
      }),
      document.timeline,
    )

    animationRef.current = animation
  }, [animationRef, durations.pomodoro, durations.rest, isRest])

  useEffect(() => {
    function toggleAnimation() {
      if (!animationRef.current) return

      if (status === 'running') {
        animationRef.current.play()
      } else if (status === 'paused') {
        animationRef.current.pause()
      }
    }

    if (status === 'running') {
      const interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 0) {
            return 0
          }
          const newRemainingTime = prev - 1
          updateTray(window.electron?.ipcRenderer, newRemainingTime, isRest, durations)
          return newRemainingTime
        })
      }, 1000)
      countInterval.current = interval
      toggleAnimation()
    } else if (status === 'paused') {
      clearInterval(countInterval.current)
      toggleAnimation()
    } else if (status === 'finish') {
      if (isRest) {
        window.electron?.ipcRenderer.sendMessage('rest_finished')
        setRemainingTime(durations.pomodoro)
        setTodayInfo({
          count: todayInfo.count,
        })
      } else {
        window.electron?.ipcRenderer.sendSync('pomodoro_finished')
        setRemainingTime(durations.rest)
        setTodayInfo({
          count: todayInfo.count + 1,
        })
      }
      setIsRest((prev) => !prev)
      setStatus('paused')
      clearInterval(countInterval.current)
    }

    return () => {
      clearInterval(countInterval.current)
    }
  }, [status, todayInfo, setTodayInfo, isRest, durations.rest, durations.pomodoro, countInterval, durations])

  function togglePlay(event: any = null) {
    setStatus((prev) => {
      return prev === 'paused' ? 'running' : 'paused'
    })
    event?.target.blur() // 마우스 클릭하여 시작 후 포커스가 머무르면 스페이스바 단축키 동작이 안돼 포커스 해제
  }

  useEffect(() => {
    if (remainingTime <= 0) {
      setStatus('finish')
    }
  }, [remainingTime])

  useEffect(() => {
    window.electron?.ipcRenderer.on('start_pomodoro', () => {
      togglePlay()
    })

    function keydownHandler(e: KeyboardEvent) {
      switch (e.key) {
        case ' ':
          togglePlay()
          break
        case 'a':
          setTodayInfo((prevTodayInfo) => ({
            count: prevTodayInfo.count + 1,
          }))
          break
        case 's':
          setIsRest(true)
          setStatus('finish')
          break
        case 'r':
          window.location.reload()
          break
        default:
          break
      }
    }

    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  }, [])

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-auto text-gray-600">
      <Domado isRest={isRest} paused={status === 'paused'} remainingTime={remainingTime} />

      <div className="p-3 flex flex-1 flex-col items-center justify-center">
        {isRest && (
          <div
            className="absolute text-white/80"
            style={{
              top: '20%',
              transform: 'translateY(-20%)',
              fontSize: '12rem',
              userSelect: 'none',
            }}
          >
            {formatRemainingTime(remainingTime)}
          </div>
        )}
        <div
          id="bg-timer"
          className="absolute bottom-0 w-full"
          style={{
            zIndex: '-1',
            background: isRest ? '#6AFF88' : '#b22222',
          }}
        />

        <div
          className="absolute bg-gray-800 bottom-0 w-full h-full"
          style={{
            zIndex: '-2',
          }}
        />
      </div>
      <Footer isRest={isRest} remainingTime={remainingTime} todayInfo={todayInfo} />
    </div>
  )
}
