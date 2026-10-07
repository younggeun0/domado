import { render, screen } from '@testing-library/react'

import App from '../App'

describe('App', () => {
  it('정상 렌더여부', () => {
    expect(render(<App />)).toBeTruthy()
  })

  it('최초 실행 시 뽀모도로 컴포넌트가 표시된다.', () => {
    render(<App />)

    expect(screen.getByTitle('오늘의 기록')).toBeInTheDocument()
  })
})
