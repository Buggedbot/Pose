import { useContext, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { boneDefs, boneMap, getChildren, type BoneDef } from './jointDefs'
import { useStore } from '../state/useStore'
import { BoneRefsContext } from './boneRefsContext'

const SKIN_COLOR = '#e7b393'
const SELECTED_COLOR = '#ff8a3d'
const HOVER_COLOR = '#f7cdae'

function fleshMaterial(color: string) {
  return <meshStandardMaterial color={color} roughness={0.62} metalness={0} />
}

function BoneSegment({ def }: { def: BoneDef }) {
  const boneRefs = useContext(BoneRefsContext)
  const groupRef = useRef<THREE.Object3D | null>(null)
  const [hovered, setHovered] = useState(false)

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

  const direction = def.direction ?? 1
  const shape = def.shape ?? 'segment'

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation()
    selectBone(def.id)
  }
  function handlePointerOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }
  function handlePointerOut() {
    setHovered(false)
    document.body.style.cursor = 'auto'
  }

  const color = isSelected ? SELECTED_COLOR : hovered ? HOVER_COLOR : SKIN_COLOR
  const interaction = {
    onClick: handleClick,
    onPointerOver: handlePointerOver,
    onPointerOut: handlePointerOut,
  }

  // Cylinder args are [topRadius, bottomRadius, height]; top is at +Y/2. Map near/far onto that
  // depending on which way the segment is drawn so limbs taper toward the extremities.
  const topR = direction === 1 ? def.radiusFar : def.radiusNear
  const botR = direction === 1 ? def.radiusNear : def.radiusFar
  const segCenter = (def.length / 2) * direction

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
      {/* Skin-colored joint ball at the pivot — bridges this bone to its parent so the body reads as one piece */}
      <mesh position={[0, 0, 0]} {...interaction}>
        <sphereGeometry args={[def.radiusNear, 20, 16]} />
        {fleshMaterial(color)}
      </mesh>

      {shape === 'segment' && (
        <mesh position={[0, segCenter, 0]} {...interaction}>
          <cylinderGeometry args={[topR, botR, def.length, 20, 1]} />
          {fleshMaterial(color)}
        </mesh>
      )}

      {shape === 'head' && (
        <>
          {/* Cranium as a gently tall ellipsoid */}
          <mesh position={[0, def.length * 0.42, 0]} scale={[0.92, 1.14, 0.98]} {...interaction}>
            <sphereGeometry args={[def.radiusNear, 28, 24]} />
            {fleshMaterial(color)}
          </mesh>
          {/* Jaw/chin taper */}
          <mesh position={[0, def.length * 0.16, 0.012]} scale={[0.78, 0.6, 0.82]} {...interaction}>
            <sphereGeometry args={[def.radiusNear, 24, 20]} />
            {fleshMaterial(color)}
          </mesh>
        </>
      )}

      {shape === 'hand' && (
        <mesh position={[0, -def.length * 0.45, 0]} scale={[0.052, def.length * 0.5, 0.024]} {...interaction}>
          <sphereGeometry args={[1, 18, 14]} />
          {fleshMaterial(color)}
        </mesh>
      )}

      {shape === 'foot' && (
        <mesh position={[0, -0.01, def.length * 0.34]} scale={[0.046, 0.04, def.length * 0.55]} {...interaction}>
          <sphereGeometry args={[1, 18, 14]} />
          {fleshMaterial(color)}
        </mesh>
      )}

      {def.bust && (
        <>
          <mesh position={[-0.058, def.length * 0.58, 0.082]} {...interaction}>
            <sphereGeometry args={[0.052, 18, 16]} />
            {fleshMaterial(color)}
          </mesh>
          <mesh position={[0.058, def.length * 0.58, 0.082]} {...interaction}>
            <sphereGeometry args={[0.052, 18, 16]} />
            {fleshMaterial(color)}
          </mesh>
        </>
      )}

      {children.map((child) => (
        <BoneSegment key={child.id} def={child} />
      ))}
    </group>
  )
}

export interface MannequinProps {
  boneRefs: React.MutableRefObject<Record<string, THREE.Object3D | null>>
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
