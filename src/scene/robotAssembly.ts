import * as THREE from 'three'

type AnimatedPartBase = {
  finalPosition: THREE.Vector3
  finalQuaternion: THREE.Quaternion
  startPosition: THREE.Vector3
  startQuaternion: THREE.Quaternion
  arcOffset: THREE.Vector3
  currentPosition: THREE.Vector3
  currentQuaternion: THREE.Quaternion
  startAt: number
  duration: number
}

export type AnimatedPart = AnimatedPartBase & (
  | { kind: 'mesh'; object: THREE.Mesh }
  | {
    kind: 'batch'
    batch: THREE.BatchedMesh
    instanceId: number
    finalScale: THREE.Vector3
    matrix: THREE.Matrix4
  }
)

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

export function configureRobotAssembly(model: THREE.Object3D, host: THREE.Group, compact: boolean) {
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
  const materialIndices = new Map<THREE.Mesh, number>()
  const robotMaterialSpecs = [
    { color: 0x683d33, metalness: 0.7, roughness: 0.33 },
    { color: 0x365052, metalness: 0.78, roughness: 0.32 },
    { color: 0x151b21, metalness: 0.25, roughness: 0.48 },
    { color: 0x454d55, metalness: 0.86, roughness: 0.26 },
    { color: 0x92704a, metalness: 0.85, roughness: 0.3 },
    { color: 0x9da6ad, metalness: 0.92, roughness: 0.28 },
  ]
  const robotMaterials = robotMaterialSpecs.map((spec, index) => new THREE.MeshPhysicalMaterial({
    color: spec.color,
    metalness: spec.metalness,
    roughness: spec.roughness,
    envMapIntensity: index === 5 ? 1.12 : 0.92,
    clearcoat: index === 2 ? 0.04 : 0.16,
    clearcoatRoughness: 0.32,
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
    object.castShadow = compact ? false : index % 4 === 0
    object.receiveShadow = true
    materialIndices.set(object, materialIndex)
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

  // Batch the 436 source meshes on desktop as well as mobile.
  // Individual meshes remain a compatibility fallback below.
  {
    type BatchEntry = {
      object: THREE.Mesh
      index: number
      finalMatrix: THREE.Matrix4
      finalPosition: THREE.Vector3
      finalQuaternion: THREE.Quaternion
      finalScale: THREE.Vector3
      startPosition: THREE.Vector3
      startQuaternion: THREE.Quaternion
      arcOffset: THREE.Vector3
      startAt: number
      duration: number
      castsShadow: boolean
      materialIndex: number
    }

    const batchEntries = meshes.map((object, index): BatchEntry => {
      const angle = index * 2.399963229728653
      const distance = 3 + seededNoise(index + 31) * 5.3
      const rise = 4.5 + seededNoise(index + 47) * 11
      const finalMatrix = hostWorldInverse.clone().multiply(object.matrixWorld)
      const finalPosition = new THREE.Vector3()
      const finalQuaternion = new THREE.Quaternion()
      const finalScale = new THREE.Vector3()
      finalMatrix.decompose(finalPosition, finalQuaternion, finalScale)
      const startQuaternion = finalQuaternion.clone().multiply(
        new THREE.Quaternion().setFromEuler(new THREE.Euler(
          (seededNoise(index + 71) - 0.5) * 3.1,
          (seededNoise(index + 83) - 0.5) * 3.6,
          (seededNoise(index + 97) - 0.5) * 2.8,
        )),
      )
      const sizeRank = sizeRanks.get(object) ?? 0
      const order = assemblyOrder.get(object) ?? 0
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
      return {
        object,
        index,
        finalMatrix,
        finalPosition,
        finalQuaternion,
        finalScale,
        startPosition: finalPosition.clone().add(new THREE.Vector3(
          Math.cos(angle) * distance,
          rise,
          Math.sin(angle) * distance,
        )),
        startQuaternion,
        arcOffset: new THREE.Vector3(
          Math.cos(angle + Math.PI / 2) * arcStrength,
          seededNoise(index + 197) * 0.85,
          Math.sin(angle + Math.PI / 2) * arcStrength,
        ),
        startAt,
        duration,
        castsShadow: sizeRank >= 0.955,
        materialIndex: materialIndices.get(object) ?? 5,
      }
    })

    const groupedEntries = new Map<string, BatchEntry[]>()
    batchEntries.forEach((entry) => {
      const key = `${entry.materialIndex}:${entry.castsShadow ? 1 : 0}`
      const group = groupedEntries.get(key)
      if (group) group.push(entry)
      else groupedEntries.set(key, [entry])
    })

    const batches: THREE.BatchedMesh[] = []
    const batchedParts: AnimatedPart[] = []
    try {
      groupedEntries.forEach((entries) => {
        const totalVertices = entries.reduce(
          (sum, entry) => sum + entry.object.geometry.getAttribute('position').count,
          0,
        )
        const totalIndices = entries.reduce(
          (sum, entry) => sum + (entry.object.geometry.index?.count ?? 0),
          0,
        )
        const material = robotMaterials[entries[0].materialIndex]
        const batch = new THREE.BatchedMesh(entries.length, totalVertices, totalIndices, material)
        batch.castShadow = entries[0].castsShadow
        batch.receiveShadow = true
        batch.frustumCulled = false
        batch.perObjectFrustumCulled = true
        batch.sortObjects = false
        batches.push(batch)

        entries.forEach((entry) => {
          const geometryId = batch.addGeometry(entry.object.geometry)
          const instanceId = batch.addInstance(geometryId)
          batch.setMatrixAt(instanceId, entry.finalMatrix)
          batchedParts.push({
            kind: 'batch',
            batch,
            instanceId,
            finalPosition: entry.finalPosition,
            finalQuaternion: entry.finalQuaternion,
            finalScale: entry.finalScale,
            startPosition: entry.startPosition,
            startQuaternion: entry.startQuaternion,
            arcOffset: entry.arcOffset,
            currentPosition: entry.finalPosition.clone(),
            currentQuaternion: entry.finalQuaternion.clone(),
            matrix: new THREE.Matrix4(),
            startAt: entry.startAt,
            duration: entry.duration,
          })
        })
      })

      host.remove(normalizer)
      batches.forEach((batch) => host.add(batch))
      const sourceGeometries = new Set(meshes.map((mesh) => mesh.geometry))
      sourceGeometries.forEach((geometry) => geometry.dispose())
      return batchedParts
    } catch (error) {
      console.warn('Falling back to individual robot meshes', error)
      batches.forEach((batch) => batch.dispose())
    }
  }

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
      kind: 'mesh' as const,
      object,
      finalPosition,
      finalQuaternion,
      startPosition: finalPosition.clone().add(localOffset),
      startQuaternion,
      arcOffset,
      currentPosition: finalPosition.clone(),
      currentQuaternion: finalQuaternion.clone(),
      startAt,
      duration,
    }
  })
}

export function applyAssembly(parts: AnimatedPart[], progress: number) {
  parts.forEach((part) => {
    const local = smoothStep((progress - part.startAt) / part.duration)
    // A gravity-like descent makes each part visibly travel down into place;
    // the sideways arc prevents the motion from reading as a flat crossfade.
    const descent = 1 - Math.pow(1 - local, 2.35)
    const arc = Math.sin(local * Math.PI) * (1 - local * 0.35)
    part.currentPosition.lerpVectors(part.startPosition, part.finalPosition, descent)
    part.currentPosition.addScaledVector(part.arcOffset, arc)
    part.currentQuaternion.slerpQuaternions(part.startQuaternion, part.finalQuaternion, local)
    if (part.kind === 'mesh') {
      part.object.position.copy(part.currentPosition)
      part.object.quaternion.copy(part.currentQuaternion)
    } else {
      part.batch.setMatrixAt(
        part.instanceId,
        part.matrix.compose(part.currentPosition, part.currentQuaternion, part.finalScale),
      )
    }
  })
}

