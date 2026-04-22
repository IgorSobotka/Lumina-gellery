import { useState, useCallback, useEffect, useRef } from 'react'
import { DEFAULT_EDIT, toFilterCSS } from './editorUtils'
import { useLang } from '../../i18n/index'
import styles from './EditorPanel.module.css'

// ── Slider ────────────────────────────────────────────────────────────────────
function Slider({ label, value, min, max, defaultVal, onChange, unit = '' }) {
  const pct = ((value - min) / (max - min)) * 100
  const display = `${value > 0 && min < 0 ? '+' : ''}${value}${unit}`
  return (
    <label className={styles.sliderRow}>
      <div className={styles.sliderTop}>
        <span className={styles.sliderLabel}>{label}</span>
        <span className={styles.sliderVal}>{display}</span>
      </div>
      <div className={styles.sliderTrack}>
        <div className={styles.sliderFill} style={{ width: `${pct}%` }} />
        <input type="range" min={min} max={max} value={value}
          onChange={e => onChange(Number(e.target.value))}
          onDoubleClick={() => onChange(defaultVal)}
          className={styles.sliderInput} />
      </div>
    </label>
  )
}

// ── Histogram ─────────────────────────────────────────────────────────────────
function Histogram({ imgRef, editState }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const img = imgRef?.current
    const canvas = canvasRef.current
    if (!img || !canvas || !img.naturalWidth) return

    const W = canvas.width  = canvas.offsetWidth  || 200
    const H = canvas.height = 48

    // Sample pixels from img with current edit filters applied
    const off = document.createElement('canvas')
    const MAX_DIM = 300
    const scale = Math.min(1, MAX_DIM / img.naturalWidth, MAX_DIM / img.naturalHeight)
    off.width  = Math.max(1, Math.round(img.naturalWidth  * scale))
    off.height = Math.max(1, Math.round(img.naturalHeight * scale))
    const oc = off.getContext('2d')
    // Apply current CSS filters so histogram reflects edited state
    if (editState) oc.filter = toFilterCSS(editState)
    oc.drawImage(img, 0, 0, off.width, off.height)
    oc.filter = 'none'
    const data = oc.getImageData(0, 0, off.width, off.height).data

    const rBins = new Uint32Array(256)
    const gBins = new Uint32Array(256)
    const bBins = new Uint32Array(256)
    const lBins = new Uint32Array(256)
    for (let i = 0; i < data.length; i += 4) {
      rBins[data[i]]++; gBins[data[i+1]]++; bBins[data[i+2]]++
      lBins[Math.round(data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114)]++
    }

    const peak = Math.max(
      ...rBins, ...gBins, ...bBins
    ) || 1

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, W, H)

    const drawCurve = (bins, color) => {
      ctx.beginPath()
      ctx.globalAlpha = 0.55
      ctx.fillStyle = color
      ctx.moveTo(0, H)
      for (let x = 0; x < 256; x++) {
        const cx = (x / 255) * W
        const cy = H - (bins[x] / peak) * H * 0.95
        x === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy)
      }
      ctx.lineTo(W, H)
      ctx.closePath()
      ctx.fill()
    }

    drawCurve(rBins, '#f05')
    drawCurve(gBins, '#0d0')
    drawCurve(bBins, '#07f')

    // Luminance (white overlay)
    ctx.globalAlpha = 0.25
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.moveTo(0, H)
    for (let x = 0; x < 256; x++) {
      const cx = (x / 255) * W
      const cy = H - (lBins[x] / peak) * H * 0.95
      x === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy)
    }
    ctx.lineTo(W, H)
    ctx.closePath()
    ctx.fill()
    ctx.globalAlpha = 1
  })   // run every render (editState changes propagate via parent re-render)

  return (
    <div className={styles.histoWrap}>
      <canvas ref={canvasRef} className={styles.histoCanvas} />
    </div>
  )
}

// ── Aspect ratio presets ──────────────────────────────────────────────────────
const RATIOS = [
  { label: 'Free', w: 0, h: 0 },
  { label: '1:1',  w: 1, h: 1 },
  { label: '3:2',  w: 3, h: 2 },
  { label: '4:3',  w: 4, h: 3 },
  { label: '16:9', w: 16, h: 9 },
]

