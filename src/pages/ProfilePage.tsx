import { ArrowRight, ArrowUpRight, Bot, MapPin, University } from 'lucide-react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useRef, type CSSProperties } from 'react'
import { directions } from '../data/portfolio'
import type { Navigate } from '../types/portfolio'
import ChapterBridge from '../components/ui/ChapterBridge'
import CinematicHero from '../components/ui/CinematicHero'
import Reveal from '../components/ui/Reveal'
import RouteLink from '../components/ui/RouteLink'
import ScrollHighlight from '../components/ui/ScrollHighlight'
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
      <div className="scan-label" aria-hidden="true"><strong>KLZC / PROFILE</strong><span>SCROLL TO SCAN</span></div>
      <div className="scan-meta" aria-hidden="true"><span>UOA CS</span><span>74000M</span></div>
    </motion.div>
  )
}

function ContactMarquee() {
  const line = 'masterzc624@gmail.com  ✦  联系我  ✦  Get in touch  ✦  '
  return (
    <a className="contact-marquee" href="mailto:masterzc624@gmail.com" data-cursor="写信 Email">
      <span className="sr-only">给我写信 / Email masterzc624@gmail.com</span>
      <span className="contact-marquee__track" aria-hidden="true">
        <span>{line.repeat(3)}</span>
        <span>{line.repeat(3)}</span>
      </span>
    </a>
  )
}

export default function ProfilePage({ navigate }: { navigate: Navigate }) {
  return (
    <div className="inner-page profile-page">
      <CinematicHero
        chapter="05"
        label="个人简介 / Profile"
        title="张骋"
        en="Cheng Zhang"
        copy="目前在奥克兰大学读计算机科学。"
        copyEn="Computer Science undergraduate at the University of Auckland."
        image="/assets/uoa-campus.webp"
        imageHd="/assets/hd/uoa-campus.webp"
        imageAlt="University of Auckland campus"
        position="60% 40%"
        meta={[{ label: 'Based', value: 'Auckland, NZ' }, { label: 'Study', value: 'UoA · Computer Science' }, { label: 'Alias', value: 'KLzc' }]}
      />

      <section className="page-section statement">
        <p className="eyebrow">现在 / Now</p>
        <ScrollHighlight text="以前参加 VEX，现在主要学习计算机科学，也做一些自己的项目。关注算法、机器人和软件开发。" />
        <p className="statement__en">Previously in VEX; now studying Computer Science and working on personal projects.</p>
      </section>

      <section className="page-section numerals numerals--band" aria-label="个人经历摘要 / Profile highlights">
        <article><strong>≈7</strong><span>年机器人经历<small>Years of VEX robotics</small></span></article>
        <article><strong>74000M</strong><span>队员与队长<small>Member and captain</small></span></article>
        <article><strong>UoA</strong><span>计算机科学本科在读<small>Computer Science undergraduate</small></span></article>
      </section>

      <section className="page-section profile-layout">
        <ScanPortrait />
        <Reveal className="profile-detail">
          <p className="eyebrow">档案 / File</p>
          <h2>奥克兰大学计算机科学本科生。</h2>
          <p>进入本科之前，完成了奥克兰大学预科课程。长期目标是成为一名优秀的软件工程师或计算机科学研究者。</p>
          <p className="en-copy">Completed the University of Auckland foundation programme before starting the degree. Working towards software engineering or computer science research.</p>
          <ul className="profile-facts">
            <li><University size={16} /> University of Auckland</li>
            <li><MapPin size={16} /> Auckland, New Zealand</li>
            <li><Bot size={16} /> Algorithms · Robotics · Software</li>
          </ul>
          <div className="profile-links">
            <RouteLink href="/projects" navigate={navigate} className="solid-action">项目 / Projects <ArrowRight size={17} /></RouteLink>
            <a href="mailto:masterzc624@gmail.com" className="quiet-action">给我写信 / Email me <ArrowUpRight size={16} /></a>
          </div>
        </Reveal>
      </section>

      <section className="page-section profile-directions">
        <SectionTitle eyebrow="方向 / Focus" title="目前在做的事。" en="What I am doing now." />
        <div className="direction-grid">
          {directions.map((direction, index) => {
            const Icon = direction.icon
            return (
              <Reveal className="direction-card" key={direction.title} delay={index * 0.08}>
                <span className="direction-card__index">{String(index + 1).padStart(2, '0')}</span>
                <Icon size={20} aria-hidden="true" />
                <h3>{direction.zh}</h3>
                <strong>{direction.title}</strong>
                <p>{direction.copy}</p>
                <p className="en-copy">{direction.en}</p>
              </Reveal>
            )
          })}
        </div>
      </section>

      <section className="profile-contact" aria-label="联系 / Contact">
        <Reveal className="profile-contact__copy">
          <p className="eyebrow">目前 / Now</p>
          <h2>现在在奥克兰。</h2>
          <p>继续上课，也继续做自己的东西。欢迎来信。</p>
          <p className="en-copy">Studying and working on personal projects in Auckland. Feel free to write.</p>
        </Reveal>
        <ContactMarquee />
      </section>

      <ChapterBridge
        index="↺"
        kicker="结束 / End of reel"
        title="回到开头"
        en="Back to the beginning"
        href="/"
        navigate={navigate}
        actionZh="回到首页"
        actionEn="Back home"
        image="/assets/cinematic-tunnel-environment.webp"
      />
    </div>
  )
}
