import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { Grid, OrbitControls, TransformControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Mannequin } from './Mannequin'
import { CustomModelView } from './CustomModelView'
import { useStore } from '../state/useStore'

function LightingRig() {
  const lighting = useStore((s) => s.lighting)

  const keyPos = useMemo(() => {
    const az = THREE.MathUtils.degToRad(lighting.keyAzimuth)
    const el = THREE.MathUtils.degToRad(lighting.keyElevation)
    const radius = 3
    return new THREE.Vector3(
      radius * Math.cos(el) * Math.sin(az),
      radius * Math.sin(el),
      radius * Math.cos(el) * Math.cos(az),
    )
  }, [lighting.keyAzimuth, lighting.keyElevation])

  return (
    <>
      <ambientLight intensity={lighting.fillIntensity} />
      <directionalLight
        position={keyPos}
        intensity={lighting.keyIntensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {lighting.rimEnabled && (
        <directionalLight position={[-keyPos.x, 1.2, -keyPos.z]} intensity={0.4} color="#bcd8ff" />
      )}
    </>
  )
}

function Floor() {
  const showFloorGrid = useStore((s) => s.lighting.showFloorGrid)
  if (!showFloorGrid) return null
  return (
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
  )
}

function PosingGizmo({ boneRefs }: { boneRefs: React.MutableRefObject<Record<string, THREE.Object3D | null>> }) {
  const selectedBone = useStore((s) => s.selectedBone)
  const setDragging = useStore((s) => s.setDragging)
  const setBoneRotation = useStore((s) => s.setBoneRotation)
  const orbitRef = useRef<OrbitControlsImpl>(null)

  const target = selectedBone ? boneRefs.current[selectedBone] : null

  function handleObjectChange() {
    if (!selectedBone || !target) return
    setBoneRotation(selectedBone, {
      x: THREE.MathUtils.radToDeg(target.rotation.x),
      y: THREE.MathUtils.radToDeg(target.rotation.y),
      z: THREE.MathUtils.radToDeg(target.rotation.z),
    })
  }

  return (
    <>
      {target && (
        <TransformControls
          object={target}
          mode="rotate"
          size={0.85}
          onObjectChange={handleObjectChange}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
        />
      )}
      <OrbitControlsRef innerRef={orbitRef} />
    </>
  )
}

function OrbitControlsRef({ innerRef }: { innerRef: React.RefObject<OrbitControlsImpl> }) {
  const isDragging = useStore((s) => s.isDragging)
  return (
    <OrbitControls
      ref={innerRef}
      enabled={!isDragging}
      makeDefault
      target={[0, 0.9, 0]}
      minDistance={0.6}
      maxDistance={6}
      maxPolarAngle={Math.PI * 0.95}
    />
  )
}

export interface SceneProps {
  boneRefs: React.MutableRefObject<Record<string, THREE.Object3D | null>>
}

export function Scene({ boneRefs }: SceneProps) {
  const mode = useStore((s) => s.mode)
  const customModelUrl = useStore((s) => s.customModelUrl)

  return (
    <Canvas
      shadows
      camera={{ position: [2.2, 1.55, 2.7], fov: 35 }}
      onPointerMissed={() => useStore.getState().selectBone(null)}
    >
      <color attach="background" args={['#1d1f23']} />
      <LightingRig />
      <Floor />
      {mode === 'custom' && customModelUrl ? (
        <CustomModelView key={customModelUrl} url={customModelUrl} boneRefs={boneRefs} />
      ) : (
        <Mannequin boneRefs={boneRefs} />
      )}
      <PosingGizmo boneRefs={boneRefs} />
    </Canvas>
  )
}
