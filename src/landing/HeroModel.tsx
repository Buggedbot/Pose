import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGLTF, useScroll } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { applyScrollPose, type BoneRest } from './landingPoses'

const MODEL_URL = `${import.meta.env.BASE_URL}models/landing.vrm`
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

  const bones = useMemo(() => {
    const map = new Map<string, BoneRest>()
    scene.traverse((o) => {
      if ((o as THREE.Bone).isBone) {
        map.set(o.name, { bone: o as THREE.Bone, rest: o.quaternion.clone() })
      }
    })
    scene.traverse((o) => {
      o.castShadow = true
      o.frustumCulled = false
    })
    normalize(scene)
    return map
  }, [scene])

  useFrame((state, delta) => {
    applyScrollPose(bones, scroll.offset)

    // She glances toward the cursor — damped so the motion has weight, strongest on the
    // hero section and fading out as the scripted poses take over down the page.
    const strength = 1 - Math.min(scroll.offset * 3, 0.8)
    gaze.current.x = THREE.MathUtils.damp(gaze.current.x, state.pointer.x * strength, 3, delta)
    gaze.current.y = THREE.MathUtils.damp(gaze.current.y, state.pointer.y * strength, 3, delta)
    const head = bones.get('J_Bip_C_Head')
    const neck = bones.get('J_Bip_C_Neck')
    if (head) {
      head.bone.rotateY(gaze.current.x * 0.32)
      head.bone.rotateX(-gaze.current.y * 0.14)
    }
    if (neck) {
      neck.bone.rotateY(gaze.current.x * 0.12)
    }

    if (swayRef.current) {
      const t = state.clock.elapsedTime
      swayRef.current.rotation.y = Math.sin(t * 0.4) * 0.07
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
