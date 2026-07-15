import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { ArrowRight } from 'lucide-react'
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

type AnimatedPart = {
  object: THREE.Mesh
  finalPosition: THREE.Vector3
  finalQuaternion: THREE.Quaternion
  startPosition: THREE.Vector3
  startQuaternion: THREE.Quaternion
  arcOffset: THREE.Vector3
  startAt: number
  duration: number
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

const ENVIRONMENT_URL = '/models/v4/mechanical-memory-environment.glb'
const ROBOT_URL = '/models/robot-74000m-assembly.glb'

const CINEMATIC_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uGrain: { value: 0.012 },
    uAberration: { value: 0.00068 },
    uVignette: { value: 0.24 },
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
    varying vec2 vUv;

    float random(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime * 13.17) * 43758.5453);
    }

    void main() {
      vec2 fromCenter = vUv - 0.5;
      float edge = dot(fromCenter, fromCenter);
      vec2 offset = fromCenter * edge * uAberration * 9.0;
      vec3 color;
      color.r = texture2D(tDiffuse, vUv + offset).r;
      color.g = texture2D(tDiffuse, vUv).g;
      color.b = texture2D(tDiffuse, vUv - offset).b;
      float vignette = 1.0 - smoothstep(0.14, 0.58, edge) * uVignette;
      color *= vignette;
      float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
      vec3 shadowTint = vec3(0.89, 0.98, 1.05);
      vec3 highlightTint = vec3(1.04, 0.98, 0.99);
      color *= mix(shadowTint, highlightTint, smoothstep(0.08, 0.88, luminance));
      // Broad asymmetric light pools replace the previous uniform black void.
      // Their palette changes by chapter, while the luminance mask protects UI
      // type and the bright robot highlights from being colour-washed.
      float phase = uProgress * 6.2831853;
      vec3 cyan = vec3(0.12, 0.7, 0.78);
      vec3 violet = vec3(0.38, 0.2, 0.72);
      vec3 magenta = vec3(0.8, 0.13, 0.42);
      vec3 amber = vec3(0.82, 0.35, 0.12);
      vec3 leftColor = mix(violet, cyan, 0.5 + 0.5 * sin(phase * 0.72 + 0.8));
      vec3 rightColor = mix(magenta, amber, 0.5 + 0.5 * sin(phase * 0.91 + 2.1));
      vec2 leftVector = (vUv - vec2(0.08, 0.68)) / vec2(0.54, 0.68);
      vec2 rightVector = (vUv - vec2(0.92, 0.34)) / vec2(0.48, 0.62);
      float leftPool = exp(-dot(leftVector, leftVector) * 2.25);
      float rightPool = exp(-dot(rightVector, rightVector) * 2.55);
      float shadowRoom = 1.0 - smoothstep(0.08, 0.72, luminance);
      color += (leftColor * leftPool * 0.115 + rightColor * rightPool * 0.09) * shadowRoom;
      color += vec3(0.006, 0.012, 0.017) * shadowRoom;
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
    description: '在首尔参加第十三届 VEX 亚太机器人锦标赛，获得 VEX IQ 初中组铜奖。',
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
    description: '在重庆参加 VEX 世锦赛中国总决赛，获得 VEX IQ 初中组一等奖。',
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
    description: '以 74000M 队员身份前往青岛参加第十五届 VEX 亚洲锦标赛。',
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
    description: '在上海参加科创青禾全国 VEX 精英赛，获得高中组一等奖。',
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
    description: '在中国—加拿大 VEX 机器人国际赛（西南区）中，74000M 获得团队协作冠军。',
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
    description: '参加第十七届 VEX 亚洲机器人锦标赛签名赛，获得 V5RC 高中组二等奖。',
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
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return
    if (object.geometry) geometries.add(object.geometry)
    const meshMaterials = Array.isArray(object.material) ? object.material : [object.material]
    meshMaterials.forEach((material) => {
      if (!material) return
      materials.add(material)
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) textures.add(value)
      })
    })
  })
  textures.forEach((texture) => texture.dispose())
  materials.forEach((material) => material.dispose())
  geometries.forEach((geometry) => geometry.dispose())
}

