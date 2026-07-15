import { motion, useReducedMotion } from 'framer-motion'

type PageHeadingProps = {
  chapter?: string
  label: string
  title: string
  en: string
  copy: string
  copyEn?: string
}

export default function PageHeading({ chapter, label, title, en, copy, copyEn }: PageHeadingProps) {
  const reducedMotion = useReducedMotion()
  const titleInitial = reducedMotion ? { opacity: 1 } : { opacity: 0, y: 24, filter: 'blur(7px)' }
  const copyInitial = reducedMotion ? { opacity: 1 } : { opacity: 0, y: 16, filter: 'blur(5px)' }

  return (
    <header className="page-heading">
      {chapter ? (
        <div className="page-heading__chapter" aria-hidden="true">
          <span>章节</span>
          <strong>{chapter}</strong>
          <em>/ 05 · Chapter</em>
        </div>
      ) : null}
      <motion.p
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="eyebrow"
      >
        {label}
      </motion.p>
      <motion.h1
        initial={titleInitial}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: reducedMotion ? 0 : 0.72, ease: [0.16, 1, 0.3, 1] }}
      >
        {title}
      </motion.h1>
      <motion.h2
        initial={copyInitial}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: reducedMotion ? 0 : 0.68, delay: reducedMotion ? 0 : 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        {en}
      </motion.h2>
      <motion.div
        className="page-intro"
        initial={copyInitial}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: reducedMotion ? 0 : 0.68, delay: reducedMotion ? 0 : 0.14, ease: [0.16, 1, 0.3, 1] }}
      >
        <p>{copy}</p>
        {copyEn ? <p className="en-copy">{copyEn}</p> : null}
      </motion.div>
    </header>
  )
}
