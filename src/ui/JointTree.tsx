import { useStore } from '../state/useStore'
import { boneMap } from '../scene/jointDefs'
import { jointGroups } from './jointGroups'

export function JointTree() {
  const selectedBone = useStore((s) => s.selectedBone)
  const selectBone = useStore((s) => s.selectBone)

  return (
    <div className="panel-section">
      <h3>Joints</h3>
      {jointGroups.map((group) => (
        <div key={group.label} className="joint-group">
          <div className="joint-group-label">{group.label}</div>
          <div className="joint-group-buttons">
            {group.boneIds.map((id) => {
              const bone = boneMap[id]
              return (
                <button
                  key={id}
                  className={selectedBone === id ? 'chip chip-selected' : 'chip'}
                  onClick={() => selectBone(id)}
                >
                  {bone.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
