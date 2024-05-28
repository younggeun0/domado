import { MemoryRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'
import Layout from './pages/Layout'
import Pomodoro from './pages/Pomodoro'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="pomodoro" element={<Pomodoro />} />
        </Route>
      </Routes>
    </Router>
  )
}
