import { useAtom } from 'jotai'
import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useNotionSync } from '../jotaiStore'
import Footer from '../components/Footer'

export default function Layout() {
  const navigate = useNavigate()
  const [useSync] = useAtom(useNotionSync)

  useEffect(() => {
    if (useSync === null) navigate('/set_keys')
  }, [navigate, useSync])

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-auto text-gray-600">
      <div className="p-3 flex flex-1 flex-col items-center justify-center">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
