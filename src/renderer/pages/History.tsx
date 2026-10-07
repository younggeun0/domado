import { useEffect, useState } from 'react'

import HistoryBackupActions from '../components/HistoryBackupActions'
import { buildHeatmapWeeks, loadDailyCounts } from '../hooks/pomodoroHistory'
import { getTodayKey, loadTodayInfo } from '../hooks/todayInfoStorage'
import { useI18n } from '../i18n'

const LEVEL_CLASSES = ['bg-white/[0.07]', 'bg-red-950', 'bg-red-800', 'bg-red-600', 'bg-red-500']

function getLevel(count: number) {
  if (count <= 0) return 0
  if (count <= 2) return 1
  if (count <= 4) return 2
  if (count <= 7) return 3
  return 4
}

// 히트맵이 마운트될 때 한 번, 최근 기록이 보이도록 오른쪽 끝으로 스크롤 (안정된 참조라 리렌더 때는 다시 호출되지 않음)
function scrollToEnd(node: HTMLDivElement | null) {
  if (node) node.scrollLeft = node.scrollWidth
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// 위젯 창과 별개인 기록 창. 창이 열릴 때마다 새로 마운트되므로 한 번만 읽는다
export default function History() {
  const { language, m } = useI18n()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [selectedDate, setSelectedDate] = useState(getTodayKey)
  const todayCount = loadTodayInfo().count

  useEffect(() => {
    loadDailyCounts().then(setCounts)
  }, [])

  const today = getTodayKey()
  // IndexedDB 저장이 끝나기 전에 열어도 오늘 개수는 화면 값과 같게 보이도록 병합
  const countOf = (date: string) => (date === today ? Math.max(counts[date] ?? 0, todayCount) : (counts[date] ?? 0))

  const weeks = buildHeatmapWeeks(parseDateKey(today))
  const visibleDates = weeks.flat().filter((date): date is string => date !== null)
  const total = visibleDates.reduce((sum, date) => sum + countOf(date), 0)
  const activeDays = visibleDates.filter(date => countOf(date) > 0).length

  const monthFormat = new Intl.DateTimeFormat(language, { month: 'short' })
  const dayFormat = new Intl.DateTimeFormat(language, { dateStyle: 'medium' })

  return (
    <main className="flex h-screen flex-col gap-4 bg-neutral-900 p-5 pt-10 text-white">
      {/* 숨긴 타이틀바 자리. 창을 끌어 옮기는 손잡이이자 신호등 버튼과 내용이 겹치지 않게 하는 여백 */}
      <div className="drag-region fixed inset-x-0 top-0 h-8" />
      <title>{m.history.title}</title>
      <header className="grid gap-1.5">
        <h1 className="text-lg font-semibold leading-none tracking-tight">{m.history.title}</h1>
        <p className="text-sm text-white/70">{m.history.description}</p>
      </header>

      {/* 창이 낮으면 헤더를 고정하고 이 영역만 스크롤 */}
      <div className="min-h-0 space-y-4 overflow-y-auto">
        <p className="text-sm text-white/80">{m.history.summary(total, activeDays)}</p>

        <div ref={scrollToEnd} className="overflow-x-auto pb-2">
          {/* 선택 칸의 ring은 칸 바깥에 그려져 스크롤 영역 가장자리에서 잘리므로 안쪽 여백을 둔다 */}
          <div className="flex w-max gap-[3px] p-[2px]">
            {weeks.map((week, index) => {
              const firstDate = parseDateKey(week[0] ?? today)
              const previous = index > 0 ? parseDateKey(weeks[index - 1][0] ?? today) : null
              const showMonth = previous !== null && previous.getMonth() !== firstDate.getMonth()

              return (
                <div key={week[0]} className="flex w-[11px] flex-col gap-[3px]">
                  <span className="h-3 whitespace-nowrap text-[10px] leading-3 text-white/45">
                    {showMonth ? monthFormat.format(firstDate) : ''}
                  </span>
                  {week.map((date, day) =>
                    date === null ? (
                      <span key={day} className="h-[11px] w-[11px]" />
                    ) : (
                      <button
                        key={date}
                        type="button"
                        aria-label={`${dayFormat.format(parseDateKey(date))}: ${countOf(date)}`}
                        aria-pressed={date === selectedDate}
                        onClick={() => setSelectedDate(date)}
                        className={`h-[11px] w-[11px] rounded-[2px] ${LEVEL_CLASSES[getLevel(countOf(date))]} ${
                          date === selectedDate ? 'ring-1 ring-white/80' : ''
                        }`}
                      />
                    ),
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-white/60">
          <span>
            {dayFormat.format(parseDateKey(selectedDate))} · 🍅 {countOf(selectedDate)}
          </span>
          <span className="flex items-center gap-1">
            {m.history.less}
            {LEVEL_CLASSES.map(levelClass => (
              <span key={levelClass} className={`h-[11px] w-[11px] rounded-[2px] ${levelClass}`} />
            ))}
            {m.history.more}
          </span>
        </div>

        <HistoryBackupActions onImported={() => loadDailyCounts().then(setCounts)} />
      </div>
    </main>
  )
}
