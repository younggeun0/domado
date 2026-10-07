import { useSyncExternalStore } from 'react'

export const LANGUAGES = ['ko', 'en', 'ja'] as const
export type Language = (typeof LANGUAGES)[number]

export const LANGUAGE_NAMES: Record<Language, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
}

const ko = {
  remainingTime: '남은 시간',
  todayRecord: '오늘의 기록',
  footer: {
    increment: '뽀모도로 개수 증가',
    skipRest: '휴식 스킵',
    reload: '새로고침',
    settings: '설정',
  },
  confirm: {
    increment: '오늘의 뽀모도로를 1개 추가할까요?',
    skipRest: '휴식을 건너뛰고 새 뽀모도로 대기 상태로 이동할까요?',
    reload: '앱을 새로고침할까요? 진행 중인 상태가 초기화될 수 있습니다.',
  },
  notification: {
    restEndTitle: '휴식 시간이 끝났습니다! 🍅',
    restEndBody: '다시 집중할 시간입니다. 새로운 뽀모도로를 시작하세요!',
    pomodoroEndTitle: '뽀모도로가 완료되었습니다! 🎉',
    pomodoroEndBody: (count: number) => `오늘 ${count}개의 뽀모도로를 완료했습니다! 휴식을 취하세요.`,
  },
  settings: {
    title: '뽀모도로 설정',
    description: '뽀모도로 시간과 휴식 시간을 설정하세요.',
    pomodoroMinutes: '뽀모도로 시간 (분)',
    restMinutes: '휴식 시간 (분)',
    resetWarning: '시간을 변경하면 현재 진행 중인 뽀모도로 정보가 초기화됩니다.',
    language: '언어',
    opacity: '위젯 불투명도',
    cancel: '취소',
    save: '저장',
  },
  history: {
    title: '뽀모도로 기록',
    description: '최근 1년 동안 하루에 완료한 뽀모도로 개수입니다.',
    summary: (total: number, days: number) => `총 ${total}개 · ${days}일`,
    less: '적음',
    more: '많음',
    export: 'JSON 내보내기',
    import: 'JSON 불러오기',
    importDone: (days: number) => `${days}일 기록을 불러왔습니다.`,
    importError: '올바른 domado 기록 파일이 아닙니다.',
  },
}

export type Messages = typeof ko

const en: Messages = {
  remainingTime: 'Time remaining',
  todayRecord: "Today's count",
  footer: {
    increment: 'Add a pomodoro',
    skipRest: 'Skip break',
    reload: 'Reload',
    settings: 'Settings',
  },
  confirm: {
    increment: "Add 1 to today's pomodoro count?",
    skipRest: 'Skip the break and get ready for a new pomodoro?',
    reload: 'Reload the app? Your current progress may be reset.',
  },
  notification: {
    restEndTitle: 'Break is over! 🍅',
    restEndBody: 'Time to focus again. Start a new pomodoro!',
    pomodoroEndTitle: 'Pomodoro complete! 🎉',
    pomodoroEndBody: (count: number) =>
      `You've completed ${count} ${count === 1 ? 'pomodoro' : 'pomodoros'} today! Take a break.`,
  },
  settings: {
    title: 'Pomodoro settings',
    description: 'Set your pomodoro and break durations.',
    pomodoroMinutes: 'Pomodoro (minutes)',
    restMinutes: 'Break (minutes)',
    resetWarning: 'Changing the durations will reset your current pomodoro.',
    language: 'Language',
    opacity: 'Widget opacity',
    cancel: 'Cancel',
    save: 'Save',
  },
  history: {
    title: 'Pomodoro history',
    description: 'Pomodoros completed each day over the past year.',
    summary: (total: number, days: number) => `${total} total · ${days} ${days === 1 ? 'day' : 'days'}`,
    less: 'Less',
    more: 'More',
    export: 'Export JSON',
    import: 'Import JSON',
    importDone: (days: number) => `Imported ${days} ${days === 1 ? 'day' : 'days'} of history.`,
    importError: 'This is not a valid domado history file.',
  },
}

const ja: Messages = {
  remainingTime: '残り時間',
  todayRecord: '今日の記録',
  footer: {
    increment: 'ポモドーロ数を増やす',
    skipRest: '休憩をスキップ',
    reload: '再読み込み',
    settings: '設定',
  },
  confirm: {
    increment: '今日のポモドーロ数を1つ増やしますか？',
    skipRest: '休憩をスキップして、次のポモドーロの準備をしますか？',
    reload: 'アプリを再読み込みしますか？\u3000進行中の状態がリセットされる場合があります。',
  },
  notification: {
    restEndTitle: '休憩時間が終わりました！🍅',
    restEndBody: 'また集中する時間です。新しいポモドーロを始めましょう！',
    pomodoroEndTitle: 'ポモドーロが完了しました！🎉',
    pomodoroEndBody: (count: number) => `今日は${count}個のポモドーロを完了しました！\u3000休憩しましょう。`,
  },
  settings: {
    title: 'ポモドーロ設定',
    description: 'ポモドーロの時間と休憩時間を設定してください。',
    pomodoroMinutes: 'ポモドーロ時間（分）',
    restMinutes: '休憩時間（分）',
    resetWarning: '時間を変更すると、進行中のポモドーロ情報がリセットされます。',
    language: '言語',
    opacity: 'ウィジェットの不透明度',
    cancel: 'キャンセル',
    save: '保存',
  },
  history: {
    title: 'ポモドーロ記録',
    description: '過去1年間の1日あたりのポモドーロ完了数です。',
    summary: (total: number, days: number) => `合計${total}個・${days}日間`,
    less: '少ない',
    more: '多い',
    export: 'JSONを書き出す',
    import: 'JSONを読み込む',
    importDone: (days: number) => `${days}日分の記録を読み込みました。`,
    importError: '有効なdomadoの記録ファイルではありません。',
  },
}

const MESSAGES: Record<Language, Messages> = { ko, en, ja }
const STORAGE_KEY_LANGUAGE = 'domado_language'

function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language)
}

function detectLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LANGUAGE)
    if (isLanguage(saved)) return saved
  } catch {
    // 저장소 접근이 막힌 환경은 브라우저 언어로 판단
  }

  const browserLanguage = navigator.language.slice(0, 2)
  return isLanguage(browserLanguage) ? browserLanguage : 'en'
}

let currentLanguage = detectLanguage()
document.documentElement.lang = currentLanguage
const listeners = new Set<() => void>()

export function setLanguage(language: Language) {
  currentLanguage = language
  document.documentElement.lang = language
  try {
    localStorage.setItem(STORAGE_KEY_LANGUAGE, language)
  } catch {
    // 저장 실패 시에도 현재 세션에는 반영
  }
  listeners.forEach(listener => listener())
}

// 설정 창에서 바꾼 언어를 위젯 창에도 반영
window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY_LANGUAGE || !isLanguage(event.newValue)) return
  currentLanguage = event.newValue
  document.documentElement.lang = currentLanguage
  listeners.forEach(listener => listener())
})

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useI18n() {
  const language = useSyncExternalStore(subscribe, () => currentLanguage)
  return { language, setLanguage, m: MESSAGES[language] }
}
