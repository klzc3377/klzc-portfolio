import { motion } from 'framer-motion'
import { Trophy, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { Award } from '../../types/portfolio'

export default function AwardModal({ award, onClose }: { award: Award; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
      if (event.key === 'Tab') {
        event.preventDefault()
        closeRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [onClose])

  return (
    <motion.div
      className="award-modal"
      role="dialog"
      aria-modal="true"
      aria-label={award.zh}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <button ref={closeRef} type="button" className="modal-close" aria-label="Close certificate preview" onClick={onClose}>
        <X size={21} />
      </button>
      <motion.div
        className="modal-content"
        initial={{ opacity: 0, y: 22, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.985 }}
        transition={{ duration: 0.28 }}
        onClick={(event) => event.stopPropagation()}
      >
        <img src={award.image} alt={award.zh} />
        <div>
          <p className="eyebrow">{award.year}</p>
          <h2>{award.title}</h2>
          <p>{award.zh}</p>
          <span><Trophy size={15} /> Certificate / 证书</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
