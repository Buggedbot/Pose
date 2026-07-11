import { Suspense } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Scroll, ScrollControls, useScroll } from '@react-three/drei'
import { HeroModel } from './HeroModel'

function goToApp() {
  window.location.hash = '#/app'
}

// Camera framing + background colour per scroll keyframe (one per section).
const CAM_POS: [number, number, number][] = [
  [0.2, 1.25, 3.0],
  [-1.0, 1.35, 2.3],
  [1.0, 1.15, 2.5],
  [-0.65, 1.55, 2.15],
  [0.15, 1.3, 3.1],
]
const CAM_LOOK: [number, number, number][] = [
  [-0.12, 1.12, 0],
  [-0.12, 1.25, 0],
  [-0.12, 1.05, 0],
  [-0.12, 1.3, 0],
  [-0.12, 1.15, 0],
]
const BG_COLORS = ['#141026', '#0c1a2e', '#271225', '#0f2740', '#1c1030'].map((c) => new THREE.Color(c))

function lerpTriple(a: [number, number, number], b: [number, number, number], t: number, out: THREE.Vector3) {
  out.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t)
}

const _pos = new THREE.Vector3()
const _look = new THREE.Vector3()
const _bg = new THREE.Color()

function ScrollDirector() {
  const scroll = useScroll()
  const { camera, scene } = useThree()

  useFrame(() => {
    const n = CAM_POS.length - 1
    const t = THREE.MathUtils.clamp(scroll.offset, 0, 1) * n
    const i = Math.min(Math.floor(t), n - 1)
    const f = t - i

    lerpTriple(CAM_POS[i], CAM_POS[i + 1], f, _pos)
    lerpTriple(CAM_LOOK[i], CAM_LOOK[i + 1], f, _look)
    camera.position.copy(_pos)
    camera.lookAt(_look)

    _bg.copy(BG_COLORS[i]).lerp(BG_COLORS[i + 1], f)
    if (!scene.background) scene.background = _bg.clone()
    else (scene.background as THREE.Color).copy(_bg)
  })

  return null
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <hemisphereLight args={['#ffffff', '#3a2a4a', 0.5]} />
      <directionalLight position={[3, 5, 4]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 2, -2]} intensity={0.5} color="#8fb8ff" />
    </>
  )
}

function Feature({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section className="lp-section">
      <div className="lp-card">
        <span className="lp-kicker">{kicker}</span>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </section>
  )
}

function LandingContent() {
  return (
    <div className="lp-content">
      <section className="lp-section lp-hero">
        <div className="lp-hero-text">
          <h1>
            Pose a 3D figure.
            <br />
            Draw from any angle.
          </h1>
          <p>
            A 3D posing studio for manga & comic artists. Grab a joint, drag to pose, and orbit around your
            reference — or bring your own character model.
          </p>
          <div className="lp-cta-row">
            <button className="lp-launch lp-launch-lg" onClick={goToApp}>
              Start Posing →
            </button>
            <span className="lp-scroll-hint">scroll to explore ↓</span>
          </div>
        </div>
      </section>

      <Feature kicker="Direct posing" title="Click a joint, drag to pose">
        No clumsy sliders. Click any part of the figure and drag the rotation gizmo — the whole limb follows
        naturally, so you can block out a pose in seconds and spin the camera to check it from every side.
      </Feature>

      <Feature kicker="Your characters" title="Import your own models">
        Drop in a rigged GLB, GLTF, or VRM model — from VRoid, Ready Player Me, Mixamo, or anywhere you have
        rights to use. The app finds the skeleton automatically and lets you pose it exactly like the built-in
        figure.
      </Feature>

      <Feature kicker="Shading reference" title="Light it, save it, reuse it">
        Move the key light around to study how form catches shadow, then save your favourite poses and reload
        them whenever you sit down to draw. Presets get you started fast.
      </Feature>

      <section className="lp-section lp-final">
        <div className="lp-card lp-card-center">
          <h2>Ready to draw?</h2>
          <p>Open the studio and start posing your reference now — it runs right in your browser.</p>
          <button className="lp-launch lp-launch-lg" onClick={goToApp}>
            Launch the Studio →
          </button>
        </div>
      </section>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="landing">
      <nav className="lp-nav">
        <span className="lp-logo">Manga Pose Reference</span>
        <button className="lp-launch" onClick={goToApp}>
          Launch App
        </button>
      </nav>
      <Canvas shadows camera={{ position: [0.2, 1.25, 3.0], fov: 34 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <ScrollControls pages={5} damping={0.3}>
            <ScrollDirector />
            <Lights />
            <HeroModel />
            <ContactShadows position={[-0.55, 0, 0]} opacity={0.5} scale={4} blur={2.4} far={3} color="#000000" />
            <Scroll html style={{ width: '100%' }}>
              <LandingContent />
            </Scroll>
          </ScrollControls>
        </Suspense>
      </Canvas>
      <div className="lp-loading">Loading…</div>
    </div>
  )
}
