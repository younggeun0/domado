import { ArrowPathIcon, Cog6ToothIcon, ForwardIcon, PlusIcon } from '@heroicons/react/24/outline'

import { useI18n } from '../i18n'

import type { ComponentPropsWithoutRef } from 'react'

interface FooterProps {
  todayInfo: { count: number }
  canSkipRest: boolean
  onIncrementCount: () => void
  onSkipRest: () => void
  onReload: () => void
}

const openWindow = (name: 'settings' | 'history') => window.electron?.ipcRenderer.sendMessage('open_window', name)

const ICON_CLASS = 'h-4 w-4 min-[240px]:h-6 min-[240px]:w-6'

// 작은 위젯(폭 240px 미만)에서는 개수 아래에 버튼을 한 줄로, 넓으면 웹앱처럼 좌우로 배치
export default function Footer({ todayInfo, canSkipRest, onIncrementCount, onSkipRest, onReload }: FooterProps) {
  const { m } = useI18n()

  return (
    // 마우스를 올렸을 때만 개수·버튼이 함께 보인다
    <div className="flex w-full select-none flex-col gap-1 px-0.5 pb-1 text-sm opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 min-[240px]:flex-row min-[240px]:items-end min-[240px]:justify-between min-[240px]:p-3">
      {/* 오늘 개수를 누르면 일별 기록 히트맵 창을 연다 */}
      <button
        type="button"
        title={m.todayRecord}
        onClick={() => openWindow('history')}
        className="pointer-events-auto self-start rounded-full px-1 py-1 text-white transition-colors hover:text-white/80"
      >
        🍅 : {todayInfo.count}
      </button>

      <div className="flex justify-between min-[240px]:gap-3">
        <FooterActionButton title={m.footer.increment} onClick={onIncrementCount}>
          <PlusIcon className={ICON_CLASS} />
        </FooterActionButton>
        <FooterActionButton title={m.footer.skipRest} onClick={onSkipRest} disabled={!canSkipRest}>
          <ForwardIcon className={ICON_CLASS} />
        </FooterActionButton>
        <FooterActionButton title={m.footer.reload} onClick={onReload}>
          <ArrowPathIcon className={ICON_CLASS} />
        </FooterActionButton>
        <FooterActionButton title={m.footer.settings} onClick={() => openWindow('settings')}>
          <Cog6ToothIcon className={ICON_CLASS} />
        </FooterActionButton>
      </div>
    </div>
  )
}

function FooterActionButton({ title, disabled = false, children, ...props }: ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="pointer-events-auto inline-flex h-6 w-6 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white/80 disabled:pointer-events-none disabled:text-white/20 min-[240px]:h-10 min-[240px]:w-10"
      title={title}
      aria-label={title}
      {...props}
    >
      {children}
    </button>
  )
}
