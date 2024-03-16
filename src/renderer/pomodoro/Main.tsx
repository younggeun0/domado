import React, { useEffect } from 'react'
import dayjs from 'dayjs'
import PomodoroTimer from './PomodoroTimer'
import NotionKeySetter from './NotionKeySetter'
import PomodoroHeatmap from './PomodoroHeatmap'

export interface PomodoroInfo {
  date: string
  count: number
}

export default function Main() {
  // 동기화 여부 상관없이 쓰는 플래그, 오늘 작업 내역
  const [todayInfo, setTodayInfo] = React.useState<PomodoroInfo | null | undefined>(null)

  // 동기화 쓸 때 사용할 플래그들
  const [useLog, setUseLog] = React.useState(true) // 기록 사용 여부
  const [task, setTask] = React.useState('') // 현재 작업명
  const [isDone, setIsDone] = React.useState(false) // 작업 완료 여부(Timer 완료 시 전달하는용도) << TODO, 타이머 합치고 제거 예정
  const [editTask, setEditTask] = React.useState(false) // task 편집모드
  // 이거 리스트로 만들어두면 여러개의 task를 기록할 수 있을 것 같은데
  const [previousTask, setPreviousTask] = React.useState('') // 이전 작업명

  // 동기화 사용 안할 때 사용하는 플래그들
  const [notionSync, setNotionSync] = React.useState<boolean | null>(window.electron.store.get('notion-sync') ?? null)

  function showGuide() {
    window.open('https://github.com/younggeun0/pomodoro_notion_recorder')
  }

  function setKeys(notionKey: string, notionPomodoroDatabaseId: string) {
    let result = false
    if (notionKey && notionPomodoroDatabaseId) {
      if (!window.electron.ipcRenderer.sendSync('set_notion_keys', notionKey, notionPomodoroDatabaseId)) {
        alert('노션 API KEY 또는 DB ID가 잘못 입력됐습니다. 다시 설정해주세요.')
        return result
      }

      result = true
      window.electron.store.set('notion-sync', result)
      setNotionSync(result)
      setTodayInfo({
        date: dayjs().format('yyyy-mm-dd'),
        count: window.electron.store.get('TODAY_COUNT') || 0,
      })
    }
    return result
  }

  useEffect(() => {
    if (notionSync === false) {
      setTodayInfo({
        date: dayjs().format('yyyy-mm-dd'),
        count: 0,
      })
      return
    }

    const notionKey = window.electron.store.get('NOTION_KEY')
    const notionPomodoroDatabaseId = window.electron.store.get('NOTION_POMODORO_DATABASE_ID')
    setKeys(notionKey, notionPomodoroDatabaseId)
  }, [notionSync])

  function resetKeys() {
    setNotionSync(null)
    setUseLog(true)
    setTask('')
    window.electron.ipcRenderer.sendMessage('reset_notion_keys')
  }

  function updateTodayInfo() {
    const today = dayjs().format('YYYY-MM-DD')

    if (todayInfo && todayInfo.date === today) {
      setTodayInfo({
        date: todayInfo.date,
        count: todayInfo.count + 1,
      })
    } else {
      setTodayInfo({
        date: today,
        count: 1,
      })
    }
  }

  function logTask(value: string) {
    window.electron.ipcRenderer.sendMessage('log_task_memo', {
      task,
      memo: value,
    })
    // TODO, 기록기능이 들어가면서 쉬는 타이머를 쓸 수 없게됨, 상태 정보를 PomodoroTimer내부에서 핸들링하는 대신 Main에서 관리하도록 변경 필요
    setIsDone(false)
    setPreviousTask(task)
    setTask('')
  }

  // 0. isKeySet false -> setter show
  // 1. when isKeySet true, notionSync true
  //   - useLog true - memo and timer (최초기록은 타이머 없이 / 타이머 있고 메모는 상단 노출 / 최후기록은 타이머 없이 / 타이머 있고 최초기록을 위에, 최후기록을 하단에)
  //   - useLog false - normal timer
  // 2. when isKeySet true, notionSync false << 그냥 쓰기
  //   - useLog no matter - normal timer

  if (notionSync === null) {
    return (
      <>
        <NotionKeySetter
          setKeys={(notionKey, notionPomodoroDatabaseId) => setKeys(notionKey, notionPomodoroDatabaseId)}
          logState={{ useLog, setUseLog }}
        />

        <div className="mt-3 d-flex justify-content-end align-items-center">
          <button
            type="button"
            className="default_btn"
            onClick={() => {
              window.electron.store.set('notion-sync', false)
              setUseLog(false)
              setNotionSync(false)
              setTodayInfo({
                date: dayjs().format('yyyy-mm-dd'),
                count: 0,
              })
            }}
            style={{ marginRight: 10 }}
          >
            그냥 쓰기
          </button>
          <button type="button" className="default_btn" onClick={showGuide} style={{ borderRadius: '100%' }}>
            ?
          </button>
        </div>
      </>
    )
  }

  if (useLog && task === '') {
    return (
      <>
        <div className="py-5">
          <input
            id="task-input"
            type="text"
            className="w-100"
            placeholder="🍅 작업 목표를 설정해주세요."
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                if (e.target.value === '') {
                  alert('목표를 설정해주세요')
                  return
                }

                setTask(e.target.value)
                e.target.value = ''
              } else if (e.key === 'ArrowUp' && previousTask !== '') {
                e.target.value = previousTask
              }
            }}
          />
          <button
            type="button"
            className="default_btn mt-2 w-100"
            onClick={() => {
              const input = document.getElementById('task-input') as HTMLInputElement

              if (input?.value === '') {
                alert('목표를 설정해주세요')
                return
              }

              setTask(input?.value ?? '')
              input.value = ''
            }}
          >
            목표 설정
          </button>
        </div>

        <div className="mt-3 d-flex justify-content-end align-items-center">
          <button
            type="button"
            className="default_btn me-2"
            onClick={() => {
              if (window.confirm('노션 API KEY를 초기화하시겠습니까?')) {
                resetKeys()
              }
            }}
          >
            notion key 재설정 ✏️
          </button>
          <button type="button" className="default_btn rounded-pill" onClick={showGuide}>
            ?
          </button>
        </div>
      </>
    )
  }

  if (useLog && isDone) {
    return (
      <div>
        <textarea
          id="memo-input"
          className="w-100 rounded"
          placeholder={`📝 '${task}' 작업 내용을 기록해주세요.`}
          rows={8}
          onKeyUp={(e) => {
            // cmd + enter or ctrl + enter
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              logTask(e.target.value)
              e.target.value = ''
            }
          }}
        />
        <button
          type="button"
          className="default_btn mt-2 w-100"
          onClick={() => {
            const textarea = document.getElementById('memo-input') as HTMLInputElement
            logTask(textarea?.value ?? '')
            textarea.value = ''
          }}
        >
          메모 기록
        </button>
      </div>
    )
  }

  return (
    <>
      <div>
        {/* TODO, no sync인데 task값 설정이 되는 문제 */}
        {useLog && editTask && (
          <input
            id="task-edit-input"
            type="input"
            className="w-100 mb-2"
            value={task}
            onInput={(e) => {
              e.stopPropagation()
              if (e.target.value === '') {
                alert('목표를 설정해주세요')
                return
              }

              setTask(e.target.value)
            }}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                setEditTask(false)
              }
            }}
            onBlur={() => {
              setEditTask(false)
            }}
          />
        )}
        {useLog && !editTask && (
          <div className="text-wrap" style={{ maxWidth: '250px' }}>
            <strong
              onClick={() => {
                setEditTask(true)
                setTimeout(() => {
                  document.getElementById('task-edit-input')?.focus()
                }, 0)
              }}
            >
              🎯 {task}
            </strong>
          </div>
        )}

        <div className="d-flex justify-content-end mb-3 text-end">
          🍅 : {todayInfo?.count ?? 0}
          <br />
        </div>

        <PomodoroTimer updateTodayInfo={() => updateTodayInfo()} setIsDone={setIsDone} editTask={editTask} />

        <PomodoroHeatmap />
      </div>

      <div className="mt-3 d-flex justify-content-end align-items-center">
        <button
          type="button"
          className="default_btn me-2"
          onClick={() => {
            if (window.confirm('노션 API KEY를 초기화하시겠습니까?')) {
              resetKeys()
            }
          }}
        >
          notion key 재설정 ✏️
        </button>
        <button type="button" className="default_btn rounded-pill" onClick={showGuide}>
          ?
        </button>
      </div>
    </>
  )
}
