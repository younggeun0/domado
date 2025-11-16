import { Link } from 'react-router-dom'
import { formatRemainingTime } from './pomodoro'

interface FooterProps {
  isRest: boolean
  remainingTime: number
  todayInfo: { count: number }
  status: 'restart' | 'running' | 'finish' | 'paused'
  onTogglePlay: () => void
}

export default function Footer({ isRest, remainingTime, todayInfo, status, onTogglePlay }: FooterProps) {
  return (
    <div
      className="text-sm p-3 w-full flex justify-between items-end"
      style={{
        zIndex: '10',
      }}
    >
      <div
        className="flex flex-col gap-2"
        style={{
          // @ts-ignore
          WebkitAppRegion: 'drag',
          // no-select
          WebKitUserSelect: 'none',
          MozUserSelect: 'none',
          MSUserSelect: 'none',
          userSelect: 'none',
          cursor: 'grab',
        }}
      >
        {!isRest && <div className="text-white/80">{formatRemainingTime(remainingTime)}</div>}

        <div className="flex items-center gap-2">
          <span title="오늘의 기록" className="text-white">
            🍅 : {todayInfo.count}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onTogglePlay()
            }}
            className="text-white/60 hover:text-white/80 transition-colors"
            title={status === 'running' ? '일시정지' : '재생'}
            style={{
              zIndex: '11',
              pointerEvents: 'auto',
              // @ts-ignore
              WebkitAppRegion: 'no-drag',
            }}
          >
            {status === 'running' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div
        className="flex justify-between items-center github-button gap-2"
        style={{
          zIndex: '11',
          // @ts-ignore
          WebkitAppRegion: 'no-drag',
        }}
      >
        <Link
          to="/settings"
          className="text-white/60 hover:text-white/80 transition-colors"
          title="설정"
          style={{ zIndex: '11', pointerEvents: 'auto' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>

        <button type="button" title="README" onClick={() => window.open('https://github.com/younggeun0/domado')}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="white">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.463 2 11.97c0 4.404 2.865 8.14 6.839 9.458.5.092.682-.216.682-.48 0-.236-.008-.864-.013-1.695-2.782.602-3.369-1.337-3.369-1.337-.454-1.151-1.11-1.458-1.11-1.458-.908-.618.069-.606.069-.606 1.003.07 1.531 1.027 1.531 1.027.892 1.524 2.341 1.084 2.91.828.092-.643.35-1.083.636-1.332-2.22-.251-4.555-1.107-4.555-4.927 0-1.088.39-1.979 1.029-2.675-.103-.252-.446-1.266.098-2.638 0 0 .84-.268 2.75 1.022A9.607 9.607 0 0 1 12 6.82c.85.004 1.705.114 2.504.336 1.909-1.29 2.747-1.022 2.747-1.022.546 1.372.202 2.386.1 2.638.64.696 1.028 1.587 1.028 2.675 0 3.83-2.339 4.673-4.566 4.92.359.307.678.915.678 1.846 0 1.332-.012 2.407-.012 2.734 0 .267.18.577.688.48 3.97-1.32 6.833-5.054 6.833-9.458C22 6.463 17.522 2 12 2Z"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