function configureRobotAssembly(model: THREE.Object3D, host: THREE.Group) {
  // The source assembly's physical base is inverted relative to the glTF's
  // authored screen orientation, so turn it over before normalizing the model.
  model.rotation.z = Math.PI
  model.updateMatrixWorld(true)
  const bounds = new THREE.Box3().setFromObject(model)
  if (bounds.isEmpty()) return [] as AnimatedPart[]

  const center = bounds.getCenter(new THREE.Vector3())
  const size = bounds.getSize(new THREE.Vector3())
  const scale = 5.45 / Math.max(size.x, size.y, size.z, 0.001)
  const normalizer = new THREE.Group()
  normalizer.position.copy(center).multiplyScalar(-scale)
  normalizer.scale.setScalar(scale)
  normalizer.add(model)
  host.add(normalizer)
  host.position.set(0, -5.1, 0)
  host.rotation.y = -0.42
  host.updateMatrixWorld(true)

  const meshes: THREE.Mesh[] = []
  const robotMaterialSpecs = [
    { color: 0x651427, metalness: 0.56, roughness: 0.34, sheen: 0xff6685 },
    { color: 0x0e3a34, metalness: 0.58, roughness: 0.36, sheen: 0x63ded4 },
    { color: 0x0b1116, metalness: 0.72, roughness: 0.3, sheen: 0x7bb7ca },
    { color: 0x12384c, metalness: 0.62, roughness: 0.33, sheen: 0x74b7ff },
    { color: 0x61402d, metalness: 0.6, roughness: 0.36, sheen: 0xffa56f },
    { color: 0x65757c, metalness: 0.8, roughness: 0.29, sheen: 0xa9dce5 },
  ]
  const robotMaterials = robotMaterialSpecs.map((spec, index) => new THREE.MeshPhysicalMaterial({
    color: spec.color,
    metalness: spec.metalness,
    roughness: spec.roughness,
    envMapIntensity: index === 5 ? 0.96 : 0.82,
    clearcoat: index === 5 ? 0.44 : 0.58,
    clearcoatRoughness: index === 5 ? 0.18 : 0.14,
    iridescence: index === 5 ? 0.07 : 0.16,
    iridescenceIOR: 1.28,
    sheen: index === 5 ? 0.12 : 0.26,
    sheenColor: new THREE.Color(spec.sheen),
    sheenRoughness: 0.42,
  }))
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !object.visible) return
    const index = meshes.length
    const colorRoll = seededNoise(index + 211)
    const materialIndex = colorRoll < 0.08
      ? 0
      : colorRoll < 0.15
        ? 1
        : colorRoll < 0.22
          ? 2
          : colorRoll < 0.28
            ? 3
            : colorRoll < 0.33
              ? 4
              : 5
    object.material = robotMaterials[materialIndex]
    object.castShadow = index % 4 === 0
    object.receiveShadow = true
    meshes.push(object)
  })

  const sizeRanks = new Map<THREE.Mesh, number>()
  const rankedMeshes = [...meshes]
    .map((object) => ({
      object,
      size: new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3()).length(),
    }))
    .sort((a, b) => a.size - b.size)
  rankedMeshes.forEach(({ object }, rank) => {
    sizeRanks.set(object, rank / Math.max(1, rankedMeshes.length - 1))
  })

  // Give every mesh its own deterministic slot instead of reusing a small
  // set of start times. This keeps the build visibly continuous as the user
  // scrolls, rather than releasing whole batches near the end.
  const assemblyOrder = new Map<THREE.Mesh, number>()
  meshes
    .map((object, index) => ({ object, order: seededNoise(index + 347) }))
    .sort((a, b) => a.order - b.order)
    .forEach(({ object }, rank) => {
      assemblyOrder.set(object, rank / Math.max(1, meshes.length - 1))
    })

  const hostWorldInverse = host.matrixWorld.clone().invert()

  return meshes.map((object, index) => {
    const angle = index * 2.399963229728653
    const distance = 3 + seededNoise(index + 31) * 5.3
    const rise = 4.5 + seededNoise(index + 47) * 11
    const parentToHost = hostWorldInverse.clone().multiply(object.parent?.matrixWorld ?? model.matrixWorld)
    const hostToParentLinear = new THREE.Matrix3().setFromMatrix4(parentToHost.invert())
    const localOffset = new THREE.Vector3(
      Math.cos(angle) * distance,
      rise,
      Math.sin(angle) * distance,
    ).applyMatrix3(hostToParentLinear)
    const finalPosition = object.position.clone()
    const finalQuaternion = object.quaternion.clone()
    const startQuaternion = finalQuaternion.clone().multiply(
      new THREE.Quaternion().setFromEuler(new THREE.Euler(
        (seededNoise(index + 71) - 0.5) * 3.1,
        (seededNoise(index + 83) - 0.5) * 3.6,
        (seededNoise(index + 97) - 0.5) * 2.8,
      )),
    )
    const sizeRank = sizeRanks.get(object) ?? 0
    const order = assemblyOrder.get(object) ?? 0
    // Large silhouette-defining members arrive slightly earlier; small
    // hardware keeps falling in until the final stretch. Nothing is held for
    // a global bottom-of-page snap.
    const startAt = THREE.MathUtils.clamp(
      0.004 + order * 0.87 - sizeRank * 0.075 + (1 - sizeRank) * 0.018,
      0.004,
      0.88,
    )
    const duration = Math.min(
      0.075 + seededNoise(index + 127) * 0.055,
      1 - startAt,
    )
    const arcStrength = 0.65 + seededNoise(index + 173) * 1.9
    const arcOffset = new THREE.Vector3(
      Math.cos(angle + Math.PI / 2) * arcStrength,
      seededNoise(index + 197) * 0.85,
      Math.sin(angle + Math.PI / 2) * arcStrength,
    ).applyMatrix3(hostToParentLinear)
    return {
      object,
      finalPosition,
      finalQuaternion,
      startPosition: finalPosition.clone().add(localOffset),
      startQuaternion,
      arcOffset,
      startAt,
      duration,
    }
  })
}

function applyAssembly(parts: AnimatedPart[], progress: number) {
  parts.forEach((part) => {
    const local = smoothStep((progress - part.startAt) / part.duration)
    // A gravity-like descent makes each part visibly travel down into place;
    // the sideways arc prevents the motion from reading as a flat crossfade.
    const descent = 1 - Math.pow(1 - local, 2.35)
    const arc = Math.sin(local * Math.PI) * (1 - local * 0.35)
    part.object.position.lerpVectors(part.startPosition, part.finalPosition, descent)
    part.object.position.addScaledVector(part.arcOffset, arc)
    part.object.quaternion.slerpQuaternions(part.startQuaternion, part.finalQuaternion, local)
  })
}

