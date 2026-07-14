import { motion } from 'framer-motion'

type PageHeadingProps = {
  chapter?: string
  label: string
  title: string
  en: string
  copy: string
  copyEn?: string
}

export default function PageHeading({ chapter, label, title, en, copy, copyEn }: PageHeadingProps) {
  return (
    <header className="page-heading">
      {chapter ? (
        <div className="page-heading__chapter" aria-hidden="true">
          <span>Chapter</span>
          <strong>{chapter}</strong>
          <em>/ 05</em>
        </div>
      ) : null}
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="eyebrow">
        {label}
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {title}
      </motion.h1>
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.06 }}
      >
        {en}
      </motion.h2>
      <motion.div
        className="page-intro"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.11 }}
      >
        <p>{copy}</p>
        {copyEn ? <p className="en-copy">{copyEn}</p> : null}
      </motion.div>
    </header>
  )
}
