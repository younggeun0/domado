import { MemoryRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Pomodoro from './pages/Pomodoro'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Pomodoro />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  )
}
