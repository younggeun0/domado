/* eslint-disable consistent-return */
import React, { useEffect, useRef, useState } from 'react'
import { useAtom } from 'jotai'
import { todayPomodoroInfo } from '../jotaiStore'

const { isDebug } = window.electron || { isDebug: false }

const TIME_INFO = isDebug
  ? {
      MIN_PER_POMODORO: 0.05,
      MIN_PER_REST: 0.05,
      ADD_MIN: 5,
    }
  : {
      MIN_PER_POMODORO: 25,
      MIN_PER_REST: 5,
      ADD_MIN: 5,
    }

const getStrTowDigitFormat = (num: number) => (num < 10 ? `0${num}` : num)

export default function Pomodoro() {
  const [todayInfo, setTodayInfo] = useAtom(todayPomodoroInfo)
  const [pomodoroTime, setPomodoroTime] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null })

  const {
    electron: { store: electronStore, ipcRenderer },
  } = window

  // TODO 구현 - restart, 휴식시간 스킵 기능, 시간 조절(필수는 아닐듯)
  const [status, setStatus] = useState<'restart' | 'running' | 'finish' | 'paused'>('paused')
  const [isRest, setIsRest] = useState(false)
  const [durations] = useState({
    pomodoro: TIME_INFO.MIN_PER_POMODORO * 60,
    rest: TIME_INFO.MIN_PER_REST * 60,
  })
  const [remainingTime, setRemainingTime] = useState(durations.pomodoro)
  const countInterval = useRef<any>(null)
  const animationRef = useRef<Animation | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // function addMin(min: number) {
  //   const newDuration = (isRest ? durations.rest : durations.pomodoro) + min * 60
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
    if (!bgTimer) return

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
      setPomodoroTime({
        start: new Date(),
        end: null,
      })

      const updateTray = (newRemainingTime: number) => {
        const canvas = document.createElement('canvas')
        canvas.width = 16
        canvas.height = 16

        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        ctx.fillRect(0, 0, 16, 0)
        if (isRest) {
          const level = Math.floor((1 - newRemainingTime / durations.rest) * 100)
          const height = Math.floor((level / 100) * 14)
          ctx.fillStyle = '#41e418'
          ctx.fillRect(1, 15, 14, -height)
        } else {
          const level = Math.floor((newRemainingTime / durations.pomodoro) * 100)
          const height = Math.floor((level / 100) * 14)
          ctx.fillStyle = '#fa3508'
          ctx.fillRect(1, 15 - height, 14, height)
        }

        ipcRenderer.sendMessage('update_tray', canvas.toDataURL())
      }

      const interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 0) {
            return 0
          }
          const newRemainingTime = prev - 1
          updateTray(newRemainingTime)
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
        ipcRenderer.sendMessage('rest_finished')
        setRemainingTime(durations.pomodoro)
        setTodayInfo({
          count: todayInfo.count,
        })
      } else {
        setPomodoroTime((prev) => ({
          start: prev.start,
          end: new Date(),
        }))
        ipcRenderer.sendSync('post_pomodoro')
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
  }, [
    status,
    todayInfo,
    setTodayInfo,
    ipcRenderer,
    isRest,
    durations.rest,
    durations.pomodoro,
    countInterval,
    electronStore,
  ])

  function logTaskMemo() {
    setPomodoroTime({ start: null, end: null })
  }

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

  const minutes = Math.floor(remainingTime / 60)
  const seconds = remainingTime % 60

  return (
    <>
      <div className="w-screen h-full flex flex-col justify-center items-center">
        <button
          type="button"
          className="flex w-full h-100 justify-center rounded-md bg-transparent p-10 text-8xl leading-8 text-white"
          onClick={togglePlay}
        >
          {status === 'paused' ? isRest ? '☕️' : '️🔥' : '⏸️'}
        </button>

        <div className=" text-sm bottom-4 text-white/70" style={{ zIndex: 10 }}>
          {`${minutes}:${getStrTowDigitFormat(seconds)}`}
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
    </>
  )
}
