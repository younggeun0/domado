import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { usePomodoroSettings } from '../hooks/usePomodoroSettings'

export default function Settings() {
  const navigate = useNavigate()
  const { pomodoroMinutes, restMinutes, updateSettings } = usePomodoroSettings()
  const [pomodoroMinutesInput, setPomodoroMinutesInput] = useState(pomodoroMinutes.toString())
  const [restMinutesInput, setRestMinutesInput] = useState(restMinutes.toString())

  useEffect(() => {
    setPomodoroMinutesInput(pomodoroMinutes.toString())
    setRestMinutesInput(restMinutes.toString())
  }, [pomodoroMinutes, restMinutes])

  const handleSave = () => {
    const pomodoro = parseInt(pomodoroMinutesInput, 10)
    const rest = parseInt(restMinutesInput, 10)

    if (pomodoro > 0 && rest > 0) {
      updateSettings(pomodoro, rest)
      navigate('/')
    }
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg border border-gray-700 p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">domado 설정</h1>
          <p className="text-gray-400 text-sm">뽀모도로 시간과 휴식 시간을 설정하세요.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="pomodoro" className="text-sm font-medium text-gray-300 block">
              뽀모도로 시간 (분)
            </label>
            <input
              id="pomodoro"
              type="number"
              min="1"
              value={pomodoroMinutesInput}
              onChange={(e) => setPomodoroMinutesInput(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white placeholder:text-gray-500 px-3 py-2 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="rest" className="text-sm font-medium text-gray-300 block">
              휴식 시간 (분)
            </label>
            <input
              id="rest"
              type="number"
              min="1"
              value={restMinutesInput}
              onChange={(e) => setRestMinutesInput(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white placeholder:text-gray-500 px-3 py-2 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-600 text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

