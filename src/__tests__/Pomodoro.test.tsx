import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Pomodoro from '../renderer/pages/Pomodoro'
import { formatRemainingTime, getTimeInfo } from '../renderer/components/pomodoro'

describe('Pomodoro', () => {
  it('정상 렌더여부', () => {
    expect(render(<Pomodoro />)).toBeTruthy()
  })

//   it('뽀모도로 타이머 시작 버튼 선택 후 시간이 남은 상태에서 재선택 시 타이머가 중단된다', async () => {
//     render(<Pomodoro />)

//     const button = await screen.findByRole('button', { name: /🔥/ })
//     // 타이머 시작
//     const timeInfo = getTimeInfo(true)
//     const pomodoroInitTime = formatRemainingTime(timeInfo.POMODORO_SEC)
//     const remainingTimeElem = screen.getByText(pomodoroInitTime)
//     await userEvent.click(button)

//     // 타이머가 종료되었는지 확인
//     await act(async () => {
//       await new Promise((resolve) => {
//         setTimeout(resolve, (timeInfo.POMODORO_SEC - 2) * 1000)
//       })
//       // 타이머 시작
//       await userEvent.click(button)

//       expect(button).toHaveTextContent(/⏸️/)

//       // 왜 안줄어들지?
//     //   expect(remainingTimeElem).not.toHaveTextContent(pomodoroInitTime)
//     })
//   })

  it('뽀모도로 타이머 종료 시 휴식아이콘으로 변경되고 남은 시간이 휴식시간으로 변경된다.', async () => {
    render(<Pomodoro />)

    const button = await screen.findByRole('button', { name: /🔥/ })
    const timeInfo = getTimeInfo(true)
    const pomodoroTime = formatRemainingTime(timeInfo.POMODORO_SEC)
    const remainingTimeElem = screen.getByText(pomodoroTime)
    await userEvent.click(button)

    // 타이머가 시작되었는지 확인
    expect(remainingTimeElem).toBeInTheDocument()

    // 타이머가 종료되었는지 확인
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, (timeInfo.POMODORO_SEC + 1) * 1000)
      })
    })

    expect(button).toHaveTextContent(/☕️/)
    expect(remainingTimeElem).toHaveTextContent(formatRemainingTime(timeInfo.REST_SEC))
  })
})
