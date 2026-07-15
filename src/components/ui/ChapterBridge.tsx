import { ArrowRight } from 'lucide-react'
import type { Navigate } from '../../types/portfolio'
import Reveal from './Reveal'
import RouteLink from './RouteLink'

type ChapterBridgeProps = {
  index: string
  title: string
  en: string
  href: string
  navigate: Navigate
  kicker?: string
  actionZh?: string
  actionEn?: string
}

export default function ChapterBridge({
  index,
  title,
  en,
  href,
  navigate,
  kicker = '下一章 / Next chapter',
  actionZh = '继续阅读',
  actionEn = 'Continue',
}: ChapterBridgeProps) {
  return (
    <Reveal className="chapter-bridge">
      <div className="chapter-bridge__index" aria-hidden="true">{index}</div>
      <div className="chapter-bridge__copy">
        <p>{kicker}</p>
        <h2>{title}</h2>
        <span>{en}</span>
      </div>
      <RouteLink href={href} navigate={navigate} className="chapter-bridge__action">
        <span>{actionZh}<small>{actionEn}</small></span>
        <ArrowRight size={20} />
      </RouteLink>
    </Reveal>
  )
}
