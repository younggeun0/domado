export interface TodayInfo {
  count: number
  date: string
}

const STORAGE_KEY_TODAY_INFO = 'domado_today_info'

// 로컬 날짜 기준 YYYY-MM-DD (toISOString은 UTC라 한국에서는 오전 9시 전 기록이 전날로 잡힌다)
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function getTodayKey(): string {
  return toDateKey(new Date())
}

export function loadTodayInfo(): TodayInfo {
  if (typeof window === 'undefined') {
    return { count: 0, date: getTodayKey() }
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY_TODAY_INFO)
    if (saved) {
      const data = JSON.parse(saved) as TodayInfo
      const today = getTodayKey()

      if (data.date === today) {
        return data
      }
    }
  } catch (error) {
    console.warn('Failed to load today info from localStorage:', error)
  }

  return { count: 0, date: getTodayKey() }
}

export function saveTodayInfo(data: TodayInfo): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY_TODAY_INFO, JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save today info to localStorage:', error)
  }
}

// 자정을 넘겨 앱을 켜 둔 경우 전날 개수에 이어 세지 않고 오늘 기록을 새로 시작한다
export function incrementTodayInfo(prev: TodayInfo): TodayInfo {
  const today = getTodayKey()
  return prev.date === today ? { ...prev, count: prev.count + 1 } : { date: today, count: 1 }
}
