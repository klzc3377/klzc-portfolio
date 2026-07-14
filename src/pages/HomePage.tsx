import { lazy, Suspense } from 'react'
import type { Navigate } from '../types/portfolio'

const MechanicalMemoryExperience = lazy(() => import('../MechanicalMemoryExperience'))

export default function HomePage({ navigate }: { navigate: Navigate }) {
  return (
    <div className="home-page">
      <Suspense fallback={<div className="memory-tunnel-route-fallback" role="status" aria-label="Loading spatial archive" />}>
        <MechanicalMemoryExperience navigate={navigate} />
      </Suspense>
    </div>
  )
}
