import { useStore } from '../state/useStore'

export function LightingPanel() {
  const lighting = useStore((s) => s.lighting)
  const setLighting = useStore((s) => s.setLighting)

  return (
    <div className="panel-section">
      <h3>Lighting &amp; Reference</h3>
      <div className="slider-row">
        <div className="slider-label">
          <span>Key light azimuth</span>
          <span className="slider-value">{lighting.keyAzimuth}°</span>
        </div>
        <input
          type="range"
          min={-180}
          max={180}
          value={lighting.keyAzimuth}
          onChange={(e) => setLighting({ keyAzimuth: Number(e.target.value) })}
        />
      </div>
      <div className="slider-row">
        <div className="slider-label">
          <span>Key light elevation</span>
          <span className="slider-value">{lighting.keyElevation}°</span>
        </div>
        <input
          type="range"
          min={5}
          max={90}
          value={lighting.keyElevation}
          onChange={(e) => setLighting({ keyElevation: Number(e.target.value) })}
        />
      </div>
      <div className="slider-row">
        <div className="slider-label">
          <span>Key light intensity</span>
          <span className="slider-value">{lighting.keyIntensity.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={0.1}
          value={lighting.keyIntensity}
          onChange={(e) => setLighting({ keyIntensity: Number(e.target.value) })}
        />
      </div>
      <div className="slider-row">
        <div className="slider-label">
          <span>Fill light intensity</span>
          <span className="slider-value">{lighting.fillIntensity.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={lighting.fillIntensity}
          onChange={(e) => setLighting({ fillIntensity: Number(e.target.value) })}
        />
      </div>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={lighting.rimEnabled}
          onChange={(e) => setLighting({ rimEnabled: e.target.checked })}
        />
        Rim light
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={lighting.showFloorGrid}
          onChange={(e) => setLighting({ showFloorGrid: e.target.checked })}
        />
        Floor grid
      </label>
    </div>
  )
}
