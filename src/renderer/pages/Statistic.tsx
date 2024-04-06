import { Switch } from '@headlessui/react'
import { useAtom } from 'jotai'
import { useNavigate } from 'react-router-dom'
import { useMemoSync, useNotionSync } from '../jotaiStore'
import PomodoroHeatmap from '../components/PomodoroHeatmap'

export default function Statistic() {
  const navigate = useNavigate()
  const [useSync] = useAtom(useNotionSync)

  return (
    <>
      <button
        type="button"
        className="me-2 underline text-blue-500"
        onClick={() => {
          navigate('/pomodoro')
        }}
      >
        🍅 타이머로 이동
      </button>
      <PomodoroHeatmap />
    </>
  )
}
