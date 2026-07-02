import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Scene } from './scene/Scene'
import { PresetBar } from './ui/PresetBar'
import { LightingPanel } from './ui/LightingPanel'
import { ModelPanel } from './ui/ModelPanel'
import { ViewportControls } from './ui/ViewportControls'
import { useStore } from './state/useStore'

type Tab = 'poses' | 'lighting' | 'model'

// A bundled human figure, if one has been dropped into public/models/, becomes the default on load.
// When it's absent the app simply stays on the built-in mannequin.
export const DEFAULT_MODEL_URL = `${import.meta.env.BASE_URL}models/figure.glb`

export default function App() {
  const boneRefs = useRef<Record<string, THREE.Object3D | null>>({})
  const [tab, setTab] = useState<Tab>('poses')

  useEffect(() => {
    let cancelled = false
    fetch(DEFAULT_MODEL_URL, { method: 'HEAD' })
      .then((res) => {
        if (!cancelled && res.ok) {
          useStore.getState().loadCustomModel(DEFAULT_MODEL_URL, 'Built-in figure', true)
        }
      })
      .catch(() => {
        /* no bundled figure — stay on the mannequin */
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Manga Pose Reference</h1>
        <p>Click any part of the figure, then drag the gizmo rings to pose it. Orbit with the mouse to draw from any angle.</p>
      </header>
      <main className="app-main">
        <div className="viewport">
          <Scene boneRefs={boneRefs} />
          <ViewportControls />
        </div>
        <aside className="sidebar">
          <nav className="tabs">
            <button className={tab === 'poses' ? 'tab tab-active' : 'tab'} onClick={() => setTab('poses')}>
              Poses
            </button>
            <button className={tab === 'lighting' ? 'tab tab-active' : 'tab'} onClick={() => setTab('lighting')}>
              Lighting
            </button>
            <button className={tab === 'model' ? 'tab tab-active' : 'tab'} onClick={() => setTab('model')}>
              Model
            </button>
          </nav>
          <div className="sidebar-content">
            {tab === 'poses' && <PresetBar />}
            {tab === 'lighting' && <LightingPanel />}
            {tab === 'model' && <ModelPanel />}
          </div>
        </aside>
      </main>
    </div>
  )
}
