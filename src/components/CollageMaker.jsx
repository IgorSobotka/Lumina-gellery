import { useState, useRef, useEffect, useCallback } from 'react'
import { useLang } from '../i18n/index'
import styles from './CollageMaker.module.css'

// Layout definitions: each slot is { x, y, w, h } as fractions 0–1
const LAYOUTS = [
  {
    id: '2col', label: '2×1', slots: [
      { x:0,    y:0, w:0.5,  h:1 },
      { x:0.5,  y:0, w:0.5,  h:1 },
    ]
  },
  {
    id: '3col', label: '3×1', slots: [
      { x:0,       y:0, w:1/3, h:1 },
      { x:1/3,     y:0, w:1/3, h:1 },
      { x:2/3,     y:0, w:1/3, h:1 },
    ]
  },
  {
    id: '2row', label: '1×2', slots: [
      { x:0, y:0,   w:1, h:0.5 },
      { x:0, y:0.5, w:1, h:0.5 },
    ]
  },
  {
    id: '2+1', label: '2+1', slots: [
      { x:0,   y:0, w:0.5, h:0.5 },
      { x:0.5, y:0, w:0.5, h:0.5 },
      { x:0,   y:0.5, w:1, h:0.5 },
    ]
  },
  {
    id: '1+2', label: '1+2', slots: [
      { x:0, y:0,   w:1, h:0.5 },
      { x:0, y:0.5, w:0.5, h:0.5 },
      { x:0.5, y:0.5, w:0.5, h:0.5 },
    ]
  },
  {
    id: '2x2', label: '2×2', slots: [
      { x:0,   y:0,   w:0.5, h:0.5 },
      { x:0.5, y:0,   w:0.5, h:0.5 },
      { x:0,   y:0.5, w:0.5, h:0.5 },
      { x:0.5, y:0.5, w:0.5, h:0.5 },
    ]
  },
  {
    id: '3x2', label: '3×2', slots: [
      { x:0,       y:0,   w:1/3, h:0.5 },
      { x:1/3,     y:0,   w:1/3, h:0.5 },
      { x:2/3,     y:0,   w:1/3, h:0.5 },
      { x:0,       y:0.5, w:1/3, h:0.5 },
      { x:1/3,     y:0.5, w:1/3, h:0.5 },
      { x:2/3,     y:0.5, w:1/3, h:0.5 },
    ]
  },
  {
    id: 'featured', label: 'Featured', slots: [
      { x:0,   y:0,   w:0.67, h:1 },
      { x:0.67,y:0,   w:0.33, h:0.5 },
      { x:0.67,y:0.5, w:0.33, h:0.5 },
    ]
  },
]

const BG_OPTIONS = ['#000000', '#ffffff', '#1a1a2e', '#2d1b4e', '#0d1117']
const CANVAS_W = 1200
const CANVAS_H = 800