// ── EditorPanel ───────────────────────────────────────────────────────────────
export default function EditorPanel({ editState, onChange, onStartCrop, imgRef, showOriginal, onToggleOriginal }) {
  const t      = useLang()
  const [tab, setTab] = useState('light')
  const set    = useCallback((key, val) => onChange({ ...editState, [key]: val }), [editState, onChange])
  const rotate = (dir) => onChange({ ...editState, rotation: ((editState.rotation + dir) + 360) % 360 })
  const reset  = () => onChange({ ...DEFAULT_EDIT })
  const hasCrop = editState.crop !== null
  const [aspectRatio, setAspectRatio] = useState(null)  // { w, h } or null

  const handleStartCropWithRatio = () => {
    onStartCrop(aspectRatio)
  }

  return (
    <div className={styles.panel}>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        {[['light', t('tabLight')], ['color', t('tabColor')], ['geometry', t('tabGeometry')]].map(([id, label]) => (
          <button key={id} className={`${styles.tab} ${tab === id ? styles.tabActive : ''}`}
            onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Histogram (Light + Color tabs) ── */}
      {(tab === 'light' || tab === 'color') && imgRef && (
        <div className={styles.histoGroup}>
          <Histogram imgRef={imgRef} editState={editState} />
        </div>
      )}

      {/* ── Scroll area ── */}
      <div className={styles.scroll}>

        {/* ── LIGHT tab ── */}
        {tab === 'light' && <>
          <div className={styles.group}>
            <div className={styles.groupTitle}>{t('toneSection')}</div>
            <Slider label={t('exposure')}   value={editState.exposure   ?? 0}   min={-100} max={100} defaultVal={0}   onChange={v => set('exposure', v)} />
            <Slider label={t('brightness')} value={editState.brightness ?? 100} min={0}    max={200} defaultVal={100} onChange={v => set('brightness', v)} />
            <Slider label={t('contrast')}   value={editState.contrast   ?? 100} min={0}    max={200} defaultVal={100} onChange={v => set('contrast', v)} />
            <Slider label={t('highlights')} value={editState.highlights ?? 0}   min={-100} max={100} defaultVal={0}   onChange={v => set('highlights', v)} />
            <Slider label={t('shadows')}    value={editState.shadows    ?? 0}   min={-100} max={100} defaultVal={0}   onChange={v => set('shadows', v)} />
          </div>
        </>}

        {/* ── COLOR tab ── */}
        {tab === 'color' && <>
          <div className={styles.group}>
            <div className={styles.groupTitle}>{t('colorSection')}</div>
            <Slider label={t('saturation')}  value={editState.saturation  ?? 100} min={0}    max={200} defaultVal={100} onChange={v => set('saturation', v)} />
            <Slider label={t('temperature')} value={editState.temperature ?? 0}   min={-100} max={100} defaultVal={0}   onChange={v => set('temperature', v)} />
          </div>
          <div className={styles.group}>
            <div className={styles.groupTitle}>{t('effectsSection')}</div>
            <Slider label={t('vignette')}   value={editState.vignette  ?? 0}   min={0}    max={100} defaultVal={0}   onChange={v => set('vignette', v)} />
            <Slider label={t('sharpness')}  value={editState.sharpness ?? 0}   min={-100} max={100} defaultVal={0}   onChange={v => set('sharpness', v)} />
          </div>
        </>}

        {/* ── GEOMETRY tab ── */}
        {tab === 'geometry' && <>
          {/* Crop */}
          <div className={styles.group}>
            <div className={styles.groupTitle}>{t('cropSection')}</div>

            {/* Aspect ratio presets */}
            <div className={styles.ratioRow}>
              {RATIOS.map(r => (
                <button
                  key={r.label}
                  className={`${styles.ratioBtn} ${
                    (r.w === 0 && aspectRatio === null) ||
                    (aspectRatio && aspectRatio.w === r.w && aspectRatio.h === r.h)
                      ? styles.ratioBtnActive : ''
                  }`}
                  onClick={() => setAspectRatio(r.w === 0 ? null : r)}>
                  {r.label}
                </button>
              ))}
            </div>

            <div className={styles.cropRow}>
              <button
                className={`${styles.toolBtn} ${styles.cropBtn} ${hasCrop ? styles.toolBtnActive : ''}`}
                onClick={handleStartCropWithRatio}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M4 1v10a1 1 0 001 1h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <path d="M1 4h10a1 1 0 011 1v10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.1" strokeDasharray="2 1.5"/>
                </svg>
                <span>{t('cropBtn')}</span>
              </button>
              {hasCrop && (
                <button className={`${styles.toolBtn} ${styles.cropResetBtn}`}
                  onClick={() => onChange({ ...editState, crop: null })} title={t('removeCropTitle')}>
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  <span>{t('removeCropBtn')}</span>
                </button>
              )}
            </div>
            {hasCrop && (
              <div className={styles.cropInfo}>
                {Math.round(editState.crop.w * 100)}% × {Math.round(editState.crop.h * 100)}%
              </div>
            )}
          </div>

          {/* Geometry */}
          <div className={styles.group}>
            <div className={styles.groupTitle}>{t('geometrySection')}</div>
            <div className={styles.btnRow}>
              <button className={styles.toolBtn} onClick={() => rotate(-90)}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8A5 5 0 1 0 8 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M3 4v4h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>{t('rotateLeft')}</span>
              </button>
              <button className={styles.toolBtn} onClick={() => rotate(90)}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13 8A5 5 0 1 1 8 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M13 4v4H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>{t('rotateRight')}</span>
              </button>
              <button className={`${styles.toolBtn} ${editState.flipH ? styles.toolBtnActive : ''}`} onClick={() => set('flipH', !editState.flipH)}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 5l4 3-4 3M14 5l-4 3 4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>Flip H</span>
              </button>
              <button className={`${styles.toolBtn} ${editState.flipV ? styles.toolBtnActive : ''}`} onClick={() => set('flipV', !editState.flipV)}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M5 2l3 4 3-4M5 14l3-4 3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>Flip V</span>
              </button>
            </div>
          </div>
        </>}

        {/* ── Before / After + Reset (all tabs) ── */}
        <div className={styles.group}>
          <div className={styles.baRow}>
            <button
              className={`${styles.baBtn} ${showOriginal ? styles.baBtnActive : ''}`}
              onMouseDown={onToggleOriginal}
              onMouseUp={onToggleOriginal}
              onMouseLeave={showOriginal ? onToggleOriginal : undefined}
              title={t('beforeAfter')}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="3" width="6" height="10" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="9" y="3" width="6" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2 1.5"/>
                <path d="M7.5 8h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              {t('beforeAfter')}
            </button>
            <button className={styles.resetBtn} onClick={reset}>
              {t('resetAll')}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
