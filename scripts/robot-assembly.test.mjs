import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { configureRobotAssembly, applyAssembly } from '../src/scene/robotAssembly.ts'

async function loadRobot() {
  const bytes = await readFile(new URL('../public/models/robot-74000m-assembly.glb', import.meta.url))
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  const gltf = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  return gltf.scene
}

for (const compact of [false, true]) {
  test(`real 74000M assembly preserves all 436 parts and batches correctly (${compact ? 'mobile' : 'desktop'})`, async () => {
    const robot = await loadRobot()
    let sourceCount = 0
    robot.traverse((object) => { if (object.isMesh) sourceCount++ })
    assert.equal(sourceCount, 436)
    const host = new THREE.Group()
    const parts = configureRobotAssembly(robot, host, compact)
    assert.equal(parts.length, sourceCount)
    assert(parts.every((part) => part.kind === 'batch'), 'no silent fallback to hundreds of draw calls')
    assert(host.children.length <= 12, `only ${host.children.length} material/shadow batches`)
    for (const progress of [0, .15, .5, .85, 1, .5, 0, 1]) {
      applyAssembly(parts, progress)
      for (const part of parts) {
        assert(part.currentPosition.toArray().every(Number.isFinite))
        assert(part.currentQuaternion.toArray().every(Number.isFinite))
        if (progress === 1) {
          assert(part.currentPosition.distanceTo(part.finalPosition) < 1e-6, 'every part reaches its original assembled position')
          assert(Math.abs(part.currentQuaternion.dot(part.finalQuaternion)) > .99999)
        }
      }
    }
    const bounds = new THREE.Box3().setFromObject(host)
    assert(!bounds.isEmpty())
    assert(bounds.getSize(new THREE.Vector3()).toArray().every((n) => Number.isFinite(n) && n > 0))
    for (const batch of host.children) { batch.dispose(); batch.material.dispose() }
  })
}
