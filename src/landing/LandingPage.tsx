import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Float,
  MeshReflectorMaterial,
  Scroll,
  ScrollControls,
  Sparkles,
  Stars,
  useProgress,
  useScroll,
} from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { HeroModel } from './HeroModel'

const SECTION_COUNT = 5

function goToApp() {
  window.location.hash = '#/app'
}

// ---------------------------------------------------------------------------
// Season choreography. Each scroll section is a season — Summer, Autumn,
// Winter, Spring — and a cosmic finale. Camera, background/fog, key light,
// the celestial orb, and the weather particles all ride the same scroll.
// ---------------------------------------------------------------------------
const CAM_POS: [number, number, number][] = [
  [0.25, 1.3, 3.2],
  [-1.6, 1.45, 2.8],
  [1.3, 1.0, 2.4],
  [-0.4, 1.5, 3.1],
  [0.4, 1.25, 3.4],
]
const CAM_LOOK: [number, number, number][] = [
  [-0.12, 1.1, 0],
  [-0.15, 1.2, 0],
  [-0.1, 1.0, 0],
  [-1.05, 1.25, 0],
  [0.3, 1.1, 0],
]

// Summer azure noon → autumn amber dusk → winter steel → spring plum dawn → cosmic brand
const BG_COLORS = ['#173d63', '#3d1d0c', '#22344c', '#3b1e35', '#170b2e'].map((c) => new THREE.Color(c))
const KEY_COLORS = ['#fff3d6', '#ffc07a', '#cfe0ff', '#ffd9e8', '#e8dcff'].map((c) => new THREE.Color(c))
const KEY_INTENSITY = [1.5, 1.0, 0.85, 1.25, 1.15]
const SUN_COLORS = ['#ffcf6e', '#ff8f4d', '#dcecff', '#ffc4de', '#8b5cf6'].map((c) => new THREE.Color(c))
const SUN_INTENSITY = [4.5, 3.6, 2.2, 3.2, 3]

function scrollPhase(offset: number) {
  const n = SECTION_COUNT - 1
  const t = THREE.MathUtils.clamp(offset, 0, 1) * n
  const i = Math.min(Math.floor(t), n - 1)
  return { t, i, f: THREE.MathUtils.smoothstep(t - i, 0, 1) }
}

function lerpTriple(a: [number, number, number], b: [number, number, number], t: number, out: THREE.Vector3) {
  out.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t)
}

const _pos = new THREE.Vector3()
const _look = new THREE.Vector3()
const _bg = new THREE.Color()

function ScrollDirector() {
  const scroll = useScroll()
  const { camera, scene } = useThree()
  const parallax = useRef({ x: 0, y: 0 })

  useFrame((state, delta) => {
    const { i, f } = scrollPhase(scroll.offset)

    parallax.current.x = THREE.MathUtils.damp(parallax.current.x, state.pointer.x * 0.22, 2.5, delta)
    parallax.current.y = THREE.MathUtils.damp(parallax.current.y, state.pointer.y * 0.12, 2.5, delta)

    lerpTriple(CAM_POS[i], CAM_POS[i + 1], f, _pos)
    lerpTriple(CAM_LOOK[i], CAM_LOOK[i + 1], f, _look)
    camera.position.set(_pos.x + parallax.current.x, _pos.y + parallax.current.y, _pos.z)
    camera.lookAt(_look)

    _bg.copy(BG_COLORS[i]).lerp(BG_COLORS[i + 1], f)
    if (!scene.background) scene.background = _bg.clone()
    else (scene.background as THREE.Color).copy(_bg)
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(_bg)

    // Let the DOM (section dots, reveals) know where we are.
    window.dispatchEvent(new CustomEvent('lp-scroll', { detail: scroll.offset }))
  })

  return null
}

// Key light + celestial orb that turn golden in summer, amber in autumn, pale in winter,
// blossom-pink in spring, and violet for the finale.
function SeasonalLighting() {
  const scroll = useScroll()
  const keyRef = useRef<THREE.DirectionalLight>(null)
  const sunMat = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(() => {
    const { i, f } = scrollPhase(scroll.offset)
    if (keyRef.current) {
      keyRef.current.color.copy(KEY_COLORS[i]).lerp(KEY_COLORS[i + 1], f)
      keyRef.current.intensity = THREE.MathUtils.lerp(KEY_INTENSITY[i], KEY_INTENSITY[i + 1], f)
    }
    if (sunMat.current) {
      sunMat.current.emissive.copy(SUN_COLORS[i]).lerp(SUN_COLORS[i + 1], f)
      sunMat.current.emissiveIntensity = THREE.MathUtils.lerp(SUN_INTENSITY[i], SUN_INTENSITY[i + 1], f)
      sunMat.current.color.copy(sunMat.current.emissive)
    }
  })

  return (
    <>
      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#cdb4ff', '#1a0f2e', 0.5]} />
      <directionalLight ref={keyRef} position={[3, 5, 4]} intensity={1.15} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 2.5, -3]} intensity={1.0} color="#7c9dff" />
      <directionalLight position={[3.5, 1.5, -2.5]} intensity={0.8} color="#ff8a3d" />
      {/* the season's sun / winter moon / spring blossom-light */}
      <mesh position={[2.4, 3.2, -4.5]}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial ref={sunMat} toneMapped={false} />
      </mesh>
    </>
  )
}

