import { toDateKey } from './todayInfoStorage'

const DB_NAME = 'domado'
const STORE_NAME = 'dailyCounts'

interface DailyCount {
  date: string
  count: number
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'date' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

function hasIndexedDB() {
  return typeof indexedDB !== 'undefined'
}

// 하루 개수는 늘어나기만 하므로, 기존 기록보다 클 때만 덮어쓴다 (localStorage가 비어 0부터 다시 세는 경우 기록 보호)
export async function saveDailyCount(date: string, count: number): Promise<void> {
  if (!hasIndexedDB() || count <= 0) return

  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(date)
      request.onsuccess = () => {
        const saved = request.result as DailyCount | undefined
        if (!saved || saved.count < count) store.put({ date, count } satisfies DailyCount)
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (error) {
    console.warn('Failed to save daily count to IndexedDB:', error)
  }
}

export async function loadDailyCounts(): Promise<Record<string, number>> {
  if (!hasIndexedDB()) return {}

  try {
    const db = await openDB()
    const rows = await new Promise<DailyCount[]>((resolve, reject) => {
      const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll()
      request.onsuccess = () => resolve(request.result as DailyCount[])
      request.onerror = () => reject(request.error)
    })
    return Object.fromEntries(rows.map(row => [row.date, row.count]))
  } catch (error) {
    console.warn('Failed to load daily counts from IndexedDB:', error)
    return {}
  }
}

// 오늘이 속한 주를 마지막 열로 하는 weeks개 주(일~토)의 날짜 키. 오늘 이후 칸은 null
export function buildHeatmapWeeks(today: Date, weeks = 53): (string | null)[][] {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - (weeks - 1) * 7)

  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + week * 7 + day)
      return date > today ? null : toDateKey(date)
    }),
  )
}

// ── JSON 백업 (웹앱 younggeun0.dev/apps/domado와 같은 형식이라 서로 주고받을 수 있다) ──

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export interface HistoryBackup {
  app: 'domado'
  version: 1
  exportedAt: string
  dailyCounts: Record<string, number>
}

export async function downloadHistoryBackup(): Promise<void> {
  const backup: HistoryBackup = {
    app: 'domado',
    version: 1,
    exportedAt: new Date().toISOString(),
    dailyCounts: await loadDailyCounts(),
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `domado-history-${toDateKey(new Date())}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url))
}

// 사용자가 고른 파일이라 형식을 검사한다. domado 백업이 아니거나 값이 이상하면 null
export function parseHistoryBackup(text: string): Record<string, number> | null {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }

  const counts = (data as Partial<HistoryBackup> | null)?.dailyCounts
  if ((data as Partial<HistoryBackup>)?.app !== 'domado' || typeof counts !== 'object' || counts === null) return null

  const entries = Object.entries(counts)
  const isValid = entries.every(
    ([date, count]) => DATE_KEY_PATTERN.test(date) && Number.isInteger(count) && count >= 0 && count < 1000,
  )
  return isValid ? Object.fromEntries(entries) : null
}

// 날짜별로 기존 기록과 비교해 큰 값을 남긴다 (saveDailyCount 규칙) — 백업을 불러와도 그 뒤 기록이 줄지 않는다
export async function importDailyCounts(counts: Record<string, number>): Promise<void> {
  for (const [date, count] of Object.entries(counts)) {
    await saveDailyCount(date, count)
  }
}
