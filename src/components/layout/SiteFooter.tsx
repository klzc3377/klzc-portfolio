import { ArrowUp } from 'lucide-react'
import { scrollToTop } from '../../app/smoothScroll'
import type { Navigate } from '../../types/portfolio'
import RouteLink from '../ui/RouteLink'

export default function SiteFooter({ navigate }: { navigate: Navigate }) {
  return (
    <footer className="site-footer">
      <div className="site-footer__sign">
        <strong>Cheng Zhang</strong>
        <span>KLzc · 张骋 · © 2026</span>
      </div>
      <nav aria-label="页脚导航 / Footer navigation">
        <RouteLink href="/atlas" navigate={navigate}>地点 Atlas</RouteLink>
        <RouteLink href="/projects" navigate={navigate}>项目 Projects</RouteLink>
        <RouteLink href="/profile" navigate={navigate}>关于我 Profile</RouteLink>
      </nav>
      <a className="site-footer__mail" href="mailto:masterzc624@gmail.com"><small>联系我 / Contact</small>masterzc624@gmail.com</a>
      <button type="button" className="site-footer__top" onClick={() => scrollToTop(0, true)}>
        <ArrowUp size={15} aria-hidden="true" /><span>回到顶部<small>Top</small></span>
      </button>
    </footer>
  )
}
