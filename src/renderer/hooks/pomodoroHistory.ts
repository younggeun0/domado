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
