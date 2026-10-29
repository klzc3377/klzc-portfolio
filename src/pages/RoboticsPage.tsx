import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRef } from 'react'
import { roboticsTimeline } from '../data/portfolio'
import type { Navigate } from '../types/portfolio'
import ChapterBridge from '../components/ui/ChapterBridge'
import CineImage from '../components/ui/CineImage'
import CinematicHero from '../components/ui/CinematicHero'
import Reveal from '../components/ui/Reveal'
import RouteLink from '../components/ui/RouteLink'
import ScrollHighlight from '../components/ui/ScrollHighlight'
import SectionTitle from '../components/ui/SectionTitle'

const stills = [
  { src: '/assets/vex-asia-pacific.webp', alt: '2022 VEX Asia-Pacific Robotics Championship team photo in Qingdao', caption: '2022 · 青岛 · 第十五届 VEX 亚洲锦标赛', className: 'still--wide' },
  { src: '/assets/robotics-klzc.webp', alt: 'Cheng Zhang at a VEX robotics competition', caption: '赛场 / On the field', className: 'still--tall' },
  { src: '/assets/teamwork-trophy.webp', alt: '2022–2023 China–Canada VEX Teamwork Champion trophy', caption: '2022–2023 · 团队协作冠军奖杯', className: 'still--tall' },
]

function Timeline() {
  const ref = useRef<HTMLDivElement | null>(null)
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 55%'] })
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })

  return (
    <div ref={ref} className="timeline">
      <span className="timeline__line" aria-hidden="true"><motion.i style={{ scaleY: reducedMotion ? 1 : fill }} /></span>
      {roboticsTimeline.map((item, index) => (
        <Reveal className="timeline-row" key={item.title} delay={index * 0.04}>
          <span className="timeline-row__index">{String(index + 1).padStart(2, '0')}</span>
          <span className="timeline-row__year">{item.year}</span>
          <div>
            <h3>{item.title}</h3>
            <p>{item.zh}</p>
            <p className="en-copy">{item.en}</p>
          </div>
        </Reveal>
      ))}
    </div>
  )
}

export default function RoboticsPage({ navigate }: { navigate: Navigate }) {
  return (
    <div className="inner-page robotics-page">
      <CinematicHero
        chapter="02"
        label="机器人经历 / Robotics"
        title="VEX 机器人"
        en="VEX Robotics"
        copy="从初中开始参加 VEX，前后约七年。做过 VEX IQ 和 V5RC，也担任过 74000M 队员与队长。"
        copyEn="About seven years in VEX, from VEX IQ to V5RC, including as a member and captain of 74000M."
        image="/assets/robot-build.webp"
        imageHd="/assets/hd/robot-build.webp"
        imageAlt="Team 74000M VEX robot in raking sunlight"
        position="50% 42%"
        meta={[{ label: 'Team', value: '74000M' }, { label: 'Years', value: '≈ 7' }, { label: 'Role', value: 'Member · Captain' }]}
      />

      <section className="page-section statement">
        <p className="eyebrow">序 / Prologue</p>
        <ScrollHighlight text="这里保留了 74000M 的装配模型、比赛照片和证书，按年份和地点整理在一起。" />
        <p className="statement__en">The 74000M assembly model, competition photos and certificates are kept here.</p>
      </section>

      <section className="page-section robot-feature">
        <CineImage className="robot-feature__image" src="/assets/robot-74000m.webp" alt="Team 74000M VEX robot" caption="74000M / Robot build" parallax={6} />
        <div className="robot-feature__copy">
          <div className="numerals">
            <article><strong>≈7</strong><span>年 VEX 经历<small>Years in VEX</small></span></article>
            <article><strong>74000M</strong><span>队伍编号<small>Team</small></span></article>
            <article><strong>IQ→V5</strong><span>从 VEX IQ 到 V5RC<small>Divisions</small></span></article>
          </div>
          <p>担任过 74000M 的队员与队长，参加过中国国内赛事和国际赛事。</p>
          <p className="en-copy">Member and captain of 74000M, competing at national and international events.</p>
          <RouteLink href="/awards" navigate={navigate} className="text-action" cursor="证书 Awards">查看比赛证书 / Certificates <ArrowRight size={17} /></RouteLink>
        </div>
      </section>

      <section className="page-section contact-sheet" aria-label="比赛照片 / Competition stills">
        {stills.map((still, index) => (
          <CineImage
            key={still.src}
            className={`still ${still.className}`}
            src={still.src}
            alt={still.alt}
            direction={index % 2 ? 'left' : 'up'}
            caption={<><span>{String(index + 1).padStart(2, '0')}</span>{still.caption}</>}
          />
        ))}
      </section>

      <section className="page-section timeline-section">
        <SectionTitle eyebrow="时间线 / Timeline" title="约七年的记录。" en="About seven years." />
        <Timeline />
      </section>

      <ChapterBridge index="03" title="比赛留下的记录" en="Competition records" href="/awards" navigate={navigate} />
    </div>
  )
}
