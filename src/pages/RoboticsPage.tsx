import { ArrowRight, Bot } from 'lucide-react'
import { roboticsTimeline } from '../data/portfolio'
import type { Navigate } from '../types/portfolio'
import ChapterBridge from '../components/ui/ChapterBridge'
import PageHeading from '../components/ui/PageHeading'
import Reveal from '../components/ui/Reveal'
import RouteLink from '../components/ui/RouteLink'
import SectionTitle from '../components/ui/SectionTitle'

export default function RoboticsPage({ navigate }: { navigate: Navigate }) {
  return (
    <div className="inner-page robotics-page">
      <PageHeading
        chapter="02"
        label="机器人经历 / Robotics"
        title="我的 VEX 机器人经历"
        en="My VEX robotics story"
        copy="我从初中开始参加 VEX，前后大约七年。做过结构搭建、调试与比赛，也承担过队员和队长的职责。"
        copyEn="I started VEX in junior high and spent about seven years building, testing and competing as both a team member and captain."
      />
      <section className="robotics-hero">
        <Reveal className="robot-visual">
          <img src="/assets/robot-74000m.webp" alt="Team 74000M VEX robot" />
          <div><Bot size={18} /><span>74000M / Robot build</span></div>
        </Reveal>
        <Reveal className="robot-summary" delay={0.08}>
          <div className="stat-grid">
            <article><strong>约 7 年</strong><span>VEX 经历 / Years in VEX</span></article>
            <article><strong>74000M</strong><span>队伍 / Team</span></article>
            <article><strong>队员与队长</strong><span>Member & Captain</span></article>
          </div>
          <p>机器人是我第一次真正经历完整工程循环的地方：理解任务、设计结构、搭建、测试、在赛场压力下修正，再与团队复盘。</p>
          <p className="en-copy">Robotics was where I first experienced a full engineering loop: understand, design, build, test, adapt under competition pressure and review with the team.</p>
          <RouteLink href="/awards" navigate={navigate} className="text-action">查看比赛证书 / Certificates <ArrowRight size={17} /></RouteLink>
        </Reveal>
      </section>
      <section className="timeline-section section-band">
        <SectionTitle eyebrow="时间线 / Timeline" title="从搭机器人，到现在写软件。" en="From building competition robots to making software." />
        <div className="timeline">
          {roboticsTimeline.map((item, index) => (
            <Reveal className="timeline-row" key={item.title} delay={index * 0.05}>
              <span>{item.year}</span>
              <div><h3>{item.title}</h3><p>{item.zh}</p><p className="en">{item.en}</p></div>
            </Reveal>
          ))}
        </div>
      </section>
      <ChapterBridge index="03" title="比赛留下的记录" en="Competition records" href="/awards" navigate={navigate} />
    </div>
  )
}
