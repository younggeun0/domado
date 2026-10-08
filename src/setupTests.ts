import '@testing-library/jest-dom'

import { vi } from 'vitest'

// @ts-expect-error - HTMLCanvasElement.prototype.getContext mock for testing
HTMLCanvasElement.prototype.getContext = () => {}

class ResizeObserverMock implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock

// tauriBridge가 만드는 window.domado 목. 테스트에서 sendMessage 호출로 메인 프로세스 연동을 확인한다
window.domado = {
  ipc: { sendMessage: vi.fn(), on: vi.fn(() => () => {}) },
  isDebug: false,
}

// 테스트는 한국어 문구 기준 — i18n 모듈이 로드될 때 브라우저 언어를 읽으므로 먼저 고정
Object.defineProperty(window.navigator, 'language', { value: 'ko-KR', configurable: true })

// jsdom에는 <dialog>의 showModal이 없다
HTMLDialogElement.prototype.showModal = function () {
  this.open = true
}
