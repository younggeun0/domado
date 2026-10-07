# domado 🍅

혼자 쓰려고 만든 뽀모도로 일렉트론 앱 (웹앱: https://domado.younggeun0.dev)

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

```sh
npm install
npm run dev        # electron-vite 개발 모드 (타이머가 3초씩 돈다)
npm test           # vitest (단위)
npm run test:e2e   # 패키징 앱을 띄워 3D 렌더링·창 상태 검사 (macOS, 릴리스 전 실행)
npm run package    # release/build에 앱 생성
```

macOS 공증은 `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` 환경 변수가 있으면 electron-builder가 처리한다.
