import { useSyncExternalStore } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallState = 'installed' | 'available' | 'ios' | 'unavailable'

// beforeinstallprompt는 페이지 로드 직후 한 번 오므로, 설정 모달이 열리기 전에 모듈 로드 시점부터 받아 둔다
let deferredPrompt: BeforeInstallPromptEvent | null = null
let installedNow = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach(listener => listener())

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault()
  deferredPrompt = event as BeforeInstallPromptEvent
  notify()
})

window.addEventListener('appinstalled', () => {
  deferredPrompt = null
  installedNow = true
  notify()
})

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function getInstallState(): InstallState {
  if (installedNow || isStandalone()) return 'installed'
  if (deferredPrompt) return 'available'
  return isIos() ? 'ios' : 'unavailable'
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export async function promptInstall() {
  if (!deferredPrompt) return
  const prompt = deferredPrompt
  // prompt()는 이벤트당 한 번만 호출할 수 있다
  deferredPrompt = null
  notify()
  await prompt.prompt()
}

export function useInstallState() {
  return useSyncExternalStore(subscribe, getInstallState)
}
