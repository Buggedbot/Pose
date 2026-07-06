import { useContext, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useFrame } from '@react-three/fiber'
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

export interface CustomModelViewProps {
  url: string
  boneRefs: React.MutableRefObject<Record<string, THREE.Object3D | null>>
}

export function CustomModelView({ url, boneRefs }: CustomModelViewProps) {
  const contextBoneRefs = useContext(BoneRefsContext)
  const refs = contextBoneRefs ?? boneRefs
  const registerCustomBones = useStore((s) => s.registerCustomBones)
  const handleModelError = useStore((s) => s.handleModelError)
  const [scene, setScene] = useState<THREE.Object3D | null>(null)
  const bonesRef = useRef<THREE.Bone[]>([])

  useEffect(() => {
    let cancelled = false
    const loader = new GLTFLoader()

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

        const defs: DynamicBoneDef[] = bones.map((b) => ({
          id: boneId(b),
          parent: b.parent && (b.parent as THREE.Bone).isBone ? boneId(b.parent as THREE.Bone) : null,
          label: prettify(b.name),
        }))

        const initial: Record<string, { x: number; y: number; z: number }> = {}
        bones.forEach((b) => {
          initial[boneId(b)] = {
            x: THREE.MathUtils.radToDeg(b.rotation.x),
            y: THREE.MathUtils.radToDeg(b.rotation.y),
            z: THREE.MathUtils.radToDeg(b.rotation.z),
          }
        })

        bonesRef.current = bones
        registerCustomBones(defs, initial)
        bones.forEach((b) => {
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

  if (!scene) return null
  return <primitive object={scene} />
}
