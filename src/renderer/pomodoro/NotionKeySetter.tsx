export default function NotionKeySetter({
  setKeys,
  logState,
}: {
  setKeys: (notionKey: string, notionPomodoroDatabaseId: string) => boolean
  logState: {
    useLog: boolean
    setUseLog: (useLog: boolean) => void
  }
}) {
  const { useLog, setUseLog } = logState

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
          let notionDatabaseId = (document.getElementById('notion_pomodoro_database_id') as HTMLInputElement).value

          // TODO, validate inputs
          if (!notionKey.trim() || !notionDatabaseId.trim()) {
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

          window.electron.ipcRenderer.sendMessage('electron-store-set', 'NOTION_KEY', notionKey)
          window.electron.ipcRenderer.sendMessage('electron-store-set', 'NOTION_POMODORO_DATABASE_ID', notionDatabaseId)
          window.electron.ipcRenderer.sendMessage('set_notion_keys', notionKey, notionDatabaseId)

          if (!setKeys(notionKey, notionDatabaseId)) {
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
              fontSize: '2.5rem',
              margin: '0px',
              lineHeight: '1',
            }}
          >
            💾
          </button>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="use-log"
              checked={useLog}
              onChange={() => setUseLog(!useLog)}
            />
            <label className="form-check-label" htmlFor="use-log">
              기록하기
            </label>
          </div>
        </div>
      </form>
    </div>
  )
}
