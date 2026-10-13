import SplitText from './SplitText'

export default function SectionTitle({ eyebrow, title, en }: { eyebrow: string; title: string; en?: string }) {
  return (
    <div className="section-title">
      <p className="eyebrow">{eyebrow}</p>
      <SplitText as="h2" text={title} stagger={0.04} />
      {en ? <p className="section-subtitle">{en}</p> : null}
    </div>
  )
}
