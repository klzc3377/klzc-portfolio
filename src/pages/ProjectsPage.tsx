import { ArrowRight } from 'lucide-react'
import { projects } from '../data/portfolio'
import type { Navigate } from '../types/portfolio'
import ChapterBridge from '../components/ui/ChapterBridge'
import PageHeading from '../components/ui/PageHeading'
import Reveal from '../components/ui/Reveal'
import RouteLink from '../components/ui/RouteLink'

export default function ProjectsPage({ navigate }: { navigate: Navigate }) {
  return (
    <div className="inner-page projects-page">
      <PageHeading
        chapter="04"
        label="Selected work / 精选项目"
        title="我做过的东西"
        en="Things I’ve made"
        copy="这里不只展示最终画面，也记录每个项目的问题、我的角色、技术方案、关键取舍与结果。"
        copyEn="More than final visuals: each project records the problem, my role, technical approach, key trade-offs and outcome."
      />
      <section className="projects-grid" aria-label="Selected projects">
        {projects.map((project, index) => (
          <Reveal className="project-category" key={project.slug} delay={index * 0.06}>
            <div className="project-cover">
              <img src={project.image} alt={project.imageAlt} loading={index > 0 ? 'lazy' : undefined} />
              <span>{project.kind}</span>
            </div>
            <div className="project-copy">
              <p className="eyebrow">{String(index + 1).padStart(2, '0')} / {project.year}</p>
              <h2>{project.title}</h2>
              <h3>{project.zh}</h3>
              <p>{project.summaryZh}</p>
              <p className="en-copy">{project.summaryEn}</p>
              <ul className="project-stack-preview" aria-label={`${project.title} technology stack`}>
                {project.stack.slice(0, 4).map((item) => <li key={item}>{item}</li>)}
              </ul>
              <RouteLink href={`/projects/${project.slug}`} navigate={navigate} className="text-action">
                View case study / 查看案例 <ArrowRight size={17} />
              </RouteLink>
            </div>
          </Reveal>
        ))}
      </section>
      <ChapterBridge index="05" title="现在与下一步" en="Now and what comes next" href="/profile" navigate={navigate} />
    </div>
  )
}
