import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { ArrowRight, Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { ARENA_URL, dressArena } from './scene/arena'
import { configureRobotAssembly, applyAssembly, type AnimatedPart } from './scene/robotAssembly'
import './MechanicalMemoryExperience.css'

type SceneStatus = 'loading' | 'ready' | 'error'

type MemoryEntry = {
  t: number
  year: string
  place: string
  placeZh: string
  chapter: string
  title: string
  titleZh: string
  description: string
  image: string
  result: string
  resultZh: string
  team: string
  date: string
  destination: string
}

type CardVisual = {
  group: THREE.Group
  baseQuaternion: THREE.Quaternion
  materials: Array<{ material: THREE.Material & { opacity: number }, opacity: number }>
  accentMaterial: THREE.MeshStandardMaterial
  baseEmissiveIntensity: number
  destination: string
  photoMaterial: THREE.ShaderMaterial
  t: number
}

const ROBOT_URL = '/models/robot-74000m-assembly.glb'
const DESKTOP_TARGET_FRAME_RATE = 60
const DESKTOP_PIXEL_RATIO_CAP = 1.5
const DESKTOP_MSAA_SAMPLES = 2

const CINEMATIC_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uGrain: { value: 0.006 },
    uAberration: { value: 0.00024 },
    uVignette: { value: 0.34 },
    uStreak: { value: 0.16 },
    uTexel: { value: new THREE.Vector2(1 / 1920, 1 / 1080) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uProgress;
    uniform float uGrain;
    uniform float uAberration;
    uniform float uVignette;
    uniform float uStreak;
    uniform vec2 uTexel;
    varying vec2 vUv;

    float random(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime * 13.17) * 43758.5453);
    }

    vec3 highlights(vec2 uv) {
      vec3 c = texture2D(tDiffuse, uv).rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      return c * smoothstep(0.85, 2.4, l);
    }

    void main() {
      vec2 fromCenter = vUv - 0.5;
      float edge = dot(fromCenter, fromCenter);
      vec2 offset = fromCenter * edge * uAberration * 9.0;
      vec3 color;
      color.r = texture2D(tDiffuse, vUv + offset).r;
      color.g = texture2D(tDiffuse, vUv).g;
      color.b = texture2D(tDiffuse, vUv - offset).b;

      // Anamorphic flare: a thin horizontal smear of only the hottest pixels,
      // the signature of a 2x squeeze lens. Taps spread geometrically so eight
      // per side reach ~22% of the frame width.
      if (uStreak > 0.0) {
        vec3 streak = vec3(0.0);
        float spread = uTexel.x * 6.0;
        float weightSum = 0.0;
        for (int i = 1; i <= 8; i++) {
          float fi = float(i);
          float dist = spread * fi * fi;
          float w = exp(-fi * 0.42);
          streak += (highlights(vUv + vec2(dist, 0.0)) + highlights(vUv - vec2(dist, 0.0))) * w;
          weightSum += 2.0 * w;
        }
        streak /= weightSum;
        float streakLum = dot(streak, vec3(0.333));
        color += mix(vec3(streakLum), vec3(0.42, 0.72, 0.86) * streakLum * 1.6, 0.7) * uStreak * 2.2;
      }

      float vignette = 1.0 - smoothstep(0.12, 0.6, edge) * uVignette;
      color *= vignette;
      float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
      // Print-film grade: pull saturation back a touch, then split-tone teal
      // shadows against warm highlights instead of painting coloured blobs.
      color = mix(vec3(luminance), color, 0.86);
      float highlightMix = smoothstep(0.05, 0.9, luminance);
      color *= mix(vec3(0.88, 0.99, 1.05), vec3(1.07, 1.0, 0.9), highlightMix);
      // One soft key pool from frame right (warm) and a cooler fill from the
      // left keep the void from going flat black without stealing the subject.
      float phase = uProgress * 6.2831853;
      vec3 warm = mix(vec3(0.62, 0.3, 0.12), vec3(0.58, 0.4, 0.2), 0.5 + 0.5 * sin(phase * 0.8 + 1.4));
      vec3 cool = vec3(0.1, 0.34, 0.4);
      vec2 leftVector = (vUv - vec2(0.06, 0.7)) / vec2(0.55, 0.7);
      vec2 rightVector = (vUv - vec2(0.94, 0.36)) / vec2(0.5, 0.62);
      float leftPool = exp(-dot(leftVector, leftVector) * 2.4);
      float rightPool = exp(-dot(rightVector, rightVector) * 2.6);
      float shadowRoom = 1.0 - smoothstep(0.06, 0.6, luminance);
      color += (cool * leftPool * 0.07 + warm * rightPool * 0.06) * shadowRoom;
      color += vec3(0.004, 0.008, 0.01) * shadowRoom;
      float grain = (random(vUv * vec2(1920.0, 1080.0)) - 0.5) * uGrain * (0.55 + luminance * 0.45);
      color += grain;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
}

const MEMORY_ENTRIES: MemoryEntry[] = [
  {
    t: 0.08,
    year: '2019',
    place: 'SEOUL',
    placeZh: '韩国首尔',
    chapter: 'MATCH / 01',
    title: 'First competition abroad',
    titleZh: '第一次去国外参加机器人比赛',
    description: '2019 年，我第一次前往国外参加 VEX 比赛，并在首尔获得 VEX IQ 初中组铜奖。',
    image: '/assets/award-7.webp',
    result: 'VEX IQ BRONZE',
    resultZh: '亚太锦标赛铜奖',
    team: '76000P / VEX IQ',
    date: 'DEC 2019',
    destination: '/awards',
  },
  {
    t: 0.23,
    year: '2020',
    place: 'CHONGQING',
    placeZh: '重庆',
    chapter: 'FINAL / 02',
    title: 'VEX IQ China National Final',
    titleZh: 'VEX 世锦赛中国总决赛',
    description: '2020 年，76000M 在重庆参加 VEX IQ 中国总决赛，获得初中组一等奖。',
    image: '/assets/award-5.webp',
    result: 'FIRST PRIZE',
    resultZh: '中国总决赛一等奖',
    team: '76000M / VEX IQ',
    date: 'DEC 2020',
    destination: '/awards',
  },
  {
    t: 0.38,
    year: '2022',
    place: 'QINGDAO',
    placeZh: '青岛',
    chapter: 'ASIA / 03',
    title: 'VEX Asia Championship',
    titleZh: '第十五届 VEX 亚洲锦标赛',
    description: '2022 年，我以 74000M 队员身份前往青岛，参加第十五届 VEX 亚洲锦标赛。',
    image: '/assets/vex-asia-pacific.webp',
    result: 'ASIA EVENT',
    resultZh: '亚洲锦标赛记录',
    team: '74000M / V5RC',
    date: 'AUG 2022',
    destination: '/robotics',
  },
  {
    t: 0.54,
    year: '2023',
    place: 'SHANGHAI',
    placeZh: '上海',
    chapter: 'ELITE / 04',
    title: 'National VEX Elite Competition',
    titleZh: '科创青禾全国 VEX 精英赛',
    description: '2023 年，74000M 在上海参加全国 VEX 机器人精英赛，获得高中组一等奖。',
    image: '/assets/award-1.webp',
    result: 'FIRST PRIZE',
    resultZh: '全国精英赛一等奖',
    team: '74000M / V5RC',
    date: 'MAR 2023',
    destination: '/awards',
  },
  {
    t: 0.69,
    year: '2023',
    place: 'CHONGQING',
    placeZh: '重庆',
    chapter: 'CHAMPION / 05',
    title: 'China–Canada VEX Competition',
    titleZh: '中国—加拿大 VEX 西南区比赛',
    description: '2023 年，74000M 在重庆参加中国—加拿大 VEX 西南区比赛，获得团队协作冠军。',
    image: '/assets/teamwork-trophy.webp',
    result: 'TEAMWORK CHAMPION',
    resultZh: '团队协作冠军',
    team: '74000M / VRC',
    date: 'APR 2023',
    destination: '/awards',
  },
  {
    t: 0.85,
    year: '2024/25',
    place: 'SIGNATURE EVENT',
    placeZh: '签名赛',
    chapter: 'SIGNATURE / 06',
    title: 'V5RC Signature Event',
    titleZh: '第十七届 VEX 亚洲锦标赛签名赛',
    description: '2025 年，我以 89866B 队员身份参加 VEX 亚洲锦标赛签名赛，获得高中组二等奖。',
    image: '/assets/award-8.webp',
    result: 'SECOND PRIZE',
    resultZh: '高中组二等奖',
    team: '89866B / V5RC',
    date: 'JAN 2025',
    destination: '/awards',
  },
]

function clamp(value: number) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))
}

function smoothStep(value: number) {
  const n = clamp(value)
  return n * n * (3 - 2 * n)
}

function seededNoise(seed: number) {
  const value = Math.sin(seed * 91.345 + 19.73) * 43758.5453
  return value - Math.floor(value)
}

function sampleColorStops(target: THREE.Color, stops: THREE.Color[], progress: number) {
  const scaled = clamp(progress) * (stops.length - 1)
  const lower = Math.min(stops.length - 1, Math.floor(scaled))
  const upper = Math.min(stops.length - 1, lower + 1)
  target.lerpColors(stops[lower], stops[upper], scaled - lower)
}

