import dayjs from 'dayjs';
import React from 'react';
import PomodoroTimer, { PomodoroInfo } from './PomodoroTimer';

export function Pomodoro() {
  // const { data: session } = useSession();
  // const isYoung = true; // session?.user?.email === 'dureng5@gmail.com'
  const allPomodoroInfos: any[] = [];
  const [todayInfo, setTodayInfo] = React.useState<
    PomodoroInfo | null | undefined
  >(null);
  const [pomodoroInfos, setPomodoroInfos] =
    React.useState<PomodoroInfo[]>(allPomodoroInfos);

  React.useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const info = pomodoroInfos.find((info) => info.date === today);
    setTodayInfo(info);
  }, [pomodoroInfos]);

  React.useEffect(() => {
    if (!todayInfo) return;

    const idx = pomodoroInfos.findIndex(
      (info) => info.date === todayInfo?.date,
    );

    if (idx !== -1) {
      const newPomodoroInfos = [...pomodoroInfos];
      newPomodoroInfos[idx] = todayInfo;
      setPomodoroInfos(newPomodoroInfos);
    } else {
      setPomodoroInfos([...pomodoroInfos, todayInfo]);
    }
  }, [pomodoroInfos, todayInfo]);

  return (
    <section style={{ paddingTop: '1px' }}>
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
    </section>
  );
}
