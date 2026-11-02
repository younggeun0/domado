import './tauriBridge'
import { createRoot } from 'react-dom/client'
import App from './App'

if (!window.domado) document.documentElement.classList.add('web')

const container = document.getElementById('root') as HTMLElement
const root = createRoot(container)
root.render(<App />)
