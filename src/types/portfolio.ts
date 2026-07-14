import type { LucideIcon } from 'lucide-react'

export type StaticRoute = '/' | '/profile' | '/atlas' | '/robotics' | '/awards' | '/projects'
export type RoutePath = StaticRoute | `/projects/${string}`
export type Navigate = (href: string) => void

export type NavItem = {
  path: StaticRoute
  label: string
  zh: string
}

export type StoryChapter = {
  number: string
  href: StaticRoute
  label: string
  zh: string
}

export type Direction = {
  title: string
  zh: string
  icon: LucideIcon
  copy: string
  en: string
}

export type Award = {
  title: string
  zh: string
  year: string
  image: string
}

export type RoboticsTimelineItem = {
  year: string
  title: string
  zh: string
  en: string
}

export type ProjectMetric = {
  value: string
  label: string
  labelEn: string
}

export type ProjectStep = {
  title: string
  titleEn: string
  zh: string
  en: string
}

export type ProjectLink = {
  href: string
  label: string
  labelEn: string
}

export type ProjectImage = {
  src: string
  alt: string
}

export type Project = {
  slug: string
  title: string
  zh: string
  year: string
  kind: string
  image: string
  imageAlt: string
  summaryZh: string
  summaryEn: string
  whyZh: string
  whyEn: string
  roleZh: string
  roleEn: string
  stack: string[]
  metrics: ProjectMetric[]
  steps: ProjectStep[]
  interestingZh: string
  interestingEn: string
  statusZh: string
  statusEn: string
  gallery: ProjectImage[]
  links: ProjectLink[]
}
