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
}

export default function ChapterBridge({
  index,
  title,
  en,
  href,
  navigate,
  kicker = 'Next chapter / 下一章',
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
        <span>Continue</span>
        <ArrowRight size={20} />
      </RouteLink>
    </Reveal>
  )
}
