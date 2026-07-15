import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'
import type { RoutePath } from '../../types/portfolio'

export default function AmbientBackdrop({ path }: { path: RoutePath }) {
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const artY = useTransform(scrollYProgress, [0, 1], ['0%', '-7%'])
  const gridY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])
  const artScale = useTransform(scrollYProgress, [0, 1], [1.02, 1.09])
  const pointerX = useMotionValue(-720)
  const pointerY = useMotionValue(-720)
  const glowX = useSpring(pointerX, { stiffness: 64, damping: 24, mass: 0.72 })
  const glowY = useSpring(pointerY, { stiffness: 64, damping: 24, mass: 0.72 })

  useEffect(() => {
    if (reducedMotion || window.matchMedia('(pointer: coarse)').matches) return
    const onPointerMove = (event: PointerEvent) => {
      pointerX.set(event.clientX - 280)
      pointerY.set(event.clientY - 280)
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [pointerX, pointerY, reducedMotion])

  return (
    <div
      className={`ambient-stage ${path === '/' ? 'home-backdrop' : ''} ${path === '/robotics' ? 'robotics-backdrop' : ''} ${path === '/awards' ? 'awards-backdrop' : ''} ${path.startsWith('/projects') ? 'projects-backdrop' : ''}`}
      aria-hidden="true"
    >
      <motion.div className="ambient-image" style={reducedMotion ? undefined : { y: artY, scale: artScale }} />
      <motion.div className="ambient-grid" style={reducedMotion ? undefined : { y: gridY }} />
      <motion.div className="ambient-pointer-glow" style={reducedMotion ? undefined : { x: glowX, y: glowY }} />
      <div className="ambient-vignette" />
    </div>
  )
}
