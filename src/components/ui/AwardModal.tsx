import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ExternalLink, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Award } from '../../types/portfolio'

type AwardModalProps = {
  award: Award
  index: number
  count: number
  onClose: () => void
  onStep: (direction: number) => void
}

export default function AwardModal({ award, index, count, onClose, onStep }: AwardModalProps) {
  const reducedMotion = useReducedMotion()
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const callbacks = useRef({ onClose, onStep })
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  // Only the certificate that was opened morphs from its film frame; stepping
  // to a neighbour must not fly in from a frame that is off-screen.
  const [originImage] = useState(award.image)
  const zoomed = zoomedImage === award.image

  useEffect(() => { callbacks.current = { onClose, onStep } }, [onClose, onStep])
  useEffect(() => { viewportRef.current?.scrollTo(0, 0) }, [award.image, zoomed])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        callbacks.current.onClose()
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        // Zoomed images keep native arrow-key scrolling.
        if (dialogRef.current?.querySelector('.is-zoomed')) return
        event.preventDefault()
        callbacks.current.onStep(event.key === 'ArrowLeft' ? -1 : 1)
      } else if (event.key === 'Tab') {
        const elements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]') ?? [])
        const first = elements[0]
        const last = elements.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      window.requestAnimationFrame(() => {
        if (previousFocus?.isConnected && !previousFocus.closest('[inert]')) previousFocus.focus({ preventScroll: true })
      })
    }
  }, [])

  return (
    <motion.div
      ref={dialogRef}
      className="award-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="certificate-title"
      initial={{ opacity: reducedMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
      data-lenis-prevent
    >
      <button ref={closeRef} type="button" className="modal-close" aria-label="关闭证书预览 / Close certificate preview" onClick={onClose}>
        <X size={20} />
      </button>
      <div className="modal-content">
        <div ref={viewportRef} className={`certificate-viewport${zoomed ? ' is-zoomed' : ''}`} tabIndex={zoomed ? 0 : undefined} aria-label="证书图片 / Certificate image">
          <motion.img
            key={award.image}
            layoutId={reducedMotion || award.image !== originImage ? undefined : `award-${award.image}`}
            initial={award.image === originImage || reducedMotion ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            src={award.image}
            alt={award.zh}
            onClick={() => setZoomedImage(zoomed ? null : award.image)}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            data-cursor={zoomed ? '缩小 Out' : '放大 Zoom'}
          />
        </div>
        <motion.div
          className="modal-copy"
          key={award.image}
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.6, delay: reducedMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="certificate-position" role="status">
            <strong>{String(index + 1).padStart(2, '0')}</strong> / {String(count).padStart(2, '0')}
          </p>
          <p className="eyebrow">{award.year} / VEX</p>
          <h2 id="certificate-title">{award.zh}</h2>
          <p lang="en" className="modal-copy__en">{award.title}</p>
          <div className="certificate-tools" aria-label="证书操作 / Certificate controls">
            <button type="button" onClick={() => onStep(-1)} aria-label="上一张证书 / Previous certificate"><ArrowLeft size={18} /></button>
            <button type="button" onClick={() => onStep(1)} aria-label="下一张证书 / Next certificate"><ArrowRight size={18} /></button>
            <button type="button" onClick={() => setZoomedImage(zoomed ? null : award.image)} aria-pressed={zoomed}>
              {zoomed ? <ZoomOut size={17} /> : <ZoomIn size={17} />}{zoomed ? '缩小' : '放大'}
            </button>
            <a href={award.image} target="_blank" rel="noopener noreferrer" aria-label="在新标签页打开证书原图 / Open original in a new tab"><ExternalLink size={15} /> 原图</a>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
