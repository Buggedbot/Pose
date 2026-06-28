import { useRef } from 'react'
import { useStore } from '../state/useStore'

export function ModelPanel() {
  const mode = useStore((s) => s.mode)
  const customModelName = useStore((s) => s.customModelName)
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

  return (
    <div className="panel-section">
      <h3>Custom Model</h3>

      {modelError && (
        <div className="error-banner">
          <span>{modelError}</span>
          <button className="link-button" onClick={clearModelError}>
            Dismiss
          </button>
        </div>
      )}

      {mode === 'custom' && customModelName ? (
        <>
          <p className="hint">Posing: {customModelName}</p>
          <button className="reset-all-button" onClick={unloadCustomModel}>
            Remove Model / Use Mannequin
          </button>
        </>
      ) : (
        <>
          <p className="hint">Currently posing the built-in mannequin.</p>
          <button className="reset-all-button" onClick={() => inputRef.current?.click()}>
            Upload GLB/GLTF Model
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".glb,.gltf"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </>
      )}

      <p className="hint">
        Upload a rigged (skinned) humanoid model in GLB or GLTF format — for example one exported from Mixamo,
        Ready Player Me, VRoid, or another tool you have rights to use. The app will detect the model's skeleton
        and let you pose its joints the same way as the mannequin.
      </p>
    </div>
  )
}
