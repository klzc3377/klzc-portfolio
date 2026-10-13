import { useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'

const INTERACTIVE_SELECTOR = "a, button, select, [role='button'], [data-cursor]"
const TEXT_SELECTOR = "textarea, input, [contenteditable='true']"

/** Dot + trailing lens ring. Labels come from the nearest `data-cursor`. */
export default function CinematicPointer() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const ringRef = useRef<HTMLDivElement | null>(null)
  const dotRef = useRef<HTMLDivElement | null>(null)
  const labelRef = useRef<HTMLSpanElement | null>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const root = rootRef.current
    const ring = ringRef.current
    const dot = dotRef.current
    const label = labelRef.current
    const finePointer = window.matchMedia('(pointer: fine) and (hover: hover)')
    if (!root || !ring || !dot || !label || reducedMotion || !finePointer.matches) return

    document.documentElement.dataset.cinematicCursor = 'enabled'
    const target = { x: -100, y: -100 }
    const lens = { x: -100, y: -100, scale: 1 }
    let mode: 'default' | 'interactive' | 'label' | 'text' = 'default'
    let pressed = false
    let visible = false
    let frame = 0
    let previous = performance.now()

    const setMode = (element: Element | null) => {
      const text = element?.closest(TEXT_SELECTOR)
      const interactive = element?.closest(INTERACTIVE_SELECTOR)
      const labelled = interactive instanceof HTMLElement ? interactive.closest<HTMLElement>('[data-cursor]') : null
      const nextLabel = labelled?.dataset.cursor ?? ''
      mode = text ? 'text' : nextLabel ? 'label' : interactive ? 'interactive' : 'default'
      if (label.textContent !== nextLabel) label.textContent = nextLabel
      root.dataset.mode = mode
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      target.x = event.clientX
      target.y = event.clientY
      if (!visible) {
        visible = true
        lens.x = target.x
        lens.y = target.y
        root.dataset.visible = 'true'
      }
      setMode(event.target instanceof Element ? event.target : null)
    }
    const onDown = () => { pressed = true }
    const onUp = () => { pressed = false }
    const onLeave = () => {
      visible = false
      root.dataset.visible = 'false'
    }

    let lastProbe = 0
    const render = (now: number) => {
      frame = requestAnimationFrame(render)
      const delta = Math.min(64, now - previous)
      previous = now
      // Content can change under a resting pointer (route curtains, dialogs, scrolling).
      if (visible && now - lastProbe > 180) {
        lastProbe = now
        setMode(document.elementFromPoint(target.x, target.y))
      }
      const follow = 1 - Math.pow(0.0018, delta / 1000)
      lens.x += (target.x - lens.x) * follow
      lens.y += (target.y - lens.y) * follow
      const goal = (mode === 'label' ? 4.4 : mode === 'interactive' ? 1.9 : mode === 'text' ? 0.4 : 1) * (pressed ? 0.78 : 1)
      lens.scale += (goal - lens.scale) * Math.min(1, follow * 1.3)
      dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`
      ring.style.transform = `translate3d(${lens.x}px, ${lens.y}px, 0) scale(${lens.scale.toFixed(3)})`
      label.style.transform = `translate3d(${lens.x}px, ${lens.y}px, 0)`
    }
    frame = requestAnimationFrame(render)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      delete document.documentElement.dataset.cinematicCursor
    }
  }, [reducedMotion])

  return (
    <div ref={rootRef} className="cine-cursor" aria-hidden="true" data-visible="false" data-mode="default">
      <div ref={ringRef} className="cine-cursor__ring" />
      <span ref={labelRef} className="cine-cursor__label" />
      <div ref={dotRef} className="cine-cursor__dot" />
    </div>
  )
}
