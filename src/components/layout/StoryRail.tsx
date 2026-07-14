import { storyChapters } from '../../data/portfolio'
import { isStoryChapterActive } from '../../app/routing'
import type { Navigate, RoutePath } from '../../types/portfolio'
import RouteLink from '../ui/RouteLink'

export default function StoryRail({ path, navigate }: { path: RoutePath; navigate: Navigate }) {
  return (
    <nav className="story-rail" aria-label="Story chapters">
      <p className="story-rail__label"><span>KLZC</span>Story</p>
      <div className="story-rail__chapters">
        {storyChapters.map((chapter) => {
          const active = isStoryChapterActive(chapter.href, path)
          return (
            <RouteLink
              key={chapter.number}
              href={chapter.href}
              navigate={navigate}
              className={`story-rail__chapter${active ? ' is-active' : ''}`}
              ariaLabel={`${chapter.label} — ${chapter.zh}`}
            >
              <span>{chapter.number}</span>
              <strong>{chapter.label}</strong>
              <em>{chapter.zh}</em>
            </RouteLink>
          )
        })}
      </div>
      <p className="story-rail__year">2019—NOW</p>
    </nav>
  )
}