// Glossy dark floor that mirrors the character — reads as sunlit ground, wet leaves, or ice
// depending on the season's light.
function ReflectiveFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[24, 24]} />
      <MeshReflectorMaterial
        blur={[280, 90]}
        resolution={1024}
        mixBlur={0.9}
        mixStrength={22}
        roughness={0.85}
        depthScale={1.1}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.3}
        color="#0a0714"
        metalness={0.55}
        mirror={0.6}
      />
    </mesh>
  )
}

interface ParticleSeed {
  x: number
  y: number
  z: number
  phase: number
  speed: number
  spin: number
  spinSpeed: number
  scale: number
  color: THREE.Color
}

// Weather for one season: instanced quads that fall, sway, and tumble, fading in only
// while the scroll is inside that season's section.
function SeasonWeather({
  season,
  colors,
  count,
  size,
  fallSpeed,
  sway,
}: {
  season: number
  colors: string[]
  count: number
  size: number
  fallSpeed: number
  sway: number
}) {
  const scroll = useScroll()
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const seeds = useMemo<ParticleSeed[]>(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 7,
        y: Math.random() * 4.5,
        z: -1.2 + (Math.random() - 0.5) * 4,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.9,
        spin: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 3,
        scale: 0.7 + Math.random() * 0.7,
        color: new THREE.Color(colors[Math.floor(Math.random() * colors.length)]),
      })),
    [count, colors],
  )

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    seeds.forEach((s, idx) => mesh.setColorAt(idx, s.color))
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [seeds])

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return
    const { t } = scrollPhase(scroll.offset)
    const w = THREE.MathUtils.clamp(1 - Math.abs(t - season), 0, 1)
    if (matRef.current) matRef.current.opacity = w * 0.95
    mesh.visible = w > 0.02
    if (!mesh.visible) return

    const time = state.clock.elapsedTime
    const H = 4.5
    seeds.forEach((s, idx) => {
      const y = ((s.y - time * fallSpeed * s.speed) % H + H) % H
      dummy.position.set(s.x + Math.sin(time * 0.8 + s.phase) * sway, y, s.z)
      dummy.rotation.set(s.spin + time * s.spinSpeed, s.phase + time * s.spinSpeed * 0.7, 0)
      dummy.scale.setScalar(s.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(idx, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial ref={matRef} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
    </instancedMesh>
  )
}

function Weather() {
  return (
    <>
      {/* autumn leaves */}
      <SeasonWeather season={1} colors={['#e07a2f', '#c1521d', '#a83c16', '#d9942b']} count={220} size={0.055} fallSpeed={0.55} sway={0.5} />
      {/* winter snow */}
      <SeasonWeather season={2} colors={['#ffffff', '#dcecff', '#c9dcf5']} count={320} size={0.028} fallSpeed={0.35} sway={0.28} />
      {/* spring petals */}
      <SeasonWeather season={3} colors={['#ffb7d5', '#ff9ec6', '#ffd3e6', '#ffc4de']} count={240} size={0.04} fallSpeed={0.42} sway={0.6} />
    </>
  )
}

// Drifting emissive accents the camera sails past — they pick up the bloom pass.
function FloatingAccents() {
  return (
    <>
      <Float speed={1.4} rotationIntensity={0.8} floatIntensity={0.9}>
        <mesh position={[1.5, 2.0, -1.4]}>
          <torusGeometry args={[0.34, 0.012, 16, 80]} />
          <meshStandardMaterial color="#ff8a3d" emissive="#ff8a3d" emissiveIntensity={3.2} toneMapped={false} />
        </mesh>
      </Float>
      <Float speed={1.1} rotationIntensity={1.2} floatIntensity={0.7}>
        <mesh position={[-2.0, 0.9, -1.0]}>
          <icosahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={2.4} wireframe toneMapped={false} />
        </mesh>
      </Float>
      <Float speed={1.7} rotationIntensity={0.5} floatIntensity={1.2}>
        <mesh position={[1.9, 0.5, 0.7]}>
          <torusGeometry args={[0.16, 0.01, 12, 60]} />
          <meshStandardMaterial color="#61e0ff" emissive="#61e0ff" emissiveIntensity={2.6} toneMapped={false} />
        </mesh>
      </Float>
    </>
  )
}

function Atmosphere() {
  return (
    <>
      <Stars radius={35} depth={30} count={1400} factor={3} saturation={0.4} fade speed={0.6} />
      <Sparkles count={80} scale={[3.2, 2.6, 2.4]} position={[-0.4, 1.3, 0]} size={1.6} speed={0.35} opacity={0.5} color="#ffd9b8" />
    </>
  )
}

function Effects() {
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={1.05} mipmapBlur intensity={0.8} radius={0.75} />
      <Vignette eskil={false} offset={0.18} darkness={0.78} />
    </EffectComposer>
  )
}

// ---------------------------------------------------------------------------
// DOM layer
// ---------------------------------------------------------------------------

function Feature({
  season,
  kicker,
  title,
  align,
  children,
}: {
  season: string
  kicker: string
  title: string
  align: 'left' | 'right'
  children: React.ReactNode
}) {
  return (
    <section className={`lp-section lp-align-${align}`}>
      <div className="lp-card lp-reveal">
        <span className="lp-chip">{season}</span>
        <br />
        <span className="lp-kicker">{kicker}</span>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </section>
  )
}

function LandingContent() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) e.target.classList.add('in-view')
          else e.target.classList.remove('in-view')
        }
      },
      { threshold: 0.35 },
    )
    root.querySelectorAll('.lp-reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="lp-content" ref={rootRef}>
      <section className="lp-section lp-hero lp-align-right">
        <div className="lp-hero-text lp-reveal in-view">
          <span className="lp-chip">☀️ Summer — a muse for every season</span>
          <h1>
            Pose her.
            <br />
            <em>Draw anything.</em>
          </h1>
          <p>
            A 3D reference studio for manga &amp; comic artists. Grab a joint, drag to pose, orbit to any
            angle — and scroll to watch the seasons turn.
          </p>
          <div className="lp-cta-row">
            <button className="lp-launch lp-launch-lg lp-glow" onClick={goToApp}>
              Start Posing →
            </button>
            <span className="lp-scroll-hint">
              <span className="lp-mouse" />
              scroll
            </span>
          </div>
        </div>
      </section>

      <Feature season="🍂 Autumn" align="left" kicker="Direct posing" title="Click a joint. Drag. Done.">
        No slider spreadsheets. Click any part of the figure and swing the rotation rings — the whole limb
        follows with natural limits, so you block out a pose in seconds while the leaves tumble past.
      </Feature>

      <Feature season="❄️ Winter" align="right" kicker="Your characters" title="Bring your own model">
        Drop in any rigged GLB, GLTF, or VRM — from VRoid, Ready Player Me, Mixamo, or your own pipeline. The
        skeleton is detected automatically and poses exactly like the built-in figure.
      </Feature>

      <Feature season="🌸 Spring" align="left" kicker="Shading reference" title="Light it. Save it. Reuse it.">
        Swing the key light to study how form catches shadow, then save your favourite poses and reload them
        whenever you sit down to draw. Presets get you started fast.
      </Feature>

      <section className="lp-section lp-final">
        <div className="lp-card lp-card-center lp-reveal">
          <span className="lp-chip">✨ Every season, every pose</span>
          <h2>Ready to draw?</h2>
          <p>It runs right in your browser — nothing to install, nothing to pay.</p>
          <button className="lp-launch lp-launch-lg lp-glow" onClick={goToApp}>
            Launch the Studio →
          </button>
        </div>
      </section>
    </div>
  )
}

