import { GlobeAltIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

import { usePomodoroSettings, useWidgetOpacity } from '../hooks/usePomodoroSettings'
import { LANGUAGE_NAMES, LANGUAGES, type Language, useI18n } from '../i18n'

const INPUT_CLASS =
  'w-full rounded-lg border border-white/40 bg-black/60 px-3 py-2 text-base text-white outline-hidden focus:ring-2 focus:ring-red-400'
const BUTTON_CLASS = 'rounded-lg px-4 py-2 text-sm font-medium transition-colors'

// 위젯 창과 별개인 설정 창. 저장하면 localStorage를 거쳐 위젯 창에 반영된다
export default function Settings() {
  const { language, setLanguage, m } = useI18n()
  const { pomodoroMinutes: currentPomodoroMinutes, restMinutes: currentRestMinutes, updateSettings } =
    usePomodoroSettings()
  const [opacity, setOpacity] = useWidgetOpacity()
  const [pomodoroMinutes, setPomodoroMinutes] = useState(currentPomodoroMinutes.toString())
  const [restMinutes, setRestMinutes] = useState(currentRestMinutes.toString())

  const nextPomodoro = parseInt(pomodoroMinutes, 10)
  const nextRest = parseInt(restMinutes, 10)
  const hasValidInput = Number.isFinite(nextPomodoro) && Number.isFinite(nextRest) && nextPomodoro > 0 && nextRest > 0
  const hasChanged = hasValidInput && (nextPomodoro !== currentPomodoroMinutes || nextRest !== currentRestMinutes)

  const handleSave = () => {
    if (!hasValidInput) return
    if (hasChanged) updateSettings(nextPomodoro, nextRest)
    window.close()
  }

  return (
    <main className="flex h-screen flex-col gap-4 bg-neutral-900 p-5 pt-10 text-white">
      {/* 숨긴 타이틀바 자리. 창을 끌어 옮기는 손잡이이자 신호등 버튼과 내용이 겹치지 않게 하는 여백 */}
      <div className="drag-region fixed inset-x-0 top-0 h-8" />
      <title>{m.settings.title}</title>
      <header className="grid gap-1.5">
        <h1 className="text-lg font-semibold leading-none tracking-tight">{m.settings.title}</h1>
        <p className="text-sm text-white/70">{m.settings.description}</p>
      </header>

      <div className="-mx-1.5 grid min-h-0 flex-1 content-start gap-4 overflow-y-auto px-1.5 py-2">
        <div className="grid gap-2">
          <label htmlFor="pomodoro" className="text-sm font-medium text-white/80">
            {m.settings.pomodoroMinutes}
          </label>
          <input
            id="pomodoro"
            type="number"
            min="1"
            value={pomodoroMinutes}
            onChange={e => setPomodoroMinutes(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="rest" className="text-sm font-medium text-white/80">
            {m.settings.restMinutes}
          </label>
          <input
            id="rest"
            type="number"
            min="1"
            value={restMinutes}
            onChange={e => setRestMinutes(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        {hasChanged ? (
          <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {m.settings.resetWarning}
          </p>
        ) : null}
        <div className="grid gap-2">
          <label htmlFor="language" className="text-sm font-medium text-white/80">
            {m.settings.language}
          </label>
          {/* 저장 버튼과 별개로 선택 즉시 언어를 바꾼다 */}
          <select
            id="language"
            value={language}
            onChange={e => setLanguage(e.target.value as Language)}
            className={INPUT_CLASS}
          >
            {LANGUAGES.map(code => (
              <option key={code} value={code}>
                {LANGUAGE_NAMES[code]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <label htmlFor="opacity" className="flex justify-between text-sm font-medium text-white/80">
            {m.settings.opacity}
            <span className="tabular-nums text-white/60">{opacity}%</span>
          </label>
          {/* 언어처럼 저장 버튼과 별개로 움직이는 즉시 위젯에 반영한다 */}
          <input
            id="opacity"
            type="range"
            min="20"
            max="100"
            step="5"
            value={opacity}
            onChange={e => setOpacity(Number(e.target.value))}
            className="accent-red-600 [color-scheme:dark]"
          />
        </div>
      </div>

      <footer className="flex items-center justify-between gap-3">
        <a
          href="https://younggeun0.dev"
          target="_blank"
          rel="noopener noreferrer"
          title="younggeun0.dev"
          aria-label="younggeun0.dev"
          className="text-white/45 transition-colors hover:text-white"
        >
          <GlobeAltIcon className="h-5 w-5" aria-hidden="true" />
        </a>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.close()}
            className={`${BUTTON_CLASS} border border-white/10 text-white/75 hover:bg-white/5 hover:text-white`}
          >
            {m.settings.cancel}
          </button>
          <button type="button" onClick={handleSave} className={`${BUTTON_CLASS} bg-red-700 text-white hover:bg-red-600`}>
            {m.settings.save}
          </button>
        </div>
      </footer>
    </main>
  )
}
