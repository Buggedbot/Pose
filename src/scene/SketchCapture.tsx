import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { useStore } from '../state/useStore'
import { generateSketchFromDataUrl } from '../utils/sketch'

// Lives inside the R3F <Canvas> so it can reach the renderer/scene directly. When a sketch is
// requested it hides the backdrop and gizmo, swaps in a plain white background, waits for that
// clean frame to actually render, grabs a still from the WebGL canvas, then runs it through the
// sketch filter and restores the scene to how it was.
export function SketchCapture() {
  const { gl, scene } = useThree()
  const sketchRequested = useStore((s) => s.sketchRequested)
  const prevBackground = useRef<THREE.Color | THREE.Texture | null>(null)

  useEffect(() => {
    if (!sketchRequested) return
    let cancelled = false

    async function run() {
      const store = useStore.getState()
      const prevSelected = store.selectedBone
      prevBackground.current = scene.background as THREE.Color | THREE.Texture | null
      store.selectBone(null)
      store.setSketching(true)
      scene.background = new THREE.Color('#ffffff')

      // Two rAFs so the hidden-backdrop, deselected, white-background frame has definitely
      // been drawn to the canvas before we read pixels back out of it.
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

      try {
        if (cancelled) return
        const raw = gl.domElement.toDataURL('image/png')
        const sketch = await generateSketchFromDataUrl(raw)
        if (!cancelled) useStore.getState().setSketchImage(sketch)
      } catch (err) {
        if (!cancelled) {
          useStore.getState().setSketchError(err instanceof Error ? err.message : 'Could not generate a sketch.')
        }
      } finally {
        scene.background = prevBackground.current
        store.setSketching(false)
        if (prevSelected) store.selectBone(prevSelected)
        useStore.getState().consumeSketchRequest()
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [sketchRequested, gl, scene])

  return null
}
