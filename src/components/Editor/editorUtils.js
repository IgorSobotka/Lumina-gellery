export const DEFAULT_EDIT = {
  brightness: 100,  // 0–200, default 100
  contrast:   100,  // 0–200, default 100
  saturation: 100,  // 0–200, default 100
  exposure:     0,  // -100–100, added to brightness
  rotation:     0,  // 0 | 90 | 180 | 270
  flipH:    false,
  flipV:    false,
  crop:      null,  // null | { x, y, w, h } — normalised 0–1 fractions
}

export function isEdited(state) {
  const d = DEFAULT_EDIT
  return state.brightness !== d.brightness || state.contrast !== d.contrast ||
    state.saturation !== d.saturation || state.exposure !== d.exposure ||
    state.rotation !== d.rotation || state.flipH || state.flipV || state.crop !== null
}

/** CSS filter string for live <img> preview */
export function toFilterCSS(state) {
  const br = Math.max(0, (state.brightness + state.exposure) / 100)
  const co = Math.max(0, state.contrast   / 100)
  const sa = Math.max(0, state.saturation / 100)
  return `brightness(${br}) contrast(${co}) saturate(${sa})`
}

/** CSS transform string for live <img> preview */
export function toTransformCSS(state, basePan, baseScale) {
  const { rotation, flipH, flipV } = state
  const sx = flipH ? -baseScale : baseScale
  const sy = flipV ? -baseScale : baseScale
  return `translate(${basePan.x}px,${basePan.y}px) rotate(${rotation}deg) scale(${sx},${sy})`
}

/** CSS clip-path for live crop preview (applied when not in crop mode) */
export function toCropCSS(state) {
  const c = state.crop
  if (!c) return 'none'
  const t = (c.y * 100).toFixed(2)
  const r = ((1 - c.x - c.w) * 100).toFixed(2)
  const b = ((1 - c.y - c.h) * 100).toFixed(2)
  const l = (c.x * 100).toFixed(2)
  return `inset(${t}% ${r}% ${b}% ${l}%)`
}

/** Export: draw image with all edits (including crop) onto a canvas, return dataURL */
export function exportCanvas(imgEl, state, format = 'jpeg', quality = 0.92) {
  const { rotation, flipH, flipV, crop } = state
  const ow = imgEl.naturalWidth
  const oh = imgEl.naturalHeight

  // Source rect in natural image pixel coords
  const sx = crop ? Math.round(crop.x * ow) : 0
  const sy = crop ? Math.round(crop.y * oh) : 0
  const sw = crop ? Math.round(crop.w * ow) : ow
  const sh = crop ? Math.round(crop.h * oh) : oh

  const rotated = rotation === 90 || rotation === 270
  const cw = rotated ? sh : sw
  const ch = rotated ? sw : sh

  const canvas = document.createElement('canvas')
  canvas.width  = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')

  ctx.filter = toFilterCSS(state)
  ctx.translate(cw / 2, ch / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
  ctx.drawImage(imgEl, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh)

  const mime = format === 'png' ? 'image/png' : 'image/jpeg'
  return canvas.toDataURL(mime, quality)
}

/** Load image from URL and export with edits — returns Promise<dataURL> */
export function exportFromUrl(url, state, format = 'jpeg', quality = 0.92) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(exportCanvas(img, state, format, quality))
    img.onerror = reject
    img.src = url
  })
}
