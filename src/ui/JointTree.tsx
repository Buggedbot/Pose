import { useStore } from '../state/useStore'
import { boneLabel } from '../scene/boneInfo'
import { jointGroups } from './jointGroups'

export function JointTree() {
  const mode = useStore((s) => s.mode)
  const selectedBone = useStore((s) => s.selectedBone)
  const selectBone = useStore((s) => s.selectBone)
  const customBoneTree = useStore((s) => s.customBoneTree)

  if (mode === 'custom') {
    return (
      <div className="panel-section">
        <h3>Joints</h3>
        {customBoneTree.length === 0 ? (
          <p className="hint">No bones found.</p>
        ) : (
          <div className="joint-group">
            <div className="joint-group-buttons">
              {customBoneTree.map((bone) => (
                <button
                  key={bone.id}
                  className={selectedBone === bone.id ? 'chip chip-selected' : 'chip'}
                  onClick={() => selectBone(bone.id)}
                >
                  {bone.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="panel-section">
      <h3>Joints</h3>
      {jointGroups.map((group) => (
        <div key={group.label} className="joint-group">
          <div className="joint-group-label">{group.label}</div>
          <div className="joint-group-buttons">
            {group.boneIds.map((id) => (
              <button
                key={id}
                className={selectedBone === id ? 'chip chip-selected' : 'chip'}
                onClick={() => selectBone(id)}
              >
                {boneLabel(mode, id, customBoneTree)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
