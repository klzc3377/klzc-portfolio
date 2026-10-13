import { motion, useScroll, useSpring } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { chapterFor, storyChapters } from '../../data/portfolio'
import type { Navigate, RoutePath } from '../../types/portfolio'
import RouteLink from '../ui/RouteLink'

/** Timecode-style chapter readout pinned to the bottom of the frame. */
export default function ChapterHud({ path, navigate }: { path: RoutePath; navigate: Navigate }) {
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 32, mass: 0.3 })
  const chapter = chapterFor(path) ?? storyChapters[0]
  const next = storyChapters[storyChapters.indexOf(chapter) + 1]

  return (
    <nav className="chapter-hud" aria-label="章节进度 / Chapter progress">
      <div className="chapter-hud__current">
        <span>{chapter.number} / 05</span>
        <strong>{chapter.zh}</strong>
        <em>{chapter.label}</em>
      </div>
      <div className="chapter-hud__track" aria-hidden="true">
        <motion.b style={{ scaleX: progress }} />
      </div>
      <RouteLink href={next?.href ?? '/'} navigate={navigate} className="chapter-hud__next">
        <span>{next ? '下一章' : '回到开头'}<small>{next ? 'Next' : 'Restart'}</small></span>
        <strong>{next?.zh ?? '首页'}</strong>
        <ArrowRight size={15} aria-hidden="true" />
      </RouteLink>
    </nav>
  )
}
