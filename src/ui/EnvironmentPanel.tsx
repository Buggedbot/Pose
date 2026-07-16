import { useStore } from '../state/useStore'
import type { Backdrop } from '../state/useStore'

const BACKDROPS: { id: Backdrop; label: string; icon: string }[] = [
  { id: 'studio', label: 'Studio', icon: '⬜' },
  { id: 'beach', label: 'Beach', icon: '🏖️' },
  { id: 'outdoor', label: 'Outdoor', icon: '🌳' },
  { id: 'seamless', label: 'Seamless Paper', icon: '📄' },
]

const PAPER_COLORS = ['#e5e2dc', '#ffffff', '#2b2b2b', '#0e0e10', '#9fc3e0', '#e8b9c9']

export function EnvironmentPanel() {
  const backdrop = useStore((s) => s.backdrop)
  const backdropColor = useStore((s) => s.backdropColor)
  const setBackdrop = useStore((s) => s.setBackdrop)
  const setBackdropColor = useStore((s) => s.setBackdropColor)

  return (
    <div className="panel-section">
      <h3>Environment</h3>
      <p className="hint">Pick a backdrop for context while you draw — it's just a visual reference, it won't be saved with poses.</p>
      <div className="preset-grid">
        {BACKDROPS.map((b) => (
          <button
            key={b.id}
            className={backdrop === b.id ? 'preset-button preset-button-active' : 'preset-button'}
            onClick={() => setBackdrop(b.id)}
          >
            {b.icon} {b.label}
          </button>
        ))}
      </div>

      {backdrop === 'seamless' && (
        <>
          <h3>Paper Colour</h3>
          <div className="swatch-row">
            {PAPER_COLORS.map((c) => (
              <button
                key={c}
                className={backdropColor === c ? 'swatch swatch-active' : 'swatch'}
                style={{ background: c }}
                onClick={() => setBackdropColor(c)}
                aria-label={c}
              />
            ))}
            <input
              type="color"
              className="swatch-custom"
              value={backdropColor}
              onChange={(e) => setBackdropColor(e.target.value)}
              aria-label="Custom colour"
            />
          </div>
        </>
      )}
    </div>
  )
}
