import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }

export default class PageBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Page could not be displayed', error, info.componentStack) }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <section className="inner-page route-error" role="alert">
        <p className="eyebrow">KLzc / Connection interrupted</p>
        <h1>这一页暂时未能打开。</h1>
        <p>请检查网络后重试，或先回到首页继续浏览。</p>
        <p className="en-copy">This page could not load. Try again or return home.</p>
        <button type="button" className="solid-action" onClick={() => window.location.reload()}>重新载入 / Reload</button>
        <a href="/" className="quiet-action">返回首页 / Home</a>
      </section>
    )
  }
}
