import { useRef } from 'react'
import { useStore } from '../state/useStore'

export function ModelPanel() {
  const mode = useStore((s) => s.mode)
  const customModelName = useStore((s) => s.customModelName)
  const isDefaultModel = useStore((s) => s.isDefaultModel)
  const modelError = useStore((s) => s.modelError)
  const loadCustomModel = useStore((s) => s.loadCustomModel)
  const unloadCustomModel = useStore((s) => s.unloadCustomModel)
  const clearModelError = useStore((s) => s.clearModelError)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const url = URL.createObjectURL(file)
    loadCustomModel(url, file.name)
  }

  const usingModel = mode === 'custom' && !!customModelName

  return (
    <div className="panel-section">
      <h3>Figure</h3>

      {modelError && (
        <div className="error-banner">
          <span>{modelError}</span>
          <button className="link-button" onClick={clearModelError}>
            Dismiss
          </button>
        </div>
      )}

      {usingModel ? (
        <p className="hint">
          Posing: {isDefaultModel ? 'the built-in figure' : customModelName}
        </p>
      ) : (
        <p className="hint">Posing the simple mannequin.</p>
      )}

      <button className="reset-all-button" onClick={() => inputRef.current?.click()}>
        {usingModel ? 'Upload a Different Model' : 'Upload GLB/GLTF Model'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".glb,.gltf,.vrm"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {usingModel && (
        <button className="reset-all-button" onClick={unloadCustomModel}>
          Use Simple Mannequin
        </button>
      )}

      <p className="hint">
        Upload a rigged (skinned) humanoid model in GLB, GLTF, or VRM format — for example one exported from
        Mixamo, Ready Player Me, or VRoid. The app detects the model's skeleton and lets you pose its joints by
        dragging, just like the mannequin.
      </p>
    </div>
  )
}