function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()
  const batchedMeshes = new Set<THREE.BatchedMesh>()
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return
    if (object instanceof THREE.BatchedMesh) batchedMeshes.add(object)
    else if (object.geometry) geometries.add(object.geometry)
    const meshMaterials = Array.isArray(object.material) ? object.material : [object.material]
    meshMaterials.forEach((material) => {
      if (!material) return
      materials.add(material)
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) textures.add(value)
      })
      if (material instanceof THREE.ShaderMaterial) {
        Object.values(material.uniforms).forEach(({ value }) => {
          if (value instanceof THREE.Texture) textures.add(value)
        })
      }
    })
  })
  batchedMeshes.forEach((batch) => batch.dispose())
  textures.forEach((texture) => texture.dispose())
  materials.forEach((material) => material.dispose())
  geometries.forEach((geometry) => geometry.dispose())
}

function createParticles(compact: boolean) {
  // Build a layered, soft-focus dust volume instead of a uniform star field.
  // The dense knots sit behind the helix and give the scene the iridescent,
  // photographic depth of the reference without competing with the cards.
  const count = compact ? 2000 : 4600
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const sizes = new Float32Array(count)
  const alphas = new Float32Array(count)
  const paletteBands = [
    [new THREE.Color(0x6fb8c4), new THREE.Color(0x3f6f86)],
    [new THREE.Color(0xd9a45a), new THREE.Color(0x6fb8c4)],
    [new THREE.Color(0xd0603f), new THREE.Color(0x8a6a4c)],
    [new THREE.Color(0x5fa9b3), new THREE.Color(0xe08a4c)],
    [new THREE.Color(0xc9573a), new THREE.Color(0x4f8796)],
    [new THREE.Color(0xe6b06a), new THREE.Color(0x5b8fa6)],
  ]
  const silver = new THREE.Color(0xb9cbd0)
  // Pull the chapter palette toward warm projector dust so the volume reads as
  // light in air rather than coloured confetti.
  const dust = new THREE.Color(0xd9cdb8)
  const graded = new THREE.Color()

  for (let index = 0; index < count; index += 1) {
    const seed = seededNoise(index + 401)
    const clustered = seededNoise(index + 421) > 0.18
    const vertical = seededNoise(index + 491)
    const clusterBand = Math.floor(seededNoise(index + 433) * paletteBands.length)
    const y = clustered
      ? 10.6 - clusterBand * 7.1 + (seededNoise(index + 449) - 0.5) * 3
      : 13 - vertical * 44
    // Follow the same handedness and pitch as the camera helix. Two offset
    // lobes keep the dust volume beside the focal object, not directly over it.
    const helixAngle = -0.56 - (8.4 - y) * 0.38
    const lobe = seededNoise(index + 439) < 0.5 ? -1 : 1
    const bandAngle = helixAngle + lobe * (
      0.46 + seededNoise(index + 587) * (clustered ? 0.42 : 1.65)
    )
    const radius = clustered
      ? 4.7 + seededNoise(index + 463) * 2.6
      : 5.6 + Math.pow(seededNoise(index + 463), 0.78) * 3.8
    const radialJitter = (seededNoise(index + 477) - 0.5) * (clustered ? 1.8 : 0.8)
    positions[index * 3] = Math.cos(bandAngle) * (radius + radialJitter)
    positions[index * 3 + 1] = y
    positions[index * 3 + 2] = Math.sin(bandAngle) * (radius + radialJitter)
    const colorBand = paletteBands[clustered
      ? clusterBand
      : Math.min(paletteBands.length - 1, Math.floor(vertical * paletteBands.length))]
    const color = graded.copy(seed < 0.67 ? colorBand[0] : seed < 0.92 ? colorBand[1] : silver).lerp(dust, 0.78)
    colors[index * 3] = color.r
    colors[index * 3 + 1] = color.g
    colors[index * 3 + 2] = color.b
    seeds[index] = seed
    const detailSeed = seededNoise(index + 571)
    const haze = clustered && detailSeed > 0.988
    const pearl = clustered && detailSeed > 0.91 && !haze
    sizes[index] = haze
      ? 18 + seededNoise(index + 517) * 42
      : pearl
        ? 2.05 + seededNoise(index + 517) * 3.2
        : clustered
          ? 0.45 + Math.pow(seededNoise(index + 517), 1.65) * 1.72
          : 0.2 + seededNoise(index + 517) * 0.9
    alphas[index] = haze
      ? 0.014 + seededNoise(index + 541) * 0.028
      : pearl
        ? 0.09 + seededNoise(index + 541) * 0.15
        : clustered
          ? 0.1 + seededNoise(index + 541) * 0.17
          : 0.03 + seededNoise(index + 541) * 0.06
  }

  if (compact) {
    for (let index = 0; index < count; index += 1) {
      sizes[index] *= 1.12
      alphas[index] *= 1.1
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uPixelRatio: { value: 1 },
    },
    vertexShader: `
      attribute float aSeed;
      attribute float aSize;
      attribute float aAlpha;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vSeed;
      uniform float uTime;
      uniform float uProgress;
      uniform float uPixelRatio;

      void main() {
        vec3 p = position;
        float spin = uTime * (0.012 + aSeed * 0.018) + uProgress * 0.72;
        float c = cos(spin);
        float s = sin(spin);
        p.xz = mat2(c, -s, s, c) * p.xz;
        p.y += sin(uTime * 0.18 + aSeed * 18.0) * 0.13;
        vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = clamp(aSize * uPixelRatio * (43.0 / max(8.0, -viewPosition.z)), 0.65, 62.0);
        vColor = color;
        vAlpha = aAlpha;
        vSeed = aSeed;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      varying float vSeed;

      void main() {
        vec2 q = gl_PointCoord - 0.5;
        float d2 = dot(q, q);
        float envelope = smoothstep(0.25, 0.035, d2);
        float halo = exp(-d2 * 10.5);
        float core = exp(-d2 * 42.0);
        float organic = 0.84 + 0.16 * sin((q.x * 17.0 + q.y * 13.0) + vSeed * 31.0);
        float alpha = (halo * 0.7 + core * 0.3) * envelope * organic * vAlpha;
        gl_FragColor = vec4(vColor * (0.74 + halo * 0.34), alpha);
      }
    `,
  })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  return { points, material }
}

function createVolumetricClouds(compact: boolean) {
  // A small number of broad, irregular veils supplies the missing mid-frequency
  // detail between the tiny dust and the large mechanical silhouette.
  const count = compact ? 40 : 72
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const sizes = new Float32Array(count)
  const alphas = new Float32Array(count)
  const palettes = [
    [new THREE.Color(0x2f8c9c), new THREE.Color(0x35566e)],
    [new THREE.Color(0xa8743c), new THREE.Color(0x2f8c9c)],
    [new THREE.Color(0xa8432c), new THREE.Color(0x4a3a30)],
    [new THREE.Color(0x2b8a86), new THREE.Color(0xb0602f)],
    [new THREE.Color(0x3c5f70), new THREE.Color(0xa8432c)],
    [new THREE.Color(0xb07a3a), new THREE.Color(0x356a86)],
  ]

  for (let index = 0; index < count; index += 1) {
    const seed = seededNoise(index + 1801)
    const band = index % palettes.length
    const y = 10.6 - band * 7.1 + (seededNoise(index + 1817) - 0.5) * 5.4
    const helixAngle = -0.56 - (8.4 - y) * 0.38
    const lobe = seededNoise(index + 1831) < 0.5 ? -1 : 1
    const angle = helixAngle + lobe * (0.52 + seededNoise(index + 1847) * 0.74)
    const radius = 5.2 + seededNoise(index + 1861) * 3.5
    positions[index * 3] = Math.cos(angle) * radius
    positions[index * 3 + 1] = y
    positions[index * 3 + 2] = Math.sin(angle) * radius
    const color = palettes[band][seed > 0.64 ? 1 : 0]
    colors[index * 3] = color.r
    colors[index * 3 + 1] = color.g
    colors[index * 3 + 2] = color.b
    seeds[index] = seed
    sizes[index] = 10 + seededNoise(index + 1877) * 18
    alphas[index] = 0.022 + seededNoise(index + 1889) * 0.032
  }

  if (compact) {
    for (let index = 0; index < count; index += 1) {
      sizes[index] *= 1.2
      alphas[index] *= 1.16
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uPixelRatio: { value: 1 },
    },
    vertexShader: `
      attribute float aSeed;
      attribute float aSize;
      attribute float aAlpha;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vSeed;
      uniform float uTime;
      uniform float uProgress;
      uniform float uPixelRatio;

      void main() {
        vec3 p = position;
        float spin = uTime * (0.003 + aSeed * 0.004) + uProgress * 0.22;
        float c = cos(spin);
        float s = sin(spin);
        p.xz = mat2(c, -s, s, c) * p.xz;
        p.y += sin(uTime * 0.045 + aSeed * 17.0) * 0.12;
        vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = clamp(aSize * uPixelRatio * (42.0 / max(9.0, -viewPosition.z)), 18.0, 150.0);
        vColor = color;
        vAlpha = aAlpha;
        vSeed = aSeed;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      varying float vSeed;

      void main() {
        vec2 q = gl_PointCoord * 2.0 - 1.0;
        float radius = length(q);
        float warp = sin(q.x * 7.0 + vSeed * 19.0)
          * sin(q.y * 8.0 - vSeed * 13.0) * 0.075;
        float envelope = 1.0 - smoothstep(0.18, 1.0, radius + warp * (1.0 - radius));
        float filaments = 0.62 + 0.38 * sin(q.x * 10.0 + sin(q.y * 7.0 + vSeed * 23.0));
        filaments = smoothstep(0.18, 1.0, filaments);
        float alpha = envelope * envelope * mix(0.62, 1.0, filaments) * vAlpha;
        gl_FragColor = vec4(vColor * (0.72 + filaments * 0.26), alpha);
      }
    `,
  })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  points.renderOrder = -1
  return { points, material }
}

