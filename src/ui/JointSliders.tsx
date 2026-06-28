import { useStore } from '../state/useStore'
import { boneMap, AXES, type Axis } from '../scene/jointDefs'

const AXIS_LABEL: Record<Axis, string> = { x: 'Bend (X)', y: 'Twist (Y)', z: 'Swing (Z)' }

export function JointSliders() {
  const selectedBone = useStore((s) => s.selectedBone)
  const rotation = useStore((s) => (selectedBone ? s.rotations[selectedBone] : undefined))
  const setAxis = useStore((s) => s.setAxis)
  const resetBone = useStore((s) => s.resetBone)
  const selectBone = useStore((s) => s.selectBone)

  if (!selectedBone || !rotation) {
    return (
      <div className="panel-section">
        <h3>Joint Controls</h3>
        <p className="hint">Click a joint on the figure or pick one from the list to pose it.</p>
      </div>
    )
  }

  const bone = boneMap[selectedBone]

  return (
    <div className="panel-section">
      <div className="panel-section-header">
        <h3>{bone.label}</h3>
        <div className="header-actions">
          <button className="link-button" onClick={() => resetBone(selectedBone)}>
            Reset
          </button>
          <button className="link-button" onClick={() => selectBone(null)}>
            Deselect
          </button>
        </div>
      </div>
      {AXES.map((axis) => {
        const limit = bone.limits[axis]
        if (!limit) return null
        const value = rotation[axis]
        return (
          <div key={axis} className="slider-row">
            <div className="slider-label">
              <span>{AXIS_LABEL[axis]}</span>
              <span className="slider-value">{Math.round(value)}°</span>
            </div>
            <input
              type="range"
              min={limit.min}
              max={limit.max}
              step={1}
              value={value}
              onChange={(e) => setAxis(selectedBone, axis, Number(e.target.value))}
            />
          </div>
        )
      })}
    </div>
  )
}
