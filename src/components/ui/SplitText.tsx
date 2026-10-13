import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { isSpace, tokenize } from '../../app/text'

const tags = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
  div: motion.div,
}

type SplitTextProps = {
  text: string
  as?: keyof typeof tags
  className?: string
  delay?: number
  stagger?: number
  duration?: number
  /** `mount` plays immediately; `view` waits until the text scrolls into frame. */
  trigger?: 'mount' | 'view'
}

export default function SplitText({
  text,
  as = 'span',
  className = '',
  delay = 0,
  stagger = 0.035,
  duration = 1.05,
  trigger = 'view',
}: SplitTextProps) {
  const reducedMotion = useReducedMotion()
  const Tag = tags[as]
  const container: Variants = {
    hidden: {},
    shown: { transition: { staggerChildren: reducedMotion ? 0 : stagger, delayChildren: reducedMotion ? 0 : delay } },
  }
  const glyph: Variants = {
    hidden: { y: reducedMotion ? 0 : '112%', rotate: reducedMotion ? 0 : 3 },
    shown: { y: 0, rotate: 0, transition: { duration: reducedMotion ? 0 : duration, ease: [0.16, 1, 0.3, 1] } },
  }
  const play = trigger === 'mount' ? { animate: 'shown' } : { whileInView: 'shown', viewport: { once: true, amount: 0.35 } }

  return (
    <Tag className={`split-text ${className}`} initial="hidden" variants={container} {...play}>
      <span className="sr-only">{text}</span>
      {tokenize(text).map((token, index) => (
        isSpace(token)
          ? <span key={index} className="split-text__space" aria-hidden="true"> </span>
          : (
            <span key={index} className="split-text__mask" aria-hidden="true">
              <motion.span className="split-text__glyph" variants={glyph}>{token}</motion.span>
            </span>
          )
      ))}
    </Tag>
  )
}
