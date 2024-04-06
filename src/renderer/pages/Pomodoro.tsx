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
    electron: { ipcRenderer },
  } = window

  // 동기화 쓸 때 사용할 플래그들
  const [task, setTask] = React.useState('') // 현재 작업명
  const [editTask, setEditTask] = React.useState(false) // task 편집모드

  // TODO, previousTasks로 변경(이력관리)
  const [previousTask, setPreviousTask] = React.useState('')

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
      {useSync && syncMemo && (
        <div className="mb-5">
          <div>
            <label htmlFor="doing_task" className="block text-sm font-medium leading-6 text-gray-900">
              🎯 FOCUS ON...
            </label>
            <div className="mt-1">
              <input
                id="doing_task"
                name="doing_task"
                type="text"
                className="block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          <div className="mt-2">
            <textarea
              id="memo_textarea"
              name="memo_textarea"
              rows={8}
              className="block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="작업 내용(내부, 외부 방해 요인, 중간 작업 기록)을 기록해주세요."
              defaultValue=""
              onKeyUp={(e) => {
                // cmd + enter or ctrl + enter
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  logTask(e.target.value)
                  e.target.value = ''
                }
              }}
            />
          </div>
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
    </div>
  )
}
