import { MemoryRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Layout from './pages/Layout'
import Pomodoro from './pages/Pomodoro'
import SetKeys from './pages/SetKeys'
import Statistic from './pages/Statistic'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="pomodoro" element={<Pomodoro />} />
          <Route path="set_keys" element={<SetKeys />} />
          {/* TODO, 타이머에서 통계보기 눌렀을 때 바로 이동안되는 현상 */}
          <Route path="statistic" element={<Statistic />} />
        </Route>
      </Routes>
    </Router>
  )
}
