import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'

import type { Channels, ElectronHandler } from '../preload'

// Tauri 시험 구현: Electron preload가 내주던 window.electron을 같은 모양으로 만들어 renderer 코드는 그대로 둔다.
// 채널 이름이 Rust 커맨드 이름이고, 위치 인자를 커맨드의 이름 있는 인자로 바꾼다
const toArgs: Partial<Record<Channels, (...args: any[]) => Record<string, unknown>>> = {
  set_fullscreen: value => ({ value }),
  notify: ({ title, body }) => ({ title, body }),
  update_tray: image => ({ image }),
  open_window: name => ({ name }),
  resize_widget: (width, height) => ({ width, height }),
}

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown
    __DOMADO_FAST_TIMER__?: boolean
  }
}

if (window.__TAURI_INTERNALS__) {
  const handler: ElectronHandler = {
    ipcRenderer: {
      sendMessage(channel, ...args) {
        invoke(channel, toArgs[channel]?.(...args)).catch(console.error)
      },
      on(channel, func) {
        const unlisten = listen(channel, event => func(event.payload))
        return () => void unlisten.then(off => off())
      },
    },
    isDebug: import.meta.env.DEV || window.__DOMADO_FAST_TIMER__ === true,
  }
  window.electron = handler

  // WKWebView는 스크립트로 열지 않은 창의 window.close()를 무시한다 (설정 저장 후 창 닫기)
  window.close = () => void getCurrentWindow().close()

  // target="_blank" 링크는 기본 브라우저로 연다
  document.addEventListener('click', event => {
    const link = (event.target as Element).closest?.('a[target="_blank"]') as HTMLAnchorElement | null
    if (!link) return
    event.preventDefault()
    invoke('open_external', { url: link.href }).catch(console.error)
  })
}