function createParticles(compact: boolean) {
  // Build a layered, soft-focus dust volume instead of a uniform star field.
  // The dense knots sit behind the helix and give the scene the iridescent,
  // photographic depth of the reference without competing with the cards.
  const count = compact ? 6000 : 11000
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const sizes = new Float32Array(count)
  const alphas = new Float32Array(count)
  const paletteBands = [
    [new THREE.Color(0x63dbea), new THREE.Color(0x3e78bd)],
    [new THREE.Color(0x8f65d8), new THREE.Color(0x63dbea)],
    [new THREE.Color(0xe03a72), new THREE.Color(0x8f65d8)],
    [new THREE.Color(0x39c7b4), new THREE.Color(0xff5f99)],
    [new THREE.Color(0x7756e8), new THREE.Color(0xe03a72)],
    [new THREE.Color(0xe06a35), new THREE.Color(0x4c8be0)],
  ]
  const silver = new THREE.Color(0xb9cbd0)

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
    const color = seed < 0.67 ? colorBand[0] : seed < 0.92 ? colorBand[1] : silver
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
        ? 0.14 + seededNoise(index + 541) * 0.22
        : clustered
          ? 0.14 + seededNoise(index + 541) * 0.23
          : 0.03 + seededNoise(index + 541) * 0.06
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
  const count = compact ? 60 : 72
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const sizes = new Float32Array(count)
  const alphas = new Float32Array(count)
  const palettes = [
    [new THREE.Color(0x2caec2), new THREE.Color(0x4f67c8)],
    [new THREE.Color(0x7753c9), new THREE.Color(0x31b7c4)],
    [new THREE.Color(0xc52f72), new THREE.Color(0x6f4dc1)],
    [new THREE.Color(0x2aa998), new THREE.Color(0xd94885)],
    [new THREE.Color(0x654dcc), new THREE.Color(0xc42c67)],
    [new THREE.Color(0xc55b32), new THREE.Color(0x3974c5)],
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
  const count = compact ? 1800 : 2400
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const sizes = new Float32Array(count)
  const alphas = new Float32Array(count)
  const cyan = new THREE.Color(0x64d3df)
  const red = new THREE.Color(0xe23872)
  const violet = new THREE.Color(0x8362d2)
  const pink = new THREE.Color(0xf064a0)

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
      uAccent: { value: new THREE.Color(0xff3651) },
      uCool: { value: new THREE.Color(0x63dbea) },
      uTime: { value: 0 },
      uIntensity: { value: 0.68 },
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

function timelinePoint(t: number, radius: number, yOffset = 0, orbitOffset = 0.5) {
  const angle = -0.56 + orbitOffset - t * TIMELINE_TURNS * Math.PI * 2
  return new THREE.Vector3(
    Math.cos(angle) * radius,
    6.2 - 35.4 * t + yOffset,
    Math.sin(angle) * radius,
  )
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = value.split(' ')
  const lines: string[] = []
  let current = ''
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word
    if (context.measureText(candidate).width <= maxWidth || !current) current = candidate
    else {
      lines.push(current)
      current = word
    }
  })
  if (current) lines.push(current)
  lines.slice(0, maxLines).forEach((line, index) => context.fillText(line, x, y + index * lineHeight))
}

