import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const cacheDir = path.resolve(root, '.cad-work', 'osm-cache')
const outFile = path.resolve(root, 'src', 'osmParticleData.ts')
const worldSvgFile = path.resolve(root, 'public', 'assets', 'world.svg')

const TARGET_COUNT = 32000
const VIEW_WIDTH = 1280
const VIEW_HEIGHT = 820

const overpassEndpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
]

const cityConfigs = [
  {
    key: 'chengdu',
    label: 'Chengdu',
    labelZh: '成都',
    bbox: [30.58, 103.78, 30.84, 104.12],
    importantLabels: [
      ['Tianjiao Campus', '天骄校区', 103.91575, 30.75322],
      ['Qingshuihe Campus', '清水河校区', 103.90276, 30.75868],
      ['Chengdu', '成都', 104.0665, 30.5728],
    ],
  },
  {
    key: 'seoul',
    label: 'Seoul',
    labelZh: '首尔',
    bbox: [37.43, 126.76, 37.72, 127.18],
    importantLabels: [['Seoul', '首尔', 126.978, 37.5665]],
  },
  {
    key: 'chongqing',
    label: 'Chongqing',
    labelZh: '重庆',
    bbox: [29.38, 106.32, 29.78, 106.78],
    importantLabels: [['Chongqing', '重庆', 106.5516, 29.563]],
  },
  {
    key: 'xian',
    label: "Xi'an",
    labelZh: '西安',
    bbox: [34.18, 108.76, 34.46, 109.12],
    importantLabels: [["Xi'an", '西安', 108.9398, 34.3416]],
  },
  {
    key: 'qingdao',
    label: 'Qingdao',
    labelZh: '青岛',
    bbox: [35.95, 120.16, 36.22, 120.56],
    importantLabels: [['Qingdao', '青岛', 120.3826, 36.0671]],
  },
  {
    key: 'shanghai',
    label: 'Shanghai',
    labelZh: '上海',
    bbox: [31.15, 121.34, 31.30, 121.58],
    importantLabels: [['Shanghai', '上海', 121.4737, 31.2304]],
  },
  {
    key: 'auckland',
    label: 'Auckland',
    labelZh: '奥克兰',
    bbox: [-36.98, 174.58, -36.73, 174.92],
    importantLabels: [
      ['University of Auckland', '奥克兰大学', 174.7682, -36.8523],
      ['Auckland', '奥克兰', 174.7633, -36.8485],
    ],
  },
]

const roadKinds = {
  motorway: 2,
  motorway_link: 2,
  trunk: 2,
  trunk_link: 2,
  primary: 2,
  primary_link: 2,
  secondary: 1,
  secondary_link: 1,
  tertiary: 1,
  tertiary_link: 1,
  unclassified: 0,
  residential: 0,
  living_street: 0,
  service: 0,
}

const samplingStepByKind = {
  0: 5.5,
  1: 4,
  2: 2.8,
  3: 3.5,
  4: 3,
}

function queryFor([south, west, north, east]) {
  return `
[out:json][timeout:90][bbox:${south},${west},${north},${east}];
(
  way["highway"~"^(motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|residential|unclassified|living_street|service)$"];
  way["waterway"~"^(river|stream|canal)$"];
  way["natural"="water"];
  way["water"~"^(river|canal|lake|reservoir)$"];
  node["place"~"^(city|town|suburb|neighbourhood|quarter)$"]["name"];
  node["amenity"~"^(university|school)$"]["name"];
);
out geom 18000;
`
}

async function fetchOverpass(config) {
  await fs.mkdir(cacheDir, { recursive: true })
  const cacheFile = path.join(cacheDir, `${config.key}.json`)
  try {
    const cached = await fs.readFile(cacheFile, 'utf8')
    return JSON.parse(cached)
  } catch {
    // Continue to network fetch.
  }

  const body = new URLSearchParams({ data: queryFor(config.bbox) })
  let lastError = null

  for (const endpoint of overpassEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'user-agent': 'klzc-portfolio-road-particle-generator/1.0',
        },
        body,
      })
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }
      const json = await response.json()
      await fs.writeFile(cacheFile, JSON.stringify(json))
      return json
    } catch (error) {
      lastError = error
      console.warn(`[osm] ${config.key}: ${endpoint} failed: ${error.message}`)
    }
  }

  throw lastError ?? new Error(`Unable to fetch ${config.key}`)
}

function mercatorY(lat) {
  const rad = (lat * Math.PI) / 180
  return Math.log(Math.tan(Math.PI / 4 + rad / 2))
}

function makeProjector([south, west, north, east]) {
  const top = mercatorY(north)
  const bottom = mercatorY(south)
  const width = east - west
  const height = top - bottom

  return (lng, lat) => {
    const x = ((lng - west) / width) * VIEW_WIDTH
    const y = ((top - mercatorY(lat)) / height) * VIEW_HEIGHT
    return [x, y]
  }
}

