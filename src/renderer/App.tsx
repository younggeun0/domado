import { MemoryRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Layout from './pages/Layout'
import Pomodoro from './pages/Pomodoro'
import SetKeys from './pages/SetKeys'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="pomodoro" element={<Pomodoro />} />
          <Route path="set_keys" element={<SetKeys />} />
        </Route>
      </Routes>
    </Router>
  )
}
