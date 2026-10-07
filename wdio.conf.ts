import path from 'path'

// e2e feature로 빌드한 앱(앱 안 WebDriver 서버)을 띄운다. 빌드는 npm run test:e2e가 먼저 한다 (npm run build:e2e)
process.env.DOMADO_FAST_TIMER = '1'

export const config: WebdriverIO.Config = {
  runner: 'local',
  specs: ['./e2e/**/*.spec.ts'],
  maxInstances: 1,
  capabilities: [
    {
      browserName: 'tauri',
      'tauri:options': {
        application: path.join(
          __dirname,
          'src-tauri/target/release/bundle/macos/domado.app/Contents/MacOS/domado',
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
