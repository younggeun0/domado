import { execSync } from 'child_process'

// 개발 서버가 아닌 패키징 결과로 검사해야 asar 제외 규칙 같은 패키징 문제를 잡는다 (E2E_SKIP_BUILD=1이면 기존 빌드 재사용)
export default function globalSetup() {
  if (process.env.E2E_SKIP_BUILD === '1') return
  // 검사용 빌드라 서명·공증은 하지 않는다 (APPLE_* 공증 변수도 넘기지 않음)
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('APPLE_')))
  const run = (command: string) => execSync(command, { stdio: 'inherit', env: { ...env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' } })
  run('npx electron-vite build')
  run(`npx electron-builder --dir --mac --${process.arch} --publish never`)
}
