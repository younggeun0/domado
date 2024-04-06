import { useEffect, useState } from 'react'
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
  editTask,
}: {
  updateTodayInfo: () => void
  editTask: boolean
}) {
  const [status, setStatus] = useState<
    'pomodoro_start' | 'rest_start' | 'restart' | 'paused' | 'pomodoro_finished' | 'rest_finished'
  >('paused')
  const [isRest, setIsRest] = useState(false)
  const [timerKey, setTimerKey] = useState(uuidv4())
  const [durations, setDurations] = useState({
    pomodoro: TIME_INFO.MIN_PER_POMODORO * 60,
    rest: TIME_INFO.MIN_PER_REST * 60,
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function addMin(min: number) {
    const newDuration = (isRest ? durations.rest : durations.pomodoro) + min * 60
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
    function keydownHandler(e: KeyboardEvent) {
      if (editTask) return

      switch (e.key) {
        case ' ':
          if (status === 'paused') {
            setStatus(isRest ? 'rest_start' : 'pomodoro_start')
          } else {
            setStatus('paused')
          }
          break
        case 'a':
          window.electron.ipcRenderer.sendMessage('post_pomodoro', 'hello world')
          updateTodayInfo()
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
  }, [addMin, isRest, status, updateTodayInfo])

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
                <stop offset="95%" stopColor="#1ed14b" />
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
          trailColor="#ededed"
          strokeWidth={20}
          size={250}
        >
          {({ remainingTime }) => {
            if (status === 'paused') {
              return (
                <div className="flex flex-row items-center justify-center gap-x-4">
                  {isRest && (
                    <div
                      className="flex flex-col items-center cursor-pointer"
                      onClick={() => {
                        if (status === 'paused') {
                          setStatus('rest_start')
                        } else {
                          setStatus('paused')
                        }
                      }}
                    >
                      <div>☕️</div>
                      <div className="text-base">REST</div>
                    </div>
                  )}
                  <div
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => {
                      if (status === 'paused') {
                        setStatus('pomodoro_start')
                      } else {
                        setStatus('paused')
                      }
                    }}
                  >
                    <div>🔥</div>
                    <div className="text-base">START</div>
                  </div>
                </div>
              )
            }
            const minutes = Math.floor(remainingTime / 60)
            const seconds = remainingTime % 60

            return (
              <div className="flex flex-col items-center cursor-pointer" onClick={() => setStatus('paused')}>
                <div>{`${minutes}:${getStrTowDigitFormat(seconds)}`}</div>
                <div className="text-lg">PAUSE</div>
              </div>
            )
          }}
        </CountdownCircleTimer>
      </div>

      <div className={`flex justify-center items-center ${!status.endsWith('_start') ? 'invisible' : 'visible'}`}>
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
      </div>
    </>
  )
}
