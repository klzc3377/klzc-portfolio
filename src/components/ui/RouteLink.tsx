import type { MouseEvent, ReactNode } from 'react'
import type { Navigate } from '../../types/portfolio'

type RouteLinkProps = {
  href: string
  navigate: Navigate
  className?: string
  ariaLabel?: string
  children: ReactNode
}

export default function RouteLink({ href, navigate, className, ariaLabel, children }: RouteLinkProps) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    navigate(href)
  }

  return (
    <a href={href} className={className} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </a>
  )
}
