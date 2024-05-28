/* eslint-disable consistent-return */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
import { useAtom } from 'jotai'
import { useNavigate } from 'react-router-dom'
import { useCallback, useEffect } from 'react'
import { todayPomodoroInfo, useNotionSync } from '../jotaiStore'

export default function SetKeys() {
  const navigate = useNavigate()
  const [_useSync, setUseSync] = useAtom(useNotionSync)
  const [_todayInfo, setTodayInfo] = useAtom(todayPomodoroInfo)

  const setNotionKeys = useCallback(
    (notionAPIKey: string, notionDatabaseId: string) => {
      if (!notionAPIKey.trim() || !notionDatabaseId.trim()) {
        alert('노션 API키와 페이지를 기록할 노션 DB ID를 입력해주세요.')
        return
      }

      const NOTION_URL = 'https://www.notion.so/'
      if (notionDatabaseId.startsWith(NOTION_URL)) {
        notionDatabaseId = notionDatabaseId.split(NOTION_URL)[1] as string
        const hasWorkspace = notionDatabaseId.split('/').length > 1

        if (hasWorkspace) {
          notionDatabaseId = notionDatabaseId.split('/')[1] as string
        }
        notionDatabaseId = notionDatabaseId.substring(0, notionDatabaseId.indexOf('?'))
      }

      if (notionAPIKey && notionDatabaseId) {
        if (!window.electron?.ipcRenderer.sendSync('set_notion_keys', notionAPIKey, notionDatabaseId)) {
          alert('노션 API KEY 또는 DB ID가 잘못 입력됐습니다. 다시 설정해주세요.')
          document.getElementById('notion_api_key')?.focus()
          return
        }
      }

      setUseSync(true)
      setTodayInfo({
        count: window.electron?.store.get('TODAY_COUNT'),
      })
      const timeout = setTimeout(navigate, 0, '/pomodoro', { replace: true })

      return () => {
        clearTimeout(timeout)
      }
    },
    [setUseSync, setTodayInfo, navigate],
  )

  useEffect(() => {
    const notionAPIKey = (window.electron?.store.get('NOTION_API_KEY') as string) || ''
    const notionDatabaseId = (window.electron?.store.get('NOTION_POMODORO_DATABASE_ID') as string) || ''

    if (notionAPIKey === '' && notionDatabaseId === '') return

    setNotionKeys(notionAPIKey, notionDatabaseId)
  }, [setNotionKeys])

  return (
    <div className="w-full p-5 sm:p-10">
      <div className="font-extrabold text-3xl text-center text-red-600" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
        domado
      </div>
      <div className="text-sm text-center my-3">
        노션에 🍅를 기록하기 위해 <br /> 노션 키값을 설정해주세요.
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()

          const formData = new FormData(e.currentTarget)
          const { notion_api_key, notion_pomodoro_database_id } = Object.fromEntries(formData)

          setNotionKeys(notion_api_key as string, notion_pomodoro_database_id as string)
        }}
      >
        <div className="flex flex-col">
          <div className="mt-1">
            <input
              id="notion_api_key"
              name="notion_api_key"
              placeholder="노션 API KEY"
              type="text"
              required
              className="text-sm block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
            />
          </div>
          <div className="mt-2">
            <input
              id="notion_pomodoro_database_id"
              name="notion_pomodoro_database_id"
              placeholder="노션 DB URL"
              required
              className="text-sm block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
            />
          </div>

          <div className="mt-3">
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            >
              저장
            </button>
          </div>

          <div className="mt-3">
            <button
              type="button"
              className="flex w-full justify-center rounded-md bg-neutral-700 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-neutral-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-700"
              onClick={() => {
                setUseSync(false)
                setTodayInfo({
                  count: 0,
                })
                navigate('/pomodoro')
              }}
            >
              그냥쓰기
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
