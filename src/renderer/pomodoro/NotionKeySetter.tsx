export default function NotionKeySetter({
  setKeys,
}: {
  setKeys: (notionKey: string, notionPomodoroDatabaseId: string) => boolean
}) {
  return (
    <div>
      <div className="text-center mb-3">
        노션에 뽀모도로(🍅) 횟수를 기록하기 위해
        <br />
        노션 API키와 DB ID를 설정해주세요.
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()

          const notionKey = (document.getElementById('notion_key') as HTMLInputElement).value
          const notionPomodoroDatabaseId = (document.getElementById('notion_pomodoro_database_id') as HTMLInputElement)
            .value

          // TODO, validate inputs
          if (!notionKey.trim() || !notionPomodoroDatabaseId.trim()) {
            alert('노션 API키와 페이지를 기록할 노션 DB ID를 입력해주세요.')
            return
          }

          window.electron.ipcRenderer.sendMessage('electron-store-set', 'NOTION_KEY', notionKey)
          window.electron.ipcRenderer.sendMessage(
            'electron-store-set',
            'NOTION_POMODORO_DATABASE_ID',
            notionPomodoroDatabaseId,
          )
          window.electron.ipcRenderer.sendMessage('set_notion_keys', notionKey, notionPomodoroDatabaseId)

          if (!setKeys(notionKey, notionPomodoroDatabaseId)) {
            const ids = ['notion_key', 'notion_pomodoro_database_id']
            const inputs = ids.map((id) => document.getElementById(id) as HTMLInputElement | null)

            inputs.forEach((input) => {
              if (input) {
                input.value = ''
              }
            })
          }
        }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <input type="text" id="notion_key" placeholder="노션 API KEY" />
          <input type="text" id="notion_pomodoro_database_id" placeholder="노션 DB ID" style={{ marginTop: 10 }} />
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
