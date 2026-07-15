import { motion } from 'framer-motion'
import { awards } from '../data/portfolio'
import type { Award, Navigate } from '../types/portfolio'
import ChapterBridge from '../components/ui/ChapterBridge'
import PageHeading from '../components/ui/PageHeading'

export default function AwardsPage({ onOpenAward, navigate }: { onOpenAward: (award: Award) => void; navigate: Navigate }) {
  return (
    <div className="inner-page awards-page">
      <PageHeading
        chapter="03"
        label="比赛记录 / Awards"
        title="机器人比赛证书"
        en="Robotics competition certificates"
        copy="这里收录了我参加 VEX 时留下的部分证书。每张都保留赛事、组别、年份和奖项信息，点击可以查看大图。"
        copyEn="A selection of certificates from my years in VEX, kept with their event, division, year and award context. Open any one for the full record."
      />
      <section className="awards-grid" aria-label="比赛证书 / Award certificates">
        {awards.map((award, index) => (
          <motion.button
            className="certificate-card"
            type="button"
            key={award.image}
            onClick={() => onOpenAward(award)}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.38, delay: index * 0.025 }}
          >
            <img src={award.image} alt={award.zh} loading={index > 2 ? 'lazy' : undefined} />
            <div><span>{award.year}</span><strong>{award.zh}</strong><p>{award.title}</p></div>
          </motion.button>
        ))}
      </section>
      <ChapterBridge index="04" title="从机器人走向软件" en="From robots to software" href="/projects" navigate={navigate} />
    </div>
  )
}
