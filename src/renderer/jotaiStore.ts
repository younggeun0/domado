import dayjs from 'dayjs'
import { atom } from 'jotai'

export interface PomodoroInfo {
  date: string
  count: number
}

export const notionKeys = atom({
  notionAPIKey: '',
  notionDatabaseId: '',
}) // notion API Key, Database ID

export const todayPomodoroInfo = atom<PomodoroInfo>({
  date: dayjs().format('YYYY-MM-DD'),
  count: 0,
}) // 오늘 작업 내역
export const useNotionSync = atom<boolean | null>(null) // 노션 동기화 사용 여부
export const useMemoSync = atom(true) // 메모기능 사용여부
