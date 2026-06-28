import { useContext, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { boneDefs, boneMap, getChildren, type BoneDef } from './jointDefs'
import { useStore } from '../state/useStore'
import { BoneRefsContext } from './boneRefsContext'

const SKIN_COLOR = '#e8b89a'
const JOINT_COLOR = '#c98f6e'
const SELECTED_COLOR = '#ff8a3d'
const HOVER_COLOR = '#ffc285'

function BoneSegment({ def }: { def: BoneDef }) {
  const boneRefs = useContext(BoneRefsContext)
  const groupRef = useRef<THREE.Group | null>(null)
  const hoverRef = useRef(false)

  const rotation = useStore((s) => s.rotations[def.id])
  const selectedBone = useStore((s) => s.selectedBone)
  const selectBone = useStore((s) => s.selectBone)
  const isSelected = selectedBone === def.id

  const euler = useMemo(
    () =>
      new THREE.Euler(
        THREE.MathUtils.degToRad(rotation?.x ?? 0),
        THREE.MathUtils.degToRad(rotation?.y ?? 0),
        THREE.MathUtils.degToRad(rotation?.z ?? 0),
      ),
    [rotation?.x, rotation?.y, rotation?.z],
  )

  const children = useMemo(() => getChildren(def.id), [def.id])

  const axis = def.axis ?? 'y'
  const direction = def.direction ?? 1
  const capsuleLength = Math.max(0.01, def.length - def.radius * 1.4)

  const meshPosition: [number, number, number] =
    axis === 'z' ? [0, 0, def.length / 2] : [0, (def.length / 2) * direction, 0]
  const meshRotation: [number, number, number] = axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0]

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation()
    selectBone(def.id)
  }

  function handlePointerOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    hoverRef.current = true
    document.body.style.cursor = 'pointer'
  }

  function handlePointerOut() {
    hoverRef.current = false
    document.body.style.cursor = 'auto'
  }

  const color = isSelected ? SELECTED_COLOR : SKIN_COLOR

  return (
    <group
      ref={(node) => {
        groupRef.current = node
        if (boneRefs) boneRefs.current[def.id] = node
      }}
      position={def.position}
      rotation={euler}
      userData={{ boneId: def.id }}
    >
      {/* Joint ball at this bone's pivot (the parent-facing end) */}
      <mesh
        position={[0, 0, 0]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[def.radius * 1.08, 16, 16]} />
        <meshStandardMaterial color={isSelected ? SELECTED_COLOR : JOINT_COLOR} roughness={0.7} />
      </mesh>

      {/* Limb segment */}
      <mesh
        position={meshPosition}
        rotation={meshRotation}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <capsuleGeometry args={[def.radius, capsuleLength, 4, 12]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>

      {children.map((child) => (
        <BoneSegment key={child.id} def={child} />
      ))}
    </group>
  )
}

export interface MannequinProps {
  boneRefs: React.MutableRefObject<Record<string, THREE.Group | null>>
}

export function Mannequin({ boneRefs }: MannequinProps) {
  const rootBones = useMemo(() => getChildren(null), [])

  return (
    <BoneRefsContext.Provider value={boneRefs}>
      <group name="mannequin">
        {rootBones.map((def) => (
          <BoneSegment key={def.id} def={def} />
        ))}
      </group>
    </BoneRefsContext.Provider>
  )
}

export { boneDefs, boneMap }
