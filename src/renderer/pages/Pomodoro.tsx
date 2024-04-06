import React, { useEffect } from 'react'
import { useAtom } from 'jotai'
import PomodoroTimer from '../components/PomodoroTimer'
import PomodoroHeatmap from '../components/PomodoroHeatmap'
import { todayPomodoroInfo, useMemoSync, useNotionSync } from '../jotaiStore'

export interface PomodoroInfo {
  date: string
  count: number
}

export default function Pomodoro() {
  const [useSync] = useAtom(useNotionSync)
  const [syncMemo] = useAtom(useMemoSync)
  const [todayInfo, setTodayInfo] = useAtom(todayPomodoroInfo)

  const {
    electron: { store: electronStore, ipcRenderer },
  } = window

  // 동기화 쓸 때 사용할 플래그들
  const [task, setTask] = React.useState('') // 현재 작업명
  const [editTask, setEditTask] = React.useState(false) // task 편집모드

  // TODO, previousTasks로 변경(이력관리)
  const [previousTask, setPreviousTask] = React.useState('')

  useEffect(() => {
    console.log('visit pomodoro')
  }, [])

  function logTask(value: string) {
    ipcRenderer.sendMessage('log_task_memo', {
      task,
      memo: value,
    })
    // TODO, 기록기능이 들어가면서 쉬는 타이머를 쓸 수 없게됨, 상태 정보를 PomodoroTimer내부에서 핸들링하는 대신 Main에서 관리하도록 변경 필요
    setPreviousTask(task)
    setTask('')
  }

  return (
    <div>
      {/* TODO, no sync인데 task값 설정이 되는 문제 */}
      {useSync && syncMemo && (
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
      {useSync && syncMemo && !editTask && (
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

      <PomodoroTimer
        updateTodayInfo={() =>
          setTodayInfo({
            date: todayInfo.date,
            count: todayInfo.count + 1,
          })
        }
        editTask={editTask}
      />

      {useSync && <PomodoroHeatmap />}
    </div>
  )
}
