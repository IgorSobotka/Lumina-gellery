export const DEFAULT_EDIT = {
  brightness:   100,  // 0–200, default 100
  contrast:     100,  // 0–200, default 100
  saturation:   100,  // 0–200, default 100
  exposure:       0,  // -100–100
  temperature:    0,  // -100 (cool) – +100 (warm)
  highlights:     0,  // -100–100
  shadows:        0,  // -100–100
  vignette:       0,  // 0–100
  sharpness:      0,  // -100 (blur) – +100 (sharpen)
  rotation:       0,  // 0 | 90 | 180 | 270
  flipH:      false,
  flipV:      false,
  crop:        null,  // null | { x, y, w, h } — normalised 0–1 fractions
}

export function isEdited(state) {
  const d = DEFAULT_EDIT
  return (
    (state.brightness  ?? 100) !== d.brightness  ||
    (state.contrast    ?? 100) !== d.contrast    ||
    (state.saturation  ?? 100) !== d.saturation  ||
    (state.exposure    ?? 0)   !== d.exposure    ||
    (state.temperature ?? 0)   !== d.temperature ||
    (state.highlights  ?? 0)   !== d.highlights  ||
    (state.shadows     ?? 0)   !== d.shadows     ||
    (state.vignette    ?? 0)   !== d.vignette    ||
    (state.sharpness   ?? 0)   !== d.sharpness   ||
    (state.rotation    ?? 0)   !== d.rotation    ||
    state.flipH || state.flipV || state.crop !== null
  )
}

/** CSS filter string for live <img> preview */
export function toFilterCSS(state) {
  const br  = Math.max(0, (state.brightness + state.exposure) / 100)
  const co  = Math.max(0, state.contrast   / 100)
  const sa  = Math.max(0, state.saturation / 100)
  const parts = [`brightness(${br})`, `contrast(${co})`, `saturate(${sa})`]

  // Temperature — CSS approximation
  const t = state.temperature ?? 0
  if (t > 0) {
    // Warm: sepia tint + slight hue shift toward orange
    parts.push(`sepia(${(t * 0.5).toFixed(1)}%)`, `hue-rotate(-${(t * 0.1).toFixed(1)}deg)`)
  } else if (t < 0) {
    // Cool: hue shift toward blue + slight desaturate
    parts.push(`hue-rotate(${(Math.abs(t) * 0.14).toFixed(1)}deg)`, `saturate(${(100 - Math.abs(t) * 0.12).toFixed(1)}%)`)
  }

  // Sharpness — contrast boost / blur approximation
  const sh = state.sharpness ?? 0
  if (sh > 0) {
    parts.push(`contrast(${(100 + sh * 0.3).toFixed(1)}%)`)
  } else if (sh < 0) {
    parts.push(`blur(${(-sh / 85).toFixed(2)}px)`)
  }

  return parts.join(' ')
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
  const top  = (c.y * 100).toFixed(2)
  const rgt  = ((1 - c.x - c.w) * 100).toFixed(2)
  const bot  = ((1 - c.y - c.h) * 100).toFixed(2)
  const lft  = (c.x * 100).toFixed(2)
  return `inset(${top}% ${rgt}% ${bot}% ${lft}%)`
}

// ── Export helpers ────────────────────────────────────────────────────────────

const clampByte = v => Math.max(0, Math.min(255, Math.round(v)))

/** Per-pixel: temperature, highlights, shadows */
function applyPixelEffects(ctx, w, h, state) {
  const temp = (state.temperature ?? 0) / 100
  const hi   = (state.highlights  ?? 0) / 100
  const sh   = (state.shadows     ?? 0) / 100
  if (temp === 0 && hi === 0 && sh === 0) return

  const imgData = ctx.getImageData(0, 0, w, h)
  const d = imgData.data

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2]

    // Temperature (±28 R, ±7 G, ∓28 B)
    if (temp !== 0) {
      r = clampByte(r + temp * 28)
      g = clampByte(g + temp * 7)
      b = clampByte(b - temp * 28)
    }

    // Recalculate luminance after temp
    const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255

    // Highlights — affects bright tones (lum > 0.5)
    if (hi !== 0) {
      const mask = Math.max(0, lum * 2 - 1)  // 0 @ lum=0.5, 1 @ lum=1
      const adj  = hi * mask * 62
      r = clampByte(r + adj)
      g = clampByte(g + adj)
      b = clampByte(b + adj)
    }

    // Shadows — affects dark tones (lum < 0.5)
    if (sh !== 0) {
      const mask = Math.max(0, 1 - lum * 2)  // 1 @ lum=0, 0 @ lum=0.5
      const adj  = sh * mask * 62
      r = clampByte(r + adj)
      g = clampByte(g + adj)
      b = clampByte(b + adj)
    }

    d[i] = r; d[i + 1] = g; d[i + 2] = b
  }
  ctx.putImageData(imgData, 0, 0)
}

