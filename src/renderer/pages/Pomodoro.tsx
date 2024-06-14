/* eslint-disable consistent-return */
import { useEffect, useRef, useState } from 'react'
import { formatRemainingTime, getTimeInfo, updateTray } from '../components/pomodoro'
import Footer from '../components/Footer'

export default function Pomodoro() {
  const [todayInfo, setTodayInfo] = useState({ count: 0 })

  // TODO 구현 - restart, 휴식시간 스킵 기능, 시간 조절(필수는 아닐듯)
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // function addMin(min: number) {
  //   const newDuration = (isRest ? durations.rest : durations.pomodoro) + min
  //   if (newDuration <= 0) {
  //     setStatus(isRest ? 'finish' : 'pomodoro_finished')
  //     return
  //   }

  //   setDurations({
  //     ...durations,
  //     ...(isRest ? { rest: newDuration } : { pomodoro: newDuration }),
  //   })
  // }

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

  function togglePlay() {
    setStatus((prev) => {
      return prev === 'paused' ? 'running' : 'paused'
    })
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

  const playEmoji = isRest ? '☕️' : '️🔥'

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-auto text-gray-600">
      <div className="p-3 flex flex-1 flex-col items-center justify-center">
        <div className="w-screen h-full flex flex-col justify-center items-center">
          <button
            type="button"
            className="flex w-full h-100 justify-center rounded-md bg-transparent p-10 text-8xl leading-8 text-white"
            onClick={togglePlay}
            tabIndex={-1}
          >
            {status === 'paused' ? playEmoji : '⏸️'}
          </button>

          <div className=" text-sm bottom-4 text-white/70" style={{ zIndex: 10 }}>
            {formatRemainingTime(remainingTime)}
          </div>

          {/* <div className={`flex justify-center items-center ${!status.endsWith('_start') ? 'invisible' : 'visible'}`}>
          <button
            type="button"
            className="flex w-full justify-center rounded-md bg-neutral-700 px-1 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-neutral-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-700"
            onClick={() => addMin(TIME_INFO.ADD_MIN)}
          >
            +5 min
          </button>

          <button
            type="button"
            className="mx-2 h-full flex w-full justify-center rounded-md bg-neutral-700 px-1 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-neutral-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-700"
            onClick={restart}
          >
            RESET
          </button>

          <button
            type="button"
            className="flex w-full justify-center rounded-md bg-neutral-700 px-1 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-neutral-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-700"
            onClick={() => addMin(-TIME_INFO.ADD_MIN)}
          >
            -5 min
          </button>
        </div> */}
        </div>

        <div
          id="bg-timer"
          className="absolute bottom-0 w-full"
          style={{
            zIndex: '-1',
            background: isRest
              ? 'linear-gradient(to top, rgb(137, 248, 109), #6bf748, #6bf748, #41e418)'
              : 'linear-gradient(to bottom, #fa3508, #fa5029, #fa5029, #fa5029, #fa5029)',
          }}
        />
        <div
          className="absolute bg-gray-800 bottom-0 w-full h-full"
          style={{
            zIndex: '-2',
          }}
        />
      </div>
      <Footer todayInfo={todayInfo} />
    </div>
  )
}