function SectionDots() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const onScroll = (e: Event) => {
      const offset = (e as CustomEvent<number>).detail
      setActive(Math.round(offset * (SECTION_COUNT - 1)))
    }
    window.addEventListener('lp-scroll', onScroll)
    return () => window.removeEventListener('lp-scroll', onScroll)
  }, [])

  function jump(i: number) {
    const scroller = Array.from(document.querySelectorAll<HTMLDivElement>('.landing div')).find((el) => {
      const s = getComputedStyle(el)
      return (s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 50
    })
    if (scroller) {
      scroller.scrollTo({
        top: (scroller.scrollHeight - scroller.clientHeight) * (i / (SECTION_COUNT - 1)),
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className="lp-dots">
      {['☀️', '🍂', '❄️', '🌸', '✨'].map((label, i) => (
        <button
          key={i}
          className={i === active ? 'lp-dot lp-dot-active' : 'lp-dot'}
          onClick={() => jump(i)}
          aria-label={`Go to section ${i + 1}`}
          title={label}
        />
      ))}
    </div>
  )
}

function LoadingVeil() {
  const { active, progress } = useProgress()
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (!active && progress >= 100) {
      const t = setTimeout(() => setGone(true), 450)
      return () => clearTimeout(t)
    }
  }, [active, progress])

  if (gone) return null
  return (
    <div className={`lp-veil ${!active && progress >= 100 ? 'lp-veil-out' : ''}`}>
      <div className="lp-veil-inner">
        <span className="lp-veil-title">Manga Pose Reference</span>
        <div className="lp-veil-bar">
          <div className="lp-veil-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
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
      <SectionDots />
      <Canvas shadows camera={{ position: [0.25, 1.3, 3.2], fov: 34 }} dpr={[1, 1.75]}>
        <fog attach="fog" args={['#173d63', 5.5, 13]} />
        <Suspense fallback={null}>
          <ScrollControls pages={SECTION_COUNT} damping={0.28}>
            <ScrollDirector />
            <SeasonalLighting />
            <HeroModel />
            <ReflectiveFloor />
            <Weather />
            <FloatingAccents />
            <Atmosphere />
            <Scroll html style={{ width: '100%' }}>
              <LandingContent />
            </Scroll>
          </ScrollControls>
          <Effects />
        </Suspense>
      </Canvas>
      <LoadingVeil />
    </div>
  )
}
