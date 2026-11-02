# domado 🍅

혼자 쓰려고 만든 macOS 뽀모도로 위젯 앱 (웹앱: https://domado.younggeun0.dev)

4.0.0부터 Electron 대신 [Tauri](https://tauri.app)로 만든다 (dmg 약 134MB → 9MB).

- 작은 위젯 창에 마우스를 올리면 오늘 개수와 버튼(개수 증가·휴식 스킵·새로고침·설정)이 보인다
- 오늘 개수를 누르면 일별 기록 히트맵 창, 설정 버튼을 누르면 설정 창이 따로 열린다
- 기록 창에서 기록을 JSON으로 내보내고 불러올 수 있다 (웹앱과 같은 형식, 불러오면 날짜별로 더 큰 값을 남김)
- 설정 창에서 위젯 불투명도를 바로 조절할 수 있다
- 위젯 상단을 끌어 창을 옮기고, 우하단 손잡이로 크기를 바꾼다 (최소 100×200 — 타이머·버튼·3D 모델이 잘리거나 겹치지 않는 크기)
- 뽀모도로가 끝나면 휴식 동안 전체화면으로 바뀐다 (설정에서 "휴식 없이 바로 다음 뽀모도로"를 켜면 휴식 없이 다음 뽀모도로 대기 상태가 된다)
- 알림센터 위젯(소형)에 현재 단계(집중·휴식), 남은 시간, 일시정지 여부, 오늘 개수가 보인다

### 뽀모도로 단축키

| 단축키 | 설명 |
| --- | --- |
| `Space` or `cmd + shift + d` | 뽀모도로 시작/중지 |
| `a` | 뽀모도로 개수 증가 |
| `s` | 휴식 스킵(휴식 대기 중일 때) |
| `r` | 새로고침 |

### 개발

Rust(`rustup`), Node 22 이상, Xcode, [XcodeGen](https://github.com/yonaskolb/XcodeGen)(`brew install xcodegen`)이 필요하다. Xcode와 XcodeGen은 알림센터 위젯을 빌드할 때 쓴다.

```sh
npm install
npm run dev        # tauri dev (타이머가 3초씩 돈다)
npm test           # vitest (단위)
npm run test:e2e   # e2e feature로 앱을 빌드해 3D 렌더링·창 상태 검사 (macOS, 릴리스 전 실행)
npm run build      # src-tauri/target/release/bundle에 앱·dmg·업데이트 파일 생성
npm run build:web  # 웹앱을 dist에 빌드 (Vercel이 실행, npx vite preview로 확인)
```

웹앱은 같은 renderer를 Tauri 브리지 없이 띄운다. `window.domado`가 없으면 설정·기록을 별도 창 대신 위젯 위 모달로 열고, 알림은 브라우저 Notification, 작업 중에는 화면 꺼짐 방지(Wake Lock)를 쓴다. 불투명도·항상 위 설정은 데스크톱에만, 앱 설치 안내는 웹에만 있다.

알림센터 위젯은 `src-tauri/widget`의 WidgetKit 확장이다. `npm run build:widget`이 XcodeGen으로 프로젝트를 만들고 xcodebuild로 빌드하며, `tauri build`가 번들 직전에 자동으로 실행해 `Contents/PlugIns`에 넣는다. 앱은 타이머 상태가 바뀔 때만 App Group(`TFLHLW3C9D.domado`) 폴더의 `widget.json`에 상태를 쓰고 위젯을 새로고침한다. 실행 중에는 종료 시각을 넘겨 위젯이 스스로 카운트다운한다. 새로 고친 위젯이 설치 뒤에도 옛 화면이면 이전 확장 프로세스가 남아 있는 것이니 `pkill -x DomadoWidget` 후 앱을 다시 실행한다.

Node 25 이상에서 `npm test`를 돌리면 Node 내장 `localStorage`가 jsdom 것을 가려 실패한다. `NODE_OPTIONS=--no-experimental-webstorage npm test`로 돌린다.

### 릴리스

- 자동 업데이트는 GitHub 최신 릴리스의 `latest.json`을 본다. 업데이트 파일(`domado.app.tar.gz`)은 `~/.tauri/domado-updater.key`로 서명한다 (`TAURI_SIGNING_PRIVATE_KEY`). 이 키를 잃으면 이미 설치된 앱에 업데이트를 보낼 수 없다.
- 위젯의 App Group은 팀 ID로 시작하므로 Developer ID(팀 `TFLHLW3C9D`)로 서명해야 위젯이 앱 상태를 읽는다.
- 서명은 `APPLE_SIGNING_IDENTITY`로 지정한 Developer ID로 하고, 공증은 `xcrun notarytool submit --keychain-profile <프로필>` 후 `xcrun stapler staple`로 한다.