function createAssemblyAura(compact: boolean) {
  const count = compact ? 1300 : 2400
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const sizes = new Float32Array(count)
  const alphas = new Float32Array(count)
  const cyan = new THREE.Color(0x7cc3cc)
  const red = new THREE.Color(0xd8573c)
  const violet = new THREE.Color(0xe0a35c)
  const pink = new THREE.Color(0xf2d2a0)

  for (let index = 0; index < count; index += 1) {
    const seed = seededNoise(index + 1301)
    const height = (seededNoise(index + 1399) - 0.5) * 8.4
    const angle = seededNoise(index + 1327) * Math.PI * 2 + height * 0.72
    const radius = 1.45 + Math.pow(seededNoise(index + 1361), 0.82) * 3.8
    positions[index * 3] = Math.cos(angle) * radius
    positions[index * 3 + 1] = height
    positions[index * 3 + 2] = Math.sin(angle) * radius
    const color = seed < 0.28 ? red : seed < 0.58 ? cyan : seed < 0.82 ? violet : pink
    colors[index * 3] = color.r
    colors[index * 3 + 1] = color.g
    colors[index * 3 + 2] = color.b
    seeds[index] = seed
    const haze = seed > 0.965
    sizes[index] = haze
      ? 10 + seededNoise(index + 1423) * 18
      : 0.55 + Math.pow(seededNoise(index + 1423), 1.4) * 3.8
    alphas[index] = haze
      ? 0.018 + seededNoise(index + 1459) * 0.032
      : 0.1 + seededNoise(index + 1459) * 0.21
  }

  if (compact) {
    for (let index = 0; index < count; index += 1) {
      sizes[index] *= 1.14
      alphas[index] *= 1.1
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: {
      uTime: { value: 0 },
      uAssembly: { value: 0 },
      uPixelRatio: { value: 1 },
    },
    vertexShader: `
      attribute float aSeed;
      attribute float aSize;
      attribute float aAlpha;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vSeed;
      uniform float uTime;
      uniform float uAssembly;
      uniform float uPixelRatio;

      void main() {
        float spread = mix(1.55, 0.68, uAssembly);
        vec3 p = position * spread;
        float spin = uTime * (0.12 + aSeed * 0.08) + aSeed * 5.0;
        float c = cos(spin);
        float s = sin(spin);
        p.xz = mat2(c, -s, s, c) * p.xz;
        vec3 direction = normalize(position + vec3(0.001));
        p += direction * sin(uTime * 0.82 + aSeed * 31.0) * mix(0.24, 0.06, uAssembly);
        vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = clamp(aSize * uPixelRatio * (43.0 / max(7.0, -viewPosition.z)), 0.8, 48.0);
        vColor = color;
        vAlpha = aAlpha * mix(1.0, 0.55, uAssembly);
        vSeed = aSeed;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      varying float vSeed;

      void main() {
        vec2 q = gl_PointCoord - 0.5;
        float angle = vSeed * 6.2831853;
        mat2 turn = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        q = turn * q;
        float haze = smoothstep(0.965, 0.99, vSeed);
        q.x *= mix(1.45 + vSeed * 1.55, 1.0, haze);
        float d2 = dot(q, q);
        float envelope = smoothstep(0.27, mix(0.045, 0.015, haze), d2);
        float glow = exp(-d2 * mix(18.0, 8.0, haze));
        gl_FragColor = vec4(vColor * mix(1.08, 0.72, haze), glow * envelope * vAlpha);
      }
    `,
  })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  points.renderOrder = 2
  return { points, material }
}

function createCinematicLightField(compact: boolean) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uAccent: { value: new THREE.Color(0xe0703a) },
      uCool: { value: new THREE.Color(0x5fb3c2) },
      uTime: { value: 0 },
      uIntensity: { value: 0.42 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uAccent;
      uniform vec3 uCool;
      uniform float uTime;
      uniform float uIntensity;
      varying vec2 vUv;

      float hash21(vec2 p) {
        return fract(sin(dot(p, vec2(41.17, 289.31))) * 45758.5453);
      }

      void main() {
        vec2 p = vUv - 0.5;
        vec2 coolP = (p - vec2(-0.18, 0.04)) / vec2(0.34, 0.62);
        vec2 accentP = (p - vec2(0.22, -0.06)) / vec2(0.28, 0.52);
        float coolPool = exp(-dot(coolP, coolP) * 2.15);
        float accentPool = exp(-dot(accentP, accentP) * 2.35);
        float vertical = smoothstep(0.55, 0.04, abs(p.x)) * smoothstep(0.58, 0.18, abs(p.y));
        float sweep = pow(max(0.0, 1.0 - abs(p.x * 0.72 + p.y - 0.12) * 3.2), 5.0);
        float grain = (hash21(vUv * 720.0 + uTime * 0.015) - 0.5) * 0.045;
        vec3 color = uCool * coolPool * 0.78 + uAccent * accentPool * 0.72;
        color += mix(uCool, uAccent, 0.52) * vertical * 0.12;
        color += mix(uAccent, vec3(1.0), 0.28) * sweep * 0.09;
        float alpha = (coolPool + accentPool + vertical * 0.18) * uIntensity;
        alpha *= smoothstep(0.73, 0.30, length(p));
        gl_FragColor = vec4(max(color + grain, 0.0), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: true,
  })
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(compact ? 8.5 : 11.5, compact ? 10.5 : 13.5),
    material,
  )
  mesh.name = 'CINEMATIC_LIGHT_FIELD'
  mesh.frustumCulled = false
  mesh.renderOrder = -2
  return { mesh, material }
}

// Match the Blender rail's pitch over the camera's visible vertical span.
// Blender authors 2.18 turns over 36 units; this scene travels 35.4 units.
const TIMELINE_TURNS = 2.14

function timelineOrbitOffset(t: number, compact: boolean) {
  // The rail is authored once in Blender, so desktop and compact layouts share
  // its exact phase. Card size and camera FOV provide the responsive fit.
  void compact
  return THREE.MathUtils.lerp(-0.36, -0.32, t)
}

const CARD_FONTS = {
  serif: '"Instrument Serif", Georgia, serif',
  display: '"Barlow Condensed", "Arial Narrow", sans-serif',
  mono: '"IBM Plex Mono", Consolas, monospace',
  zh: '"Noto Sans SC Variable", "Microsoft YaHei", "PingFang SC", sans-serif',
}

function fitFont(context: CanvasRenderingContext2D, text: string, font: (size: number) => string, size: number, maxWidth: number) {
  let next = size
  context.font = font(next)
  while (next > 12 && context.measureText(text).width > maxWidth) {
    next -= 4
    context.font = font(next)
  }
  return next
}