export default function CollageMaker({ images, onClose }) {
  const t = useLang()
  const canvasRef  = useRef(null)
  const [layoutId, setLayoutId]   = useState('2col')
  const [gap,      setGap]        = useState(8)
  const [bg,       setBg]         = useState('#000000')
  const [exporting, setExporting] = useState(false)
  const [slots,    setSlots]      = useState([]) // assigned image indices per slot

  const layout = LAYOUTS.find(l => l.id === layoutId) ?? LAYOUTS[0]

  // Assign images to slots (cycle if fewer images than slots)
  useEffect(() => {
    const count = layout.slots.length
    setSlots(Array.from({ length: count }, (_, i) => i % images.length))
  }, [layoutId, images.length])

  // Draw canvas
  const draw = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    const loadImg = (src) => new Promise((res, rej) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload  = () => res(img)
      img.onerror = rej
      img.src = src
    })

    for (let i = 0; i < layout.slots.length; i++) {
      const slot   = layout.slots[i]
      const imgIdx = slots[i] ?? 0
      const imgObj = images[imgIdx]
      if (!imgObj) continue

      const sx = Math.round(slot.x * CANVAS_W + gap / 2)
      const sy = Math.round(slot.y * CANVAS_H + gap / 2)
      const sw = Math.round(slot.w * CANVAS_W - gap)
      const sh = Math.round(slot.h * CANVAS_H - gap)

      try {
        const img = await loadImg(imgObj.url)
        // Cover fit
        const ratio = img.naturalWidth / img.naturalHeight
        const slotRatio = sw / sh
        let srcX = 0, srcY = 0, srcW = img.naturalWidth, srcH = img.naturalHeight
        if (ratio > slotRatio) {
          srcW = Math.round(img.naturalHeight * slotRatio)
          srcX = Math.round((img.naturalWidth - srcW) / 2)
        } else {
          srcH = Math.round(img.naturalWidth / slotRatio)
          srcY = Math.round((img.naturalHeight - srcH) / 2)
        }
        ctx.drawImage(img, srcX, srcY, srcW, srcH, sx, sy, sw, sh)
      } catch { /* skip */ }
    }
  }, [layout, slots, gap, bg, images])

  useEffect(() => { draw() }, [draw])

  const handleExport = async () => {
    setExporting(true)
    await draw()
    const canvas = canvasRef.current
    const dataURL = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `collage_${Date.now()}.png`
    link.href = dataURL
    link.click()
    setExporting(false)
  }

  const cycleSlot = (slotIdx) => {
    setSlots(prev => {
      const next = [...prev]
      next[slotIdx] = (prev[slotIdx] + 1) % images.length
      return next
    })
  }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.panel}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sideTitle}>{t('collageTitle')}</div>

          {/* Layout picker */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>{t('collageLayout')}</div>
            <div className={styles.layoutGrid}>
              {LAYOUTS.map(l => (
                <button
                  key={l.id}
                  className={`${styles.layoutBtn} ${layoutId === l.id ? styles.layoutBtnActive : ''}`}
                  onClick={() => setLayoutId(l.id)}
                  title={l.label}
                >
                  <LayoutPreview slots={l.slots} />
                  <span className={styles.layoutLabel}>{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Gap */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>{t('collageGap')} ({gap}px)</div>
            <input
              type="range" min="0" max="40" value={gap}
              onChange={e => setGap(Number(e.target.value))}
              className={styles.slider}
            />
          </div>

          {/* Background */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>{t('collageBg')}</div>
            <div className={styles.bgRow}>
              {BG_OPTIONS.map(c => (
                <button
                  key={c}
                  className={`${styles.bgBtn} ${bg === c ? styles.bgBtnActive : ''}`}
                  style={{ background: c, border: c === '#ffffff' ? '1px solid rgba(255,255,255,0.25)' : undefined }}
                  onClick={() => setBg(c)}
                />
              ))}
              <input
                type="color" value={bg} onChange={e => setBg(e.target.value)}
                className={styles.colorPicker}
                title="Custom"
              />
            </div>
          </div>

          {/* Export */}
          <button className={styles.exportBtn} onClick={handleExport} disabled={exporting}>
            {exporting ? t('collageExporting') : t('collageExport')}
          </button>

          <button className={styles.closeBtn} onClick={onClose}>{t('pvCancel')}</button>
        </div>

        {/* Canvas preview */}
        <div className={styles.canvasWrap}>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className={styles.canvas}
          />
          {/* Slot overlay buttons (click to cycle image) */}
          <div className={styles.slotOverlay}>
            {layout.slots.map((slot, i) => (
              <button
                key={i}
                className={styles.slotBtn}
                style={{
                  left:   `${slot.x * 100}%`,
                  top:    `${slot.y * 100}%`,
                  width:  `${slot.w * 100}%`,
                  height: `${slot.h * 100}%`,
                }}
                onClick={() => cycleSlot(i)}
                title="Click to cycle image"
              >
                <span className={styles.slotCycleHint}>↻</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Mini layout preview SVG
function LayoutPreview({ slots }) {
  return (
    <svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {slots.map((s, i) => (
        <rect
          key={i}
          x={s.x * 36 + 1}
          y={s.y * 24 + 1}
          width={s.w * 36 - 2}
          height={s.h * 24 - 2}
          rx="1.5"
          fill="rgba(255,255,255,0.18)"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="0.8"
        />
      ))}
    </svg>
  )
}
