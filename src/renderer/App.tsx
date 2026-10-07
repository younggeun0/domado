import './App.css'
import History from './pages/History'
import Pomodoro from './pages/Pomodoro'
import Settings from './pages/Settings'

// 메인 프로세스가 창마다 다른 해시로 같은 renderer를 연다 (위젯 / #settings / #history)
const PAGES: Record<string, () => React.JSX.Element> = { '#settings': Settings, '#history': History }

export default function App() {
  const Page = PAGES[window.location.hash] ?? Pomodoro
  return <Page />
}
