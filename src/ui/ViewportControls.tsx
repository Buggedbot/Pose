import { useStore } from '../state/useStore'
import { boneLabel } from '../scene/boneInfo'

// A small floating overlay inside the viewport. Posing is done entirely by clicking a body part
// and dragging its gizmo, so this just shows what's selected plus quick Reset / Done actions.
export function ViewportControls() {
  const mode = useStore((s) => s.mode)
  const customBoneTree = useStore((s) => s.customBoneTree)
  const selectedBone = useStore((s) => s.selectedBone)
  const selectBone = useStore((s) => s.selectBone)
  const resetBone = useStore((s) => s.resetBone)

  if (!selectedBone) {
    return (
      <div className="viewport-hint">
        Click a body part to grab it, then drag the coloured rings to pose that joint. Drag empty space to
        orbit; scroll to zoom.
      </div>
    )
  }

  return (
    <div className="viewport-card">
      <span className="viewport-card-title">{boneLabel(mode, selectedBone, customBoneTree)}</span>
      <span className="viewport-card-hint">drag the rings to rotate</span>
      <div className="viewport-card-actions">
        <button onClick={() => resetBone(selectedBone)}>Reset</button>
        <button onClick={() => selectBone(null)}>Done</button>
      </div>
    </div>
  )
}
