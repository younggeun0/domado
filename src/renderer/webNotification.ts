// 웹에서 타이머가 끝났을 때의 브라우저 알림. 데스크톱은 메인 프로세스(notify 커맨드)가 OS 알림을 띄운다
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission()
}

// 알림을 쓸 수 없거나 권한이 없으면 alert로 대신한다
export function notifyWeb(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    // eslint-disable-next-line no-alert -- 알림 권한이 없어도 타이머가 끝난 것은 알려야 한다
    alert(`${title}\n\n${body}`)
    return
  }
  const notification = new Notification(title, {
    body,
    icon: '/favicon.ico',
    tag: 'pomodoro-timer',
    requireInteraction: true,
  })
  notification.onclick = () => {
    window.focus()
    notification.close()
  }
  setTimeout(() => notification.close(), 5000)
}
