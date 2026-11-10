import { useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRef } from 'react'
import { storyChapters } from '../../data/portfolio'
import type { Navigate } from '../../types/portfolio'
import RouteLink from './RouteLink'
import SplitText from './SplitText'

type ChapterBridgeProps = {
  index: string
  title: string
  en: string
  href: string
  navigate: Navigate
  kicker?: string
  actionZh?: string
  actionEn?: string
  image?: string
}

/** The closing shot of a chapter doubles as the door to the next one. */
export default function ChapterBridge({
  index,
  title,
  en,
  href,
  navigate,
  kicker = '下一章 / Next chapter',
  actionZh = '继续',
  actionEn = 'Continue',
  image,
}: ChapterBridgeProps) {
  const backdrop = image ?? storyChapters.find((chapter) => chapter.href === href)?.image ?? '/assets/cinematic-tunnel-environment.webp'
  // Touch screens never hover, so the plate develops from a grey negative into
  // colour once the shot is properly in frame.
  const plateRef = useRef<HTMLSpanElement | null>(null)
  const developed = useInView(plateRef, { amount: 0.55 })

  return (
    <RouteLink href={href} navigate={navigate} className="chapter-bridge" cursor="继续 Next">
      <span ref={plateRef} className="chapter-bridge__plate" data-developed={developed || undefined} aria-hidden="true"><img src={backdrop} alt="" loading="lazy" decoding="async" /></span>
      <span className="chapter-bridge__kicker">{kicker}</span>
      <span className="chapter-bridge__index" aria-hidden="true">{index}</span>
      <span className="chapter-bridge__copy">
        <SplitText as="span" className="chapter-bridge__title" text={title} stagger={0.05} />
        <span className="chapter-bridge__en">{en}</span>
      </span>
      <span className="chapter-bridge__action">
        <span>{actionZh}<small>{actionEn}</small></span>
        <i><ArrowRight size={22} /></i>
      </span>
    </RouteLink>
  )
}
