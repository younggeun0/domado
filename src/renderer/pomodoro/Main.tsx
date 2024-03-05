// import dayjs from 'dayjs'
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
  const [isKeySet, setIsKeySet] = React.useState(false)
  const [todayInfo, setTodayInfo] = React.useState<PomodoroInfo | null | undefined>(null)
  const [notionSync, setNotionSync] = React.useState(window.electron.store.get('notion-sync') ?? true)
  const [useLog, setUseLog] = React.useState(true)
  const [task, setTask] = React.useState('')
  const [isDone, setIsDone] = React.useState(false)
  const [editTask, setEditTask] = React.useState(false)
  const [previousTask, setPreviousTask] = React.useState('')

  function showGuide() {
    window.open('https://github.com/younggeun0/pomodoro_notion_recorder')
  }

  function setKeys(notionKey: string, notionPomodoroDatabaseId: string) {
    let result = false
    if (notionKey && notionPomodoroDatabaseId) {
      if (!window.electron.ipcRenderer.sendSync('set_notion_keys', notionKey, notionPomodoroDatabaseId)) {
        alert('노션 API KEY 또는 Database ID가 잘못 입력됐습니다. 다시 설정해주세요.')
      } else {
        const count = window.electron.store.get('TODAY_COUNT') || 0

        setTodayInfo({
          date: dayjs().format('yyyy-mm-dd'),
          count,
        })
        result = true
        window.electron.store.set('notion-sync', true)
        setNotionSync(true)
      }
      setIsKeySet(result)
    }
    return result
  }

  useEffect(() => {
    if (!notionSync) {
      setIsKeySet(true)
      setTodayInfo({
        date: dayjs().format('yyyy-mm-dd'),
        count: 0,
      })
      return
    }

    const notionKey = window.electron.store.get('NOTION_KEY')
    const notionPomodoroDatabaseId = window.electron.store.get('NOTION_POMODORO_DATABASE_ID')
    setKeys(notionKey, notionPomodoroDatabaseId)

    // window.electron.ipcRenderer.send('pomodoro:ready')
    // window.electron.ipcRenderer.on('pomodoro:ready', () => {
    //   window.electron.ipcRenderer.send('pomodoro:load')
    // })
    // window.electron.ipcRenderer.on(
    //   'pomodoro:load',
    //   (event: any, pomodoroInfos: PomodoroInfo[]) => {
    //     // setPomodoroInfos(pomodoroInfos);
    //     const today = new Date().toLocaleDateString()
    //     const found = pomodoroInfos.find((info) => info.date === today)
    //     setTodayInfo(found)
    //   },
    // )
  }, [notionSync])

  function resetKeys() {
    setIsKeySet(false)
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

  if (!isKeySet) {
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
              // TODO, api 키 설정했는지 여부로 히트맵을 보여주기 위해서 그냥 쓸 땐 keySet을 false로 유지하고 다른 플래그로 판단하는게 좋아보임
              setIsKeySet(true)
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
      <div>
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
            <strong onClick={() => {
              setEditTask(true)
              setTimeout(() => {
                document.getElementById('task-edit-input')?.focus()
              }, 0)
            }}>🎯 {task}</strong>
          </div>
        )}

        <div className="d-flex justify-content-end mb-3 text-end">
          🍅 : {todayInfo?.count ?? 0}
          <br />
          {!notionSync && 'no sync '}
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
