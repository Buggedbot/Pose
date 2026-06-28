import { useRef, useState } from 'react'
import * as THREE from 'three'
import { Scene } from './scene/Scene'
import { JointTree } from './ui/JointTree'
import { JointSliders } from './ui/JointSliders'
import { PresetBar } from './ui/PresetBar'
import { LightingPanel } from './ui/LightingPanel'
import { ModelPanel } from './ui/ModelPanel'

type Tab = 'pose' | 'presets' | 'lighting' | 'model'

export default function App() {
  const boneRefs = useRef<Record<string, THREE.Object3D | null>>({})
  const [tab, setTab] = useState<Tab>('pose')

  return (
    <div className="app">
      <header className="app-header">
        <h1>Manga Pose Reference</h1>
        <p>Drag a joint's gizmo in the viewport, or use the sliders, to pose the figure for sketching.</p>
      </header>
      <main className="app-main">
        <div className="viewport">
          <Scene boneRefs={boneRefs} />
        </div>
        <aside className="sidebar">
          <nav className="tabs">
            <button className={tab === 'pose' ? 'tab tab-active' : 'tab'} onClick={() => setTab('pose')}>
              Pose
            </button>
            <button className={tab === 'presets' ? 'tab tab-active' : 'tab'} onClick={() => setTab('presets')}>
              Presets
            </button>
            <button className={tab === 'lighting' ? 'tab tab-active' : 'tab'} onClick={() => setTab('lighting')}>
              Lighting
            </button>
            <button className={tab === 'model' ? 'tab tab-active' : 'tab'} onClick={() => setTab('model')}>
              Model
            </button>
          </nav>
          <div className="sidebar-content">
            {tab === 'pose' && (
              <>
                <JointSliders />
                <JointTree />
              </>
            )}
            {tab === 'presets' && <PresetBar />}
            {tab === 'lighting' && <LightingPanel />}
            {tab === 'model' && <ModelPanel />}
          </div>
        </aside>
      </main>
    </div>
  )
}
