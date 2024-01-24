/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
// import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import { CountdownCircleTimer } from 'react-countdown-circle-timer'
import { v4 as uuidv4 } from 'uuid'

const { isDebug } = window.electron
const TIME_INFO = isDebug
  ? {
      MIN_PER_POMODORO: 0.05,
      MIN_PER_REST: 0.03,
      ADD_MIN: 5,
    }
  : {
      MIN_PER_POMODORO: 25,
      MIN_PER_REST: 5,
      ADD_MIN: 5,
    }

const getStrTowDigitFormat = (num: number) => (num < 10 ? `0${num}` : num)

export default function PomodoroTimer({
  updateTodayInfo,
}: {
  updateTodayInfo: () => void
}) {
  const [status, setStatus] = useState<
    | 'pomodoro_start'
    | 'rest_start'
    | 'restart'
    | 'paused'
    | 'pomodoro_finished'
    | 'rest_finished'
  >('paused')
  const [isRest, setIsRest] = useState(false)
  const [timerKey, setTimerKey] = useState(uuidv4())
  const [durations, setDurations] = useState({
    pomodoro: TIME_INFO.MIN_PER_POMODORO * 60,
    rest: TIME_INFO.MIN_PER_REST * 60,
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function addMin(min: number) {
    const newDuration =
      (isRest ? durations.rest : durations.pomodoro) + min * 60
    if (newDuration <= 0) {
      setStatus(isRest ? 'rest_finished' : 'pomodoro_finished')
      return
    }

    setDurations({
      ...durations,
      ...(isRest ? { rest: newDuration } : { pomodoro: newDuration }),
    })
  }

  function restart() {
    // TIMER key값을 갱신하면 새로 시작됨
    // 참고, https://github.com/vydimitrov/react-countdown-circle-timer/tree/master/packages/web#recipes
    setTimerKey(uuidv4())
  }

  useEffect(() => {
    function keydownHandler(e) {
      switch (e.key) {
        case ' ':
          if (status === 'paused') {
            setStatus(isRest ? 'rest_start' : 'pomodoro_start')
          } else {
            setStatus('paused')
          }
          break
        case 'r':
          restart()
          break
        case 'ArrowUp':
          addMin(TIME_INFO.ADD_MIN)
          break
        case 'ArrowDown':
          addMin(-TIME_INFO.ADD_MIN)
          break
        default:
          break
      }
    }

    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  }, [addMin, isRest, status])

  useEffect(() => {
    switch (status) {
      // paused에서 재시작 시 키값을 조기화하면 새로시작하기 때문에 상태만 변경
      // rest중에 멈췄다가 다시 시작 시 이슈
      case 'pomodoro_start':
        setIsRest((prev) => {
          if (prev === true) restart()
          return false
        })
        break
      case 'rest_start':
        setIsRest(true)
        break
      case 'pomodoro_finished':
        setIsRest(true)
        setStatus('paused')
        restart()

        // TODO, 무엇을 했는지 입력받아서 노션에 기록
        // prompt Web API는 Electron에서는 동작하지 않아 방법 찾아야 함
        window.electron.ipcRenderer.sendMessage('post_pomodoro', 'hello world')
        updateTodayInfo()
        break
      case 'rest_finished':
        setStatus('paused')
        setIsRest(false)
        restart()
        window.electron.ipcRenderer.sendMessage('rest_finished')
        break
      default:
        // paused
        break
    }
  }, [status, updateTodayInfo])

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          fontSize: '3rem',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <svg style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id="pomodoro-timer" x1="1" y1="0" x2="0" y2="0">
              {isRest ? (
                <stop offset="100%" stopColor="#478476" />
              ) : (
                <>
                  <stop offset="5%" stopColor="gold" />
                  <stop offset="95%" stopColor="red" />
                </>
              )}
            </linearGradient>
          </defs>
        </svg>
        <CountdownCircleTimer
          key={timerKey}
          isPlaying={status !== 'paused'}
          duration={durations[isRest ? 'rest' : 'pomodoro']}
          colors="url(#pomodoro-timer)"
          onComplete={() => {
            if (isRest) {
              setStatus('rest_finished')
            } else {
              setStatus('pomodoro_finished')
            }
          }}
          trailStrokeWidth={30}
          trailColor="#373d47"
          strokeWidth={20}
          size={250}
        >
          {({ remainingTime }) => {
            if (status === 'paused') {
              return (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignContent: 'center',
                    lineHeight: 0.8,
                  }}
                >
                  {isRest && (
                    <div
                      style={{
                        textAlign: 'center',
                        cursor: 'pointer',
                        marginRight: '1rem',
                      }}
                      onClick={() => {
                        if (status === 'paused') {
                          setStatus('rest_start')
                        } else {
                          setStatus('paused')
                        }
                      }}
                    >
                      ☕️
                      <br />
                      <span style={{ fontSize: '1rem' }}>REST</span>
                    </div>
                  )}
                  <div
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => {
                      if (status === 'paused') {
                        setStatus('pomodoro_start')
                      } else {
                        setStatus('paused')
                      }
                    }}
                  >
                    🔥
                    <br />
                    <span style={{ fontSize: '1rem' }}>START</span>
                  </div>
                </div>
              )
            }
            const minutes = Math.floor(remainingTime / 60)
            const seconds = remainingTime % 60

            return (
              <span
                style={{ cursor: 'pointer' }}
                onClick={() => setStatus('paused')}
              >
                {`${minutes}:${getStrTowDigitFormat(seconds)}`}
              </span>
            )
          }}
        </CountdownCircleTimer>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          visibility: status === 'paused' ? 'hidden' : 'visible',
        }}
      >
        <button
          type="button"
          style={{ marginRight: '2px', height: '29px' }}
          onClick={() => addMin(TIME_INFO.ADD_MIN)}
        >
          +5 min
        </button>

        <button type="button" style={{ marginRight: '2px' }} onClick={restart}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-arrow-repeat"
            viewBox="0 0 16 16"
          >
            <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z" />
            <path
              fillRule="evenodd"
              d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z"
            />
          </svg>
        </button>

        <button
          type="button"
          style={{ height: '29px' }}
          onClick={() => addMin(-TIME_INFO.ADD_MIN)}
        >
          -5 min
        </button>
      </div>
    </>
  )
}