/** An archival print plate: photo on the left, set type on the right. */
function drawTimelineFace(canvas: HTMLCanvasElement, entry: MemoryEntry, index: number) {
  const context = canvas.getContext('2d')
  if (!context) return
  const width = canvas.width
  const height = canvas.height
  const s = width / 1696
  const inset = 62 * s
  const photoRight = width * 0.5
  const columnX = photoRight + 74 * s
  const columnWidth = width - columnX - inset
  const ink = 'rgba(239, 231, 218, 0.96)'
  const dim = 'rgba(239, 231, 218, 0.52)'
  const gold = '#e9be78'

  context.clearRect(0, 0, width, height)
  context.textBaseline = 'alphabetic'

  // Caption strip on the print itself, like an edge-printed film frame.
  const captionShade = context.createLinearGradient(0, height - 220 * s, 0, height - inset)
  captionShade.addColorStop(0, 'rgba(4, 5, 6, 0)')
  captionShade.addColorStop(1, 'rgba(4, 5, 6, 0.78)')
  context.fillStyle = captionShade
  context.fillRect(inset, height - 220 * s, photoRight - inset, 220 * s - inset)
  context.fillStyle = 'rgba(239, 231, 218, 0.82)'
  context.font = `500 ${22 * s}px ${CARD_FONTS.mono}`
  context.letterSpacing = `${4 * s}px`
  context.fillText(`KLZC ARCHIVE  ·  ${String(index + 1).padStart(2, '0')}`, inset + 30 * s, height - inset - 30 * s)
  context.textAlign = 'right'
  context.fillText(entry.team, photoRight - 30 * s, height - inset - 30 * s)
  context.textAlign = 'left'

  // Hairline frame around the print.
  context.strokeStyle = 'rgba(239, 231, 218, 0.22)'
  context.lineWidth = 1.5 * s
  context.strokeRect(inset, inset, photoRight - inset, height - inset * 2)

  context.fillStyle = gold
  context.font = `500 ${24 * s}px ${CARD_FONTS.mono}`
  context.letterSpacing = `${6 * s}px`
  context.fillText(`NO. ${String(index + 1).padStart(2, '0')}`, columnX, inset + 30 * s)
  context.fillStyle = dim
  context.textAlign = 'right'
  context.fillText(entry.date, width - inset, inset + 30 * s)
  context.textAlign = 'left'
  context.fillStyle = 'rgba(239, 231, 218, 0.16)'
  context.fillRect(columnX, inset + 62 * s, columnWidth, 1.5 * s)

  context.letterSpacing = '0px'
  context.fillStyle = ink
  const yearSize = fitFont(context, entry.year, (size) => `italic 400 ${size}px ${CARD_FONTS.serif}`, 250 * s, columnWidth)
  context.fillText(entry.year, columnX - 6 * s, inset + 62 * s + yearSize * 0.98)

  let y = inset + 62 * s + yearSize * 0.98 + 34 * s
  context.fillStyle = dim
  context.font = `500 ${24 * s}px ${CARD_FONTS.mono}`
  context.letterSpacing = `${5 * s}px`
  context.fillText(`${entry.place}  ·  ${entry.placeZh}`, columnX, y)

  y += 92 * s
  context.letterSpacing = `${1.5 * s}px`
  context.fillStyle = ink
  context.font = `600 ${68 * s}px ${CARD_FONTS.display}`
  const titleLines: string[] = []
  let line = ''
  for (const word of entry.title.toUpperCase().split(' ')) {
    const candidate = line ? `${line} ${word}` : word
    if (context.measureText(candidate).width > columnWidth && line) {
      titleLines.push(line)
      line = word
    } else line = candidate
  }
  if (line) titleLines.push(line)
  titleLines.slice(0, 2).forEach((text, lineIndex) => context.fillText(text, columnX, y + lineIndex * 66 * s))
  y += (Math.min(2, titleLines.length) - 1) * 66 * s + 58 * s

  context.letterSpacing = '0px'
  context.fillStyle = 'rgba(239, 231, 218, 0.74)'
  context.font = `500 ${32 * s}px ${CARD_FONTS.zh}`
  context.fillText(entry.titleZh, columnX, y)

  const resultY = height - inset - 150 * s
  context.fillStyle = gold
  context.fillRect(columnX, resultY - 58 * s, 64 * s, 2 * s)
  context.font = `600 ${30 * s}px ${CARD_FONTS.mono}`
  context.letterSpacing = `${4 * s}px`
  context.fillText(entry.result, columnX, resultY)
  context.letterSpacing = '0px'
  context.fillStyle = ink
  context.font = `500 ${30 * s}px ${CARD_FONTS.zh}`
  context.fillText(entry.resultZh, columnX, resultY + 50 * s)

  context.fillStyle = 'rgba(239, 231, 218, 0.16)'
  context.fillRect(columnX, height - inset - 58 * s, columnWidth, 1.5 * s)
  context.fillStyle = dim
  context.font = `500 ${22 * s}px ${CARD_FONTS.mono}`
  context.letterSpacing = `${4 * s}px`
  context.fillText('OPEN RECORD', columnX, height - inset - 14 * s)
  context.textAlign = 'right'
  context.fillStyle = ink
  context.fillText('查看  ↗', width - inset, height - inset - 14 * s)
  context.textAlign = 'left'
  context.letterSpacing = '0px'
}

function createTimelineFaceTexture(entry: MemoryEntry, index: number, compact: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = compact ? 1358 : 1696
  canvas.height = compact ? 800 : 1000
  drawTimelineFace(canvas, entry, index)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  // Canvas only draws with faces that are already loaded; repaint once the
  // site's display faces (and the Chinese subsets this card needs) arrive.
  const zhText = `${entry.titleZh}${entry.resultZh}${entry.placeZh}查看`
  void Promise.all([
    document.fonts?.load(`italic 400 100px ${CARD_FONTS.serif}`),
    document.fonts?.load(`600 60px ${CARD_FONTS.display}`),
    document.fonts?.load(`500 24px ${CARD_FONTS.mono}`),
    document.fonts?.load(`600 24px ${CARD_FONTS.mono}`),
    document.fonts?.load(`500 30px ${CARD_FONTS.zh}`, zhText),
  ]).catch(() => undefined).then(() => {
    drawTimelineFace(canvas, entry, index)
    texture.needsUpdate = true
  })
  return texture
}

