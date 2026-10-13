import { lazy, Suspense } from 'react'
import type { Navigate } from '../types/portfolio'

const MechanicalMemoryExperience = lazy(() => import('../MechanicalMemoryExperience'))

export default function HomePage({ navigate }: { navigate: Navigate }) {
  return (
    <div className="home-page">
      <Suspense fallback={<div className="memory-tunnel-route-fallback" data-route-pending role="status" aria-label="正在载入空间档案 / Loading spatial archive">正在载入空间档案 / Loading spatial archive</div>}>
        <MechanicalMemoryExperience navigate={navigate} />
      </Suspense>
    </div>
  )
}
