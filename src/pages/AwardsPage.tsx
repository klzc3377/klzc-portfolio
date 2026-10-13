import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useLayoutEffect, useRef, useState } from 'react'
import { awards } from '../data/portfolio'
import type { Award, Navigate } from '../types/portfolio'
import ChapterBridge from '../components/ui/ChapterBridge'
import CinematicHero from '../components/ui/CinematicHero'

type AwardsPageProps = {
  onOpenAward: (award: Award) => void
  selected: Award | null
  navigate: Navigate
}

function useStripTravel(enabled: boolean) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [travel, setTravel] = useState(0)
  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track || !enabled) return
    const measure = () => setTravel(Math.max(0, track.scrollWidth - window.innerWidth))
    // ResizeObserver reports the initial size as soon as observation starts.
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [enabled])
  return { trackRef, travel: enabled ? travel : 0 }
}

export default function AwardsPage({ onOpenAward, selected, navigate }: AwardsPageProps) {
  const reducedMotion = useReducedMotion()
  const [pinned] = useState(() => window.matchMedia('(min-width: 900px) and (min-height: 560px)').matches && !reducedMotion)
  const sectionRef = useRef<HTMLElement | null>(null)
  const { trackRef, travel } = useStripTravel(pinned)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 32, mass: 0.35 })
  const x = useTransform(smooth, (value) => -value * travel)
  const [frame, setFrame] = useState(1)
  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const next = Math.min(awards.length, Math.max(1, Math.round(value * (awards.length - 1)) + 1))
    setFrame((current) => (current === next ? current : next))
  })

  return (
    <div className="inner-page awards-page">
      <CinematicHero
        chapter="03"
        label="比赛记录 / Awards"
        title="比赛与荣誉"
        en="Competition archive"
        copy="留下来的部分比赛证书。点击任意一帧可以查看大图。"
        copyEn="A selection of competition certificates. Open any frame to view it."
        image="/assets/teamwork-trophy.webp"
        imageAlt="2022–2023 China–Canada VEX Teamwork Champion trophy"
        position="50% 34%"
        meta={[{ label: 'Frames', value: String(awards.length).padStart(2, '0') }, { label: 'Span', value: '2019—2025' }, { label: 'Program', value: 'VEX IQ · V5RC' }]}
      />

      <section
        ref={sectionRef}
        className={`film-strip-section${pinned ? ' is-pinned' : ''}`}
        style={pinned ? { height: `calc(100svh + ${travel}px)` } : undefined}
        aria-label="比赛证书 / Award certificates"
      >
        <div className="film-strip-section__sticky">
          <div className="film-strip-section__head">
            <p className="eyebrow">胶片 / Contact strip</p>
            <span className="film-strip-section__counter" aria-hidden="true">
              <strong>{String(frame).padStart(2, '0')}</strong> / {String(awards.length).padStart(2, '0')}
            </span>
          </div>
          <motion.div ref={trackRef} className="film-strip" style={pinned ? { x } : undefined}>
            {awards.map((award, index) => (
              <button
                className="film-frame"
                type="button"
                key={award.image}
                onClick={() => onOpenAward(award)}
                aria-haspopup="dialog"
                data-cursor="查看 View"
              >
                <span className="film-frame__code" aria-hidden="true">KLZC {String(index + 1).padStart(2, '0')}A ▸ {award.year}</span>
                <span className="film-frame__image">
                  {selected === award ? null : (
                    <motion.img
                      layoutId={`award-${award.image}`}
                      src={award.image}
                      alt={award.zh}
                      loading={index > 2 ? 'lazy' : undefined}
                      transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
                    />
                  )}
                </span>
                <span className="film-frame__caption">
                  <span>{String(index + 1).padStart(2, '0')} — {award.year}</span>
                  <strong>{award.zh}</strong>
                  <em>{award.title}</em>
                </span>
              </button>
            ))}
          </motion.div>
          {pinned ? <p className="film-strip-section__hint" aria-hidden="true">继续滚动以推进胶片 / Scroll to advance the reel</p> : null}
        </div>
      </section>

      <ChapterBridge index="04" title="项目记录" en="Projects" href="/projects" navigate={navigate} />
    </div>
  )
}
