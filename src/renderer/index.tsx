import { createRoot } from 'react-dom/client'
import App from './App'

const container = document.getElementById('root') as HTMLElement
const root = createRoot(container)
root.render(<App />)

// calling IPC exposed from preload script
// window.electron.ipcRenderer.once('ipc-example', (arg) => {
//   // eslint-disable-next-line no-console
//   // TODO, 최초 뽀모도로 리스트를 조회할 때 사용
//   console.log(arg);
// });

// window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);

// window.electron.ipcRenderer.on('end_post_pomodoro', async (arg) => {
//   // eslint-disable-next-line no-console
//   // TODO, 최초 뽀모도로 리스트를 조회할 때 사용
//   console.log(arg);
// });
