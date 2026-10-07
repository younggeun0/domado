import { defineConfig } from '@playwright/test'

// 패키징된 앱(electron-builder --dir)을 띄워 3D 렌더링·창 상태를 검사한다. macOS 전용
export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 60_000,
  workers: 1,
  reporter: 'list',
})
