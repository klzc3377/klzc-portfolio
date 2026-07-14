import type { Navigate } from '../../types/portfolio'
import RouteLink from '../ui/RouteLink'

export default function SiteFooter({ navigate }: { navigate: Navigate }) {
  return (
    <footer className="site-footer">
      <span>KLzc / Cheng Zhang</span>
      <nav aria-label="Footer navigation">
        <RouteLink href="/projects" navigate={navigate}>Selected work / 项目</RouteLink>
        <RouteLink href="/profile" navigate={navigate}>Profile / 现在</RouteLink>
      </nav>
      <a href="mailto:masterzc624@gmail.com">masterzc624@gmail.com</a>
    </footer>
  )
}
