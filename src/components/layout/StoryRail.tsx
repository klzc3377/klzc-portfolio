import { ArrowRight } from 'lucide-react'
import { storyChapters } from '../../data/portfolio'
import { isStoryChapterActive } from '../../app/routing'
import type { Navigate, RoutePath } from '../../types/portfolio'
import RouteLink from '../ui/RouteLink'

export default function StoryRail({ path, navigate }: { path: RoutePath; navigate: Navigate }) {
  const activeIndex = Math.max(0, storyChapters.findIndex((chapter) => isStoryChapterActive(chapter.href, path)))
  const activeChapter = storyChapters[activeIndex]
  const nextChapter = storyChapters[activeIndex + 1]
  const nextHref = nextChapter?.href ?? '/#contact'
  const nextZh = nextChapter?.zh ?? '联系我'
  const nextEn = nextChapter?.label ?? 'Contact'

  return (
    <>
      <nav className="story-rail" aria-label="故事章节 / Story chapters">
        <p className="story-rail__label"><span>KLZC</span>章节 / Story</p>
        <div className="story-rail__chapters">
          {storyChapters.map((chapter) => {
            const active = isStoryChapterActive(chapter.href, path)
            return (
              <RouteLink
                key={chapter.number}
                href={chapter.href}
                navigate={navigate}
                className={`story-rail__chapter${active ? ' is-active' : ''}`}
                ariaLabel={`${chapter.zh} / ${chapter.label}`}
              >
                <span>{chapter.number}</span>
                <strong>{chapter.zh}</strong>
                <em>{chapter.label}</em>
              </RouteLink>
            )
          })}
        </div>
        <p className="story-rail__year">2019—现在 / NOW</p>
      </nav>

      <nav className="story-mobile-dock" aria-label="当前与下一章节 / Current and next chapter">
        <div className="story-mobile-dock__current">
          <span>章节 {activeChapter.number} / 05</span>
          <strong>{activeChapter.zh}</strong>
          <small>{activeChapter.label}</small>
        </div>
        <RouteLink href={nextHref} navigate={navigate} className="story-mobile-dock__next">
          <span>{nextChapter ? '下一章' : '故事之后'}<small>{nextChapter ? 'Next' : 'After the story'}</small></span>
          <strong>{nextZh}<small>{nextEn}</small></strong>
          <ArrowRight size={17} aria-hidden="true" />
        </RouteLink>
      </nav>
    </>
  )
}