function createPhotoDepthMaterial(texture: THREE.Texture, accentColor: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: texture },
      uAccent: { value: new THREE.Color(accentColor) },
      uTexelSize: { value: new THREE.Vector2(1 / 1024, 1 / 1024) },
      uViewOffset: { value: new THREE.Vector2() },
      uOpacity: { value: 0.96 },
      uHover: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform vec3 uAccent;
      uniform vec2 uTexelSize;
      uniform vec2 uViewOffset;
      uniform float uOpacity;
      uniform float uHover;
      uniform float uTime;
      varying vec2 vUv;

      float hash21(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float roundedMask(vec2 uv) {
        vec2 p = abs(uv - 0.5) - vec2(0.497, 0.497);
        float d = length(max(p, 0.0)) + min(max(p.x, p.y), 0.0);
        return 1.0 - smoothstep(-0.002, 0.002, d);
      }

      void main() {
        vec2 viewShift = uViewOffset * 0.024;
        vec2 uv = clamp(vUv + viewShift, 0.012, 0.988);
        vec2 depthUv = clamp(vUv - viewShift * 0.58, 0.012, 0.988);
        vec2 blurStep = uTexelSize * 9.0;

        vec3 blur = texture2D(uMap, depthUv).rgb * 0.20;
        blur += texture2D(uMap, depthUv + vec2(blurStep.x, 0.0)).rgb * 0.12;
        blur += texture2D(uMap, depthUv - vec2(blurStep.x, 0.0)).rgb * 0.12;
        blur += texture2D(uMap, depthUv + vec2(0.0, blurStep.y)).rgb * 0.12;
        blur += texture2D(uMap, depthUv - vec2(0.0, blurStep.y)).rgb * 0.12;
        blur += texture2D(uMap, depthUv + blurStep).rgb * 0.08;
        blur += texture2D(uMap, depthUv - blurStep).rgb * 0.08;
        blur += texture2D(uMap, depthUv + vec2(blurStep.x, -blurStep.y)).rgb * 0.08;
        blur += texture2D(uMap, depthUv + vec2(-blurStep.x, blurStep.y)).rgb * 0.08;

        vec2 chroma = viewShift * 0.18 + vec2(0.0012, 0.0);
        vec3 sharp;
        sharp.r = texture2D(uMap, clamp(uv + chroma, 0.01, 0.99)).r;
        sharp.g = texture2D(uMap, uv).g;
        sharp.b = texture2D(uMap, clamp(uv - chroma, 0.01, 0.99)).b;

        float centerLight = 1.0 - smoothstep(0.18, 0.72, length(vUv - 0.5));
        float glassSweep = pow(max(0.0, 1.0 - abs(vUv.x + vUv.y - 1.18 + uViewOffset.x * 0.22) * 4.6), 5.0);
        float grain = (hash21(vUv * 940.0 + uTime * 0.07) - 0.5) * 0.026;
        vec3 color = mix(blur, sharp, 0.72 + centerLight * 0.15);
        color = mix(color, color * vec3(1.03, 1.0, 0.94), 0.22);
        color += uAccent * (glassSweep * (0.035 + uHover * 0.05));
        color += grain;

        float mask = roundedMask(vUv);
        float innerEdge = smoothstep(0.40, 0.68, length(vUv - 0.5));
        color *= 1.0 - innerEdge * 0.22;
        gl_FragColor = vec4(color, mask * uOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}

function createCardVisual(
  entry: MemoryEntry,
  index: number,
  textureLoader: THREE.TextureLoader,
  compact: boolean,
) {
  const group = new THREE.Group()
  group.name = `TIMELINE_CARD_${String(index + 1).padStart(2, '0')}`
  group.userData.cardIndex = index
  const orbitOffset = timelineOrbitOffset(entry.t, compact)
  const baseAngle = -0.56 + orbitOffset - entry.t * TIMELINE_TURNS * Math.PI * 2
  const radius = compact ? 6.72 : 7.62
  // Sit just above the camera's focal line. A large positive offset makes a
  // correctly mounted card look as though it has disappeared above the frame.
  const cardYOffset = compact ? 0.9 : 1.24
  const y = 6.2 - 35.4 * entry.t + cardYOffset
  group.position.set(Math.cos(baseAngle) * radius, y, Math.sin(baseAngle) * radius)
  const activeCameraAngle = -0.56 - entry.t * TIMELINE_TURNS * Math.PI * 2
  const activeEndFraming = smoothStep((entry.t - 0.86) / 0.14)
  const activeCameraRadius = THREE.MathUtils.lerp(compact ? 12.4 : 14.4, compact ? 9.7 : 10.6, entry.t)
    + activeEndFraming * (compact ? 4.2 : 5.7)
  const activeCameraY = 8.4 - entry.t * 35.4 + 1.7
    + activeEndFraming * (compact ? 1.05 : 1.35)
  const activeCameraPosition = new THREE.Vector3(
    Math.cos(activeCameraAngle) * activeCameraRadius,
    activeCameraY,
    Math.sin(activeCameraAngle) * activeCameraRadius,
  )
  const activeCameraTarget = new THREE.Vector3(
    0,
    8.4 - entry.t * 35.4 - 2.6 + activeEndFraming * (compact ? 3.05 : 2.85),
    0,
  )
  // Copy the matching camera's image-plane orientation. Unlike a simple
  // lookAt(camera.position), this also removes screen-space roll, so the card
  // is a true front-facing rectangle at its timeline node while staying fixed.
  const activeCameraMatrix = new THREE.Matrix4().lookAt(
    activeCameraPosition,
    activeCameraTarget,
    new THREE.Vector3(0, 1, 0),
  )
  const activeCameraQuaternion = new THREE.Quaternion().setFromRotationMatrix(activeCameraMatrix)
  // Match the camera image plane exactly at the active node. Mouse parallax is
  // intentionally excluded from the camera, so the card cannot drift out of
  // this screen-square orientation while the user is reading it.
  group.quaternion.copy(activeCameraQuaternion)
  const baseQuaternion = group.quaternion.clone()

  // The camera radius tightens on descent, so taper physical card width to
  // preserve a consistent readable screen size and keep the final card whole.
  const baseWidth = THREE.MathUtils.lerp(
    compact ? 2.5 : 3.38,
    compact ? 2.08 : 2.72,
    entry.t,
  ) + (index === 4 ? 0.08 : 0)
  const finalCardFit = 1 - smoothStep((entry.t - 0.74) / 0.14) * 0.14
  const width = baseWidth * finalCardFit
  const height = width * 0.59
  const materials: CardVisual['materials'] = []
  const register = <T extends THREE.Material & { opacity: number }>(material: T, opacity: number) => {
    material.transparent = true
    material.opacity = opacity
    materials.push({ material, opacity })
    return material
  }

  // A matte mount board, thin as a print plate. Everything else is type and
  // the photograph, so the card reads as an archive print, not a gadget.
  const boardDepth = 0.05
  const boardMaterial = register(new THREE.MeshStandardMaterial({
    color: 0x0b0c0d,
    metalness: 0.25,
    roughness: 0.62,
    envMapIntensity: 0.5,
    depthWrite: false,
  }), 0.94)
  const board = new THREE.Mesh(new RoundedBoxGeometry(width, height, boardDepth, 3, 0.02), boardMaterial)
  board.castShadow = true
  group.add(board)

  // Soft contact shadow lifts the plate off the haze behind it.
  const shadowCanvas = document.createElement('canvas')
  shadowCanvas.width = 256
  shadowCanvas.height = 256
  const shadowContext = shadowCanvas.getContext('2d')
  if (shadowContext) {
    const falloff = shadowContext.createRadialGradient(128, 128, 20, 128, 128, 128)
    falloff.addColorStop(0, 'rgba(0, 0, 0, 0.85)')
    falloff.addColorStop(0.55, 'rgba(0, 0, 0, 0.45)')
    falloff.addColorStop(1, 'rgba(0, 0, 0, 0)')
    shadowContext.fillStyle = falloff
    shadowContext.fillRect(0, 0, 256, 256)
  }
  const shadowMaterial = register(new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(shadowCanvas),
    depthWrite: false,
  }), 0.72)
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(width * 1.4, height * 1.6), shadowMaterial)
  shadow.position.set(width * 0.03, -height * 0.07, -0.14)
  shadow.renderOrder = -1
  group.add(shadow)

  // The print sits inside the face texture's hairline frame (62px inset on a
  // 1696 x 1000 canvas, right edge at the centre line).
  const photoInsetX = width * (62 / 1696)
  const photoInsetY = height * (62 / 1000)
  const photoWidth = width * 0.5 - photoInsetX
  const photoHeight = height - photoInsetY * 2
  const photoX = -width / 2 + photoInsetX + photoWidth / 2
  let photoDepthMaterial: THREE.ShaderMaterial | null = null
  const photoTexture = textureLoader.load(entry.image, (loaded) => {
    const image = loaded.image as { width?: number, height?: number }
    const imageWidth = image.width ?? 1
    const imageHeight = image.height ?? 1
    const imageAspect = imageWidth / Math.max(imageHeight, 1)
    const panelAspect = photoWidth / photoHeight
    if (imageAspect > panelAspect) {
      loaded.repeat.set(panelAspect / imageAspect, 1)
      loaded.offset.set((1 - loaded.repeat.x) / 2, 0)
    } else {
      loaded.repeat.set(1, imageAspect / panelAspect)
      loaded.offset.set(0, (1 - loaded.repeat.y) / 2)
    }
    photoDepthMaterial?.uniforms.uTexelSize.value.set(1 / imageWidth, 1 / imageHeight)
    loaded.needsUpdate = true
  })
  photoTexture.colorSpace = THREE.SRGBColorSpace
  photoTexture.anisotropy = 8
  photoDepthMaterial = register(createPhotoDepthMaterial(photoTexture, 0xe9be78), 0.98)
  const image = new THREE.Mesh(new THREE.PlaneGeometry(photoWidth, photoHeight), photoDepthMaterial)
  image.position.set(photoX, 0, boardDepth / 2 + 0.004)
  image.renderOrder = 4
  group.add(image)

  const faceTexture = createTimelineFaceTexture(entry, index, compact)
  const faceMaterial = register(new THREE.MeshBasicMaterial({
    map: faceTexture,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false,
  }), 0.98)
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width, height), faceMaterial)
  face.position.z = boardDepth / 2 + 0.008
  face.renderOrder = 6
  group.add(face)

  // One gold edge light along the base is the card's only accent; hover
  // brightens it.
  const accentMaterial = register(new THREE.MeshStandardMaterial({
    color: 0xe9be78,
    emissive: 0xe9be78,
    emissiveIntensity: 0.9,
    metalness: 0.4,
    roughness: 0.3,
  }), 0.95)
  const edge = new THREE.Mesh(new THREE.BoxGeometry(width - 0.05, 0.008, 0.012), accentMaterial)
  edge.position.set(0, -height / 2 + 0.002, boardDepth / 2 + 0.002)
  group.add(edge)

  return {
    group,
    baseQuaternion,
    materials,
    accentMaterial,
    baseEmissiveIntensity: 0.9,
    destination: entry.destination,
    photoMaterial: photoDepthMaterial,
    t: entry.t,
  } satisfies CardVisual
}

function loadGltf(loader: GLTFLoader, url: string) {
  return new Promise<THREE.Object3D>((resolve, reject) => {
    loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject)
  })
}

