import React from 'react'

export default function NotionKeySetter({
  setIsKeySet,
}: {
  setIsKeySet: React.Dispatch<React.SetStateAction<boolean>>
}) {
  return (
    <div>
      <div style={{ textAlign: 'center', padding: '0 10px 30px 10px' }}>
        노션에 뽀모도로(🍅) 횟수를 기록하기 위해 노션 API키와 DB ID를 설정해주세요.
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()

          const NOTION_KEY = (
            document.getElementById('notion_key') as HTMLInputElement
          ).value
          const NOTION_POMODORO_DATABASE_ID = (
            document.getElementById(
              'notion_pomodoro_database_id',
            ) as HTMLInputElement
          ).value

          // TODO, validate inputs
          if (!NOTION_KEY.trim() || !NOTION_POMODORO_DATABASE_ID.trim()) {
            alert('노션 API키와 페이지를 기록할 노션 DB ID를 입력해주세요.')
            return
          }

          localStorage.setItem('notion_key', NOTION_KEY)
          localStorage.setItem(
            'notion_pomodoro_database_id',
            NOTION_POMODORO_DATABASE_ID,
          )

          window.electron.ipcRenderer.sendMessage('set_notion_keys', {
            NOTION_KEY,
            NOTION_POMODORO_DATABASE_ID,
          })
          setIsKeySet(true)
        }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <input type="text" id="notion_key" placeholder="노션 API KEY" />
          <input
            type="text"
            id="notion_pomodoro_database_id"
            placeholder="노션 DB ID"
            style={{ marginTop: 10 }}
          />
        </div>
        <div>
          <button
            type="submit"
            style={{
              marginLeft: 10,
              background: 'transparent',
              fontSize: '3rem',
            }}
          >
            💾
          </button>
        </div>
      </form>
    </div>
  )
}
