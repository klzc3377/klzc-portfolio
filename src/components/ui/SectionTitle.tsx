export default function SectionTitle({ eyebrow, title, en }: { eyebrow: string; title: string; en?: string }) {
  return (
    <div className="section-title">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {en ? <p className="section-subtitle">{en}</p> : null}
    </div>
  )
}
