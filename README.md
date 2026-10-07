# domado 🍅

혼자 쓰려고 만든 macOS 뽀모도로 위젯 앱 (웹앱: https://domado.younggeun0.dev)

4.0.0부터 Electron 대신 [Tauri](https://tauri.app)로 만든다 (dmg 약 134MB → 9MB).

- 작은 위젯 창에 마우스를 올리면 오늘 개수와 버튼(개수 증가·휴식 스킵·새로고침·설정)이 보인다
- 오늘 개수를 누르면 일별 기록 히트맵 창, 설정 버튼을 누르면 설정 창이 따로 열린다
- 기록 창에서 기록을 JSON으로 내보내고 불러올 수 있다 (웹앱과 같은 형식, 불러오면 날짜별로 더 큰 값을 남김)
- 설정 창에서 위젯 불투명도를 바로 조절할 수 있다
- 위젯 상단을 끌어 창을 옮기고, 우하단 손잡이로 크기를 바꾼다 (최소 100×200 — 타이머·버튼·3D 모델이 잘리거나 겹치지 않는 크기)
- 뽀모도로가 끝나면 휴식 동안 전체화면으로 바뀐다

### 뽀모도로 단축키

| 단축키 | 설명 |
| --- | --- |
| `Space` or `cmd + shift + d` | 뽀모도로 시작/중지 |
| `a` | 뽀모도로 개수 증가 |
| `s` | 휴식 스킵(휴식 대기 중일 때) |
| `r` | 새로고침 |

### 개발

Rust(`rustup`)와 Node 22 이상이 필요하다.

```sh
npm install
npm run dev        # tauri dev (타이머가 3초씩 돈다)
npm test           # vitest (단위)
npm run test:e2e   # e2e feature로 앱을 빌드해 3D 렌더링·창 상태 검사 (macOS, 릴리스 전 실행)
npm run build      # src-tauri/target/release/bundle에 앱·dmg·업데이트 파일 생성
```

### 릴리스

- 자동 업데이트는 GitHub 최신 릴리스의 `latest.json`을 본다. 업데이트 파일(`domado.app.tar.gz`)은 `~/.tauri/domado-updater.key`로 서명한다 (`TAURI_SIGNING_PRIVATE_KEY`). 이 키를 잃으면 이미 설치된 앱에 업데이트를 보낼 수 없다.
- 서명은 `APPLE_SIGNING_IDENTITY`로 지정한 Developer ID로 하고, 공증은 `xcrun notarytool submit --keychain-profile <프로필>` 후 `xcrun stapler staple`로 한다.
