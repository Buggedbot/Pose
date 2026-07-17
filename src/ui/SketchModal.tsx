import { useStore } from '../state/useStore'

export function SketchModal() {
  const sketchImage = useStore((s) => s.sketchImage)
  const sketchGenerating = useStore((s) => s.sketchGenerating)
  const sketchError = useStore((s) => s.sketchError)
  const closeSketch = useStore((s) => s.closeSketch)

  if (!sketchGenerating && !sketchImage && !sketchError) return null

  return (
    <div className="sketch-overlay" onClick={closeSketch}>
      <div className="sketch-modal" onClick={(e) => e.stopPropagation()}>
        {sketchGenerating && (
          <div className="sketch-status">
            <div className="sketch-spinner" />
            <p>Sketching this pose…</p>
          </div>
        )}

        {sketchError && !sketchGenerating && (
          <div className="sketch-status">
            <p className="hint">{sketchError}</p>
            <button className="reset-all-button" onClick={closeSketch}>
              Close
            </button>
          </div>
        )}

        {sketchImage && !sketchGenerating && (
          <>
            <img src={sketchImage} alt="Generated sketch of the current pose" className="sketch-image" />
            <div className="sketch-actions">
              <a className="sketch-download" href={sketchImage} download="pose-sketch.png">
                Download PNG
              </a>
              <button className="reset-all-button" onClick={closeSketch}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
