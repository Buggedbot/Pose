import { useMemo } from 'react'
import * as THREE from 'three'
import { Grid } from '@react-three/drei'
import { useStore } from '../state/useStore'

// ---------------------------------------------------------------------------
// Studio (default) — the original dark background + optional reference grid.
// ---------------------------------------------------------------------------
function StudioBackdrop() {
  const showFloorGrid = useStore((s) => s.lighting.showFloorGrid)
  return (
    <>
      <color attach="background" args={['#1d1f23']} />
      {showFloorGrid && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[10, 10]} />
            <shadowMaterial opacity={0.25} />
          </mesh>
          <Grid
            position={[0, 0.001, 0]}
            args={[10, 10]}
            cellSize={0.1}
            cellThickness={0.5}
            sectionSize={0.5}
            sectionThickness={1}
            cellColor="#3a3a3a"
            sectionColor="#555"
            fadeDistance={8}
            fadeStrength={1}
            infiniteGrid
          />
        </>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Beach — sand, a still-water ocean plane (wave pattern baked once, not
// animated every frame, since this viewport also has to stay responsive
// while the user drags pose gizmos), and two procedural palm trees.
// ---------------------------------------------------------------------------
function buildWaveGeometry() {
  const geo = new THREE.PlaneGeometry(20, 12, 40, 24)
  const pos = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const wave = Math.sin(x * 0.9) * 0.03 + Math.sin(y * 0.6) * 0.025 + Math.sin((x + y) * 1.4) * 0.015
    pos.setZ(i, wave)
  }
  geo.computeVertexNormals()
  return geo
}

function PalmTree({
  position,
  scale = 1,
  lean = 0.12,
}: {
  position: [number, number, number]
  scale?: number
  lean?: number
}) {
  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8a6b48', roughness: 0.95 }), [])
  const frondMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#2f7d4f', roughness: 0.7, side: THREE.DoubleSide }),
    [],
  )
  const nutMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a3423', roughness: 0.9 }), [])

  const segments = 6
  const trunkHeight = 2.1
  const segHeight = trunkHeight / segments

  return (
    <group position={position} scale={scale} rotation={[0, 0, lean]}>
      {Array.from({ length: segments }, (_, i) => (
        <mesh key={i} position={[Math.sin(i * 0.5) * 0.03, segHeight * i + segHeight / 2, 0]} material={trunkMat} castShadow>
          <cylinderGeometry args={[0.085 - i * 0.006, 0.1 - i * 0.006, segHeight * 1.05, 7]} />
        </mesh>
      ))}
      <group position={[Math.sin(segments * 0.5) * 0.03, trunkHeight, 0]}>
        {Array.from({ length: 7 }, (_, i) => {
          const angle = (i / 7) * Math.PI * 2
          return (
            <mesh key={i} rotation={[1.15, 0, angle]} position={[0, 0.02, 0]} material={frondMat}>
              <coneGeometry args={[0.15, 1.05, 4]} />
            </mesh>
          )
        })}
        <mesh position={[0.06, -0.05, 0.02]} material={nutMat}>
          <sphereGeometry args={[0.045, 8, 8]} />
        </mesh>
        <mesh position={[-0.04, -0.06, -0.04]} material={nutMat}>
          <sphereGeometry args={[0.04, 8, 8]} />
        </mesh>
      </group>
    </group>
  )
}

function BeachBackdrop() {
  const waveGeo = useMemo(() => buildWaveGeometry(), [])
  return (
    <>
      <color attach="background" args={['#5fb8e0']} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#e8cf9d" roughness={1} />
      </mesh>
      <mesh geometry={waveGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -7]}>
        <meshStandardMaterial color="#1f8aa0" roughness={0.25} metalness={0.1} />
      </mesh>
      <PalmTree position={[-1.9, 0, -1.2]} scale={1.1} lean={-0.14} />
      <PalmTree position={[1.7, 0, -1.6]} scale={0.9} lean={0.12} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Outdoor / park — grass, a few simple leafy trees.
// ---------------------------------------------------------------------------
function LeafyTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6b4a30', roughness: 0.95 }), [])
  const leafMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3f8f4f', roughness: 0.8 }), [])
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.6, 0]} material={trunkMat} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 1.2, 8]} />
      </mesh>
      <mesh position={[0, 1.35, 0]} material={leafMat} castShadow>
        <sphereGeometry args={[0.55, 12, 10]} />
      </mesh>
      <mesh position={[0.28, 1.55, 0.1]} material={leafMat} castShadow>
        <sphereGeometry args={[0.35, 10, 8]} />
      </mesh>
      <mesh position={[-0.25, 1.5, -0.15]} material={leafMat} castShadow>
        <sphereGeometry args={[0.32, 10, 8]} />
      </mesh>
    </group>
  )
}

function OutdoorBackdrop() {
  return (
    <>
      <color attach="background" args={['#a9d8f5']} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#5c9c4c" roughness={1} />
      </mesh>
      <LeafyTree position={[-1.8, 0, -1.4]} scale={1.05} />
      <LeafyTree position={[1.9, 0, -1.9]} scale={0.85} />
      <LeafyTree position={[0.4, 0, -2.6]} scale={0.7} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Seamless paper — a plain photography-studio backdrop: floor curving up
// into a wall in the user-chosen colour, no props.
// ---------------------------------------------------------------------------
function SeamlessBackdrop() {
  const color = useStore((s) => s.backdropColor)
  return (
    <>
      <color attach="background" args={[color]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.5, -3]}>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
    </>
  )
}

export function Backdrop() {
  const backdrop = useStore((s) => s.backdrop)
  if (backdrop === 'beach') return <BeachBackdrop />
  if (backdrop === 'outdoor') return <OutdoorBackdrop />
  if (backdrop === 'seamless') return <SeamlessBackdrop />
  return <StudioBackdrop />
}
