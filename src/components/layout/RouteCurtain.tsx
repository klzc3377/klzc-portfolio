import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

export type CurtainCard = {
  number: string
  title: string
  en: string
}

type RouteCurtainProps = {
  card: CurtainCard
  phase: 'cover' | 'reveal'
  onCovered: () => void
  onRevealed: () => void
}

const ease = [0.76, 0, 0.24, 1] as const

/** A shutter wipes across the frame with the next chapter's title card. */
export default function RouteCurtain({ card, phase, onCovered, onRevealed }: RouteCurtainProps) {
  const callbacks = useRef({ onCovered, onRevealed })
  useEffect(() => { callbacks.current = { onCovered, onRevealed } }, [onCovered, onRevealed])

  return (
    <motion.div
      className="route-curtain"
      aria-hidden="true"
      initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
      animate={{ clipPath: phase === 'cover' ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' }}
      transition={{ duration: phase === 'cover' ? 0.62 : 0.78, ease }}
      onAnimationComplete={() => {
        if (phase === 'cover') callbacks.current.onCovered()
        else callbacks.current.onRevealed()
      }}
    >
      <motion.div
        className="route-curtain__card"
        initial={{ opacity: 0, y: 40 }}
        animate={phase === 'cover' ? { opacity: 1, y: 0 } : { opacity: 0, y: -60 }}
        transition={{ duration: phase === 'cover' ? 0.7 : 0.5, ease: [0.16, 1, 0.3, 1], delay: phase === 'cover' ? 0.18 : 0 }}
      >
        <span className="route-curtain__number">{card.number}</span>
        <span className="route-curtain__title">{card.title}</span>
        <em className="route-curtain__en">{card.en}</em>
      </motion.div>
    </motion.div>
  )
}
