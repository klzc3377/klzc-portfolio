import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const ARENA_URL = '/models/v6/arena.glb'

// (front radius, front wall height, rows, tread, rise). Must match LOWER_BOWL
// and UPPER_BOWL in blender/scripts/build_arena_scene.py.
const ARENA_BOWLS = [
  [34, 1.6, 20, 0.95, 0.5],
  [57, 17.5, 22, 0.9, 0.62],
] as const
const PORTAL_COUNT = 8
const AISLE_COUNT = 16

export type ArenaBanner = {
  year: string
  place: string
  result: string
}

const FONTS = {
  serif: '"Instrument Serif", Georgia, serif',
  display: '"Barlow Condensed", "Arial Narrow", sans-serif',
  mono: '"IBM Plex Mono", Consolas, monospace',
}

function canvasTexture(width: number, height: number, draw: (context: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  const paint = () => {
    const context = canvas.getContext('2d')
    if (!context) return
    context.clearRect(0, 0, width, height)
    draw(context)
    texture.needsUpdate = true
  }
  paint()
  // Canvas text only uses faces that are already loaded.
  void Promise.all([
    document.fonts?.load(`italic 400 80px ${FONTS.serif}`),
    document.fonts?.load(`700 80px ${FONTS.display}`),
    document.fonts?.load(`500 20px ${FONTS.mono}`),
  ]).catch(() => undefined).then(paint)
  return texture
}

function ledGrid(context: CanvasRenderingContext2D, pitch: number) {
  context.fillStyle = 'rgba(0, 0, 0, 0.42)'
  for (let x = 0; x < context.canvas.width; x += pitch) context.fillRect(x, 0, 1, context.canvas.height)
  for (let y = 0; y < context.canvas.height; y += pitch) context.fillRect(0, y, context.canvas.width, 1)
}

function seeded(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}

function scoreboardTexture(variant: 'team' | 'span') {
  return canvasTexture(1024, 532, (context) => {
    const { width, height } = context.canvas
    context.fillStyle = '#050607'
    context.fillRect(0, 0, width, height)
    context.fillStyle = '#0c0f12'
    context.fillRect(0, 0, width, 70)
    context.fillStyle = '#e9be78'
    context.font = `500 26px ${FONTS.mono}`
    context.letterSpacing = '8px'
    context.textAlign = 'center'
    context.fillText('VEX ROBOTICS COMPETITION', width / 2, 46)
    context.letterSpacing = '0px'
    if (variant === 'team') {
      context.fillStyle = '#f3ece0'
      context.font = `700 236px ${FONTS.display}`
      context.fillText('74000M', width / 2, 318)
      context.fillStyle = 'rgba(243, 236, 224, 0.7)'
      context.font = `500 26px ${FONTS.mono}`
      context.letterSpacing = '10px'
      context.fillText('CHENGDU  →  AUCKLAND', width / 2, 380)
      context.letterSpacing = '0px'
      context.font = `700 64px ${FONTS.display}`
      context.textAlign = 'left'
      context.fillStyle = '#d9503f'
      context.fillText('RED 128', 70, 480)
      context.textAlign = 'right'
      context.fillStyle = '#4d86d6'
      context.fillText('096 BLUE', width - 70, 480)
      context.textAlign = 'center'
      context.fillStyle = 'rgba(243, 236, 224, 0.55)'
      context.font = `500 22px ${FONTS.mono}`
      context.fillText('FINAL · 2:00', width / 2, 470)
    } else {
      context.fillStyle = '#f3ece0'
      context.font = `italic 400 190px ${FONTS.serif}`
      context.fillText('2019—2025', width / 2, 300)
      context.fillStyle = 'rgba(243, 236, 224, 0.72)'
      context.font = `600 52px ${FONTS.display}`
      context.letterSpacing = '6px'
      context.fillText('SEVEN SEASONS · VEX IQ → V5RC', width / 2, 400)
      context.letterSpacing = '0px'
      context.fillStyle = '#e9be78'
      context.fillRect(width / 2 - 40, 440, 80, 3)
    }
    ledGrid(context, 4)
  })
}

function ribbonTexture() {
  const texture = canvasTexture(2048, 96, (context) => {
    const { width, height } = context.canvas
    context.fillStyle = '#040506'
    context.fillRect(0, 0, width, height)
    context.font = `600 58px ${FONTS.display}`
    context.letterSpacing = '6px'
    context.textBaseline = 'middle'
    const parts = ['VEX ROBOTICS', '74000M', 'FROM CHENGDU TO AUCKLAND', '2019 — 2025']
    let x = 40
    parts.forEach((part, index) => {
      context.fillStyle = index % 2 ? '#f3ece0' : '#e9be78'
      context.fillText(part, x, height / 2 + 3)
      x += context.measureText(part).width + 56
      context.fillStyle = '#d9503f'
      context.fillRect(x - 36, height / 2 - 5, 10, 10)
    })
    ledGrid(context, 3)
  })
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

function bannerTexture(banner: ArenaBanner) {
  const texture = canvasTexture(320, 800, (context) => {
    const { width, height } = context.canvas
    context.beginPath()
    context.moveTo(0, 0)
    context.lineTo(width, 0)
    context.lineTo(width, height)
    context.lineTo(width / 2, height - 70)
    context.lineTo(0, height)
    context.closePath()
    const cloth = context.createLinearGradient(0, 0, width, 0)
    cloth.addColorStop(0, '#101722')
    cloth.addColorStop(0.5, '#172131')
    cloth.addColorStop(1, '#0e141d')
    context.fillStyle = cloth
    context.fill()
    context.save()
    context.clip()
    context.strokeStyle = '#c9a062'
    context.lineWidth = 6
    context.strokeRect(16, 16, width - 32, height - 32)
    context.restore()
    context.textAlign = 'center'
    context.fillStyle = '#c9a062'
    context.font = `500 18px ${FONTS.mono}`
    context.letterSpacing = '6px'
    context.fillText('VEX ROBOTICS', width / 2, 80)
    context.letterSpacing = '0px'
    context.fillStyle = '#efe7da'
    context.font = `italic 400 ${banner.year.length > 4 ? 82 : 112}px ${FONTS.serif}`
    context.fillText(banner.year, width / 2, 250)
    context.fillStyle = '#c9a062'
    context.fillRect(width / 2 - 30, 300, 60, 3)
    context.fillStyle = '#efe7da'
    context.font = `600 40px ${FONTS.display}`
    context.letterSpacing = '3px'
    const words = banner.place.split(' ')
    words.forEach((word, index) => context.fillText(word, width / 2, 380 + index * 46))
    context.fillStyle = 'rgba(239, 231, 218, 0.72)'
    context.font = `500 17px ${FONTS.mono}`
    banner.result.split(' ').reduce<string[]>((lines, word) => {
      const last = lines[lines.length - 1]
      if (last && (last + ' ' + word).length <= 14) lines[lines.length - 1] = `${last} ${word}`
      else lines.push(word)
      return lines
    }, []).forEach((line, index) => context.fillText(line, width / 2, 520 + index * 30))
    context.letterSpacing = '0px'
  })
  return texture
}

function createSeats(compact: boolean) {
  const seat = new THREE.BoxGeometry(0.46, 0.08, 0.42)
  seat.translate(0, 0.26, 0.02)
  const back = new THREE.BoxGeometry(0.46, 0.5, 0.06)
  back.translate(0, 0.5, -0.19)
  const geometry = mergeGeometries([seat, back])!
  seat.dispose()
  back.dispose()

  const spacing = compact ? 0.95 : 0.64
  const placements: Array<{ x: number, y: number, z: number, sector: number, bowl: number }> = []
  ARENA_BOWLS.forEach(([frontRadius, wall, rows, tread, rise], bowl) => {
    for (let row = 0; row < rows; row += 1) {
      const radius = frontRadius + row * tread + tread * 0.55
      const y = wall + row * rise
      const count = Math.floor((Math.PI * 2 * radius) / spacing)
      for (let index = 0; index < count; index += 1) {
        const angle = (index / count) * Math.PI * 2
        const aisleArc = ((angle / (Math.PI * 2)) * AISLE_COUNT % 1) * (Math.PI * 2 * radius / AISLE_COUNT)
        if (aisleArc < 0.6 || aisleArc > Math.PI * 2 * radius / AISLE_COUNT - 0.6) continue
        if (bowl === 0 && row >= 3 && row <= 8) {
          const portalPhase = ((angle / (Math.PI * 2)) * PORTAL_COUNT + 0.5) % 1
          if (Math.abs(portalPhase - 0.5) * (Math.PI * 2 * radius / PORTAL_COUNT) < 2.1) continue
        }
        placements.push({
          x: Math.cos(angle) * radius,
          y,
          z: Math.sin(angle) * radius,
          sector: Math.floor((angle / (Math.PI * 2)) * AISLE_COUNT),
          bowl,
        })
      }
    }
  })

  const material = new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0.08, envMapIntensity: 0.1 })
  const seats = new THREE.InstancedMesh(geometry, material, placements.length)
  seats.name = 'ARENA_SEATS'
  const dummy = new THREE.Object3D()
  const color = new THREE.Color()
  const palettes = [
    [0x1c2633, 0x232b33],
    [0x2a1b1d, 0x1c2633],
  ]
  placements.forEach((placement, index) => {
    dummy.position.set(placement.x, placement.y, placement.z)
    dummy.lookAt(0, placement.y, 0)
    dummy.updateMatrix()
    seats.setMatrixAt(index, dummy.matrix)
    color.setHex(palettes[placement.bowl][placement.sector % 2])
    color.offsetHSL(0, 0, (seeded(index) - 0.5) * 0.02)
    seats.setColorAt(index, color)
  })
  seats.instanceMatrix.needsUpdate = true
  if (seats.instanceColor) seats.instanceColor.needsUpdate = true
  return seats
}

