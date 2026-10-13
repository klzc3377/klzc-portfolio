import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useRef } from 'react'
import { isSpace, tokenize } from '../../app/text'

function Token({ token, index, count, progress }: { token: string; index: number; count: number; progress: MotionValue<number> }) {
  const start = index / count
  const opacity = useTransform(progress, [start, Math.min(1, start + 2.4 / count)], [0.16, 1])
  return <motion.span className="scroll-highlight__token" style={{ opacity }}>{token}</motion.span>
}

/** Words light up in reading order as the paragraph travels through the frame. */
export default function ScrollHighlight({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement | null>(null)
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 82%', 'end 48%'] })
  const tokens = tokenize(text)

  if (reducedMotion) return <p ref={ref} className={`scroll-highlight ${className}`}>{text}</p>

  return (
    <p ref={ref} className={`scroll-highlight ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {tokens.map((token, index) => (
          isSpace(token) ? ' ' : <Token key={index} token={token} index={index} count={tokens.length} progress={scrollYProgress} />
        ))}
      </span>
    </p>
  )
}
