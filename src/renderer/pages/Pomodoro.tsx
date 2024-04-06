import React from 'react'
import { useAtom } from 'jotai'
import PomodoroTimer from '../components/PomodoroTimer'
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

  // TODO, taskHistory로 변경(이력관리)
  const [taskHistory, setTaskHistory] = React.useState([])

  function logTask(value: string) {
    const task = document.getElementById('doing_task')?.value
    const memo = document.getElementById('memo_textarea')?.value

    ipcRenderer.sendMessage('log_task_memo', {
      task,
      memo,
    })
    // TODO, 기록기능이 들어가면서 쉬는 타이머를 쓸 수 없게됨, 상태 정보를 PomodoroTimer내부에서 핸들링하는 대신 Main에서 관리하도록 변경 필요
    setTaskHistory((prev) => [...prev, task])

    document.getElementById('doing_task')!.value = ''
    document.getElementById('memo_textarea')!.value = ''
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
              rows={4}
              className="block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              defaultValue="📝 메모&#13;- &#13;🤺 내/외부 방해 요인&#13;- "
              onKeyUp={(e) => {
                // cmd + enter or ctrl + enter
                // TODO, 휴식 시간에 버튼으로 등록 처리를 할 수 있게 개선 필요
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
      />
    </div>
  )
}