/** Apply text watermark to canvas context */
export function applyWatermark(ctx, w, h, wm) {
  if (!wm?.enabled) return
  ctx.save()
  ctx.globalAlpha = (wm.opacity ?? 70) / 100

  const pad = Math.round(Math.min(w, h) * 0.025)
  const fontSize = Math.max(11, Math.round(Math.min(w, h) * (wm.fontSize ?? 20) / 600))
  ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
  ctx.fillStyle = wm.color ?? '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,0.65)'
  ctx.shadowBlur = Math.round(fontSize * 0.5)
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 1

  const text = wm.text || '© Lumina'
  const tw = ctx.measureText(text).width
  const th = fontSize

  const positions = {
    topLeft:      { x: pad,             y: pad + th },
    topCenter:    { x: (w - tw) / 2,    y: pad + th },
    topRight:     { x: w - pad - tw,    y: pad + th },
    middleLeft:   { x: pad,             y: (h + th) / 2 },
    center:       { x: (w - tw) / 2,    y: (h + th) / 2 },
    middleRight:  { x: w - pad - tw,    y: (h + th) / 2 },
    bottomLeft:   { x: pad,             y: h - pad },
    bottomCenter: { x: (w - tw) / 2,    y: h - pad },
    bottomRight:  { x: w - pad - tw,    y: h - pad },
  }
  const pos = positions[wm.position ?? 'bottomRight'] ?? positions.bottomRight
  ctx.fillText(text, pos.x, pos.y)
  ctx.restore()
}

/**
 * Export: draw image with all edits onto a canvas, return dataURL.
 * @param {HTMLImageElement} imgEl
 * @param {object} state  - editState
 * @param {'jpeg'|'png'|'webp'} format
 * @param {number} quality  0–1
 * @param {object|null} resize  - { pct } | { w } | { h } | null
 * @param {object|null} watermark  - watermark config or null
 */
export function exportCanvas(imgEl, state, format = 'jpeg', quality = 0.92, resize = null, watermark = null) {
  const { rotation, flipH, flipV, crop } = state
  const ow = imgEl.naturalWidth
  const oh = imgEl.naturalHeight

  // Source rect in natural px
  const sx = crop ? Math.round(crop.x * ow) : 0
  const sy = crop ? Math.round(crop.y * oh) : 0
  const sw = crop ? Math.round(crop.w * ow) : ow
  const sh = crop ? Math.round(crop.h * oh) : oh

  const rotated = rotation === 90 || rotation === 270
  const natCw = rotated ? sh : sw
  const natCh = rotated ? sw : sh

  // Resize factor
  let sf = 1
  if (resize) {
    if (resize.pct)  sf = resize.pct / 100
    else if (resize.w) sf = resize.w / natCw
    else if (resize.h) sf = resize.h / natCh
  }
  const cw = Math.max(1, Math.round(natCw * sf))
  const ch = Math.max(1, Math.round(natCh * sf))

  const canvas = document.createElement('canvas')
  canvas.width  = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')

  // Build CSS filter (all effects except pixel-level)
  const br = Math.max(0, (state.brightness + state.exposure) / 100)
  const co = Math.max(0, state.contrast   / 100)
  const sa = Math.max(0, state.saturation / 100)
  const fParts = [`brightness(${br})`, `contrast(${co})`, `saturate(${sa})`]

  const t = state.temperature ?? 0
  if (t > 0) fParts.push(`sepia(${(t * 0.5).toFixed(1)}%)`, `hue-rotate(-${(t * 0.1).toFixed(1)}deg)`)
  else if (t < 0) fParts.push(`hue-rotate(${(Math.abs(t) * 0.14).toFixed(1)}deg)`, `saturate(${(100 - Math.abs(t) * 0.12).toFixed(1)}%)`)

  const sharpVal = state.sharpness ?? 0
  if (sharpVal > 0) fParts.push(`contrast(${(100 + sharpVal * 0.3).toFixed(1)}%)`)
  else if (sharpVal < 0) fParts.push(`blur(${(-sharpVal / 85).toFixed(2)}px)`)

  ctx.filter = fParts.join(' ')

  // Draw source → canvas (with rotation, flip, resize via scale)
  ctx.save()
  ctx.translate(cw / 2, ch / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.scale((flipH ? -1 : 1) * sf, (flipV ? -1 : 1) * sf)
  ctx.drawImage(imgEl, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh)
  ctx.restore()

  // Pixel-level effects (temp, highlights, shadows)
  ctx.filter = 'none'
  applyPixelEffects(ctx, cw, ch, state)

  // Vignette overlay
  const vig = state.vignette ?? 0
  if (vig > 0) {
    const cx = cw / 2, cy = ch / 2
    const r  = Math.sqrt(cw * cw + ch * ch) / 2
    const grad = ctx.createRadialGradient(cx, cy, r * 0.25, cx, cy, r)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, `rgba(0,0,0,${(vig / 100 * 0.82).toFixed(3)})`)
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, cw, ch)
  }

  applyWatermark(ctx, cw, ch, watermark)

  const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg'
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