function createTimelineFaceTexture(entry: MemoryEntry, index: number, compact: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = compact ? 1358 : 1696
  canvas.height = compact ? 800 : 1000
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)

  const width = canvas.width
  const height = canvas.height
  const scale = width / 1696
  const panelX = width * 0.545
  const pad = 58 * scale
  const accent = index % 2 ? '#8be4f4' : '#ff3651'

  context.clearRect(0, 0, width, height)
  const panelGradient = context.createLinearGradient(panelX, 0, width, height)
  panelGradient.addColorStop(0, 'rgba(3, 9, 13, 0.94)')
  panelGradient.addColorStop(0.72, 'rgba(2, 6, 10, 0.98)')
  panelGradient.addColorStop(1, 'rgba(7, 9, 13, 0.99)')
  context.fillStyle = panelGradient
  context.fillRect(panelX, 0, width - panelX, height)

  const topShade = context.createLinearGradient(0, 0, 0, 180 * scale)
  topShade.addColorStop(0, 'rgba(1, 5, 8, 0.82)')
  topShade.addColorStop(1, 'rgba(1, 5, 8, 0)')
  context.fillStyle = topShade
  context.fillRect(0, 0, panelX, 190 * scale)
  const bottomShade = context.createLinearGradient(0, height - 210 * scale, 0, height)
  bottomShade.addColorStop(0, 'rgba(1, 5, 8, 0)')
  bottomShade.addColorStop(1, 'rgba(1, 5, 8, 0.9)')
  context.fillStyle = bottomShade
  context.fillRect(0, height - 220 * scale, panelX, 220 * scale)

  context.strokeStyle = 'rgba(216, 238, 241, 0.42)'
  context.lineWidth = 2 * scale
  context.strokeRect(22 * scale, 22 * scale, width - 44 * scale, height - 44 * scale)
  context.beginPath()
  context.moveTo(panelX, 0)
  context.lineTo(panelX, height)
  context.stroke()

  context.fillStyle = accent
  context.fillRect(panelX - 4 * scale, 70 * scale, 8 * scale, height - 140 * scale)
  context.beginPath()
  context.arc(panelX, 118 * scale, 12 * scale, 0, Math.PI * 2)
  context.fill()

  context.textBaseline = 'alphabetic'
  context.fillStyle = 'rgba(239, 248, 250, 0.94)'
  context.font = `${600} ${27 * scale}px "IBM Plex Mono", Consolas, monospace`
  context.letterSpacing = `${3.2 * scale}px`
  context.fillText(`ARCHIVE / ${String(index + 1).padStart(2, '0')}`, 52 * scale, 72 * scale)
  context.fillText(entry.date, 52 * scale, height - 54 * scale)
  context.textAlign = 'right'
  context.fillText(entry.team, panelX - 48 * scale, height - 54 * scale)
  context.textAlign = 'left'

  context.fillStyle = 'rgba(223, 237, 240, 0.72)'
  context.font = `${600} ${28 * scale}px "IBM Plex Mono", Consolas, monospace`
  context.fillText(`${entry.place}  /  ${entry.placeZh}`, panelX + pad, 92 * scale)

  context.fillStyle = accent
  context.font = `700 ${208 * scale}px "Barlow Condensed", "Arial Narrow", sans-serif`
  context.fillText(entry.year, panelX + pad, 286 * scale)

  context.fillStyle = '#ffffff'
  context.font = `600 ${78 * scale}px "Barlow Condensed", "Arial Narrow", sans-serif`
  wrapCanvasText(context, entry.title.toUpperCase(), panelX + pad, 396 * scale, width - panelX - pad * 1.45, 72 * scale, 2)

  context.fillStyle = 'rgba(242, 249, 250, 0.9)'
  context.font = `600 ${34 * scale}px "Microsoft YaHei", "PingFang SC", sans-serif`
  context.fillText(entry.titleZh, panelX + pad, 548 * scale)

  context.fillStyle = 'rgba(255, 255, 255, 0.075)'
  context.fillRect(panelX + pad, 620 * scale, width - panelX - pad * 1.42, 156 * scale)
  context.fillStyle = accent
  context.fillRect(panelX + pad, 620 * scale, 5 * scale, 156 * scale)
  context.fillStyle = accent
  context.font = `700 ${48 * scale}px "IBM Plex Mono", Consolas, monospace`
  context.fillText(entry.result, panelX + pad + 28 * scale, 682 * scale)
  context.fillStyle = 'rgba(239, 247, 248, 0.92)'
  context.font = `600 ${33 * scale}px "Microsoft YaHei", "PingFang SC", sans-serif`
  context.fillText(entry.resultZh, panelX + pad + 28 * scale, 738 * scale)

  context.fillStyle = '#f6fbfc'
  context.font = `600 ${27 * scale}px "IBM Plex Mono", Consolas, monospace`
  context.fillText('VIEW PROJECT  ↗', panelX + pad, height - 62 * scale)
  context.textAlign = 'right'
  context.fillStyle = accent
  context.fillText('点击查看', width - pad, height - 62 * scale)
  context.textAlign = 'left'

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
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
        vec2 p = abs(uv - 0.5) - vec2(0.455, 0.425);
        float d = length(max(p, 0.0)) + min(max(p.x, p.y), 0.0);
        return 1.0 - smoothstep(-0.018, 0.012, d);
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
        color = mix(color, color * vec3(0.82, 0.98, 1.12), 0.28);
        color += uAccent * (glassSweep * (0.14 + uHover * 0.10));
        color += grain;

        float mask = roundedMask(vUv);
        float innerEdge = smoothstep(0.40, 0.68, length(vUv - 0.5));
        color += uAccent * innerEdge * 0.055;
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
    compact ? 2.84 : 3.38,
    compact ? 2.36 : 2.72,
    entry.t,
  ) + (index === 4 ? 0.08 : 0)
  const finalCardFit = 1 - smoothStep((entry.t - 0.74) / 0.14) * 0.14
  const width = baseWidth * finalCardFit
  const height = width * 0.59
  const depth = compact ? 0.37 : 0.42
  const materials: CardVisual['materials'] = []
  const register = <T extends THREE.Material & { opacity: number }>(material: T, opacity: number) => {
    material.transparent = true
    material.opacity = opacity
    materials.push({ material, opacity })
    return material
  }

  const edgeMaterial = register(new THREE.MeshPhysicalMaterial({
    color: 0x40515a,
    metalness: 0.82,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.07,
    sheen: 0.34,
    sheenColor: new THREE.Color(0xc8f5fb),
    sheenRoughness: 0.28,
    envMapIntensity: 1.28,
    depthWrite: false,
  }), 0.76)

  const bodyMaterial = register(new THREE.MeshPhysicalMaterial({
    color: 0x03080c,
    metalness: 0.48,
    roughness: 0.28,
    clearcoat: 0.92,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.24,
    depthWrite: false,
  }), 0.9)
  const body = new THREE.Mesh(new RoundedBoxGeometry(width + 0.12, height + 0.12, depth, 6, 0.13), bodyMaterial)
  body.position.z = -depth * 0.24
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  // Four independent chassis rails expose the card's real thickness when it
  // enters and leaves the reading position, instead of looking like a photo
  // pasted onto one rounded cube.
  const railDepth = depth * 1.18
  for (const railY of [-1, 1]) {
    const rail = new THREE.Mesh(
      new RoundedBoxGeometry(width + 0.28, compact ? 0.085 : 0.095, railDepth, 4, 0.035),
      edgeMaterial,
    )
    rail.position.set(0, railY * (height * 0.5 + 0.075), -depth * 0.1)
    rail.castShadow = true
    group.add(rail)
  }
  for (const railX of [-1, 1]) {
    const rail = new THREE.Mesh(
      new RoundedBoxGeometry(compact ? 0.085 : 0.095, height + 0.18, railDepth, 4, 0.035),
      edgeMaterial,
    )
    rail.position.set(railX * (width * 0.5 + 0.09), 0, -depth * 0.1)
    rail.castShadow = true
    group.add(rail)
  }

  const accentColor = index % 2 ? 0x8be4f4 : 0xff3651
  const photoWidth = width * 0.505
  const photoHeight = height * 0.79
  const photoX = -width * 0.242
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
  const photoWellMaterial = register(new THREE.MeshStandardMaterial({
    color: 0x010304,
    metalness: 0.38,
    roughness: 0.34,
    depthWrite: false,
  }), 0.88)
  const photoWell = new THREE.Mesh(new RoundedBoxGeometry(photoWidth + 0.18, photoHeight + 0.18, depth * 0.18, 5, 0.075), photoWellMaterial)
  photoWell.position.set(photoX, -height * 0.002, depth * 0.34)
  group.add(photoWell)

  const photoEchoMaterial = register(new THREE.MeshBasicMaterial({
    map: photoTexture,
    color: index % 2 ? 0x397d8a : 0x8a2537,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: true,
  }), 0.16)
  const photoEcho = new THREE.Mesh(new THREE.PlaneGeometry(photoWidth * 0.98, photoHeight * 0.98), photoEchoMaterial)
  photoEcho.position.set(photoX - width * 0.008, height * 0.012, depth * 0.46)
  photoEcho.renderOrder = 1
  group.add(photoEcho)

  const photoGlowMaterial = register(new THREE.MeshBasicMaterial({
    map: photoTexture,
    color: accentColor,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: true,
  }), 0.16)
  const photoGlow = new THREE.Mesh(new THREE.PlaneGeometry(photoWidth * 1.045, photoHeight * 1.045), photoGlowMaterial)
  photoGlow.position.set(photoX, -height * 0.002, depth * 0.58)
  photoGlow.renderOrder = 2
  group.add(photoGlow)

  photoDepthMaterial = register(createPhotoDepthMaterial(photoTexture, accentColor), 0.96)
  const image = new THREE.Mesh(new THREE.PlaneGeometry(photoWidth, photoHeight), photoDepthMaterial)
  image.position.set(photoX, -height * 0.002, depth * 0.72)
  image.renderOrder = 4
  group.add(image)

  const photoGlassMaterial = register(new THREE.MeshPhysicalMaterial({
    color: index % 2 ? 0x95e9f4 : 0xff8798,
    metalness: 0,
    roughness: 0.26,
    transmission: 0.74,
    thickness: 0.78,
    ior: 1.48,
    envMapIntensity: 1.28,
    sheen: 0.5,
    sheenColor: new THREE.Color(index % 2 ? 0x8be4f4 : 0xff6d83),
    sheenRoughness: 0.4,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    iridescence: 0.36,
    iridescenceIOR: 1.28,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), 0.28)
  const photoGlass = new THREE.Mesh(
    new RoundedBoxGeometry(photoWidth + 0.06, photoHeight + 0.06, 0.04, 4, 0.065),
    photoGlassMaterial,
  )
  photoGlass.position.set(photoX, -height * 0.002, depth * 0.94)
  photoGlass.renderOrder = 7
  group.add(photoGlass)

  const photoFrameThickness = compact ? 0.03 : 0.035
  const photoFrameDepth = compact ? 0.075 : 0.085
  for (const frameY of [-1, 1]) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(photoWidth + 0.13, photoFrameThickness, photoFrameDepth),
      edgeMaterial,
    )
    frame.position.set(photoX, frameY * (photoHeight * 0.5 + 0.045), depth * 0.76)
    group.add(frame)
  }
  for (const frameX of [-1, 1]) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(photoFrameThickness, photoHeight + 0.13, photoFrameDepth),
      edgeMaterial,
    )
    frame.position.set(photoX + frameX * (photoWidth * 0.5 + 0.045), 0, depth * 0.76)
    group.add(frame)
  }

  const faceTexture = createTimelineFaceTexture(entry, index, compact)
  const faceMaterial = register(new THREE.MeshBasicMaterial({
    map: faceTexture,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false,
  }), 0.98)
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width, height), faceMaterial)
  // Keep the information layer optically above the physical glass. The image
  // and shell still refract underneath it, while type remains pin-sharp.
  face.position.z = depth * 1.34
  face.renderOrder = 20
  group.add(face)

  const glassMaterial = register(new THREE.MeshPhysicalMaterial({
    color: index % 2 ? 0x25434b : 0x39131b,
    roughness: 0.22,
    metalness: 0.05,
    transmission: 0.72,
    thickness: 0.92,
    ior: 1.49,
    envMapIntensity: 1.34,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    iridescence: 0.42,
    iridescenceIOR: 1.3,
    sheen: 0.46,
    sheenColor: new THREE.Color(index % 2 ? 0x86dce8 : 0xff768d),
    sheenRoughness: 0.36,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), 0.24)
  const glass = new THREE.Mesh(new RoundedBoxGeometry(width - 0.08, height - 0.08, 0.12, 6, 0.11), glassMaterial)
  glass.position.z = depth * 1.04
  glass.renderOrder = 8
  group.add(glass)

  const boltMaterial = register(new THREE.MeshStandardMaterial({
    color: 0xb8c7cc,
    metalness: 0.96,
    roughness: 0.18,
    depthWrite: false,
  }), 0.82)
  const boltGeometry = new THREE.CylinderGeometry(compact ? 0.025 : 0.032, compact ? 0.025 : 0.032, 0.045, 18)
  for (const boltX of [-1, 1]) {
    for (const boltY of [-1, 1]) {
      const bolt = new THREE.Mesh(boltGeometry, boltMaterial)
      bolt.rotation.x = Math.PI / 2
      bolt.position.set(
        boltX * (width * 0.5 - 0.105),
        boltY * (height * 0.5 - 0.105),
        depth * 1.39,
      )
      bolt.renderOrder = 21
      group.add(bolt)
    }
  }

  const louverMaterial = register(new THREE.MeshBasicMaterial({
    color: accentColor,
    toneMapped: false,
    depthWrite: false,
  }), 0.68)
  for (let louverIndex = 0; louverIndex < 5; louverIndex += 1) {
    const louver = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.075, compact ? 0.012 : 0.016, 0.018),
      louverMaterial,
    )
    louver.position.set(
      -width * 0.44 + louverIndex * width * 0.088,
      height * 0.5 + 0.11,
      depth * 0.64,
    )
    group.add(louver)
  }

  const signalMaterial = register(new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: compact ? 1.35 : 1.4,
    metalness: 0.35,
    roughness: 0.22,
  }), 0.92)
  const signal = new THREE.Mesh(new THREE.BoxGeometry(width * 0.34, 0.035, 0.055), signalMaterial)
  signal.position.set(-width * 0.31, -height / 2 - 0.075, depth * 0.7)
  group.add(signal)

  const rearMaterial = register(new THREE.MeshStandardMaterial({
    color: 0x060a0d,
    metalness: 0.84,
    roughness: 0.31,
  }), 0.72)
  const rear = new THREE.Mesh(new RoundedBoxGeometry(width * 0.82, height * 0.72, 0.1, 4, 0.08), rearMaterial)
  rear.position.set(width * 0.09, -height * 0.08, -depth * 0.72)
  group.add(rear)

  // The card is physically mounted to the helix. Its local +Z faces outward,
  // while the twin arms use the rail anchor transformed into card-local space.
  const trackRadius = 6.04
  group.updateMatrixWorld(true)
  const railAnchor = timelinePoint(entry.t, trackRadius, 0.025, orbitOffset)
  const railAnchorLocal = group.worldToLocal(railAnchor)
  const mountStart = new THREE.Vector3(0, 0, -depth * 0.5)
  const mountVector = railAnchorLocal.clone().sub(mountStart)
  const mountReach = mountVector.length()
  const mountMaterial = register(new THREE.MeshStandardMaterial({
    color: 0x263139,
    metalness: 0.94,
    roughness: 0.24,
  }), 0.86)
  const armGeometry = new THREE.BoxGeometry(
    compact ? 0.055 : 0.075,
    compact ? 0.055 : 0.075,
    mountReach,
  )
  for (const armX of [-1, 1]) {
    const arm = new THREE.Mesh(armGeometry, mountMaterial)
    arm.position.copy(mountStart).add(new THREE.Vector3(armX * width * 0.27, 0, 0)).addScaledVector(mountVector, 0.5)
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), mountVector.clone().normalize())
    group.add(arm)
  }
  const clamp = new THREE.Mesh(
    new RoundedBoxGeometry(width * 0.64, compact ? 0.08 : 0.11, compact ? 0.08 : 0.12, 3, 0.025),
    edgeMaterial,
  )
  clamp.position.copy(railAnchorLocal)
  group.add(clamp)

  return {
    group,
    baseQuaternion,
    materials,
    accentMaterial: signalMaterial,
    baseEmissiveIntensity: compact ? 1.35 : 1.4,
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
  onStatus,
  onNavigate,
}: {
  progress: MotionValue<number>
  reducedMotion: boolean
  onStatus: (status: SceneStatus) => void
  onNavigate: (href: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const hostRef = useRef<HTMLDivElement | null>(null)

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
    // Mobile keeps the same lighting and post-processing stack as desktop.
    // Device capability only changes internal resolution, never the art direction.
    const compactPixelRatioCap = constrainedMobile ? 1.8 : 2.35
    const compactPixelBudget = constrainedMobile ? 2_200_000 : 3_300_000
    let runtimeQualityScale = 1
    const resolvePixelRatio = (width: number, height: number) => {
      const deviceRatio = window.devicePixelRatio || 1
      if (!compact) return Math.min(deviceRatio, 1.65)
      const budgetRatio = Math.sqrt(compactPixelBudget / Math.max(1, width * height))
      return Math.max(1, Math.min(deviceRatio, compactPixelRatioCap, budgetRatio) * runtimeQualityScale)
    }
    const pointerNdc = new THREE.Vector2()
    const raycaster = new THREE.Raycaster()
    const startTime = performance.now()
    const world = new THREE.Group()
    const cardVisuals: CardVisual[] = []
    let robotRoot: THREE.Group | null = null
    let assemblyAura: ReturnType<typeof createAssemblyAura> | null = null
    let animatedParts: AnimatedPart[] = []
    let activePixelRatio = 1

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    renderer.setClearColor(0x03080c, 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = compact ? 0.9 : 0.86
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x03080c)
    const sceneFog = new THREE.FogExp2(0x061017, compact ? 0.0135 : 0.0125)
    scene.fog = sceneFog
    scene.add(world)

    const camera = new THREE.PerspectiveCamera(compact ? 56 : 46, 1, 0.05, 180)
    camera.up.set(0, 1, 0)

    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    const roomTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = roomTarget.texture
    let hdrTarget: THREE.WebGLRenderTarget | null = null
    const hdrLoader = new HDRLoader()
    hdrLoader.load(
      '/assets/pbr/empty-warehouse-01-1k.hdr',
      (texture) => {
        if (cancelled) {
          texture.dispose()
          return
        }
        hdrTarget = pmremGenerator.fromEquirectangular(texture)
        scene.environment = hdrTarget.texture
        texture.dispose()
      },
      undefined,
      () => undefined,
    )

    scene.add(new THREE.HemisphereLight(0x8bd7e9, 0x16050a, compact ? 0.38 : 0.36))
    scene.add(new THREE.AmbientLight(0x18323d, compact ? 0.12 : 0.11))
    const key = new THREE.DirectionalLight(0xd8f8ff, compact ? 1.3 : 1.34)
    key.position.set(5, 13, 8)
    key.target.position.set(0, -2, 0)
    key.castShadow = true
    const shadowMapSize = compact && constrainedMobile ? 512 : 1024
    key.shadow.mapSize.set(shadowMapSize, shadowMapSize)
    key.shadow.camera.left = -9
    key.shadow.camera.right = 9
    key.shadow.camera.top = 10
    key.shadow.camera.bottom = -10
    key.shadow.camera.far = 55
    key.shadow.bias = -0.00025
    key.shadow.normalBias = 0.025
    scene.add(key, key.target)
    const redLight = new THREE.SpotLight(0xff244f, compact ? 66 : 72, 30, Math.PI * 0.28, 0.82, 1.45)
    const cyanLight = new THREE.SpotLight(0x66e5f1, compact ? 58 : 64, 32, Math.PI * 0.3, 0.86, 1.35)
    const warmRim = new THREE.PointLight(0xff7b4f, compact ? 10.5 : 12, 18, 2)
    redLight.castShadow = false
    cyanLight.castShadow = false
    scene.add(redLight, redLight.target, cyanLight, cyanLight.target, warmRim)
    const accentLightStops = [0xff3651, 0x8f65d8, 0xe03a72, 0xff4067, 0xd72f86, 0xe06a35]
      .map((value) => new THREE.Color(value))
    const coolLightStops = [0x63dbea, 0x5dd3e8, 0x7f71ff, 0x49d1c1, 0x6f86ff, 0x4c8be0]
      .map((value) => new THREE.Color(value))
    const rimLightStops = [0xff8a4f, 0x8a5fe8, 0xff6a96, 0x6de5cf, 0xd15fff, 0xffa459]
      .map((value) => new THREE.Color(value))
    const fogStops = [0x031015, 0x080818, 0x100614, 0x051312, 0x0c0715, 0x120907]
      .map((value) => new THREE.Color(value))
    const backgroundStops = [0x02090d, 0x050611, 0x0b040d, 0x030b0b, 0x08050f, 0x0c0605]
      .map((value) => new THREE.Color(value))
    const sceneBackground = scene.background as THREE.Color

    const { mesh: lightField, material: lightFieldMaterial } = createCinematicLightField(compact)
    world.add(lightField)
    const { points: cloudVeils, material: cloudMaterial } = createVolumetricClouds(compact)
    const { points: particles, material: particleMaterial } = createParticles(compact)
    world.add(cloudVeils, particles)

    const textureLoader = new THREE.TextureLoader()
    MEMORY_ENTRIES.forEach((entry, index) => {
      const card = createCardVisual(entry, index, textureLoader, compact)
      cardVisuals.push(card)
      world.add(card.group)
    })

    const composer = new EffectComposer(renderer)
    if (renderer.capabilities.isWebGL2) {
      const samples = compact ? 2 : 4
      composer.renderTarget1.samples = samples
      composer.renderTarget2.samples = samples
    }
    composer.addPass(new RenderPass(scene, camera))
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      0.27,
      compact ? 0.46 : 0.48,
      compact ? 0.98 : 0.96,
    )
    composer.addPass(bloomPass)
    const cinematicPass = new ShaderPass(CINEMATIC_SHADER)
    if (compact) {
      cinematicPass.uniforms.uGrain.value = 0.0105
      cinematicPass.uniforms.uAberration.value = 0.00058
      cinematicPass.uniforms.uVignette.value = 0.24
    }
    composer.addPass(cinematicPass)
    composer.addPass(new OutputPass())

    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    onStatus('loading')
    Promise.all([
      loadGltf(loader, ENVIRONMENT_URL),
      loadGltf(loader, ROBOT_URL),
    ]).then(([environment, robot]) => {
      if (cancelled) {
        disposeObject(environment)
        disposeObject(robot)
        return
      }
      const refineEnvironmentMaterial = (
        mesh: THREE.Mesh,
        opacity: number,
        tint?: number,
        emissiveScale = 1,
      ) => {
        const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        const refined = sourceMaterials.map((source) => {
          const material = source.clone()
          material.transparent = true
          material.opacity = opacity
          material.depthWrite = false
          if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
            if (typeof tint === 'number') material.color.lerp(new THREE.Color(tint), 0.34)
            material.roughness = Math.max(material.roughness, 0.22)
            material.envMapIntensity *= 1.08
            material.emissiveIntensity *= emissiveScale
          }
          return material
        })
        mesh.material = Array.isArray(mesh.material) ? refined : refined[0]
        mesh.renderOrder = mesh.name.includes('SIGNAL') || mesh.name.includes('PRACTICAL') ? 2 : 0
      }

      environment.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        object.receiveShadow = true
        object.castShadow = false

        if (object.name.startsWith('BACKBONE_FILAMENT_')) refineEnvironmentMaterial(object, 0.62, undefined, 1.18)
        else if (object.name.startsWith('BACKBONE_BRIDGE_')) refineEnvironmentMaterial(object, 0.44, 0x101820)
        else if (object.name.startsWith('BACKBONE_')) refineEnvironmentMaterial(object, 0.78, 0x0a1117)
        else if (object.name.startsWith('HALO_SIGNAL_')) refineEnvironmentMaterial(object, 0.46, undefined, 1.05)
        else if (object.name.startsWith('HALO_METAL_')) refineEnvironmentMaterial(object, 0.28, 0x0b141a)
        else if (object.name === 'TIMELINE_RAIL_MAIN') refineEnvironmentMaterial(object, 0.28, 0x26353c)
        else if (object.name === 'TIMELINE_RAIL_COMPANION') refineEnvironmentMaterial(object, 0.1, 0x0d151a)
        else if (object.name === 'TIMELINE_RAIL_SIGNAL') refineEnvironmentMaterial(object, 0.3, undefined, 0.68)
        else if (object.name.startsWith('TIMELINE_DOCK_')) refineEnvironmentMaterial(object, 0.72, 0x1c2a31)
        else if (object.name.startsWith('TIMELINE_PRACTICAL_')) refineEnvironmentMaterial(object, 0.88, undefined, 1.3)
        else if (object.name.startsWith('CORE_ORBIT_')) refineEnvironmentMaterial(object, 0.5, undefined, 1.05)
        else if (object.name.startsWith('CROWN_')) refineEnvironmentMaterial(object, 0.54, 0x27343b)
        else if (object.name.startsWith('PORTAL_')) refineEnvironmentMaterial(object, 0.62, 0x111920)
        else if (object.name.startsWith('PRISM_SHARD_')) refineEnvironmentMaterial(object, 0.28, undefined, 0.72)
      })
      world.add(environment)
      robotRoot = new THREE.Group()
      world.add(robotRoot)
      animatedParts = configureRobotAssembly(robot, robotRoot)
      assemblyAura = createAssemblyAura(compact)
      assemblyAura.material.uniforms.uPixelRatio.value = activePixelRatio
      robotRoot.add(assemblyAura.points)
      onStatus('ready')
    }).catch((error) => {
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
    canvas.addEventListener('pointermove', onCardPointerMove, { passive: true })
    canvas.addEventListener('pointerleave', onCardPointerLeave)
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
      camera.aspect = width / height
      camera.fov = compact ? 54 : 46
      camera.updateProjectionMatrix()
      cloudMaterial.uniforms.uPixelRatio.value = pixelRatio
      particleMaterial.uniforms.uPixelRatio.value = pixelRatio
      if (assemblyAura) assemblyAura.material.uniforms.uPixelRatio.value = pixelRatio
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    resize()

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting)
    }, { threshold: 0.01 })
    visibilityObserver.observe(host)

    const cardCameraLocal = new THREE.Vector3()
    let qualityFrames = 0
    let qualityDuration = 0
    let previousQualityFrame = performance.now()
    let adaptiveQualitySettled = !compact
    const render = () => {
      if (cancelled) return
      frame = requestAnimationFrame(render)
      if (!visible) return

      const now = performance.now()
      const elapsed = (now - startTime) / 1000
      if (!adaptiveQualitySettled && robotRoot) {
        if (qualityFrames > 0) qualityDuration += Math.min(50, now - previousQualityFrame)
        previousQualityFrame = now
        qualityFrames += 1
        if (qualityFrames >= 121) {
          const averageFrameTime = qualityDuration / Math.max(1, qualityFrames - 1)
          if (averageFrameTime > 24) {
            runtimeQualityScale = averageFrameTime > 31 ? 0.78 : 0.88
            resize()
          }
          adaptiveQualitySettled = true
        }
      }
      const rawProgress = clamp(progress.get())
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
      cinematicPass.uniforms.uProgress.value = p
      if (robotRoot) {
        const assemblyProgress = reducedMotion ? 1 : rawProgress
        const portalSettle = smoothStep((p - 0.78) / 0.18)
        const platformLift = portalSettle * (compact ? 1.8 : 2.05)
        const robotY = y - (compact ? 1.65 : 1.15) + platformLift
        const robotScale = THREE.MathUtils.lerp(compact ? 0.82 : 1, compact ? 0.52 : 0.62, portalSettle)
        applyAssembly(animatedParts, assemblyProgress)
        robotRoot.rotation.y = -0.42 + p * Math.PI * 0.72
        robotRoot.position.y = robotY + Math.sin(elapsed * 0.5) * (reducedMotion ? 0 : 0.08)
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

      if (composer) composer.render()
      else renderer.render(scene, camera)
    }
    render()

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      canvas.removeEventListener('pointermove', onCardPointerMove)
      canvas.removeEventListener('pointerleave', onCardPointerLeave)
      canvas.removeEventListener('click', onCardClick)
      disposeObject(world)
      hdrTarget?.dispose()
      roomTarget.dispose()
      pmremGenerator.dispose()
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
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const progress = useSpring(scrollYProgress, reducedMotion
    ? { stiffness: 1000, damping: 1000, mass: 0.01 }
    : { stiffness: 96, damping: 29, mass: 0.2 })
  const introOpacity = useTransform(progress, [0, 0.035, 0.105], [1, 1, 0])
  const introY = useTransform(progress, [0, 0.11], [0, -40])
  const endOpacity = useTransform(progress, [0.94, 0.985, 1], [0, 0, 1])
  const cueOpacity = useTransform(progress, [0, 0.04, 0.1], [1, 1, 0])

  useMotionValueEvent(progress, 'change', (value) => {
    const nearest = MEMORY_ENTRIES.reduce((bestIndex, entry, index) => {
      const bestDistance = Math.abs(MEMORY_ENTRIES[bestIndex].t - value)
      return Math.abs(entry.t - value) < bestDistance ? index : bestIndex
    }, 0)
    setActiveIndex((current) => current === nearest ? current : nearest)
  })

  const progressLabel = useMemo(() => String(activeIndex + 1).padStart(2, '0'), [activeIndex])

  const jumpTo = (target: number) => {
    const section = sectionRef.current
    if (!section) return
    const top = window.scrollY + section.getBoundingClientRect().top
    const travel = Math.max(0, section.offsetHeight - window.innerHeight)
    window.scrollTo({ top: top + travel * target, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  const routeTo = (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    navigate(href)
  }

  return (
    <section ref={sectionRef} className={`mechanical-memory mechanical-memory--${status}`} aria-label="KLZC 机械记忆档案 / Mechanical memory archive">
      <div className="mechanical-memory__sticky">
        <MechanicalMemoryScene
          progress={progress}
          reducedMotion={reducedMotion}
          onStatus={setStatus}
          onNavigate={navigate}
        />
        <div className="mechanical-memory__shade" aria-hidden="true" />

        <nav className="mechanical-memory__quick-links" aria-label="快捷导航 / Featured navigation">
          <a href="/projects" onClick={(event) => routeTo(event, '/projects')}><span>项目</span><small>Work</small></a>
          <a href="/profile" onClick={(event) => routeTo(event, '/profile')}><span>关于我</span><small>Profile</small></a>
          <button type="button" onClick={() => jumpTo(1)}><span>联系</span><small>Contact</small></button>
        </nav>

        <motion.header className="mechanical-memory__intro" style={{ opacity: introOpacity, y: introY }}>
          <p>CHENG ZHANG / UOA COMPUTER SCIENCE</p>
          <h1><span>FROM CHENGDU</span><span>TO AUCKLAND</span></h1>
          <div>
            <strong>2019—NOW</strong>
            <span>计算机科学本科生 · 约七年 VEX 机器人经历 · 软件与 AI 工具。</span>
          </div>
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
          <span>向下滑动 / Scroll to descend</span>
          <i />
        </motion.div>

        <motion.div id="contact" className="mechanical-memory__end" style={{ opacity: endOpacity }}>
          <p>序章完成 / PROLOGUE COMPLETE · 06</p>
          <h2>从这里，进入完整故事。</h2>
          <span>接下来沿着五个章节，继续看地点、机器人、比赛、项目与现在。</span>
          <div>
            <a className="mechanical-memory__primary-action" href="/atlas" onClick={(event) => routeTo(event, '/atlas')}>
              <span>从第一章开始<small>Start with the atlas</small></span><ArrowRight size={18} aria-hidden="true" />
            </a>
            <a href="/projects" onClick={(event) => routeTo(event, '/projects')}><span>直接看项目<small>Jump to work</small></span></a>
            <a href="mailto:masterzc624@gmail.com"><span>联系我<small>Email me</small></span></a>
          </div>
        </motion.div>

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
