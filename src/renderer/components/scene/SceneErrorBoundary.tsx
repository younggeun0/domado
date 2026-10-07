import { Component, type ReactNode } from 'react'

// 3D 모델을 불러오지 못해도 타이머·버튼·휴식 흐름은 계속 동작하도록 장면만 비운다
export default class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('3D scene failed to render:', error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