function MechanicalMemoryScene({
  progress,
  reducedMotion,
  paused,
  onStatus,
  onNavigate,
}: {
  progress: MotionValue<number>
  reducedMotion: boolean
  paused: boolean
  onStatus: (status: SceneStatus) => void
  onNavigate: (href: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const hostRef = useRef<HTMLDivElement | null>(null)
  const pausedRef = useRef(paused)
  useEffect(() => { pausedRef.current = paused }, [paused])

  useEffect(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return

    let cancelled = false
    let frame = 0
    let visible = true
    const compact = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches
    const hardwareThreads = navigator.hardwareConcurrency || 6
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
    const constrainedMobile = compact && (hardwareThreads <= 4 || deviceMemory <= 2)
    // Mobile keeps the same lighting and post-processing stack as desktop,
    // while its internal resolution can continuously follow the GPU budget.
    const compactPixelRatioCap = constrainedMobile ? 1.25 : 1.65
    const compactPixelBudget = constrainedMobile ? 900_000 : 1_600_000
    const minimumQualityScale = constrainedMobile ? 0.7 : 0.72
    let runtimeQualityScale = compact ? (constrainedMobile ? 0.86 : 0.9) : 1
    const targetFrameRate = constrainedMobile ? 30 : DESKTOP_TARGET_FRAME_RATE
    const renderStep = 1000 / targetFrameRate
    const resolvePixelRatio = (width: number, height: number) => {
      const deviceRatio = window.devicePixelRatio || 1
      if (!compact) return Math.min(deviceRatio, DESKTOP_PIXEL_RATIO_CAP)
      const budgetRatio = Math.sqrt(compactPixelBudget / Math.max(1, width * height))
      return Math.max(1, Math.min(deviceRatio, compactPixelRatioCap, budgetRatio) * runtimeQualityScale)
    }
    const pointerNdc = new THREE.Vector2()
    const raycaster = new THREE.Raycaster()
    const world = new THREE.Group()
    const cardVisuals: CardVisual[] = []
    let robotRoot: THREE.Group | null = null
    let assemblyAura: ReturnType<typeof createAssemblyAura> | null = null
    let arena: ReturnType<typeof dressArena> | null = null
    let animatedParts: AnimatedPart[] = []
    let activePixelRatio = 1

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: false,
        powerPreference: compact ? 'low-power' : 'high-performance',
      })
    } catch {
      onStatus('error')
      return
    }
    const onContextLost = (event: Event) => {
      event.preventDefault()
      onStatus('error')
    }
    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.dataset.renderTarget = `${targetFrameRate}`
    renderer.setClearColor(0x03080c, 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = compact ? 1.02 : 0.98
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.shadowMap.autoUpdate = false

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x03080c)
    const sceneFog = new THREE.FogExp2(0x061017, compact ? 0.0135 : 0.0125)
    scene.fog = sceneFog
    scene.add(world)

    const camera = new THREE.PerspectiveCamera(compact ? 56 : 46, 1, 0.05, 180)
    camera.up.set(0, 1, 0)

    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    const roomTarget = pmremGenerator.fromScene(room, 0.04)
    room.dispose()
    scene.environment = roomTarget.texture
    let hdrTarget: THREE.WebGLRenderTarget | null = null
    const manager = new THREE.LoadingManager()
    manager.onLoad = () => { forceRender = true }
    const hdrLoader = new HDRLoader(manager)
    hdrLoader.load(
      '/assets/pbr/empty-warehouse-01-512.hdr',
      (texture) => {
        if (cancelled) {
          texture.dispose()
          return
        }
        hdrTarget = pmremGenerator.fromEquirectangular(texture)
        scene.environment = hdrTarget.texture
        arena?.setEnvironment(scene.environment)
        texture.dispose()
      },
      undefined,
      () => undefined,
    )

    scene.add(new THREE.HemisphereLight(0x8fc9d4, 0x140a05, compact ? 0.16 : 0.14))
    scene.add(new THREE.AmbientLight(0x18323d, compact ? 0.05 : 0.04))
    // A spot, not a sun: it follows the robot down and lights only the robot,
    // the cards and the patch of field under it. A directional key would
    // flood the whole arena evenly and flatten it into grey geometry.
    // ~14.7 units from its target; its 28-unit range fades it out before the
    // stands, and ~470 cd still gives the old 1.85 lux at the robot.
    const key = new THREE.SpotLight(0xf5f1e8, compact ? 430 : 470, 28, 0.5, 0.55, 2)
    key.position.set(5, 13, 8)
    key.target.position.set(0, -2, 0)
    key.castShadow = true
    const shadowMapSize = compact ? 512 : 1024
    key.shadow.mapSize.set(shadowMapSize, shadowMapSize)
    key.shadow.camera.near = 2
    key.shadow.camera.far = 55
    key.shadow.bias = -0.00025
    key.shadow.normalBias = 0.025
    scene.add(key, key.target)
    // Range-limited so the rims stop at the robot instead of washing the
    // stands behind it.
    const redLight = new THREE.SpotLight(0xe0703a, compact ? 215 : 235, 20, Math.PI * 0.28, 0.82, 2)
    const cyanLight = new THREE.SpotLight(0x5fb3c2, compact ? 190 : 210, 22, Math.PI * 0.3, 0.86, 2)
    const warmRim = new THREE.PointLight(0xffb070, compact ? 10.5 : 12, 18, 2)
    redLight.castShadow = false
    cyanLight.castShadow = false
    scene.add(redLight, redLight.target, cyanLight, cyanLight.target, warmRim)
    const accentLightStops = [0xe0703a, 0xd9a45a, 0xc8463a, 0xe08a3c, 0xd2553a, 0xe6b06a]
      .map((value) => new THREE.Color(value))
    const coolLightStops = [0x5fb3c2, 0x6fa8bf, 0x4f9db0, 0x78b9c2, 0x5d9fb8, 0x6cb2bd]
      .map((value) => new THREE.Color(value))
    const rimLightStops = [0xffb070, 0xe8c493, 0xff8a5c, 0xa9d4d8, 0xff9b62, 0xffc98a]
      .map((value) => new THREE.Color(value))
    const fogStops = [0x041014, 0x07100f, 0x0d0907, 0x051213, 0x0c0a08, 0x110a06]
      .map((value) => new THREE.Color(value))
    const backgroundStops = [0x02090c, 0x050909, 0x0a0605, 0x030b0b, 0x090706, 0x0c0705]
      .map((value) => new THREE.Color(value))
    const sceneBackground = scene.background as THREE.Color

    const { mesh: lightField, material: lightFieldMaterial } = createCinematicLightField(compact)
    world.add(lightField)
    const { points: cloudVeils, material: cloudMaterial } = createVolumetricClouds(compact)
    const { points: particles, material: particleMaterial } = createParticles(compact)
    world.add(cloudVeils, particles)

    const textureLoader = new THREE.TextureLoader(manager)
    MEMORY_ENTRIES.forEach((entry, index) => {
      const card = createCardVisual(entry, index, textureLoader, compact)
      cardVisuals.push(card)
      world.add(card.group)
    })

    const composer = new EffectComposer(renderer)
    if (!compact && renderer.capabilities.isWebGL2) {
      composer.renderTarget1.samples = DESKTOP_MSAA_SAMPLES
      composer.renderTarget2.samples = DESKTOP_MSAA_SAMPLES
    }
    composer.addPass(new RenderPass(scene, camera))
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      0.18,
      compact ? 0.46 : 0.48,
      compact ? 0.98 : 0.96,
    )
    composer.addPass(bloomPass)
    bloomPass.enabled = !constrainedMobile
    const cinematicPass = new ShaderPass(CINEMATIC_SHADER)
    if (compact) {
      cinematicPass.uniforms.uGrain.value = 0.004
      cinematicPass.uniforms.uAberration.value = 0.00015
      cinematicPass.uniforms.uVignette.value = 0.24
      cinematicPass.uniforms.uStreak.value = 0
    }
    composer.addPass(cinematicPass)
    const fxaaPass = compact ? new ShaderPass(FXAAShader) : null
    if (fxaaPass) composer.addPass(fxaaPass)
    composer.addPass(new OutputPass())

    const loader = new GLTFLoader(manager)
    loader.setMeshoptDecoder(MeshoptDecoder)
    onStatus('loading')
    const loadingTimeout = window.setTimeout(() => {
      if (!cancelled) onStatus('error')
    }, 30000)
    // Dispose whichever model finishes after navigation, including when its
    // companion request fails. Optional scenery must not hide a loaded robot.
    const loadOwnedModel = async (url: string) => {
      const model = await loadGltf(loader, url)
      if (cancelled) {
        disposeObject(model)
        return null
      }
      world.add(model)
      return model
    }
    Promise.all([
      loadOwnedModel(ARENA_URL).catch(() => null),
      loadOwnedModel(ROBOT_URL),
    ]).then(([environment, robot]) => {
      if (cancelled || !robot) return
      window.clearTimeout(loadingTimeout)
      // Land the robot on the field: the arena floor sits at the robot's final
      // centre height (see the frame loop) minus half its normalised height.
      const robotSize = new THREE.Box3().setFromObject(robot).getSize(new THREE.Vector3())
      const robotHalfHeight = (robotSize.y * 5.45) / Math.max(robotSize.x, robotSize.y, robotSize.z, 0.001) / 2
      const finalRobotY = 8.4 - 35.4 - (compact ? 1.65 : 1.15) + (compact ? 1.8 : 2.05)
      if (environment) {
        environment.position.y = finalRobotY - robotHalfHeight * (compact ? 0.52 : 0.62)
        // Turn the field so the final camera hangs over a roller corner (no
        // tall goal structure) and looks down the diagonal, broadcast-style.
        // The camera ends at -82.5 deg; a roller corner sits at 45 deg.
        environment.rotation.y = THREE.MathUtils.degToRad(127.5)
        arena = dressArena(environment, {
          compact,
          banners: [
            ...MEMORY_ENTRIES.map((entry) => ({ year: entry.year, place: entry.place, result: entry.result })),
            { year: '74000M', place: 'CHENGDU', result: 'TEAM 2019 — 2025' },
          ],
        })
        arena.setEnvironment(scene.environment)
      }
      world.remove(robot)
      robotRoot = new THREE.Group()
      world.add(robotRoot)
      animatedParts = configureRobotAssembly(robot, robotRoot, compact)
      assemblyAura = createAssemblyAura(compact)
      assemblyAura.material.uniforms.uPixelRatio.value = activePixelRatio
      robotRoot.add(assemblyAura.points)
      forceRender = true
      onStatus('ready')
    }).catch((error) => {
      window.clearTimeout(loadingTimeout)
      console.error('Mechanical memory scene failed to load', error)
      if (!cancelled) onStatus('error')
    })

    let hoveredCard: CardVisual | null = null
    const findCardAtPointer = (event: PointerEvent | globalThis.MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointerNdc.set(
        ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
        -((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1,
      )
      raycaster.setFromCamera(pointerNdc, camera)
      const visibleCards = cardVisuals.filter((card) => card.group.visible)
      const hit = raycaster.intersectObjects(visibleCards.map((card) => card.group), true)[0]
      let object: THREE.Object3D | null = hit?.object ?? null
      while (object) {
        const cardIndex = object.userData.cardIndex
        if (typeof cardIndex === 'number') return cardVisuals[cardIndex] ?? null
        object = object.parent
      }
      return null
    }
    const setHoveredCard = (next: CardVisual | null) => {
      if (hoveredCard === next) return
      forceRender = true
      if (hoveredCard) {
        hoveredCard.accentMaterial.emissiveIntensity = hoveredCard.baseEmissiveIntensity
        hoveredCard.photoMaterial.uniforms.uHover.value = 0
      }
      hoveredCard = next
      if (hoveredCard) {
        hoveredCard.accentMaterial.emissiveIntensity = hoveredCard.baseEmissiveIntensity * 2.2
        hoveredCard.photoMaterial.uniforms.uHover.value = 1
      }
      canvas.style.cursor = hoveredCard ? 'pointer' : 'default'
    }
    const onCardPointerMove = (event: PointerEvent) => setHoveredCard(findCardAtPointer(event))
    const onCardPointerLeave = () => setHoveredCard(null)
    const onCardClick = (event: globalThis.MouseEvent) => {
      const card = findCardAtPointer(event)
      if (card) onNavigate(card.destination)
    }
    if (!compact) {
      canvas.addEventListener('pointermove', onCardPointerMove, { passive: true })
      canvas.addEventListener('pointerleave', onCardPointerLeave)
    }
    canvas.addEventListener('click', onCardClick)

    const resize = () => {
      const rect = host.getBoundingClientRect()
      const width = Math.max(1, Math.round(rect.width))
      const height = Math.max(1, Math.round(rect.height))
      const pixelRatio = resolvePixelRatio(width, height)
      activePixelRatio = pixelRatio
      renderer.setPixelRatio(pixelRatio)
      renderer.setSize(width, height, false)
      composer?.setPixelRatio(pixelRatio)
      composer?.setSize(width, height)
      cinematicPass.uniforms.uTexel.value.set(
        1 / Math.max(1, width * pixelRatio),
        1 / Math.max(1, height * pixelRatio),
      )
      if (fxaaPass) {
        fxaaPass.uniforms.resolution.value.set(
          1 / Math.max(1, width * pixelRatio),
          1 / Math.max(1, height * pixelRatio),
        )
      }
      camera.aspect = width / height
      camera.fov = compact ? 54 : 46
      camera.updateProjectionMatrix()
      forceRender = true
      cloudMaterial.uniforms.uPixelRatio.value = pixelRatio
      particleMaterial.uniforms.uPixelRatio.value = pixelRatio
      if (assemblyAura) assemblyAura.material.uniforms.uPixelRatio.value = pixelRatio
    }
    let forceRender = true
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    resize()

    const cardCameraLocal = new THREE.Vector3()
    let qualityFrames = 0
    let qualityDuration = 0
    let previousQualityFrame = performance.now()
    let qualityCooldownFrames = 0
    let previousScheduleFrame = performance.now()
    let renderAccumulator = renderStep
    let shadowFrame = 0
    let lastAssemblyProgress = -1
    let lastRenderedProgress = -1
    let elapsed = 0
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting)
      if (visible) {
        const now = performance.now()
        previousScheduleFrame = now
        renderAccumulator = renderStep
        previousQualityFrame = now
        qualityFrames = 0
        qualityDuration = 0
      }
    }, { threshold: 0.01 })
    visibilityObserver.observe(host)

    const render = () => {
      if (cancelled) return
      frame = requestAnimationFrame(render)
      if (!visible || document.hidden || renderer.getContext().isContextLost()) {
        previousScheduleFrame = performance.now()
        return
      }

      const now = performance.now()
      const scheduleDelta = Math.min(100, Math.max(0, now - previousScheduleFrame))
      previousScheduleFrame = now
      renderAccumulator += scheduleDelta
      if (renderAccumulator + 0.5 < renderStep) return
      renderAccumulator %= renderStep
      const motionPaused = reducedMotion || pausedRef.current
      const rawProgress = clamp(progress.get())
      if (motionPaused && !forceRender && Math.abs(rawProgress - lastRenderedProgress) < 0.00001) return
      if (!motionPaused) elapsed += Math.min(scheduleDelta, 50) / 1000
      forceRender = false
      lastRenderedProgress = rawProgress
      if (compact && robotRoot) {
        if (qualityCooldownFrames > 0) {
          qualityCooldownFrames -= 1
          previousQualityFrame = now
        } else {
          if (qualityFrames > 0) qualityDuration += Math.min(50, now - previousQualityFrame)
          previousQualityFrame = now
          qualityFrames += 1
        }
        if (qualityFrames >= 90) {
          const averageFrameTime = qualityDuration / Math.max(1, qualityFrames - 1)
          let nextQualityScale = runtimeQualityScale
          if (averageFrameTime > renderStep * 1.5) nextQualityScale -= 0.1
          else if (averageFrameTime > renderStep * 1.18) nextQualityScale -= 0.05
          else if (averageFrameTime < renderStep * 0.98) nextQualityScale += 0.03
          nextQualityScale = THREE.MathUtils.clamp(nextQualityScale, minimumQualityScale, 1)
          if (Math.abs(nextQualityScale - runtimeQualityScale) > 0.005) {
            runtimeQualityScale = nextQualityScale
            resize()
            qualityCooldownFrames = 45
          }
          qualityFrames = 0
          qualityDuration = 0
          previousQualityFrame = now
        }
      }
      // `progress` is already spring-smoothed by Framer Motion. Keep the 3D
      // camera, cards, DOM chapter and robot on the same linear timeline so an
      // active competition never displays the previous event's card.
      const p = rawProgress
      sampleColorStops(redLight.color, accentLightStops, p)
      sampleColorStops(cyanLight.color, coolLightStops, p)
      sampleColorStops(warmRim.color, rimLightStops, p)
      sampleColorStops(sceneFog.color, fogStops, p)
      sampleColorStops(sceneBackground, backgroundStops, p)
      const angle = -0.56 - p * TIMELINE_TURNS * Math.PI * 2
      const endFraming = smoothStep((p - 0.86) / 0.14)
      const radius = THREE.MathUtils.lerp(compact ? 12.4 : 14.4, compact ? 9.7 : 10.6, p)
        + endFraming * (compact ? 4.2 : 5.7)
      const y = 8.4 - p * 35.4
      camera.position.set(
        Math.cos(angle) * radius,
        y + 1.7 + endFraming * (compact ? 1.05 : 1.35),
        Math.sin(angle) * radius,
      )
      camera.lookAt(0, y - 2.6 + endFraming * (compact ? 3.05 : 2.85), 0)

      const lightTargetY = y - 1.25 + endFraming * 1.5
      redLight.position.set(Math.cos(angle + Math.PI + 0.38) * 7.2, y + 1.4, Math.sin(angle + Math.PI + 0.38) * 7.2)
      redLight.target.position.set(0, lightTargetY, 0)
      cyanLight.position.set(Math.cos(angle + 1.28) * 7.8, y + 5.4, Math.sin(angle + 1.28) * 7.8)
      cyanLight.target.position.set(0, lightTargetY - 0.4, 0)
      warmRim.position.set(Math.cos(angle - 0.72) * 5.4, y - 2.6, Math.sin(angle - 0.72) * 5.4)
      key.position.set(Math.cos(angle - 0.46) * 8.8, y + 10.5, Math.sin(angle - 0.46) * 8.8)
      key.target.position.set(0, lightTargetY, 0)

      lightField.position.set(
        Math.cos(angle + Math.PI) * 4.8,
        y - 1.15 + endFraming * 1.7,
        Math.sin(angle + Math.PI) * 4.8,
      )
      lightField.quaternion.copy(camera.quaternion)
      lightFieldMaterial.uniforms.uAccent.value.copy(redLight.color)
      lightFieldMaterial.uniforms.uCool.value.copy(cyanLight.color)
      lightFieldMaterial.uniforms.uTime.value = reducedMotion ? 0 : elapsed

      particleMaterial.uniforms.uTime.value = reducedMotion ? 0 : elapsed
      particleMaterial.uniforms.uProgress.value = p
      cloudMaterial.uniforms.uTime.value = reducedMotion ? 0 : elapsed
      cloudMaterial.uniforms.uProgress.value = p
      cinematicPass.uniforms.uTime.value = reducedMotion ? 0 : elapsed
      arena?.update(reducedMotion ? 0 : elapsed)
      cinematicPass.uniforms.uProgress.value = p
      if (robotRoot) {
        const assemblyProgress = reducedMotion ? 1 : rawProgress
        const portalSettle = smoothStep((p - 0.78) / 0.18)
        const platformLift = portalSettle * (compact ? 1.8 : 2.05)
        const robotY = y - (compact ? 1.65 : 1.15) + platformLift
        const robotScale = THREE.MathUtils.lerp(compact ? 0.82 : 1, compact ? 0.52 : 0.62, portalSettle)
        if (Math.abs(assemblyProgress - lastAssemblyProgress) > 0.00005) {
          applyAssembly(animatedParts, assemblyProgress)
          lastAssemblyProgress = assemblyProgress
        }
        robotRoot.rotation.y = -0.42 + p * Math.PI * 0.72
        robotRoot.position.y = robotY + Math.sin(elapsed * 0.5) * (reducedMotion ? 0 : 0.08) * (1 - portalSettle)
        robotRoot.scale.setScalar(robotScale)
        if (assemblyAura) {
          assemblyAura.material.uniforms.uTime.value = reducedMotion ? 0 : elapsed
          assemblyAura.material.uniforms.uAssembly.value = assemblyProgress
        }
      }

      cardVisuals.forEach((card) => {
        const distance = Math.abs(p - card.t)
        const focus = smoothStep(1 - distance / (compact ? 0.2 : 0.24))
        const departure = 1 - smoothStep((p - 0.9) / 0.04)
        card.materials.forEach(({ material, opacity }) => {
          material.opacity = opacity * (0.22 + focus * 0.78) * departure
        })
        card.photoMaterial.uniforms.uOpacity.value = card.photoMaterial.opacity
        card.photoMaterial.uniforms.uTime.value = reducedMotion ? 0 : elapsed
        card.group.visible = p < 0.94 && distance < (compact ? 0.24 : 0.34)
        if (card.group.visible) {
          // The mount never translates off the Blender-authored rail. Only the
          // hinge rotation eases into the live camera quaternion, guaranteeing
          // a level, perfectly front-facing reading pose at the active node.
          card.group.quaternion.copy(card.baseQuaternion).slerp(camera.quaternion, focus * focus)
          card.group.updateWorldMatrix(true, false)
          card.group.worldToLocal(cardCameraLocal.copy(camera.position))
          const depth = Math.max(1, Math.abs(cardCameraLocal.z))
          card.photoMaterial.uniforms.uViewOffset.value.set(
            THREE.MathUtils.clamp(cardCameraLocal.x / depth, -1, 1),
            THREE.MathUtils.clamp(cardCameraLocal.y / depth, -1, 1),
          )
        }
      })

      renderer.shadowMap.needsUpdate = motionPaused || shadowFrame % (compact ? 3 : 2) === 0
      shadowFrame += 1
      if (composer) composer.render()
      else renderer.render(scene, camera)
    }
    render()

    return () => {
      cancelled = true
      window.clearTimeout(loadingTimeout)
      delete canvas.dataset.renderTarget
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      canvas.removeEventListener('pointermove', onCardPointerMove)
      canvas.removeEventListener('pointerleave', onCardPointerLeave)
      canvas.removeEventListener('click', onCardClick)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      disposeObject(world)
      hdrTarget?.dispose()
      roomTarget.dispose()
      pmremGenerator.dispose()
      composer.passes.forEach((pass) => pass.dispose())
      composer?.dispose()
      renderer.dispose()
    }
  }, [onNavigate, onStatus, progress, reducedMotion])

  return (
    <div ref={hostRef} className="mechanical-memory__scene" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}

