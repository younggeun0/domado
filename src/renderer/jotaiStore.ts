import { atom } from 'jotai'

export const todayPomodoroInfo = atom({
  count: 0,
})

export const useNotionSync = atom<boolean | null>(null) // 노션 동기화 사용 여부
export const useMemoSync = atom(true) // 메모기능 사용여부
