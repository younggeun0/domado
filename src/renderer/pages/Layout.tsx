import { useAtom } from 'jotai'
import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useNotionSync } from '../jotaiStore'
import Footer from '../components/Footer'

export default function Layout() {
  const navigate = useNavigate()
  const [useSync] = useAtom(useNotionSync)
  const {
    electron: { store: electronStore, ipcRenderer },
  } = window

  useEffect(() => {
    console.log('visit index')
  }, [])

  useEffect(() => {
    if (useSync === null) {
      navigate('/set_keys')
    } else {
      navigate('/pomodoro')
    }
  }, [navigate, useSync])

  return (
    <div className="w-screen h-screen flex flex-col overflow-auto text-gray-600">
      <div className="p-3 flex flex-1 flex-col items-center justify-center">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
