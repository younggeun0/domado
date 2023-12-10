import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import { Client } from '@notionhq/client';
// import chimeSound from '../../../audio/chime.mp3';

// const notion = new Client({ auth: window.dot_env.NOTION_KEY });
// const POMODORO_DB_ID = window.dot_env.NOTION_POMODORO_DATABASE_ID as string;

export interface PomodoroInfo {
  date: string;
  count: number;
}

// TODO, 한 사이클 분설정 기능 추가
const MIN_PER_POMODORO = 0.05; // 25;
const MIN_PER_REST = 0.05; // 5;
const DURATIONS = [60 * MIN_PER_POMODORO, 60 * MIN_PER_REST]; // 웹앱 특성 상 계속 사용하지 않으므로 15분 쉬는건 우선 제외
// const DURATIONS = [5, 3] // for test

interface PomodoroTimerProps {
  todayInfo: PomodoroInfo | null | undefined;
  setTodayInfo: React.Dispatch<
    React.SetStateAction<PomodoroInfo | null | undefined>
  >;
}

export default function PomodoroTimer({
  todayInfo,
  setTodayInfo,
}: PomodoroTimerProps) {
  const [seq, setSeq] = useState(0);
  const [status, setStatus] = useState<'play' | 'paused' | 'finished'>(
    'paused',
  );

  useEffect(() => {
    if (status === 'finished') {
      setSeq((s) => (s + 1) % 2);
      setStatus('paused');
    }
  }, [status]);

  async function updateOrCreatePomodoro() {
    try {
      // TODO, sound, post to notion using ipc

      // try {
      //   const today = new Date();
      //   today.setHours(0, 0, 0, 0);

      //   const { results } = await notion.databases.query({
      //     database_id: POMODORO_DB_ID,
      //     filter: {
      //       created_time: {
      //         after: today.toISOString(),
      //       },
      //       timestamp: 'created_time',
      //     },
      //     sorts: [
      //       {
      //         timestamp: 'created_time',
      //         direction: 'ascending',
      //       },
      //     ],
      //   });

      //   if (results.length > 0) {
      //     // 이미 등록된 오늘자 포모도로 페이지가 있으면 기존 페이지에 🍅 추가
      //     const page = results[0];
      //     const previousTitle = (page as any).properties.name.title[0].text
      //       .content;
      //     const tokens = previousTitle.split(' ');
      //     await notion.pages.update({
      //       page_id: page.id as string,
      //       properties: {
      //         name: {
      //           title: [
      //             {
      //               text: {
      //                 content: `🍅 * ${
      //                   parseInt(tokens[tokens.length - 1], 10) + 1
      //                 }`,
      //               },
      //             },
      //           ],
      //         },
      //       },
      //     });
      //   } else {
      //     // 새로운 페이지가 없으면 새로 생성
      //     await notion.pages.create({
      //       parent: {
      //         type: 'database_id',
      //         database_id: POMODORO_DB_ID,
      //       },
      //       properties: {
      //         name: {
      //           title: [
      //             {
      //               text: {
      //                 content: '🍅 * 1',
      //               },
      //             },
      //           ],
      //         },
      //       },
      //     });
      //   }
      // } catch (e) {
      //   console.error(e);
      // }

      // new Audio(chimeSound).play();
      // await fetch('/api/pomodoro', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      // });

      if (todayInfo) {
        setTodayInfo({
          date: todayInfo.date,
          count: todayInfo.count + 1,
        });
      } else {
        setTodayInfo({
          date: dayjs().format('YYYY-MM-DD'),
          count: 1,
        });
      }
    } catch (e) {
      alert(e);
      console.error(e);
    }
  }

  function start() {
    setSeq((s) => (s = 0));
    setStatus('play');
  }

  const isRest = seq === 1;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        fontSize: '3rem',
        alignItems: 'center',
        margin: '3rem 0 4rem 0',
      }}
    >
      <svg style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="pomodoro-timer" x1="1" y1="0" x2="0" y2="0">
            {isRest ? (
              <stop offset="100%" stopColor="#478476" />
            ) : (
              <>
                <stop offset="5%" stopColor="gold" />
                <stop offset="95%" stopColor="red" />
              </>
            )}
          </linearGradient>
        </defs>
      </svg>
      <CountdownCircleTimer
        key={seq}
        isPlaying={status === 'play'}
        duration={DURATIONS[seq]}
        colors="url(#pomodoro-timer)"
        onComplete={(_totalElapsedTime) => {
          if (!isRest) updateOrCreatePomodoro();
          setStatus('finished');
        }}
        trailStrokeWidth={30}
        trailColor="#373d47"
        strokeWidth={20}
        size={250}
      >
        {({ remainingTime }) => {
          if (status === 'paused') {
            return (
              <>
                {isRest && (
                  <span
                    style={{ cursor: 'pointer', marginRight: '1rem' }}
                    onClick={() => {
                      setStatus('play');
                    }}
                  >
                    ☕️
                  </span>
                )}
                <span style={{ cursor: 'pointer' }} onClick={start}>
                  🔥
                </span>
              </>
            );
          }
          // TODO, 브라우저 종료 시 remainingTime을 로컬 스토리지에 백업하고 다시 불러오는 기능
          const minutes = Math.floor(remainingTime / 60);
          const seconds = remainingTime % 60;

          return (
            <span
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setStatus('paused');
              }}
            >
              {`${minutes}:${seconds}`}
            </span>
          );
        }}
      </CountdownCircleTimer>
      <audio id="audio" src="/chime.mp3" />
    </div>
  );
}