/** Amber step lights on both edges of every aisle, the bowl's only light. */
function createAisleLights() {
  const positions: THREE.Vector3[] = []
  ARENA_BOWLS.forEach(([frontRadius, wall, rows, tread, rise]) => {
    for (let row = 0; row < rows; row += 1) {
      const radius = frontRadius + row * tread + 0.08
      const y = wall + row * rise + 0.03
      for (let aisle = 0; aisle < AISLE_COUNT; aisle += 1) {
        const center = (aisle / AISLE_COUNT) * Math.PI * 2
        for (const side of [-1, 1]) {
          const angle = center + (side * 0.5) / radius
          positions.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius))
        }
      }
    }
  })
  const material = new THREE.MeshBasicMaterial({ color: 0xe9a65a })
  material.color.multiplyScalar(1.6)
  const lights = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 0.03, 0.09), material, positions.length)
  lights.name = 'ARENA_AISLE_LIGHTS'
  const matrix = new THREE.Matrix4()
  positions.forEach((position, index) => lights.setMatrixAt(index, matrix.makeTranslation(position)))
  lights.instanceMatrix.needsUpdate = true
  return lights
}

function createBeam(origin: THREE.Vector3, target: THREE.Vector3, seed: number) {
  const length = origin.distanceTo(target)
  const geometry = new THREE.CylinderGeometry(0.22, 2.1, length, 28, 1, true)
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0xffe4bd) },
      uIntensity: { value: 0.065 },
      uTime: { value: 0 },
      uSeed: { value: seed },
    },
    vertexShader: `
      varying float vAlong;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vAlong = uv.y;
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-viewPosition.xyz);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uTime;
      uniform float uSeed;
      varying float vAlong;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        // Bright along the axis, gone at the silhouette: a light shaft in haze.
        float core = pow(clamp(abs(dot(normalize(vNormal), normalize(vView))), 0.0, 1.0), 2.2);
        float along = pow(clamp(vAlong, 0.0, 1.0), 1.6) * 0.9 + 0.1;
        float flicker = 0.94 + 0.06 * sin(uTime * 0.6 + uSeed * 6.283);
        gl_FragColor = vec4(uColor * core * along * uIntensity * flicker, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
  const beam = new THREE.Mesh(geometry, material)
  beam.position.copy(origin).add(target).multiplyScalar(0.5)
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), origin.clone().sub(target).normalize())
  beam.renderOrder = 3
  beam.name = 'ARENA_BEAM'
  return { beam, material }
}

/**
 * Dress the arena GLB with everything that is cheaper or better built at
 * runtime: seats, screen and banner graphics, light shafts and stage lights.
 */
export function dressArena(root: THREE.Object3D, options: { compact: boolean, banners: ArenaBanner[] }) {
  const { compact, banners } = options
  root.updateMatrixWorld(true)
  const lenses: THREE.Mesh[] = []
  const dimmed: THREE.MeshStandardMaterial[] = []
  const scoreboardVariants: Record<string, 'team' | 'span'> = { S: 'team', N: 'team', E: 'span', W: 'span' }

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.castShadow = false
    // The official field (FIELD_*) and the floor catch the robot's shadow.
    object.receiveShadow = object.name.startsWith('FIELD_') || object.name === 'ARENA_FLOOR'
    const material = object.material as THREE.MeshStandardMaterial
    if (object.name.startsWith('JUMBO_SCREEN_')) {
      const screen = new THREE.MeshBasicMaterial({ map: scoreboardTexture(scoreboardVariants[object.name.slice(-1)] ?? 'team') })
      screen.color.setScalar(1.35)
      object.material = screen
    } else if (material?.name === 'FieldPoly') {
      material.transparent = true
      material.opacity = 0.1
      material.depthWrite = false
      material.envMapIntensity = 1.6
    } else if (object.name.startsWith('FIXTURE_LENS_')) {
      lenses.push(object)
    } else if (material instanceof THREE.MeshStandardMaterial && material.emissive.getHex() === 0) {
      // House lights are off: the bowl only reads by its rim, the LED boards
      // and the light falling off the field, never by flat ambient fill.
      material.envMapIntensity = object.name.startsWith('FIELD_') ? 0.35 : 0.12
      dimmed.push(material)
    }
  })

  const seats = createSeats(compact)
  dimmed.push(seats.material as THREE.MeshStandardMaterial)
  root.add(seats, createAisleLights())

  const ribbons = [
    { radius: ARENA_BOWLS[0][0] - 0.04, bottom: 0.35, height: 0.95, repeat: 8 },
    { radius: ARENA_BOWLS[1][0] - 0.06, bottom: 13.8, height: 1.5, repeat: 12 },
  ]
  ribbons.forEach(({ radius, bottom, height, repeat }) => {
    const map = ribbonTexture()
    // Seen from inside the bowl, so flip U to keep the text readable.
    map.repeat.set(-repeat, 1)
    const ribbonMaterial = new THREE.MeshBasicMaterial({ map, side: THREE.BackSide })
    ribbonMaterial.color.setScalar(1.15)
    const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, compact ? 128 : 256, 1, true), ribbonMaterial)
    ribbon.position.y = bottom + height / 2
    ribbon.name = 'ARENA_RIBBON'
    root.add(ribbon)
  })

  const beamMaterials: THREE.ShaderMaterial[] = []
  const lensOrigin = new THREE.Vector3()
  lenses.forEach((lens, index) => {
    if (compact && index % 2) return
    const target = lens.userData.beam_target as number[] | undefined
    if (!target) return
    root.worldToLocal(lens.getWorldPosition(lensOrigin))
    const { beam, material } = createBeam(lensOrigin.clone(), new THREE.Vector3(...target), index / lenses.length)
    if (compact) material.uniforms.uIntensity.value = 0.075
    beamMaterials.push(material)
    root.add(beam)
  })

  const swings: THREE.Object3D[] = []
  banners.forEach((banner, index) => {
    const angle = -0.9 + (index / banners.length) * Math.PI * 2
    const top = 43.5
    const pivot = new THREE.Group()
    pivot.position.set(Math.cos(angle) * 26, top, Math.sin(angle) * 26)
    pivot.lookAt(0, top, 0)
    const swing = new THREE.Group()
    pivot.add(swing)
    const map = bannerTexture(banner)
    const cloth = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 6.5),
      new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.92, metalness: 0 }),
    )
    cloth.position.y = -3.25
    swing.add(cloth)
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 2.9, 8),
      new THREE.MeshStandardMaterial({ color: 0x8a8f93, metalness: 0.9, roughness: 0.35 }),
    )
    rod.rotation.z = Math.PI / 2
    swing.add(rod)
    swings.push(swing)
    root.add(pivot)
  })

  // Four field spots from the rig corners pool light on the field and let it
  // fall off before the stands, like a broadcast with the house lights down.
  const rigY = 32.2
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const spot = new THREE.SpotLight(0xffe6c4, compact ? 1100 : 1300, 0, 0.3, 0.5, 2)
    spot.position.set(sx * 12.5, rigY, sz * 12.5)
    spot.target.position.set(-sx * 2.5, 0, -sz * 2.5)
    root.add(spot, spot.target)
  }

  return {
    /**
     * three.js ignores envMapIntensity for the scene-wide environment, so the
     * dimmed arena materials carry their own reference to the same map.
     */
    setEnvironment(texture: THREE.Texture | null) {
      dimmed.forEach((material) => {
        material.envMap = texture
        material.needsUpdate = true
      })
    },
    update(elapsed: number) {
      beamMaterials.forEach((material) => { material.uniforms.uTime.value = elapsed })
      swings.forEach((swing, index) => {
        swing.rotation.x = Math.sin(elapsed * 0.35 + index * 1.7) * 0.025
      })
    },
  }
}
