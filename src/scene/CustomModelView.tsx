import { useContext, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three-stdlib'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useStore } from '../state/useStore'
import { BoneRefsContext } from './boneRefsContext'
import type { DynamicBoneDef } from './customModel'

const TARGET_HEIGHT = 1.7

function boneId(bone: THREE.Bone): string {
  return bone.name || bone.uuid
}

function prettify(name: string): string {
  return (name || 'Bone')
    .replace(/^mixamorig:?/i, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
}

// Recenters the model on the X/Z origin and rests its feet on the floor (y=0),
// then scales it to roughly human height so the existing camera/lighting rig frames it well.
function normalizeTransform(object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object)
  const size = new THREE.Vector3()
  box.getSize(size)
  const center = new THREE.Vector3()
  box.getCenter(center)
  object.position.x -= center.x
  object.position.z -= center.z
  object.position.y -= box.min.y
  if (size.y > 0.001) {
    object.scale.multiplyScalar(TARGET_HEIGHT / size.y)
  }
}

// Click-picking uses an allowlist of core skeleton parts so hair, cloth, breast, and facial
// bones are never grabbed. A bone is poseable if it names a body part AND isn't a
// twist/corrective helper. Rigs with no recognised names fall back to all bones.
const PRIMARY_BONE =
  /pelvis|hips?|spine|chest|torso|neck|head|clavicle|shoulder|upperarm|lowerarm|forearm|hand|thigh|calf|shin|upperleg|lowerleg|foot|knee|elbow|finger|thumb|index|middle|ring|pinky|(^|_)arm(_|\d|$)|(^|_)leg(_|\d|$)/i
const HELPER_BONE =
  /twist|fix|fuzz|_end($|_)|metacarpal|corrective|_ik\b|^ik_|roll|bckl|latissimus|dummy|helper|adjust|scapula|(^|_)root|earring|jnt|muscle/i

export interface CustomModelViewProps {
  url: string
  boneRefs: React.MutableRefObject<Record<string, THREE.Object3D | null>>
}

export function CustomModelView({ url, boneRefs }: CustomModelViewProps) {
  const contextBoneRefs = useContext(BoneRefsContext)
  const refs = contextBoneRefs ?? boneRefs
  const registerCustomBones = useStore((s) => s.registerCustomBones)
  const handleModelError = useStore((s) => s.handleModelError)
  const selectBone = useStore((s) => s.selectBone)
  const [scene, setScene] = useState<THREE.Object3D | null>(null)
  // Holds only the poseable subset of the skeleton (see `poseable` below) — real anatomy
  // joints, not twist/IK/finger-corrective helpers.
  const bonesRef = useRef<THREE.Bone[]>([])

  useEffect(() => {
    let cancelled = false
    const loader = new GLTFLoader()
    // Bundled/imported models may be meshopt-compressed to keep them small.
    const decoder = typeof MeshoptDecoder === 'function' ? (MeshoptDecoder as () => unknown)() : MeshoptDecoder
    loader.setMeshoptDecoder(decoder as Parameters<GLTFLoader['setMeshoptDecoder']>[0])

    loader.load(
      url,
      (gltf) => {
        if (cancelled) return

        const bones: THREE.Bone[] = []
        gltf.scene.traverse((obj) => {
          if ((obj as THREE.Bone).isBone) bones.push(obj as THREE.Bone)
        })

        if (bones.length === 0) {
          handleModelError('That file has no skeleton to pose. Upload a rigged (skinned) GLB/GLTF model.')
          return
        }

        normalizeTransform(gltf.scene)

        // Only the poseable subset is registered with the store, ref map, and per-frame
        // sync — a dense game rig can have hundreds of twist/IK/finger-corrective bones
        // that would otherwise bloat state and saved poses for no posing benefit. Rigs
        // with no recognised primary bones (e.g. very small/simple rigs) fall back to
        // treating every bone as poseable so nothing breaks.
        const primary = bones.filter((b) => PRIMARY_BONE.test(b.name) && !HELPER_BONE.test(b.name))
        const poseable = primary.length ? primary : bones

        const defs: DynamicBoneDef[] = poseable.map((b) => {
          let parent = b.parent
          while (parent && !poseable.includes(parent as THREE.Bone)) {
            parent = parent.parent
          }
          return {
            id: boneId(b),
            parent: parent && (parent as THREE.Bone).isBone ? boneId(parent as THREE.Bone) : null,
            label: prettify(b.name),
          }
        })

        const initial: Record<string, { x: number; y: number; z: number }> = {}
        poseable.forEach((b) => {
          initial[boneId(b)] = {
            x: THREE.MathUtils.radToDeg(b.rotation.x),
            y: THREE.MathUtils.radToDeg(b.rotation.y),
            z: THREE.MathUtils.radToDeg(b.rotation.z),
          }
        })

        bonesRef.current = poseable
        registerCustomBones(defs, initial)
        poseable.forEach((b) => {
          refs.current[boneId(b)] = b
        })
        setScene(gltf.scene)
      },
      undefined,
      (err) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Failed to load this model file.'
        handleModelError(message)
      },
    )

    return () => {
      cancelled = true
      bonesRef.current.forEach((b) => {
        delete refs.current[boneId(b)]
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  useFrame(() => {
    if (bonesRef.current.length === 0) return
    const { rotations, selectedBone, isDragging } = useStore.getState()
    for (const bone of bonesRef.current) {
      const id = boneId(bone)
      if (isDragging && id === selectedBone) continue
      const r = rotations[id]
      if (!r) continue
      bone.rotation.set(
        THREE.MathUtils.degToRad(r.x),
        THREE.MathUtils.degToRad(r.y),
        THREE.MathUtils.degToRad(r.z),
      )
    }
  })

  // Imported meshes are skinned, so we can't hang a click handler on each bone the way the
  // procedural rig does. Instead, when the model is clicked we pick the bone whose current
  // world position is nearest the clicked point — clicking a forearm grabs the forearm, etc.
  function handleClick(e: ThreeEvent<MouseEvent>) {
    if (bonesRef.current.length === 0) return
    e.stopPropagation()
    const point = e.point
    const world = new THREE.Vector3()
    let nearest: THREE.Bone | null = null
    let nearestDist = Infinity
    for (const bone of bonesRef.current) {
      bone.getWorldPosition(world)
      const d = world.distanceToSquared(point)
      if (d < nearestDist) {
        nearestDist = d
        nearest = bone
      }
    }
    if (nearest) selectBone(boneId(nearest))
  }

  function handlePointerOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
  }

  function handlePointerOut() {
    document.body.style.cursor = 'auto'
  }

  if (!scene) return null
  return (
    <primitive
      object={scene}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    />
  )
}
