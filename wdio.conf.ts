import path from 'path'

// Tauri 시험 구현 E2E: e2e feature로 빌드한 앱(앱 안 WebDriver 서버)을 띄운다
// 빌드: npx tauri build --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json
process.env.DOMADO_FAST_TIMER = '1'

export const config: WebdriverIO.Config = {
  runner: 'local',
  specs: ['./e2e-tauri/**/*.spec.ts'],
  maxInstances: 1,
  capabilities: [
    {
      browserName: 'tauri',
      'tauri:options': {
        application: path.join(
          __dirname,
          'src-tauri/target/aarch64-apple-darwin/release/bundle/macos/domado.app/Contents/MacOS/domado',
        ),
      },
    } as WebdriverIO.Capabilities,
  ],
  services: [['@wdio/tauri-service', {}]],
  framework: 'mocha',
  mochaOpts: { timeout: 60_000 },
  logLevel: 'warn',
  reporters: ['spec'],
}
