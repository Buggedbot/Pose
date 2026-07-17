import { useState } from 'react'
import { useStore } from '../state/useStore'
import { presetNames } from '../poses/presets'

export function PresetBar() {
  const mode = useStore((s) => s.mode)
  const applyPreset = useStore((s) => s.applyPreset)
  const resetAll = useStore((s) => s.resetAll)
  const savePose = useStore((s) => s.savePose)
  const loadPose = useStore((s) => s.loadPose)
  const deletePose = useStore((s) => s.deletePose)
  const savedPoses = useStore((s) => s.savedPoses)
  const requestSketch = useStore((s) => s.requestSketch)
  const sketchGenerating = useStore((s) => s.sketchGenerating)
  const [poseName, setPoseName] = useState('')

  const savedNames = Object.keys(savedPoses)
  const presetsDisabled = mode !== 'procedural'

  function sketchSavedPose(name: string) {
    loadPose(name)
    // Give the model a moment to settle into the loaded pose before capturing it.
    setTimeout(() => requestSketch(), 120)
  }

  return (
    <div className="panel-section">
      <h3>Pose Presets</h3>
      {presetsDisabled && (
        <p className="hint">Presets are built for the mannequin and aren't available for a custom model.</p>
      )}
      <div className="preset-grid">
        {presetNames.map((name) => (
          <button
            key={name}
            className="preset-button"
            disabled={presetsDisabled}
            onClick={() => applyPreset(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <button className="reset-all-button" onClick={resetAll}>
        {mode === 'procedural' ? 'Reset to Relaxed Stand' : 'Reset to Default Pose'}
      </button>

      <h3>My Poses</h3>
      <button className="sketch-trigger-button" disabled={sketchGenerating} onClick={() => requestSketch()}>
        {sketchGenerating ? 'Sketching…' : '✏️ Generate Sketch of Current Pose'}
      </button>
      <div className="save-row">
        <input
          type="text"
          placeholder="Pose name"
          value={poseName}
          onChange={(e) => setPoseName(e.target.value)}
        />
        <button
          disabled={!poseName.trim()}
          onClick={() => {
            savePose(poseName.trim())
            setPoseName('')
          }}
        >
          Save
        </button>
      </div>
      {savedNames.length === 0 && <p className="hint">No saved poses yet.</p>}
      <div className="preset-grid">
        {savedNames.map((name) => (
          <div key={name} className="saved-pose-row">
            <button className="preset-button" onClick={() => loadPose(name)}>
              {name}
            </button>
            <button
              className="sketch-pose-icon-button"
              onClick={() => sketchSavedPose(name)}
              title="Generate sketch"
              disabled={sketchGenerating}
            >
              ✏️
            </button>
            <button className="link-button" onClick={() => deletePose(name)} title="Delete">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
