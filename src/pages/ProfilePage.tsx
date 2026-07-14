import { ArrowRight, Bot, MapPin, University } from 'lucide-react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useRef, type CSSProperties } from 'react'
import { directions } from '../data/portfolio'
import type { Navigate } from '../types/portfolio'
import ChapterBridge from '../components/ui/ChapterBridge'
import PageHeading from '../components/ui/PageHeading'
import Reveal from '../components/ui/Reveal'
import RouteLink from '../components/ui/RouteLink'
import SectionTitle from '../components/ui/SectionTitle'

function ScanPortrait() {
  const ref = useRef<HTMLDivElement | null>(null)
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 88%', 'end 20%'] })
  const progress = useSpring(scrollYProgress, { stiffness: 130, damping: 30, mass: 0.28 })
  const scanY = useTransform(progress, [0, 1], ['8%', '92%'])
  const revealOpacity = useTransform(progress, [0, 0.18, 0.86, 1], [0.16, 1, 1, 0.72])

  return (
    <motion.div
      ref={ref}
      className="scan-portrait"
      style={
        reducedMotion
          ? ({ '--scan-y': '55%', '--scan-opacity': 0.85 } as CSSProperties)
          : ({ '--scan-y': scanY, '--scan-opacity': revealOpacity } as CSSProperties)
      }
    >
      <img className="scan-base" src="/assets/about-vector-klzc-clean.webp" alt="Illustrated portrait of Cheng Zhang" />
      <img className="scan-reveal" src="/assets/about-vector-klzc-clean.webp" alt="" aria-hidden="true" />
      <div className="scan-line" aria-hidden="true" />
      <div className="scan-label"><strong>KLZC / PROFILE</strong><span>SCROLL TO SCAN</span></div>
      <div className="scan-meta" aria-hidden="true"><span>UOA CS</span><span>74000M</span></div>
    </motion.div>
  )
}

export default function ProfilePage({ navigate }: { navigate: Navigate }) {
  return (
    <div className="inner-page profile-page">
      <PageHeading
        chapter="05"
        label="Profile / 个人简介"
        title="计算机科学、机器人与软件"
        en="Computer Science, robotics and software"
        copy="我是张骋，目前在奥克兰大学读计算机科学本科。我喜欢把复杂问题拆开，再通过设计、代码与反复测试把它做成真实可用的东西。"
        copyEn="I’m Cheng Zhang, a Computer Science undergraduate at the University of Auckland. I like breaking complex problems down and turning them into real, usable things through design, code and repeated testing."
      />

      <section className="profile-proof-strip" aria-label="Profile highlights">
        <article><strong>≈7 years</strong><span>VEX robotics experience / 机器人经历</span></article>
        <article><strong>74000M</strong><span>member and captain / 队员与队长</span></article>
        <article><strong>UoA CS</strong><span>Computer Science undergraduate / 本科在读</span></article>
      </section>

      <section className="profile-layout">
        <ScanPortrait />
        <Reveal className="profile-detail">
          <p>以前做 VEX 机器人时，我习惯先理解任务、动手搭建、持续测试，再和队友一起调整。现在写软件，我仍然沿用同样的工程方法。</p>
          <p className="en-copy">VEX taught me to understand the task, build, test and adjust with a team. I still use the same engineering rhythm when I make software.</p>
          <div className="profile-facts">
            <span><University size={17} /> University of Auckland</span>
            <span><MapPin size={17} /> Auckland, New Zealand</span>
            <span><Bot size={17} /> Robotics · Software · AI tools</span>
          </div>
          <div className="profile-links">
            <RouteLink href="/projects" navigate={navigate} className="solid-action">Selected work / 项目 <ArrowRight size={17} /></RouteLink>
            <a href="mailto:masterzc624@gmail.com" className="quiet-action">Email me</a>
          </div>
        </Reveal>
      </section>

      <section className="profile-directions section-band">
        <SectionTitle eyebrow="Focus / 方向" title="我现在主要在做这些。" en="What I’m focusing on now." />
        <div className="direction-grid">
          {directions.map((direction) => {
            const Icon = direction.icon
            return (
              <article className="direction-card" key={direction.title}>
                <Icon size={22} />
                <h3>{direction.title}</h3>
                <strong>{direction.zh}</strong>
                <p>{direction.copy}</p>
                <p className="en-copy">{direction.en}</p>
              </article>
            )
          })}
        </div>
      </section>

      <Reveal className="profile-availability" >
        <div>
          <p className="eyebrow">Build next / 下一步</p>
          <h2>继续做能被真实使用、也经得起解释的项目。</h2>
          <p>我愿意交流软件、机器人、AI 工具和有挑战的交互项目。</p>
          <p className="en-copy">I’m always happy to talk about software, robotics, AI tools and ambitious interactive projects.</p>
        </div>
        <a href="mailto:masterzc624@gmail.com" className="solid-action">Start a conversation <ArrowRight size={17} /></a>
      </Reveal>

      <ChapterBridge
        index="→"
        kicker="Epilogue / 尾声"
        title="回到完整的成长路径"
        en="Return to the complete journey"
        href="/"
        navigate={navigate}
      />
    </div>
  )
}
