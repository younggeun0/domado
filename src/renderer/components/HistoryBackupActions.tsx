import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { type ChangeEvent, useRef, useState } from 'react'

import { downloadHistoryBackup, importDailyCounts, parseHistoryBackup } from '../hooks/pomodoroHistory'
import { useI18n } from '../i18n'

// 기록 JSON 내보내기·불러오기 (웹앱 younggeun0.dev/apps/domado와 같은 파일)
export default function HistoryBackupActions({ onImported }: { onImported: () => void }) {
  const { m } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null)

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // 같은 파일을 다시 골라도 change가 오도록 비운다
    event.target.value = ''
    if (!file) return

    const counts = parseHistoryBackup(await file.text())
    if (!counts) {
      setMessage({ text: m.history.importError, isError: true })
      return
    }

    await importDailyCounts(counts)
    setMessage({ text: m.history.importDone(Object.keys(counts).length), isError: false })
    onImported()
  }

  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <p role="status" className={message?.isError ? 'text-red-300' : 'text-white/60'}>
        {message?.text}
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => void downloadHistoryBackup()}
          className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-white/80 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
          {m.history.export}
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-white/80 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowUpTrayIcon className="h-4 w-4" aria-hidden="true" />
          {m.history.import}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFile}
          className="hidden"
          data-testid="history-import-input"
        />
      </div>
    </div>
  )
}
