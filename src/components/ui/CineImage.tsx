import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

type CineImageProps = {
  src: string
  alt: string
  className?: string
  caption?: ReactNode
  /** Percentage of vertical drift inside the frame while scrolling. */
  parallax?: number
  eager?: boolean
  position?: string
  direction?: 'up' | 'left' | 'right'
}

const hiddenClip = {
  up: 'inset(100% 0% 0% 0%)',
  left: 'inset(0% 100% 0% 0%)',
  right: 'inset(0% 0% 0% 100%)',
}

/** An image that opens like a shutter, then drifts against the scroll. */
export default function CineImage({ src, alt, className = '', caption, parallax = 8, eager = false, position, direction = 'up' }: CineImageProps) {
  const ref = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [`${-parallax}%`, `${parallax}%`])

  return (
    <motion.figure
      ref={ref}
      className={`cine-image ${className}`}
      initial={reducedMotion ? false : { clipPath: hiddenClip[direction] }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 1.35, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.img
        src={src}
        alt={alt}
        loading={eager ? undefined : 'lazy'}
        decoding="async"
        style={{ y: reducedMotion ? 0 : y, objectPosition: position }}
        initial={reducedMotion ? false : { scale: 1.32 }}
        whileInView={{ scale: 1.14 }}
        viewport={{ once: true, amount: 0.22 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
      />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </motion.figure>
  )
}
