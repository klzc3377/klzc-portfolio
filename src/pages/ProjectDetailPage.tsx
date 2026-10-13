import { ArrowLeft, ArrowRight } from 'lucide-react'
import { projects } from '../data/portfolio'
import type { Navigate, Project } from '../types/portfolio'
import ChapterBridge from '../components/ui/ChapterBridge'
import CineImage from '../components/ui/CineImage'
import CinematicHero from '../components/ui/CinematicHero'
import Reveal from '../components/ui/Reveal'
import RouteLink from '../components/ui/RouteLink'
import ScrollHighlight from '../components/ui/ScrollHighlight'
import SectionTitle from '../components/ui/SectionTitle'

export default function ProjectDetailPage({ project, navigate }: { project: Project; navigate: Navigate }) {
  const next = projects[(projects.indexOf(project) + 1) % projects.length]

  return (
    <div className="inner-page project-detail-page">
      <CinematicHero
        chapter="04"
        label={`${project.kind} / ${project.year}`}
        title={project.zh}
        en={project.title}
        copy={project.summaryZh}
        copyEn={project.summaryEn}
        image={project.image}
        imageAlt={project.imageAlt}
        meta={[{ label: 'Year', value: project.year }, { label: 'Type', value: project.kind }, { label: 'Stack', value: project.stack.slice(0, 2).join(' · ') }]}
      />

      <div className="page-section project-back-row">
        <RouteLink href="/projects" navigate={navigate} className="project-back"><ArrowLeft size={16} />全部项目 / All projects</RouteLink>
      </div>

      <section className="page-section statement">
        <p className="eyebrow">说明 / About</p>
        <ScrollHighlight text={project.whyZh} />
        <p className="statement__en">{project.whyEn}</p>
      </section>

      <section className="page-section case-overview" aria-label="项目概览 / Project overview">
        <Reveal className="case-overview__role">
          <p className="eyebrow">完成内容 / Work</p>
          <p>{project.roleZh}</p>
          <p className="en-copy">{project.roleEn}</p>
        </Reveal>
        <Reveal className="case-overview__stack" delay={0.08}>
          <p className="eyebrow">技术栈 / Stack</p>
          <ul>{project.stack.map((item) => <li key={item}>{item}</li>)}</ul>
        </Reveal>
        <div className="numerals case-overview__metrics">
          {project.metrics.map((metric) => (
            <article key={`${metric.value}-${metric.label}`}>
              <strong>{metric.value}</strong>
              <span>{metric.label}<small>{metric.labelEn}</small></span>
            </article>
          ))}
        </div>
      </section>

      <section className="page-section case-process">
        <SectionTitle eyebrow="过程 / Process" title="过程记录" en="Process notes" />
        <ol>
          {project.steps.map((item, index) => (
            <Reveal key={item.title} className="case-process__step" delay={index * 0.05}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.zh}</p>
                <p className="en-copy">{item.en}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="page-section case-gallery" aria-label="图集 / Gallery">
        {project.gallery.map((image, index) => (
          <CineImage key={image.src} className={`case-gallery__item case-gallery__item--${index + 1}`} src={image.src} alt={image.alt} direction={index === 1 ? 'left' : 'up'} />
        ))}
      </section>

      <section className="page-section case-result">
        <Reveal>
          <p className="eyebrow">备注 / Note</p>
          <h2>{project.interestingZh}</h2>
          <p className="en-copy">{project.interestingEn}</p>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="eyebrow">状态 / Status</p>
          <p>{project.statusZh}</p>
          <p className="en-copy">{project.statusEn}</p>
          <div className="case-actions">
            {project.links.map((link, index) => (
              <RouteLink key={link.href} href={link.href} navigate={navigate} className={index === 0 ? 'solid-action' : 'quiet-action'}>
                <span>{link.label}<small>{link.labelEn}</small></span><ArrowRight size={17} />
              </RouteLink>
            ))}
          </div>
        </Reveal>
      </section>

      <ChapterBridge
        index={String(projects.indexOf(next) + 1).padStart(2, '0')}
        kicker="下一个项目 / Next project"
        title={next.zh}
        en={next.title}
        href={`/projects/${next.slug}`}
        image={next.image}
        navigate={navigate}
      />
    </div>
  )
}
