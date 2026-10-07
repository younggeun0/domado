# domado 🍅

혼자 쓰려고 만든 뽀모도로 일렉트론 앱 (웹앱: [younggeun0.dev](https://younggeun0.dev) 모노레포의 `apps/domado`)

- 작은 위젯 창에 마우스를 올리면 오늘 개수와 버튼(개수 증가·휴식 스킵·새로고침·설정)이 보인다
- 오늘 개수를 누르면 일별 기록 히트맵 창, 설정 버튼을 누르면 설정 창이 따로 열린다
- 위젯 상단을 끌어 창을 옮긴다
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
npm test           # vitest
npm run package    # release/build에 앱 생성
```

macOS 공증은 `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` 환경 변수가 있으면 electron-builder가 처리한다.
