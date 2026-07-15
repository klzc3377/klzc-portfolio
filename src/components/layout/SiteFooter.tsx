import type { Navigate } from '../../types/portfolio'
import RouteLink from '../ui/RouteLink'

export default function SiteFooter({ navigate }: { navigate: Navigate }) {
  return (
    <footer className="site-footer">
      <span>KLzc / Cheng Zhang</span>
      <nav aria-label="页脚导航 / Footer navigation">
        <RouteLink href="/projects" navigate={navigate}>精选项目 / Selected work</RouteLink>
        <RouteLink href="/profile" navigate={navigate}>关于我 / Profile</RouteLink>
      </nav>
      <a href="mailto:masterzc624@gmail.com"><span>联系我 / Contact</span><small>masterzc624@gmail.com</small></a>
    </footer>
  )
}
