import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import type { RoutePath } from '../../types/portfolio'

export default function AmbientBackdrop({ path }: { path: RoutePath }) {
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const artY = useTransform(scrollYProgress, [0, 1], ['0%', '-7%'])
  const gridY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])
  const artScale = useTransform(scrollYProgress, [0, 1], [1.02, 1.09])

  return (
    <div
      className={`ambient-stage ${path === '/' ? 'home-backdrop' : ''} ${path === '/robotics' ? 'robotics-backdrop' : ''} ${path === '/awards' ? 'awards-backdrop' : ''} ${path.startsWith('/projects') ? 'projects-backdrop' : ''}`}
      aria-hidden="true"
    >
      <motion.div className="ambient-image" style={reducedMotion ? undefined : { y: artY, scale: artScale }} />
      <motion.div className="ambient-grid" style={reducedMotion ? undefined : { y: gridY }} />
      <div className="ambient-vignette" />
    </div>
  )
}
