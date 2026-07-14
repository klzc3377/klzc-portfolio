import { useId, type SVGProps } from 'react'
import './BrandMark.css'

export type BrandMarkVariant = 'compact' | 'hero'

export type BrandMarkProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  variant?: BrandMarkVariant
  className?: string
  /**
   * Use null when the surrounding link or heading already names the brand.
   */
  title?: string | null
}

export function BrandMark({
  variant = 'compact',
  className,
  title = 'KLzc brand mark',
  role,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-hidden': ariaHidden,
  ...svgProps
}: BrandMarkProps) {
  const uid = useId().replace(/:/g, '')
  const titleId = `brand-mark-title-${uid}`
  const metalId = `brand-mark-metal-${uid}`
  const flareId = `brand-mark-flare-${uid}`
  const scanId = `brand-mark-scan-${uid}`
  const hidden = ariaHidden === true || ariaHidden === 'true'
  const visibleTitle = !hidden && title ? title : null
  const labelledBy = [visibleTitle ? titleId : null, ariaLabelledBy].filter(Boolean).join(' ') || undefined
  const hasAccessibleName = Boolean(visibleTitle || ariaLabel || ariaLabelledBy)
  const classes = ['brand-mark', `brand-mark--${variant}`, className].filter(Boolean).join(' ')

  return (
    <svg
      {...svgProps}
      className={classes}
      viewBox="0 0 176 112"
      fill="none"
      role={role ?? (!hidden && hasAccessibleName ? 'img' : undefined)}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      aria-hidden={hidden || !hasAccessibleName ? true : undefined}
      focusable="false"
    >
      {visibleTitle ? <title id={titleId}>{visibleTitle}</title> : null}
      <defs>
        <linearGradient id={metalId} x1="18" y1="12" x2="154" y2="100" gradientUnits="userSpaceOnUse">
          <stop className="brand-mark__metal-start" />
          <stop offset="0.46" className="brand-mark__metal-bright" />
          <stop offset="1" className="brand-mark__metal-end" />
        </linearGradient>
        <linearGradient id={flareId} x1="80" y1="50" x2="153" y2="57" gradientUnits="userSpaceOnUse">
          <stop className="brand-mark__flare-start" />
          <stop offset="1" className="brand-mark__flare-end" />
        </linearGradient>
        <clipPath id={scanId}>
          <path
            d="M20 97V15M20 56H37L78 15M37 56L78 97M71 15H151L75 97H154"
            stroke="black"
            strokeWidth="11"
            strokeLinejoin="miter"
            strokeLinecap="square"
          />
        </clipPath>
      </defs>

      <g className="brand-mark__fragments" aria-hidden="true">
        <path className="brand-mark__fragment brand-mark__fragment--north" d="M12 25V12H29" />
        <path className="brand-mark__fragment brand-mark__fragment--east" d="M160 38V15H145" />
        <path className="brand-mark__fragment brand-mark__fragment--south" d="M145 103H162V89" />
        <path className="brand-mark__fragment brand-mark__fragment--signal" d="M13 103H31" />
      </g>

      <g className="brand-mark__skeleton">
        <path
          className="brand-mark__rail"
          stroke={`url(#${metalId})`}
          d="M20 97V15M20 56H37L78 15M37 56L78 97"
        />
        <path className="brand-mark__rail brand-mark__rail--z" stroke={`url(#${metalId})`} d="M71 15H151L75 97H154" />
        <path className="brand-mark__accent" stroke={`url(#${flareId})`} d="M116 15H151L139 28" />
        <path className="brand-mark__accent brand-mark__accent--slash" stroke={`url(#${flareId})`} d="M74 97H96" />

        <g clipPath={`url(#${scanId})`}>
          <rect className="brand-mark__scan" x="-34" y="-2" width="22" height="116" />
        </g>

        <path
          className="brand-mark__trace"
          pathLength={1}
          d="M20 97V15M20 56H37L78 15M37 56L78 97M71 15H151L75 97H154"
        />
        <circle className="brand-mark__node" cx="75" cy="97" r="3" />
      </g>
    </svg>
  )
}

export default BrandMark
