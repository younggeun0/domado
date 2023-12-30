// import dayjs from 'dayjs'
import React, { useEffect } from 'react'
import dayjs from 'dayjs'
import PomodoroTimer from './PomodoroTimer'
import NotionKeySetter from './NotionKeySetter'

export interface PomodoroInfo {
  date: string
  count: number
}

export default function Pomodoro() {
  // const { data: session } = useSession();
  // const allPomodoroInfos: any[] = [];

  const [isKeySet, setIsKeySet] = React.useState(false)
  const [todayInfo, setTodayInfo] = React.useState<
    PomodoroInfo | null | undefined
  >(null)
  // const [pomodoroInfos, setPomodoroInfos] =
  //   React.useState<PomodoroInfo[]>(allPomodoroInfos);

  // React.useEffect(() => {
  //   const today = dayjs().format('YYYY-MM-DD');
  //   const found = pomodoroInfos.find((info) => info.date === today);
  //   setTodayInfo(found);
  // }, [pomodoroInfos]);

  // React.useEffect(() => {
  //   if (!todayInfo) return;

  //   const idx = pomodoroInfos.findIndex(
  //     (info) => info.date === todayInfo?.date,
  //   );

  //   if (idx !== -1) {
  //     const newPomodoroInfos = [...pomodoroInfos];
  //     newPomodoroInfos[idx] = todayInfo;
  //     setPomodoroInfos(newPomodoroInfos);
  //   } else {
  //     setPomodoroInfos([...pomodoroInfos, todayInfo]);
  //   }
  // }, [pomodoroInfos, todayInfo]);

  function showGuide() {
    alert(`🍅 사용 가이드 🍅`)
  }

  const notionKey = window.electron.store.get('NOTION_KEY')
  const notionPomodoroDatabaseId = window.electron.store.get(
    'NOTION_POMODORO_DATABASE_ID',
  )

  useEffect(() => {
    if (notionKey && notionPomodoroDatabaseId) {
      setIsKeySet(true)

      // TODO, 최초 실행 시 노션 DB에서 이미 등록된 뽀모도로 페이지가 있는지 확인,
      // 확인하며 요청, 응답이 정상적으로 이뤄지는지 확인하여 사용자에게 알려줘야 함
      const count = window.electron.store.get('TODAY_COUNT')
      console.log("🚀 ~ file: Pomodoro.tsx:59 ~ useEffect ~ count:", count)
      setTodayInfo({
        date: dayjs().format('yyyy-mm-dd'),
        count,
      })
    }
    // window.electron.ipcRenderer.send('pomodoro:ready')
    // window.electron.ipcRenderer.on('pomodoro:ready', () => {
    //   window.electron.ipcRenderer.send('pomodoro:load')
    // })
    // window.electron.ipcRenderer.on(
    //   'pomodoro:load',
    //   (event: any, pomodoroInfos: PomodoroInfo[]) => {
    //     // setPomodoroInfos(pomodoroInfos);
    //     const today = new Date().toLocaleDateString()
    //     const found = pomodoroInfos.find((info) => info.date === today)
    //     setTodayInfo(found)
    //   },
    // )
  }, [notionKey, notionPomodoroDatabaseId])

  function resetKeys() {
    window.electron.ipcRenderer.sendMessage('reset_notion_keys')
    setIsKeySet(false)
  }

  function updateTodayInfo() {
    if (todayInfo) {
      setTodayInfo({
        date: todayInfo.date,
        count: todayInfo.count + 1,
      })
    } else {
      setTodayInfo({
        date: dayjs().format('YYYY-MM-DD'),
        count: 1,
      })
    }
  }

  return isKeySet ? (
    <>
      <div style={{ paddingTop: '1px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'end',
            marginBottom: '1rem',
          }}
        >
          🍅 : {todayInfo?.count ?? 0}
        </div>
        <PomodoroTimer updateTodayInfo={() => updateTodayInfo()} />

        {/* <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div style={{ wimdth: '70%' }}>
                          <CalendarHeatmap
                              startDate={new Date('2023-04-30')}
                              endDate={new Date('2023-08-01')}
                              onClick={(value: any) => {
                                  if (!value || !isYoung) return

                                  alert(`${value.date}  🍅 * ${value.count}`)
                              }}
                              classForValue={(value: any) => {
                                  let selectorNumber = 0
                                  if (!value || value.count === 0) {
                                  } else if (value.count > 8) {
                                      selectorNumber = 4
                                  } else if (value.count > 6) {
                                      selectorNumber = 3
                                  } else if (value.count > 4) {
                                      selectorNumber = 2
                                  } else if (value.count > 0) {
                                      selectorNumber = 1
                                  }

                                  return `color-github-${selectorNumber}`
                              }}
                              values={pomodoroInfos}
                          />
                      </div>
                  </div> */}
      </div>
      <div className="bottom_btns">
        <button
          type="button"
          className="bottom_btn"
          onClick={() => {
            if (window.confirm('노션 key를 초기화하시겠습니까?')) {
              resetKeys()
            }
          }}
          style={{ marginRight: 10 }}
        >
          notion key 재설정 ✏️
        </button>
        <button
          type="button"
          className="bottom_btn"
          onClick={showGuide}
          style={{ borderRadius: '100%' }}
        >
          ?
        </button>
      </div>
    </>
  ) : (
    <>
      <NotionKeySetter setIsKeySet={setIsKeySet} />
      <div className="bottom_btns">
        <button
          type="button"
          className="bottom_btn"
          onClick={() => {
            window.electron.ipcRenderer.sendMessage('set_notion_keys', {
              notionKey: '',
              notionPomodoroDatabaseId: '',
            })
            setIsKeySet(true)
          }}
          style={{ marginRight: 10 }}
        >
          그냥 쓰기
        </button>
        <button
          type="button"
          className="bottom_btn"
          onClick={showGuide}
          style={{ borderRadius: '100%' }}
        >
          ?
        </button>
      </div>
    </>
  )
}
