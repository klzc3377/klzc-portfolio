import { ArrowRight } from 'lucide-react'
import type { Navigate, Project } from '../types/portfolio'
import ChapterBridge from '../components/ui/ChapterBridge'
import PageHeading from '../components/ui/PageHeading'
import RouteLink from '../components/ui/RouteLink'
import SectionTitle from '../components/ui/SectionTitle'

export default function ProjectDetailPage({ project, navigate }: { project: Project; navigate: Navigate }) {
  return (
    <div className="inner-page project-detail-page">
      <RouteLink href="/projects" navigate={navigate} className="project-back"><ArrowRight size={16} />返回项目 / Projects</RouteLink>
      <PageHeading
        chapter="04"
        label={`${project.kind} / ${project.year}`}
        title={project.zh}
        en={project.title}
        copy={project.summaryZh}
        copyEn={project.summaryEn}
      />

      <section className="case-hero">
        <img src={project.image} alt={project.imageAlt} />
        <div>
          <p className="eyebrow">为什么做 / Why I made it</p>
          <p>{project.whyZh}</p>
          <p className="en-copy">{project.whyEn}</p>
        </div>
      </section>

      <section className="case-overview section-band" aria-label="项目概览 / Project overview">
        <div className="case-role">
          <p className="eyebrow">我的角色 / My role</p>
          <p>{project.roleZh}</p>
          <p className="en-copy">{project.roleEn}</p>
        </div>
        <div className="case-stack">
          <p className="eyebrow">技术栈 / Stack</p>
          <ul>{project.stack.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className="case-metrics">
          {project.metrics.map((metric) => (
            <article key={`${metric.value}-${metric.label}`}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
              <small>{metric.labelEn}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="case-process section-band">
        <SectionTitle eyebrow="实现过程 / Process" title="我是怎么把它做出来的。" en="How I put it together." />
        <div>
          {project.steps.map((item, index) => (
            <article key={item.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.zh}</p>
                <p className="en-copy">{item.en}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="case-gallery section-band">
        {project.gallery.map((image) => <img key={image.src} src={image.src} alt={image.alt} loading="lazy" />)}
      </section>

      <section className="case-result section-band">
        <div>
          <p className="eyebrow">关键取舍 / Key decision</p>
          <h2>{project.interestingZh}</h2>
          <p className="en-copy">{project.interestingEn}</p>
        </div>
        <div>
          <p className="eyebrow">现在 / Where it is now</p>
          <p>{project.statusZh}</p>
          <p className="en-copy">{project.statusEn}</p>
          <div className="case-actions">
            {project.links.map((link, index) => (
              <RouteLink key={link.href} href={link.href} navigate={navigate} className={index === 0 ? 'solid-action' : 'quiet-action'}>
                <span>{link.label}<small>{link.labelEn}</small></span><ArrowRight size={17} />
              </RouteLink>
            ))}
          </div>
        </div>
      </section>

      <ChapterBridge index="05" title="现在与下一步" en="Now and what comes next" href="/profile" navigate={navigate} />
    </div>
  )
}
