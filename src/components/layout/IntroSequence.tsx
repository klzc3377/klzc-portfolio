import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const SEEN_KEY = 'klzc-intro-seen'
// Phone visitors arrive from shared links with little patience; the title card
// behind the leader already reveals without waiting on the 3D scene.
const COUNT_DURATION = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches ? 850 : 1500

function shouldPlay() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    return sessionStorage.getItem(SEEN_KEY) !== '1'
  } catch {
    return true
  }
}

/** Film-leader countdown shown once per visit while the first scene loads. */
export default function IntroSequence() {
  const [visible, setVisible] = useState(shouldPlay)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!visible) return
    try { sessionStorage.setItem(SEEN_KEY, '1') } catch { /* private mode */ }
    let frame = 0
    let finished = false
    const start = performance.now()
    const fontsReady = document.fonts?.ready ?? Promise.resolve()
    let fontsLoaded = false
    void fontsReady.then(() => { fontsLoaded = true })
    const tick = (now: number) => {
      const linear = Math.min(1, (now - start) / COUNT_DURATION)
      const eased = 1 - Math.pow(1 - linear, 3)
      setCount(Math.round(eased * (fontsLoaded ? 100 : 96)))
      if (linear < 1 || !fontsLoaded) {
        frame = requestAnimationFrame(tick)
      } else if (!finished) {
        finished = true
        setCount(100)
        window.setTimeout(() => setVisible(false), 260)
      }
    }
    frame = requestAnimationFrame(tick)
    const failsafe = window.setTimeout(() => setVisible(false), 4200)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(failsafe)
    }
  }, [visible])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div className="intro-sequence" aria-hidden="true" onPointerDown={() => setVisible(false)} exit={{ pointerEvents: 'none' }} transition={{ duration: 1.1 }}>
          <motion.div className="intro-sequence__shutter intro-sequence__shutter--top" exit={{ y: '-100%' }} transition={{ duration: 1.05, ease: [0.76, 0, 0.24, 1] }} />
          <motion.div className="intro-sequence__shutter intro-sequence__shutter--bottom" exit={{ y: '100%' }} transition={{ duration: 1.05, ease: [0.76, 0, 0.24, 1] }} />
          <motion.div className="intro-sequence__content" exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.4 }}>
            <p className="intro-sequence__top"><span>KLZC</span><span>Reel 01 · 2019—NOW</span></p>
            <div className="intro-sequence__title">
              <motion.span initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}>Cheng Zhang</motion.span>
              <motion.em initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.5 }}>from Chengdu to Auckland</motion.em>
            </div>
            <div className="intro-sequence__meter">
              <span>{String(count).padStart(3, '0')}</span>
              <i style={{ transform: `scaleX(${count / 100})` }} />
              <span>正在载入 / Loading</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
