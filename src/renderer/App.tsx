import { MemoryRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Pomodoro from './pages/Pomodoro'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Pomodoro />} />
      </Routes>
    </Router>
  )
}
