import fs from 'node:fs/promises'
import path from 'node:path'

const outFile = path.resolve(process.cwd(), 'src', 'particleMapData.ts')

const configs = [
  ['world', 5800, { cx: 0.52, cy: 0.5, rings: 5, rivers: 4, rotation: -0.05 }],
  ['chengdu', 7200, { cx: 0.5, cy: 0.5, rings: 7, rivers: 3, rotation: 0.08 }],
  ['chongqing', 7200, { cx: 0.48, cy: 0.52, rings: 5, rivers: 7, rotation: -0.28 }],
  ['qingdao', 7200, { cx: 0.54, cy: 0.48, rings: 4, rivers: 5, rotation: 0.24 }],
  ['shanghai', 7200, { cx: 0.52, cy: 0.5, rings: 8, rivers: 4, rotation: 0.02 }],
  ['auckland', 7200, { cx: 0.48, cy: 0.52, rings: 4, rivers: 8, rotation: -0.18 }],
  ['seoul', 7200, { cx: 0.5, cy: 0.5, rings: 7, rivers: 5, rotation: 0.16 }],
  ['xian', 7200, { cx: 0.5, cy: 0.5, rings: 6, rivers: 2, rotation: -0.02, grid: true }],
]

function seededRandom(seed) {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 0xffffffff
  }
}

function hashKey(key) {
  return [...key].reduce((sum, char) => ((sum << 5) - sum + char.charCodeAt(0)) >>> 0, 2166136261)
}

function rotate(x, y, angle, cx = 0.5, cy = 0.5) {
  const dx = x - cx
  const dy = y - cy
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos]
}

function clampPoint(x, y, warmth) {
  return [
    Number(Math.min(0.98, Math.max(0.02, x)).toFixed(4)),
    Number(Math.min(0.98, Math.max(0.02, y)).toFixed(4)),
    Number(Math.min(1, Math.max(0, warmth)).toFixed(3)),
  ]
}

function addRoad(points, random, config, x1, y1, x2, y2, samples, warmth = 0.35, jitter = 0.006) {
  const bend = (random() - 0.5) * 0.24
  for (let index = 0; index < samples; index += 1) {
    const t = index / Math.max(1, samples - 1)
    const wave = Math.sin(t * Math.PI) * bend
    const x = x1 + (x2 - x1) * t + wave * (y2 - y1)
    const y = y1 + (y2 - y1) * t - wave * (x2 - x1)
    const [rx, ry] = rotate(
      x + (random() - 0.5) * jitter,
      y + (random() - 0.5) * jitter,
      config.rotation,
    )
    points.push(clampPoint(rx, ry, warmth + random() * 0.18))
  }
}

function addRing(points, random, config, radiusX, radiusY, samples, warmth = 0.48) {
  for (let index = 0; index < samples; index += 1) {
    const t = (index / samples) * Math.PI * 2
    const pulse = 1 + Math.sin(t * 3 + random() * 2) * 0.05
    const x = config.cx + Math.cos(t) * radiusX * pulse + (random() - 0.5) * 0.008
    const y = config.cy + Math.sin(t) * radiusY * pulse + (random() - 0.5) * 0.008
    const [rx, ry] = rotate(x, y, config.rotation)
    points.push(clampPoint(rx, ry, warmth + random() * 0.12))
  }
}

function addRiver(points, random, config, samples) {
  const startY = 0.18 + random() * 0.64
  const amp = 0.04 + random() * 0.07
  const phase = random() * Math.PI * 2
  const vertical = random() > 0.52
  for (let index = 0; index < samples; index += 1) {
    const t = index / Math.max(1, samples - 1)
    const wave = Math.sin(t * Math.PI * (1.4 + random() * 1.5) + phase) * amp
    const x = vertical ? startY + wave : 0.04 + t * 0.92
    const y = vertical ? 0.04 + t * 0.92 : startY + wave
    const [rx, ry] = rotate(x, y, config.rotation)
    points.push(clampPoint(rx, ry, 0.08 + random() * 0.2))
  }
}

function addCloud(points, random, config, count) {
  for (let index = 0; index < count; index += 1) {
    const angle = random() * Math.PI * 2
    const radius = Math.pow(random(), 0.55)
    const x = config.cx + Math.cos(angle) * radius * (0.42 + random() * 0.1)
    const y = config.cy + Math.sin(angle) * radius * (0.3 + random() * 0.14)
    const [rx, ry] = rotate(x, y, config.rotation)
    points.push(clampPoint(rx, ry, 0.18 + random() * 0.28))
  }
}

function generateCity(key, count, config) {
  const random = seededRandom(hashKey(key))
  const points = []

  for (let ring = 0; ring < config.rings; ring += 1) {
    addRing(points, random, config, 0.08 + ring * 0.045, 0.055 + ring * 0.035, Math.floor(count / 28), 0.42)
  }

  const roads = config.grid ? 34 : 42
  for (let road = 0; road < roads; road += 1) {
    const horizontal = config.grid ? road % 2 === 0 : random() > 0.45
    const offset = 0.1 + random() * 0.8
    if (horizontal) {
      addRoad(points, random, config, 0.05, offset, 0.95, offset + (random() - 0.5) * 0.12, Math.floor(count / 38), 0.36)
    } else {
      addRoad(points, random, config, offset, 0.05, offset + (random() - 0.5) * 0.12, 0.95, Math.floor(count / 38), 0.36)
    }
  }

  for (let river = 0; river < config.rivers; river += 1) {
    addRiver(points, random, config, Math.floor(count / 34))
  }

  addCloud(points, random, config, Math.max(0, count - points.length))
  return points.slice(0, count)
}

const maps = Object.fromEntries(configs.map(([key, count, config]) => [key, generateCity(key, count, config)]))

const body = `export type ParticleMapKey = ${Object.keys(maps).map((key) => `'${key}'`).join(' | ')}

export type ParticleMapPoint = readonly [number, number, number]

export const PARTICLE_MAPS: Record<ParticleMapKey, readonly ParticleMapPoint[]> = ${JSON.stringify(maps)}
`

await fs.writeFile(outFile, body)
console.log(`wrote ${outFile}`)
