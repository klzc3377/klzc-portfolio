import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import SplitText from './SplitText'

type HeroMeta = { label: string; value: string }

type CinematicHeroProps = {
  chapter: string
  label: string
  title: string
  en: string
  copy: string
  copyEn?: string
  image: string
  /** Pre-scaled variant for 2x+ screens (scripts/prepare-hd-heroes.mjs). */
  imageHd?: string
  imageAlt?: string
  position?: string
  meta?: HeroMeta[]
}

const ease = [0.16, 1, 0.3, 1] as const

/** Every chapter opens on a full-frame establishing shot. */
export default function CinematicHero({ chapter, label, title, en, copy, copyEn, image, imageHd, imageAlt = '', position = 'center', meta = [] }: CinematicHeroProps) {
  const ref = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.12])
  const veil = useTransform(scrollYProgress, [0, 0.85], [0, 0.82])
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', '-38%'])
  const fade = (delay: number) => ({
    initial: reducedMotion ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reducedMotion ? 0 : 1, delay: reducedMotion ? 0 : delay, ease },
  })

  return (
    <header ref={ref} className="cine-hero">
      <motion.div className="cine-hero__plate" style={reducedMotion ? undefined : { y: imageY, scale: imageScale }}>
        <motion.img
          src={image}
          srcSet={imageHd ? `${image} 1x, ${imageHd} 2x` : undefined}
          alt={imageAlt}
          aria-hidden={imageAlt ? undefined : true}
          style={{ objectPosition: position }}
          initial={reducedMotion ? false : { scale: 1.18, opacity: 0 }}
          animate={{ scale: 1.04, opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 2.6, ease }}
        />
      </motion.div>
      <div className="cine-hero__grade" aria-hidden="true" />
      <motion.div className="cine-hero__veil" aria-hidden="true" style={reducedMotion ? undefined : { opacity: veil }} />

      <div className="cine-hero__frame" aria-hidden="true">
        <i /><i /><i /><i />
      </div>

      <motion.div className="cine-hero__slate" {...fade(0.25)}>
        <span>Scene <strong>{chapter}</strong> / 05</span>
        <span className="cine-hero__slate-label">{label}</span>
      </motion.div>

      <motion.div className="cine-hero__body" style={reducedMotion ? undefined : { y: copyY }}>
        <div className="cine-hero__title">
          <SplitText as="h1" text={title} trigger="mount" delay={0.35} stagger={0.06} duration={1.25} />
          <motion.p className="cine-hero__en" {...fade(0.75)}>{en}</motion.p>
        </div>
        <motion.div className="cine-hero__copy" {...fade(0.95)}>
          <p>{copy}</p>
          {copyEn ? <p className="en-copy">{copyEn}</p> : null}
        </motion.div>
      </motion.div>

      <motion.div className="cine-hero__footer" {...fade(1.15)}>
        <dl>
          {meta.map((item) => (
            <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>
          ))}
        </dl>
        <span className="cine-hero__cue" aria-hidden="true">向下滚动 / Scroll<i /></span>
      </motion.div>
    </header>
  )
}