export default function MechanicalMemoryExperience({ navigate }: { navigate: (href: string) => void }) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion() ?? false
  const [status, setStatus] = useState<SceneStatus>('loading')
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [sceneVersion, setSceneVersion] = useState(0)
  const [phase, setPhase] = useState<'intro' | 'journey' | 'end'>('intro')
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const progress = useSpring(scrollYProgress, reducedMotion
    ? { stiffness: 1000, damping: 1000, mass: 0.01 }
    : { stiffness: 96, damping: 29, mass: 0.2 })
  const introOpacity = useTransform(progress, [0, 0.035, 0.105], [1, 1, 0])
  const introY = useTransform(progress, [0, 0.11], [0, -40])
  const endOpacity = useTransform(progress, [0.94, 0.985, 1], [0, 0, 1])
  const cueOpacity = useTransform(progress, [0, 0.04, 0.1], [1, 1, 0])

  useMotionValueEvent(progress, 'change', (value) => {
    const nextPhase = value < 0.105 ? 'intro' : value > 0.985 ? 'end' : 'journey'
    setPhase((current) => current === nextPhase ? current : nextPhase)
    const nearest = MEMORY_ENTRIES.reduce((bestIndex, entry, index) => {
      const bestDistance = Math.abs(MEMORY_ENTRIES[bestIndex].t - value)
      return Math.abs(entry.t - value) < bestDistance ? index : bestIndex
    }, 0)
    setActiveIndex((current) => current === nearest ? current : nearest)
  })

  const progressLabel = useMemo(() => String(activeIndex + 1).padStart(2, '0'), [activeIndex])
  const titleShown = status !== 'loading' || reducedMotion
  const titleReveal = (delay: number, kind: 'mask' | 'fade' = 'mask') => ({
    initial: reducedMotion ? false : kind === 'mask' ? { y: '108%' } : { opacity: 0, y: 14 },
    animate: titleShown ? (kind === 'mask' ? { y: 0 } : { opacity: 1, y: 0 }) : undefined,
    transition: { duration: kind === 'mask' ? 1.3 : 1, delay, ease: [0.16, 1, 0.3, 1] as const },
  })

  const jumpTo = (target: number) => {
    const section = sectionRef.current
    if (!section) return
    const top = window.scrollY + section.getBoundingClientRect().top
    const sticky = section.querySelector<HTMLElement>('.mechanical-memory__sticky')
    const travel = Math.max(0, section.offsetHeight - (sticky?.offsetHeight ?? window.innerHeight))
    window.scrollTo({ top: top + travel * target, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  const routeTo = (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    navigate(href)
  }

  return (
    <section ref={sectionRef} className={`mechanical-memory mechanical-memory--${status}`} data-phase={phase} aria-label="KLZC 机械记忆档案 / Mechanical memory archive">
      <span id="contact" className="mechanical-memory__contact-anchor" data-scroll-end="true" aria-hidden="true" />
      <div className="mechanical-memory__sticky">
        <MechanicalMemoryScene
          key={sceneVersion}
          progress={progress}
          reducedMotion={reducedMotion}
          paused={paused}
          onStatus={setStatus}
          onNavigate={navigate}
        />
        <div className="mechanical-memory__shade" aria-hidden="true" />
        <div className="mechanical-memory__letterbox" aria-hidden="true"><i /><i /></div>

        <motion.header className="mechanical-memory__intro" inert={phase !== 'intro'} style={{ opacity: introOpacity, y: introY }}>
          <motion.p {...titleReveal(0.1, 'fade')}>Cheng Zhang <span aria-hidden="true">/</span> UoA Computer Science</motion.p>
          <h1>
            <span className="mechanical-memory__line"><motion.span {...titleReveal(0.2)}>From Chengdu</motion.span></span>
            <span className="mechanical-memory__line mechanical-memory__line--outline"><motion.span {...titleReveal(0.34)}>to Auckland</motion.span></span>
          </h1>
          <motion.div {...titleReveal(0.7, 'fade')}>
            <strong>2019—NOW</strong>
            <span>一些过去和现在的记录。<em>A record of then and now.</em></span>
          </motion.div>
        </motion.header>

        <div className="mechanical-memory__rail" aria-label="记忆章节 / Memory chapters">
          <span>{progressLabel}</span>
          <div>
            {MEMORY_ENTRIES.map((entry, index) => (
              <button
                key={entry.chapter}
                className={index === activeIndex ? 'is-active' : ''}
                type="button"
                aria-label={`前往 ${entry.titleZh} / Go to ${entry.title}`}
                aria-current={index === activeIndex ? 'step' : undefined}
                onClick={() => jumpTo(entry.t)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
              </button>
            ))}
          </div>
          <em>06</em>
        </div>

        <motion.div className="mechanical-memory__cue" style={{ opacity: cueOpacity }} aria-hidden="true">
          <span>向下滚动 / Scroll</span>
          <i />
        </motion.div>

        <motion.div className="mechanical-memory__end-scrim" aria-hidden="true" style={{ opacity: status === 'error' ? 1 : endOpacity }} />
        <motion.div className="mechanical-memory__end" inert={phase !== 'end' && status !== 'error'} style={{ opacity: status === 'error' ? 1 : endOpacity }}>
          <p>记录 / Records · 06</p>
          <h2>继续浏览。</h2>
          <em>The rest of the reel</em>
          <span>后面的页面按地点、比赛和项目整理。</span>
          <div>
            <a className="mechanical-memory__primary-action" href="/atlas" onClick={(event) => routeTo(event, '/atlas')} data-cursor="地点 Atlas">
              <span>查看地点<small>View places</small></span><ArrowRight size={18} aria-hidden="true" />
            </a>
            <a href="/projects" onClick={(event) => routeTo(event, '/projects')}><span>查看项目<small>View projects</small></span></a>
            <a href="mailto:masterzc624@gmail.com"><span>联系我<small>Email me</small></span></a>
          </div>
        </motion.div>

        <div className="mechanical-memory__controls">
          <span>74000M <span aria-hidden="true">/</span> MECHANICAL MEMORY</span>
          {!reducedMotion && status === 'ready' ? (
            <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)} aria-label={paused ? '继续环境动效 / Resume ambient motion' : '暂停环境动效 / Pause ambient motion'}>
              {paused ? <Play size={14} /> : <Pause size={14} />}
              {paused ? '继续动效' : '暂停动效'}
            </button>
          ) : null}
        </div>

        {status === 'loading' && (
          <div className="mechanical-memory__loading" role="status">
            <span>正在载入机械记忆 / Loading mechanical memory</span>
            <i />
          </div>
        )}
        {status === 'error' && (
          <div className="mechanical-memory__loading mechanical-memory__loading--error" role="status">
            <span>3D 场景暂不可用 / Scene unavailable</span>
            <small>仍可通过导航浏览全部章节 / The archive remains available through navigation.</small>
            <button type="button" onClick={() => { setStatus('loading'); setSceneVersion((version) => version + 1) }}><RotateCcw size={15} /> 重试 3D / Retry</button>
          </div>
        )}
      </div>

      <ol className="mechanical-memory__accessible-list">
        {MEMORY_ENTRIES.map((entry) => (
          <li key={entry.chapter}>
            <a href={entry.destination} onClick={(event) => routeTo(event, entry.destination)}>
              {entry.year} · {entry.placeZh} · {entry.resultZh} · {entry.titleZh}
            </a>
          </li>
        ))}
      </ol>
    </section>
  )
}
