import { ArrowRight } from 'lucide-react'
import { projects } from '../data/portfolio'
import type { Navigate } from '../types/portfolio'
import ChapterBridge from '../components/ui/ChapterBridge'
import CineImage from '../components/ui/CineImage'
import CinematicHero from '../components/ui/CinematicHero'
import Reveal from '../components/ui/Reveal'
import RouteLink from '../components/ui/RouteLink'
import SplitText from '../components/ui/SplitText'

export default function ProjectsPage({ navigate }: { navigate: Navigate }) {
  return (
    <div className="inner-page projects-page">
      <CinematicHero
        chapter="04"
        label="项目 / Projects"
        title="项目与实践"
        en="Selected work"
        copy="从机器人装配到网页交互，把想法做成可以探索的作品。这里记录每个项目的过程与实现。"
        copyEn="From robot assemblies to interactive websites. A collection of projects, with the process behind each one."
        image="/assets/klzc-abstract-bg.webp"
        imageHd="/assets/hd/klzc-abstract-bg.webp"
        position="62% 30%"
        meta={[{ label: 'Reels', value: String(projects.length).padStart(2, '0') }, { label: 'Span', value: '2019—2026' }, { label: 'Stack', value: 'React · Three.js · GLB' }]}
      />

      <section className="page-section reels" aria-label="项目 / Projects">
        {projects.map((project, index) => (
          <article className={`reel${index % 2 ? ' reel--flip' : ''}`} key={project.slug}>
            <RouteLink
              href={`/projects/${project.slug}`}
              navigate={navigate}
              className="reel__media"
              ariaLabel={`查看 ${project.zh} / View ${project.title}`}
              cursor="查看 View"
            >
              <CineImage src={project.image} alt={project.imageAlt} eager={index === 0} parallax={7} direction={index % 2 ? 'left' : 'right'} />
              <span className="reel__kind">{project.kind}</span>
            </RouteLink>
            <Reveal className="reel__copy" delay={0.1}>
              <span className="reel__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <p className="eyebrow">{project.year}</p>
              <SplitText as="h2" text={project.zh} stagger={0.05} />
              <h3>{project.title}</h3>
              <p>{project.summaryZh}</p>
              <p className="en-copy">{project.summaryEn}</p>
              <p className="reel__stack">{project.stack.slice(0, 4).join('  /  ')}</p>
              <RouteLink href={`/projects/${project.slug}`} navigate={navigate} className="text-action">
                查看记录 / View details <ArrowRight size={17} />
              </RouteLink>
            </Reveal>
          </article>
        ))}
      </section>

      <ChapterBridge index="05" title="关于我" en="Profile" href="/profile" navigate={navigate} />
    </div>
  )
}