function distance(a, b) {
  return Math.hypot(b[0] - a[0], b[1] - a[1])
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function classifyWay(tags = {}) {
  if (tags.waterway || tags.natural === 'water' || tags.water) return 3
  const highway = Array.isArray(tags.highway) ? tags.highway[0] : tags.highway
  return roadKinds[highway] ?? 0
}

function sampleLine(points, kind) {
  const step = samplingStepByKind[kind] ?? 7
  const sampled = []
  for (let index = 0; index < points.length - 1; index += 1) {
    const a = points[index]
    const b = points[index + 1]
    const length = distance(a, b)
    const count = Math.max(1, Math.floor(length / step))
    for (let sample = 0; sample < count; sample += 1) {
      const t = sample / count
      const x = a[0] + (b[0] - a[0]) * t
      const y = a[1] + (b[1] - a[1]) * t
      const brightness = kind === 2 ? 1 : kind === 1 ? 0.68 : kind === 3 ? 0.78 : 0.42
      sampled.push([
        Math.round(clamp(x, 0, VIEW_WIDTH)),
        Math.round(clamp(y, 0, VIEW_HEIGHT)),
        kind,
        Math.round(brightness * 100),
      ])
    }
  }
  return sampled
}

function dedupeParticles(particles) {
  const seen = new Set()
  const out = []
  for (const particle of particles) {
    const key = `${particle[0]}:${particle[1]}:${particle[2]}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(particle)
  }
  return out
}

function normalizeParticles(particles, targetCount) {
  const priority = (particle) => (particle[2] === 2 ? 0 : particle[2] === 4 ? 1 : particle[2] === 3 ? 2 : particle[2] === 1 ? 3 : 4)
  const sorted = [...particles].sort((a, b) => priority(a) - priority(b) || a[0] - b[0] || a[1] - b[1])

  if (sorted.length >= targetCount) {
    const stride = sorted.length / targetCount
    const out = []
    for (let index = 0; index < targetCount; index += 1) {
      out.push(sorted[Math.floor(index * stride)])
    }
    return out
  }

  const out = [...sorted]
  let cursor = 0
  while (out.length < targetCount && sorted.length > 0) {
    const source = sorted[cursor % sorted.length]
    const wave = out.length * 12.9898
    const dx = Math.round(Math.sin(wave) * 2)
    const dy = Math.round(Math.cos(wave * 0.7) * 2)
    out.push([
      clamp(source[0] + dx, 0, VIEW_WIDTH),
      clamp(source[1] + dy, 0, VIEW_HEIGHT),
      source[2],
      Math.max(24, source[3] - 8),
    ])
    cursor += 1
  }
  return out
}

async function buildWorldMap() {
  const svgText = await fs.readFile(worldSvgFile, 'utf8')
  const widthMatch = svgText.match(/\bwidth="([\d.]+)"/)
  const heightMatch = svgText.match(/\bheight="([\d.]+)"/)
  const geoMatch = svgText.match(/mapsvg:geoViewBox="([\d.\-\s]+)"/)
  const svgWidth = widthMatch ? Number(widthMatch[1]) : 1009.6727
  const svgHeight = heightMatch ? Number(heightMatch[1]) : 665.96301
  const geoViewBox = geoMatch ? geoMatch[1].trim().split(/\s+/).map(Number) : [-169.110266, 83.600842, 190.486279, -58.508473]
  const [west, north, east, south] = geoViewBox
  const fit = Math.min(VIEW_WIDTH / svgWidth, VIEW_HEIGHT / svgHeight)
  const offsetX = (VIEW_WIDTH - svgWidth * fit) / 2
  const offsetY = (VIEW_HEIGHT - svgHeight * fit) / 2
  const image = sharp(worldSvgFile, { density: 170 }).resize(VIEW_WIDTH, VIEW_HEIGHT, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const particles = []
  const edgeParticles = []

  for (let y = 0; y < info.height; y += 2) {
    for (let x = 0; x < info.width; x += 3) {
      const index = (y * info.width + x) * info.channels
      const alpha = data[index + 3]
      if (alpha < 18) continue

      const neighbors = [
        x > 0 ? data[(y * info.width + x - 1) * info.channels + 3] : 0,
        x < info.width - 1 ? data[(y * info.width + x + 1) * info.channels + 3] : 0,
        y > 0 ? data[((y - 1) * info.width + x) * info.channels + 3] : 0,
        y < info.height - 1 ? data[((y + 1) * info.width + x) * info.channels + 3] : 0,
      ]
      const edge = neighbors.some((value) => value < 18)
      const brightness = edge ? 94 : 54
      const particle = [x, y, 4, brightness]
      if (edge) edgeParticles.push(particle)
      else particles.push(particle)
    }
  }

  const routeCities = [
    ['Chengdu / 成都', 104.0665, 30.5728],
    ["Xi'an / 西安", 108.9398, 34.3416],
    ['Seoul / 首尔', 126.978, 37.5665],
    ['Shanghai / 上海', 121.4737, 31.2304],
    ['Qingdao / 青岛', 120.3826, 36.0671],
    ['Chongqing / 重庆', 106.5516, 29.563],
    ['Auckland / 奥克兰', 174.7633, -36.8485],
  ]

  const projectWorld = (lng, lat) => {
    const x = offsetX + ((lng - west) / (east - west)) * svgWidth * fit
    const y = offsetY + ((north - lat) / (north - south)) * svgHeight * fit
    return [Math.round(clamp(x, 0, VIEW_WIDTH)), Math.round(clamp(y, 0, VIEW_HEIGHT))]
  }

  for (let index = 0; index < routeCities.length - 1; index += 1) {
    const [, lngA, latA] = routeCities[index]
    const [, lngB, latB] = routeCities[index + 1]
    const a = projectWorld(lngA, latA)
    const b = projectWorld(lngB, latB)
    edgeParticles.push(...sampleLine([a, b], 2).map((particle) => [particle[0], particle[1], 4, 100]))
  }

  const labels = routeCities.map(([text, lng, lat]) => {
    const [x, y] = projectWorld(lng, lat)
    return [x, y, text, 4]
  })

  const normalized = normalizeParticles(dedupeParticles([...edgeParticles, ...particles]), TARGET_COUNT)

  return {
    key: 'world',
    label: 'World Route',
    labelZh: '世界路线',
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    bbox: [-90, -180, 90, 180],
    particles: normalized,
    labels,
    stats: {
      source: 'World country boundary SVG particle sampling',
      roadWays: routeCities.length - 1,
      waterWays: 0,
      particles: normalized.length,
    },
  }
}

function buildCity(config, data) {
  const project = makeProjector(config.bbox)
  const particles = []
  const labels = []
  let roadWays = 0
  let waterWays = 0

  for (const element of data.elements ?? []) {
    if (element.type === 'way' && Array.isArray(element.geometry) && element.geometry.length > 1) {
      const kind = classifyWay(element.tags)
      if (kind === 3) waterWays += 1
      else roadWays += 1
      const projected = element.geometry.map((point) => project(point.lon, point.lat))
      particles.push(...sampleLine(projected, kind))
    }

    if (element.type === 'node' && element.tags?.name && typeof element.lon === 'number' && typeof element.lat === 'number') {
      const rank = element.tags.place === 'city' ? 3 : element.tags.amenity ? 2 : 1
      const [x, y] = project(element.lon, element.lat)
      if (x >= 0 && x <= VIEW_WIDTH && y >= 0 && y <= VIEW_HEIGHT) {
        labels.push([Math.round(x), Math.round(y), element.tags.name, rank])
      }
    }
  }

  for (const [en, zh, lng, lat] of config.importantLabels) {
    const [x, y] = project(lng, lat)
    labels.push([Math.round(x), Math.round(y), `${en} / ${zh}`, 4])
  }

  const normalized = normalizeParticles(dedupeParticles(particles), TARGET_COUNT)
  const labelOut = labels
    .sort((a, b) => b[3] - a[3])
    .slice(0, 16)

  return {
    key: config.key,
    label: config.label,
    labelZh: config.labelZh,
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    bbox: config.bbox,
    particles: normalized,
    labels: labelOut,
    stats: {
      source: 'OpenStreetMap via Overpass API',
      roadWays,
      waterWays,
      particles: normalized.length,
    },
  }
}

const maps = {}
const stats = []

console.log('[osm] building world particle map')
const worldMap = await buildWorldMap()
maps.world = worldMap
stats.push(`world: boundary + route particles, ${worldMap.particles.length} particles`)

for (const config of cityConfigs) {
  console.log(`[osm] fetching ${config.key}`)
  const data = await fetchOverpass(config)
  const city = buildCity(config, data)
  maps[config.key] = city
  stats.push(`${config.key}: ${city.stats.roadWays} road ways, ${city.stats.waterWays} water ways, ${city.particles.length} particles`)
}

const keys = ['world', ...cityConfigs.map((config) => config.key)]
const body = `// Generated by scripts/generate-osm-road-particles.mjs
// Data source: OpenStreetMap via Overpass API. Do not hand-edit.

export type OsmParticleMapKey = ${keys.map((key) => `'${key}'`).join(' | ')}

export type OsmParticle = readonly [number, number, number, number]
export type OsmMapLabel = readonly [number, number, string, number]

export type OsmParticleMap = {
  readonly key: OsmParticleMapKey
  readonly label: string
  readonly labelZh: string
  readonly width: number
  readonly height: number
  readonly bbox: readonly [number, number, number, number]
  readonly particles: readonly OsmParticle[]
  readonly labels: readonly OsmMapLabel[]
  readonly stats: {
    readonly source: string
    readonly roadWays: number
    readonly waterWays: number
    readonly particles: number
  }
}

export const OSM_PARTICLE_MAPS: Record<OsmParticleMapKey, OsmParticleMap> = ${JSON.stringify(maps)}
`

await fs.writeFile(outFile, body)
console.log(`[osm] wrote ${outFile}`)
console.log(stats.join('\n'))
