import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import SceneErrorBoundary from '../components/scene/SceneErrorBoundary'

function BrokenScene(): never {
  throw new Error('Could not load model')
}

it('3D 장면이 실패해도 바깥 UI는 그대로 남는다', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})

  render(
    <main>
      <SceneErrorBoundary>
        <BrokenScene />
      </SceneErrorBoundary>
      <span>01:00</span>
    </main>,
  )

  expect(screen.getByText('01:00')).toBeInTheDocument()
})
