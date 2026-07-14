import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGLTF, useScroll } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { applyScrollPose, resolveHumanoidBones, type BoneRest, type Role } from './landingPoses'

const MODEL_URL = `${import.meta.env.BASE_URL}models/figure.glb`
const TARGET_HEIGHT = 1.6

// Recenter on X/Z, rest feet on y=0, scale to a consistent height.
function normalize(object: THREE.Object3D) {
  if (object.userData.__normalized) return
  const box = new THREE.Box3().setFromObject(object)
  const size = new THREE.Vector3()
  box.getSize(size)
  const center = new THREE.Vector3()
  box.getCenter(center)
  object.position.x -= center.x
  object.position.z -= center.z
  object.position.y -= box.min.y
  if (size.y > 0.001) object.scale.multiplyScalar(TARGET_HEIGHT / size.y)
  object.userData.__normalized = true
}

export function HeroModel() {
  const { scene } = useGLTF(MODEL_URL)
  const scroll = useScroll()
  const swayRef = useRef<THREE.Group>(null)
  const gaze = useRef({ x: 0, y: 0 })

  const roleBones = useMemo(() => {
    const byName = new Map<string, THREE.Bone>()
    scene.traverse((o) => {
      if ((o as THREE.Bone).isBone) byName.set(o.name, o as THREE.Bone)
      o.castShadow = true
      o.frustumCulled = false
    })
    const resolved = resolveHumanoidBones([...byName.keys()])
    const map = new Map<Role, BoneRest>()
    for (const role of Object.keys(resolved) as Role[]) {
      const name = resolved[role]
      const bone = name ? byName.get(name) : undefined
      if (bone) map.set(role, { bone, rest: bone.quaternion.clone() })
    }
    normalize(scene)
    return map
  }, [scene])

  useFrame((state, delta) => {
    applyScrollPose(roleBones, scroll.offset)

    // She glances toward the cursor — strongest on the hero section, fading as the
    // scripted poses take over further down the page.
    const strength = 1 - Math.min(scroll.offset * 3, 0.85)
    gaze.current.x = THREE.MathUtils.damp(gaze.current.x, state.pointer.x * strength, 3, delta)
    gaze.current.y = THREE.MathUtils.damp(gaze.current.y, state.pointer.y * strength, 3, delta)
    const head = roleBones.get('head')
    const neck = roleBones.get('neck')
    if (head) {
      head.bone.rotateY(gaze.current.x * 0.3)
      head.bone.rotateX(-gaze.current.y * 0.12)
    }
    if (neck) neck.bone.rotateY(gaze.current.x * 0.12)

    if (swayRef.current) {
      const t = state.clock.elapsedTime
      swayRef.current.rotation.y = Math.sin(t * 0.4) * 0.06
      swayRef.current.position.y = Math.sin(t * 0.9) * 0.012
    }
  })

  return (
    <group ref={swayRef} position={[-0.55, 0, 0]}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(MODEL_URL)
