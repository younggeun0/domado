import { useNavigate } from 'react-router-dom'
import PomodoroHeatmap from '../components/PomodoroHeatmap'

export default function Statistic() {
  const navigate = useNavigate()

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
