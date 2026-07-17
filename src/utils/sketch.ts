// Turns a rendered snapshot of the pose into a clean line-art sketch, entirely client-side —
// no server, no API key, no cost. A Sobel edge filter finds outlines/silhouette and shading
// boundaries, then those edges are drawn as dark strokes on white paper.

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read the captured image.'))
    img.src = src
  })
}

const GX = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
const GY = [-1, -2, -1, 0, 0, 0, 1, 2, 1]

function sobelToSketch(src: ImageData, threshold: number): ImageData {
  const { width, height, data } = src
  const gray = new Float32Array(width * height)
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }

  const out = new ImageData(width, height)
  out.data.fill(255)
  for (let i = 3; i < out.data.length; i += 4) out.data[i] = 255

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sx = 0
      let sy = 0
      let k = 0
      for (let j = -1; j <= 1; j++) {
        for (let i = -1; i <= 1; i++) {
          const v = gray[(y + j) * width + (x + i)]
          sx += v * GX[k]
          sy += v * GY[k]
          k++
        }
      }
      const magnitude = Math.sqrt(sx * sx + sy * sy)
      if (magnitude > threshold) {
        const idx = (y * width + x) * 4
        const shade = Math.max(0, 60 - magnitude * 0.05)
        out.data[idx] = shade
        out.data[idx + 1] = shade
        out.data[idx + 2] = shade
        out.data[idx + 3] = 255
      }
    }
  }
  return out
}

export interface SketchOptions {
  threshold?: number
}

/** Runs the Sobel sketch filter over a captured PNG data URL and returns a new PNG data URL. */
export async function generateSketchFromDataUrl(dataUrl: string, options: SketchOptions = {}): Promise<string> {
  const img = await loadImage(dataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available in this browser.')

  ctx.drawImage(img, 0, 0)
  const source = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const sketch = sobelToSketch(source, options.threshold ?? 45)
  ctx.putImageData(sketch, 0, 0)
  return canvas.toDataURL('image/png')
}
