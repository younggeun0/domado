import { Switch } from '@headlessui/react'
import { useAtom } from 'jotai'
import { useNavigate } from 'react-router-dom'
import { useMemoSync, useNotionSync } from '../jotaiStore'

export default function SetKeys() {
  const navigate = useNavigate()
  const [_useSync, setUseSync] = useAtom(useNotionSync)
  const [memoSync, setMemoSync] = useAtom(useMemoSync)

  const {
    electron: { ipcRenderer },
  } = window

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
  }

  return (
    <div className="w-full p-5 sm:p-10">
      <div className="font-extrabold text-3xl text-center text-red-600" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
        domado 🍅
      </div>
      <div className="text-center my-3">
        노션에 🍅를 기록하기 위해 <br /> 노션 키값을 설정해주세요.
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()

          const formData = new FormData(e.currentTarget)
          const data = Object.fromEntries(formData)

          let notionAPIKey = data.notion_api_key
          console.log('🚀 ~ notionKey:', notionAPIKey)
          let notionDatabaseId = data.notion_pomodoro_database_id
          console.log('🚀 ~ notionDatabaseId:', notionDatabaseId)


          // TODO, validate inputs
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
            if (!ipcRenderer.sendSync('set_notion_keys', notionAPIKey, notionDatabaseId)) {
              alert('노션 API KEY 또는 DB ID가 잘못 입력됐습니다. 다시 설정해주세요.')
              document.getElementById('notion_api_key')?.focus()
              return
            }
          }
          setUseSync(true)
          navigate('/pomodoro')
        }}
      >
        <div className="flex flex-col">
          <div>
            <label htmlFor="notion_api_key" className="block text-sm font-medium leading-6 text-gray-900">
              노션 API KEY
            </label>
            <div className="mt-1">
              <input
                id="notion_api_key"
                name="notion_api_key"
                type="text"
                required
                className="block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div className="mt-2">
            <label htmlFor="notion_pomodoro_database_id" className="block text-sm font-medium leading-6 text-gray-900">
              노션 DB ID
            </label>
            <div className="mt-1">
              <input
                id="notion_pomodoro_database_id"
                name="notion_pomodoro_database_id"
                required
                className="block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
              />
            </div>
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
                navigate('/pomodoro')
              }}
            >
              그냥쓰기
            </button>
          </div>

          <div className="mt-2">
            <Switch.Group as="div" className="flex gap-x-2 sm:col-span-2">
              <div className="flex h-6 items-center">
                <Switch
                  checked={memoSync}
                  onChange={setMemoSync}
                  className={classNames(
                    memoSync ? 'bg-green-600' : 'bg-gray-200',
                    'flex w-8 flex-none cursor-pointer rounded-full p-px ring-1 ring-inset ring-gray-900/5 transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600',
                  )}
                >
                  <span className="sr-only">Agree to policies</span>
                  <span
                    aria-hidden="true"
                    className={classNames(
                      memoSync ? 'translate-x-3.5' : 'translate-x-0',
                      'h-4 w-4 transform rounded-full bg-white shadow-sm ring-1 ring-gray-900/5 transition duration-200 ease-in-out',
                    )}
                  />
                </Switch>
              </div>
              <Switch.Label className="text-sm leading-6">
                <div className="group flex relative">
                  <span
                    className="text-sm group-hover:opacity-100 w-80 transition-opacity bg-gray-700 px-1 text-sm text-gray-100 rounded-md absolute left-1/2 
                    -translate-x-1/3 translate-y-2 opacity-0 m-4 mx-auto"
                  >
                    메모하기를 활성화하면 뽀모도로 횟수 뿐만 아니라 메모 내용도 동기화합니다.
                  </span>
                  <span>메모하기</span>
                  <div className="inline ms-1 opacity-50">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                      />
                    </svg>
                  </div>
                </div>
              </Switch.Label>
            </Switch.Group>
          </div>
        </div>
      </form>
    </div>
  )
}
