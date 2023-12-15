// import dayjs from 'dayjs'
import React, { useEffect } from 'react'
import PomodoroTimer, { PomodoroInfo } from './PomodoroTimer'

export default function Pomodoro() {
  // const { data: session } = useSession();
  // const isYoung = true; // session?.user?.email === 'dureng5@gmail.com'
  // const allPomodoroInfos: any[] = [];
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

  useEffect(() => {
    const { NOTION_KEY, NOTION_POMODORO_DATABASE_ID } = window.electron

    if (NOTION_KEY && NOTION_POMODORO_DATABASE_ID) {
      localStorage.setItem('notion_key', NOTION_KEY)
      localStorage.setItem(
        'notion_pomodoro_database_id',
        NOTION_POMODORO_DATABASE_ID,
      )
      window.electron.ipcRenderer.sendMessage('set_notion_keys', {
        NOTION_KEY,
        NOTION_POMODORO_DATABASE_ID,
      })
    }
    // const notionKey = localStorage.getItem('notion_key')
    // const notionPomodoroDatabaseId = localStorage.getItem(
    //   'notion_pomodoro_database_id',
    // )

    // if (notionKey && notionPomodoroDatabaseId) {
    //   window.electron.ipcRenderer.sendMessage('set_notion_keys', [
    //     notionKey,
    //     notionPomodoroDatabaseId,
    //   ])
    // }

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
  }, [])

  return (
    <>
      <div style={{ paddingTop: '1px' }}>
        <PomodoroTimer todayInfo={todayInfo} setTodayInfo={setTodayInfo} />

        {/* <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '70%' }}>
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
      <button type="button" className="help-btn" onClick={showGuide}>
        ?
      </button>
    </>
  )
}
