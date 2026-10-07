import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'

// renderer가 메인 프로세스(src-tauri)와 주고받는 채널. 채널 이름이 Rust 커맨드·이벤트 이름이다
export type Channels = 'start_pomodoro' | 'set_fullscreen' | 'notify' | 'update_tray' | 'open_window' | 'resize_widget'

export type DomadoBridge = {
  ipc: {
    sendMessage(channel: Channels, ...args: unknown[]): void
    // 구독을 해제하는 함수를 돌려준다
    on(channel: Channels, func: (...args: unknown[]) => void): () => void
  }
  // 개발 모드와 E2E·수동 확인(DOMADO_FAST_TIMER=1)은 타이머를 3초씩만 돌린다
  isDebug: boolean
}

declare global {
  interface Window {
    domado?: DomadoBridge
    __TAURI_INTERNALS__?: unknown
    __DOMADO_FAST_TIMER__?: boolean
  }
}

// 위치 인자를 Rust 커맨드의 이름 있는 인자로 바꾼다
const toArgs: Partial<Record<Channels, (...args: any[]) => Record<string, unknown>>> = {
  set_fullscreen: value => ({ value }),
  notify: ({ title, body }) => ({ title, body }),
  update_tray: image => ({ image }),
  open_window: name => ({ name }),
  resize_widget: (width, height) => ({ width, height }),
}

// Tauri 웹뷰 밖(단위 테스트의 jsdom)에서는 아무것도 하지 않는다
if (window.__TAURI_INTERNALS__) {
  window.domado = {
    ipc: {
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
