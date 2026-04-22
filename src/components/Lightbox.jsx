import { useState, useEffect, useRef, useCallback } from 'react'
import { tagColor } from '../utils/tags'
import { useLang, useLangCode, savedAs } from '../i18n/index'
import EditorPanel from './Editor/EditorPanel'
import { DEFAULT_EDIT, toFilterCSS, toTransformCSS, toCropCSS, isEdited, exportCanvas } from './Editor/editorUtils'
import styles from './Lightbox.module.css'

function formatDate(mtime, locale) {
  return new Date(mtime).toLocaleDateString(locale ?? 'pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })
}
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ── Watermark preview overlay ─────────────────────────────────────────────────
// Lives inside the transformed image wrapper — no DOM measurement needed,
// moves with the image instantly (zero lag).
function WatermarkPreview({ wm }) {
  if (!wm?.enabled || !wm?.text) return null

  const pos    = wm.position ?? 'bottomRight'
  const alignV = pos.startsWith('top') ? 'flex-start' : pos.startsWith('bottom') ? 'flex-end' : 'center'
  const alignH = pos.endsWith('Left')  ? 'flex-start' : pos.endsWith('Right')  ? 'flex-end' : 'center'

  return (
    <div style={{
      position: 'absolute', inset: 0,
      pointerEvents: 'none', zIndex: 15,
      display: 'flex', alignItems: alignV, justifyContent: alignH,
    }}>
      <span style={{
        opacity: (wm.opacity ?? 70) / 100,
        color: wm.color ?? '#fff',
        fontSize: Math.max(12, wm.fontSize ?? 20) + 'px',
        fontWeight: 700,
        textShadow: '0 1px 8px rgba(0,0,0,0.75), 0 0 3px rgba(0,0,0,0.6)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        userSelect: 'none', padding: '8px 12px', letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
      }}>
        {wm.text}
      </span>
    </div>
  )
}

// ── Export panel (floating card) ──────────────────────────────────────────────
function ExportPanel({ imgRef, imgPath, editState, onClose, wm, setWm }) {
  const t    = useLang()
  const lang = useLangCode()
  const [format,    setFormat]    = useState('jpeg')
  const [quality,   setQuality]   = useState(92)
  const [destDir,   setDestDir]   = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [msg,       setMsg]       = useState(null)
  const [resizePct, setResizePct] = useState(100)
  const [customW,   setCustomW]   = useState('')
  const [useCustom, setUseCustom] = useState(false)

  const edited   = isEdited(editState)
  const naturalW = imgRef.current?.naturalWidth  || 0
  const naturalH = imgRef.current?.naturalHeight || 0
  const previewW = useCustom && customW ? Number(customW) : Math.round(naturalW * resizePct / 100)
  const previewH = useCustom && customW && naturalW
    ? Math.round(naturalH * (Number(customW) / naturalW))
    : Math.round(naturalH * resizePct / 100)

  const getResize = () => {
    if (useCustom && customW) return { w: Number(customW) }
    if (resizePct === 100)    return null
    return { pct: resizePct }
  }

  const pickFolder = async () => {
    const p = await window.api?.selectFolder()
    if (p) setDestDir(p)
  }

  const save = async (mode) => {
    if (!imgRef.current || !imgPath) return
    setSaving(true); setMsg(null)
    try {
      const dataURL = exportCanvas(imgRef.current, editState, format, quality / 100, getResize(), wm.enabled ? wm : null)
      const res = await window.api.saveImageFile({ sourcePath: imgPath, dataURL, mode, destDir: mode === 'copy' ? destDir : null })
      if (res.success) {
        setMsg(mode === 'overwrite' ? t('savedSuccess') : savedAs(res.savedPath?.split(/[\\/]/).pop(), lang))
      } else { setMsg(t('saveError')) }
      setTimeout(() => setMsg(null), 3500)
    } catch { setMsg(t('errorGeneric')) }
    setSaving(false)
  }

  const WM_POSITIONS = ['topLeft','topCenter','topRight','middleLeft','center','middleRight','bottomLeft','bottomCenter','bottomRight']

  return (
    <div className={styles.exportFloat}>
      {/* ── Header ── */}
      <div className={styles.efHeader}>
        <span className={styles.efTitle}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {t('exportPanelTitle')}
        </span>
        <button className={styles.efClose} onClick={onClose}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className={styles.efBody}>
        {/* ── Format + Quality ── */}
        <div className={styles.efSection}>
          <div className={styles.efSectionTitle}>{t('infoFormat')}</div>
          <div className={styles.efFmtRow}>
            {['jpeg','png','webp'].map(f => (
              <button key={f}
                className={`${styles.efFmtBtn} ${format === f ? styles.efFmtActive : ''}`}
                onClick={() => setFormat(f)}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          {format !== 'png' && (
            <div className={styles.efQualRow}>
              <span className={styles.efMetaLabel}>{t('quality')}</span>
              <input type="range" min={10} max={100} value={quality}
                onChange={e => setQuality(+e.target.value)} className={styles.efRange} />
              <span className={styles.efMetaVal}>{quality}%</span>
            </div>
          )}
        </div>

        {/* ── Resize ── */}
        <div className={styles.efSection}>
          <div className={styles.efSectionTitle}>{t('exportResizeSec')}</div>
          <div className={styles.efChipRow}>
            {[100, 75, 50, 25].map(pct => (
              <button key={pct}
                className={`${styles.efChip} ${!useCustom && resizePct === pct ? styles.efChipActive : ''}`}
                onClick={() => { setResizePct(pct); setUseCustom(false) }}>
                {pct === 100 ? t('exportResizeOriginal') : `${pct}%`}
              </button>
            ))}
            <button className={`${styles.efChip} ${useCustom ? styles.efChipActive : ''}`}
              onClick={() => setUseCustom(v => !v)}>
              {t('exportResizeCustom')}
            </button>
          </div>
          {useCustom && (
            <div className={styles.efCustomRow}>
              <span className={styles.efMetaLabel}>{t('exportResizeWidth')}</span>
              <input className={styles.efCustomInput} type="number" min={1} max={99999}
                placeholder={naturalW || ''} value={customW}
                onChange={e => setCustomW(e.target.value)} />
              <span className={styles.efMetaLabel}>{t('exportResizePx')}</span>
            </div>
          )}
          {previewW > 0 && previewH > 0 && (
            <div className={styles.efDims}>{previewW} × {previewH} px</div>
          )}
        </div>

        {/* ── Watermark ── */}
        <div className={styles.efSection}>
          <div className={styles.efTitleRow}>
            <span className={styles.efSectionTitle}>{t('watermarkSec')}</span>
            <button className={`${styles.efToggle} ${wm.enabled ? styles.efToggleOn : ''}`}
              onClick={() => setWm(w => ({ ...w, enabled: !w.enabled }))}>
              {wm.enabled ? 'ON' : 'OFF'}
            </button>
          </div>
          {wm.enabled && (
            <div className={styles.efWmBox}>
              <input className={styles.efWmText} type="text" placeholder="© Your Name"
                value={wm.text} onChange={e => setWm(w => ({ ...w, text: e.target.value }))}
                maxLength={80} />
              <div className={styles.efWmLayout}>
                {/* 3×3 position grid */}
                <div className={styles.efWmPosGrid}>
                  {WM_POSITIONS.map(pos => (
                    <button key={pos}
                      className={`${styles.efWmPosBtn} ${wm.position === pos ? styles.efWmPosActive : ''}`}
                      onClick={() => setWm(w => ({ ...w, position: pos }))}
                      title={pos} />
                  ))}
                </div>
                {/* Controls */}
                <div className={styles.efWmControls}>
                  <div className={styles.efWmCtrlRow}>
                    <span>{t('watermarkOpacity')}</span>
                    <input type="range" min={10} max={100} value={wm.opacity}
                      onChange={e => setWm(w => ({ ...w, opacity: +e.target.value }))}
                      className={styles.efRange} />
                    <span>{wm.opacity}%</span>
                  </div>
                  <div className={styles.efWmCtrlRow}>
                    <span>{t('watermarkSize')}</span>
                    <input type="range" min={8} max={60} value={wm.fontSize}
                      onChange={e => setWm(w => ({ ...w, fontSize: +e.target.value }))}
                      className={styles.efRange} />
                    <span>{wm.fontSize}</span>
                  </div>
                  <div className={styles.efWmCtrlRow}>
                    <span>{t('watermarkColor')}</span>
                    <input type="color" value={wm.color}
                      onChange={e => setWm(w => ({ ...w, color: e.target.value }))}
                      className={styles.efWmColor} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Location ── */}
        <div className={styles.efSection}>
          <div className={styles.efSectionTitle}>{t('copyLocation')}</div>
          <div className={styles.efLocRow}>
            <button className={`${styles.efLocBtn} ${!destDir ? styles.efLocActive : ''}`}
              onClick={() => setDestDir(null)}>{t('nextToOriginal')}</button>
            <button className={`${styles.efLocBtn} ${destDir ? styles.efLocActive : ''}`}
              onClick={pickFolder}>{t('chooseDest')}</button>
          </div>
          {destDir && <div className={styles.efPath} title={destDir}>{destDir}</div>}
        </div>

        {/* ── Save ── */}
        <div className={styles.efActions}>
          <button className={styles.efSaveBtn} onClick={() => save('copy')} disabled={saving}>
            {saving ? '…' : t('saveCopy')}
          </button>
          <button className={`${styles.efSaveBtn} ${styles.efSaveBtnOver}`}
            onClick={() => save('overwrite')} disabled={saving || !edited}
            title={!edited ? t('noChangesToSave') : t('willOverwrite')}>
            {t('overwriteOriginal')}
          </button>
          {msg && <div className={`${styles.efMsg} ${msg.startsWith('✕') ? styles.efMsgErr : ''}`}>{msg}</div>}
          {!edited && <div className={styles.efHint}>{t('noEditsHint')}</div>}
        </div>
      </div>
    </div>
  )
}

// ── Crop overlay ─────────────────────────────────────────────────────────────
const HANDLE = 10

function CropOverlay({ imgRef, onApply, onCancel, initialCrop, aspectRatio }) {
  const t          = useLang()
  const overlayRef = useRef(null)
  const imgBounds  = useRef(null)
  const drag       = useRef(null)
  const [box,   setBox]   = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const img = imgRef.current
    const ov  = overlayRef.current
    if (!img || !ov) return
    const ir = img.getBoundingClientRect()
    const or = ov.getBoundingClientRect()
    const b  = { x: ir.left - or.left, y: ir.top - or.top, w: ir.width, h: ir.height }
    imgBounds.current = b
    if (initialCrop) {
      let bx = { x: b.x + initialCrop.x * b.w, y: b.y + initialCrop.y * b.h,
                 w: initialCrop.w * b.w,         h: initialCrop.h * b.h }
      // Enforce aspect ratio if provided
      if (aspectRatio) {
        const targetH = bx.w * aspectRatio.h / aspectRatio.w
        bx = { ...bx, h: targetH }
      }
      setBox(bx)
    } else {
      // Initial box: fit aspect ratio in center
      if (aspectRatio) {
        const ratio = aspectRatio.w / aspectRatio.h
        let bw = b.w * 0.8, bh = bw / ratio
        if (bh > b.h * 0.8) { bh = b.h * 0.8; bw = bh * ratio }
        setBox({ x: b.x + (b.w - bw) / 2, y: b.y + (b.h - bh) / 2, w: bw, h: bh })
      } else {
        setBox({ x: b.x, y: b.y, w: b.w, h: b.h })
      }
    }
    setReady(true)
  }, []) // eslint-disable-line

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

  const startDrag = useCallback((e, handle) => {
    e.preventDefault(); e.stopPropagation()
    drag.current = { handle, sx: e.clientX, sy: e.clientY, sb: { ...box } }
    const onMove = (ev) => {
      const { handle: h, sx, sy, sb } = drag.current
      const dx = ev.clientX - sx, dy = ev.clientY - sy
      const b  = imgBounds.current
      if (!b) return
      let { x, y, w, h: ht } = sb
      const ratio = aspectRatio ? aspectRatio.w / aspectRatio.h : null
      if (h === 'move') {
        x = clamp(sb.x + dx, b.x, b.x + b.w - sb.w)
        y = clamp(sb.y + dy, b.y, b.y + b.h - sb.h)
      } else {
        if (h.includes('e')) { w = clamp(sb.w + dx, 20, b.x + b.w - sb.x); if (ratio) ht = w / ratio }
        if (h.includes('s') && !ratio) ht = clamp(sb.h + dy, 20, b.y + b.h - sb.y)
        if (h.includes('w')) { const nx = clamp(sb.x + dx, b.x, sb.x + sb.w - 20); w = sb.w + (sb.x - nx); x = nx; if (ratio) ht = w / ratio }
        if (h.includes('n') && !ratio) { const ny = clamp(sb.y + dy, b.y, sb.y + sb.h - 20); ht = sb.h + (sb.y - ny); y = ny }
        // For ratio+n handles: adjust from top and match height
        if (ratio && h.includes('n') && !h.includes('e') && !h.includes('w')) {
          const ny = clamp(sb.y + dy, b.y, sb.y + sb.h - 20)
          ht = sb.h + (sb.y - ny); y = ny; w = ht * ratio
        }
      }
      setBox({ x, y, w, h: ht })
    }
    const onUp = () => { drag.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [box, aspectRatio])

  const handleApply = () => {
    const b = imgBounds.current
    if (!b || !box) return
    onApply({ x: Math.max(0, (box.x - b.x) / b.w), y: Math.max(0, (box.y - b.y) / b.h),
              w: Math.max(0.01, box.w / b.w),        h: Math.max(0.01, box.h / b.h) })
  }

  const pts = box ? [
    { h:'nw', l: box.x-HANDLE/2,         t: box.y-HANDLE/2,         c:'nw-resize' },
    { h:'ne', l: box.x+box.w-HANDLE/2,   t: box.y-HANDLE/2,         c:'ne-resize' },
    { h:'sw', l: box.x-HANDLE/2,         t: box.y+box.h-HANDLE/2,   c:'sw-resize' },
    { h:'se', l: box.x+box.w-HANDLE/2,   t: box.y+box.h-HANDLE/2,   c:'se-resize' },
    { h:'n',  l: box.x+box.w/2-HANDLE/2, t: box.y-HANDLE/2,         c:'n-resize'  },
    { h:'s',  l: box.x+box.w/2-HANDLE/2, t: box.y+box.h-HANDLE/2,   c:'s-resize'  },
    { h:'w',  l: box.x-HANDLE/2,         t: box.y+box.h/2-HANDLE/2, c:'w-resize'  },
    { h:'e',  l: box.x+box.w-HANDLE/2,   t: box.y+box.h/2-HANDLE/2, c:'e-resize'  },
  ] : []

  const btnS = { padding:'7px 20px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', backdropFilter:'blur(12px)', border:'1px solid' }

  return (
    <div ref={overlayRef} style={{ position:'absolute', inset:0, zIndex:20, userSelect:'none' }}>
      {ready && box && <>
        <div style={{ position:'absolute', left:0, top:0, right:0, height: box.y, background:'rgba(0,0,0,0.62)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', left:0, top: box.y+box.h, right:0, bottom:0, background:'rgba(0,0,0,0.62)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', left:0, top: box.y, width: box.x, height: box.h, background:'rgba(0,0,0,0.62)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', left: box.x+box.w, top: box.y, right:0, height: box.h, background:'rgba(0,0,0,0.62)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', left:box.x, top:box.y, width:box.w, height:box.h, border:'1.5px solid rgba(255,255,255,0.88)', cursor:'move', boxSizing:'border-box' }}
          onMouseDown={e => startDrag(e,'move')}>
          {[33.3,66.6].map(p => <div key={'v'+p} style={{ position:'absolute', left:`${p}%`, top:0, bottom:0, width:1, background:'rgba(255,255,255,0.20)', pointerEvents:'none' }} />)}
          {[33.3,66.6].map(p => <div key={'h'+p} style={{ position:'absolute', top:`${p}%`, left:0, right:0, height:1, background:'rgba(255,255,255,0.20)', pointerEvents:'none' }} />)}
        </div>
        {pts.map(({ h, l, t, c }) => (
          <div key={h} onMouseDown={e => startDrag(e, h)}
            style={{ position:'absolute', left:l, top:t, width:HANDLE, height:HANDLE, background:'white', borderRadius:2, cursor:c, zIndex:21, boxShadow:'0 1px 4px rgba(0,0,0,0.55)' }} />
        ))}
        {imgBounds.current && (
          <div style={{ position:'absolute', left:box.x, top:box.y-24, fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.8)', background:'rgba(0,0,0,0.55)', borderRadius:4, padding:'2px 7px', pointerEvents:'none', whiteSpace:'nowrap' }}>
            {Math.round(box.w/imgBounds.current.w*100)}% × {Math.round(box.h/imgBounds.current.h*100)}%
          </div>
        )}
      </>}
      <div style={{ position:'absolute', bottom:18, left:'50%', transform:'translateX(-50%)', display:'flex', gap:8, zIndex:22 }}>
        <button onClick={handleApply} style={{ ...btnS, background:'rgba(var(--accent-rgb),0.82)', borderColor:'rgba(var(--accent-rgb),0.95)', color:'white' }}>{t('applyCrop')}</button>
        <button onClick={onCancel}    style={{ ...btnS, background:'rgba(255,255,255,0.13)', borderColor:'rgba(255,255,255,0.28)', color:'white' }}>{t('cancelCrop')}</button>
      </div>
    </div>
  )
}

// ── Video player ─────────────────────────────────────────────────────────────
function VideoPlayer({ src }) {
  const ref  = useRef(null)
  const [playing, setPlaying]   = useState(false)
  const [current, setCurrent]   = useState(0)
  const [dur,     setDur]       = useState(0)
  const [vol,     setVol]       = useState(1)
  const [muted,   setMuted]     = useState(false)
  const [show,    setShow]      = useState(true)
  const hideRef = useRef(null)

  const scheduleHide = useCallback(() => {
    clearTimeout(hideRef.current)
    hideRef.current = setTimeout(() => setShow(false), 2800)
  }, [])

  const reveal = useCallback(() => {
    setShow(true); clearTimeout(hideRef.current)
    hideRef.current = setTimeout(() => setShow(false), 2800)
  }, [])

  useEffect(() => { return () => clearTimeout(hideRef.current) }, [])

  // reset on src change
  useEffect(() => {
    setPlaying(false); setCurrent(0); setDur(0); setShow(true)
  }, [src])

  const togglePlay = () => {
    const v = ref.current; if (!v) return
    if (v.paused) { v.play(); setPlaying(true); scheduleHide() }
    else          { v.pause(); setPlaying(false); setShow(true); clearTimeout(hideRef.current) }
  }

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`
  }

  const pct = dur ? (current / dur) * 100 : 0

  return (
    <div className={styles.videoWrap} onMouseMove={reveal} onClick={togglePlay}>
      <video ref={ref} src={src} className={styles.videoEl}
        onTimeUpdate={() => setCurrent(ref.current?.currentTime||0)}
        onLoadedMetadata={() => setDur(ref.current?.duration||0)}
        onEnded={() => { setPlaying(false); setShow(true) }}
        onClick={e => e.stopPropagation()}
        playsInline />

      {/* Big play overlay when paused */}
      {!playing && (
        <div className={styles.videoPauseOverlay} onClick={togglePlay}>
          <div className={styles.videoBigPlay}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M10 8l12 6-12 6V8z" fill="white"/>
            </svg>
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div className={`${styles.videoControls} ${show ? styles.videoCtrlShow : ''}`}
        onClick={e => e.stopPropagation()}>

        {/* Play / Pause */}
        <button className={styles.vcBtn} onClick={togglePlay}>
          {playing
            ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="1" width="4" height="12" rx="1" fill="currentColor"/><rect x="8" y="1" width="4" height="12" rx="1" fill="currentColor"/></svg>
            : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2l10 5-10 5V2z" fill="currentColor"/></svg>
          }
        </button>

        {/* Time */}
        <span className={styles.vcTime}>{fmt(current)}</span>

        {/* Seek bar */}
        <div className={styles.vcSeekWrap}>
          <div className={styles.vcSeekFill} style={{ width: `${pct}%` }} />
          <input type="range" className={styles.vcRange} min={0} max={dur||100} step={0.05}
            value={current} onChange={e => { const v=ref.current; if(v){v.currentTime=+e.target.value; setCurrent(v.currentTime)} }} />
        </div>

        <span className={styles.vcTime}>{fmt(dur)}</span>

        {/* Mute */}
        <button className={styles.vcBtn} onClick={() => { const v=ref.current; if(!v)return; v.muted=!v.muted; setMuted(v.muted) }}>
          {muted || vol===0
            ? <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 6h3l5-4v12l-5-4H2V6z" fill="currentColor" opacity=".4"/><path d="M13 6l2 2-2 2M15 6l-2 2 2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            : <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 6h3l5-4v12l-5-4H2V6z" fill="currentColor"/><path d="M12 5a4 4 0 010 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          }
        </button>

        {/* Volume slider */}
        <div className={styles.vcVolWrap}>
          <div className={styles.vcSeekFill} style={{ width: `${(muted?0:vol)*100}%` }} />
          <input type="range" className={styles.vcRange} min={0} max={1} step={0.02}
            value={muted ? 0 : vol}
            onChange={e => { const v=ref.current; const n=+e.target.value; if(v){v.volume=n; v.muted=n===0} setVol(n); setMuted(n===0) }} />
        </div>

        {/* Fullscreen */}
        <button className={styles.vcBtn} onClick={() => ref.current?.requestFullscreen()}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M1 5V1h4M11 1h4v4M15 11v4h-4M5 15H1v-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
// ── EXIF helpers ──────────────────────────────────────────────────────────────
function fmtExposure(v) {
  if (!v) return null
  if (v >= 1) return `${v}s`
  return `1/${Math.round(1 / v)}s`
}
function fmtGPS(lat, lon, latRef, lonRef) {
  if (!lat || !lon) return null
  const la = Array.isArray(lat) ? lat[0] + lat[1]/60 + lat[2]/3600 : lat
  const lo = Array.isArray(lon) ? lon[0] + lon[1]/60 + lon[2]/3600 : lon
  const laD = latRef === 'S' ? -la : la
  const loD = lonRef === 'W' ? -lo : lo
  return { lat: laD.toFixed(5), lon: loD.toFixed(5) }
}

function ExifSection({ exif, t }) {
  if (exif === null) return (
    <div style={{ padding:'10px 0 4px', fontSize:11, color:'var(--text-3)', fontStyle:'italic' }}>
      Ładowanie EXIF…
    </div>
  )
  const camera   = [exif.Make, exif.Model].filter(Boolean).join(' ') || null
  const lens     = exif.LensModel || exif.LensMake || null
  const focal    = exif.FocalLength ? `${exif.FocalLength} mm` : null
  const exposure = fmtExposure(exif.ExposureTime)
  const aperture = exif.FNumber ? `f/${exif.FNumber}` : null
  const iso      = exif.ISO ? `${exif.ISO}` : null
  const dateTaken = exif.DateTimeOriginal || exif.CreateDate
    ? new Date(exif.DateTimeOriginal || exif.CreateDate).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
    : null
  const gps      = fmtGPS(exif.GPSLatitude, exif.GPSLongitude, exif.GPSLatitudeRef, exif.GPSLongitudeRef)

  const rows = [
    camera   && [t('exifCamera'),      camera],
    lens     && [t('exifLens'),        lens],
    focal    && [t('exifFocalLength'), focal],
    exposure && [t('exifExposure'),    exposure],
    aperture && [t('exifAperture'),    aperture],
    iso      && [t('exifISO'),         iso],
    dateTaken && [t('exifDateTaken'),  dateTaken],
  ].filter(Boolean)

  if (rows.length === 0 && !gps) return (
    <div style={{ padding:'10px 0 4px', fontSize:11, color:'var(--text-3)', fontStyle:'italic' }}>
      {t('exifNoData')}
    </div>
  )

  return (
    <div style={{ marginTop: 8 }}>
      <div className={styles.tagSectionTitle} style={{ marginBottom: 4 }}>{t('exifSection')}</div>
      {rows.map(([label, val]) => (
        <div key={label} className={styles.infoRow}>
          <span>{label}</span><span>{val}</span>
        </div>
      ))}
      {gps && (
        <div className={styles.infoRow}>
          <span>{t('exifGPS')}</span>
          <a
            href={`https://maps.google.com/?q=${gps.lat},${gps.lon}`}
            target="_blank" rel="noreferrer"
            style={{ color:'var(--accent)', fontSize:11 }}
          >
            {gps.lat}°, {gps.lon}°
          </a>
        </div>
      )}
    </div>
  )
}

export default function Lightbox({ images, index, onClose, onPrev, onNext, onChange, tags, onTagsChange, edits, onEditChange }) {
  const t    = useLang()
  const lang = useLangCode()
  const [scale,        setScale]        = useState(1)
  const [pan,          setPan]          = useState({ x: 0, y: 0 })
  const [dragging,     setDragging]     = useState(false)
  const [showInfo,     setShowInfo]     = useState(false)
  const [showEditor,   setShowEditor]   = useState(false)
  const [showExport,   setShowExport]   = useState(false)
  const [cropMode,     setCropMode]     = useState(false)
  const [editState,    setEditState]    = useState(() => edits?.[images[index]?.path] ?? DEFAULT_EDIT)
  const [tagInput,     setTagInput]     = useState('')
  const [exif,         setExif]         = useState(null)
  const [showOriginal, setShowOriginal] = useState(false)
  const [cropRatio,    setCropRatio]    = useState(null)  // { w, h } or null
  const [wm,           setWm]          = useState({ enabled: false, text: '© ', opacity: 70, fontSize: 20, color: '#ffffff', position: 'bottomRight' })
  const dragStart    = useRef(null)
  const imgRef       = useRef(null)
  const containerRef = useRef(null)
  const img = images[index]

  const imgTags = img ? (tags?.[img.path] ?? []) : []

  const addTag = useCallback(() => {
    const val = tagInput.trim().toLowerCase()
    if (!val || !img) return
    if (!imgTags.includes(val)) onTagsChange(img.path, [...imgTags, val])
    setTagInput('')
  }, [tagInput, img, imgTags, onTagsChange])

  const removeTag = useCallback((tag) => {
    if (!img) return
    onTagsChange(img.path, imgTags.filter(x => x !== tag))
  }, [img, imgTags, onTagsChange])

  useEffect(() => {
    setScale(1); setPan({ x: 0, y: 0 }); setTagInput('')
    setEditState(edits?.[images[index]?.path] ?? DEFAULT_EDIT)
    setCropMode(false)
    setShowOriginal(false)
    setExif(null)
  }, [index]) // eslint-disable-line

  // Ładuj EXIF gdy otwarto info panel
  useEffect(() => {
    if (!showInfo || !img || img.isVideo) return
    if (exif !== null) return // już załadowane
    window.api?.getExif(img.path).then(res => {
      setExif(res?.success ? res.data : {})
    }).catch(() => setExif({}))
  }, [showInfo, img]) // eslint-disable-line

  // Panels are independent — left (editor) and right (info/export) can coexist
  // Info and Export share the right slot, so they stay mutually exclusive with each other
  const openInfo   = () => { setShowInfo(true);  setShowExport(false) }
  const openExport = () => { setShowExport(true); setShowInfo(false)  }
  const openEditor = () => { setShowEditor(true) }

  const handleStartCrop = (ratio = null) => {
    setScale(1); setPan({ x: 0, y: 0 })
    setCropRatio(ratio)
    setCropMode(true)
    setShowEditor(true)
  }

  const handleWheel = (e) => {
    if (cropMode) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.85 : 1.15
    setScale(s => Math.min(Math.max(s * delta, 0.2), 10))
  }
  const handleMouseDown = (e) => {
    if (cropMode || scale <= 1) return
    setDragging(true)
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }
  const handleMouseMove = (e) => {
    if (!dragging || !dragStart.current) return
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
  }
  const handleMouseUp   = () => setDragging(false)
  const handleBgClick   = (e) => { if (e.target === e.currentTarget) onClose() }

  if (!img) return null
  const canPrev = index > 0
  const canNext = index < images.length - 1
  const onChange_ = (s) => { setEditState(s); onEditChange?.(img.path, s) }
  // When showOriginal, display with DEFAULT_EDIT (before)
  const displayState = showOriginal ? DEFAULT_EDIT : editState
  const cropStyle = !cropMode && displayState.crop ? { clipPath: toCropCSS(displayState) } : {}
  const rightOpen = showInfo  // export is now a floating card, only info uses the sidebar
  const vigPct = (displayState.vignette ?? 0) / 100

  return (
    <div className={styles.overlay} onClick={handleBgClick}>

      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <span className={styles.imgName}>{img.name}</span>
          <span className={styles.imgCounter}>{index + 1} / {images.length}</span>
        </div>
        <div className={styles.topRight}>
          {/* Before / After — only when editor open and image edited */}
          {showEditor && !img.isVideo && isEdited(editState) && (
            <button
              className={`${styles.iconBtn} ${showOriginal ? styles.iconBtnActive : ''}`}
              onMouseDown={() => setShowOriginal(true)}
              onMouseUp={() => setShowOriginal(false)}
              onMouseLeave={() => setShowOriginal(false)}
              title={t('beforeAfter')}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="3" width="6" height="10" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="9" y="3" width="6" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2 1.5"/>
                <path d="M7.5 8h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          {/* Export */}
          <button className={`${styles.iconBtn} ${showExport ? styles.iconBtnActive : ''}`}
            onClick={() => showExport ? setShowExport(false) : openExport()} title={t('exportSaveBtn')}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 13h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
          {/* Info */}
          <button className={`${styles.iconBtn} ${showInfo ? styles.iconBtnActive : ''}`}
            onClick={() => showInfo ? setShowInfo(false) : openInfo()} title={t('infoBtn')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M8 7.5V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="8" cy="5.5" r="0.7" fill="currentColor"/>
            </svg>
          </button>
          {/* Reset zoom */}
          <button className={styles.iconBtn} onClick={() => { setScale(1); setPan({ x: 0, y: 0 }) }} title={t('resetZoom')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1 4V1h3M12 1h3v3M15 12v3h-3M4 15H1v-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>
          {/* Close */}
          <button className={`${styles.iconBtn} ${styles.closeBtn}`} onClick={onClose} title={t('closeEsc')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Editor toggle tab (left edge, only when editor closed and not video) ── */}
      {!showEditor && !img.isVideo && (
        <button className={styles.editorTab} onClick={openEditor} title={t('openEditor')}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <path d="M9.5 4.5l2 2" stroke="currentColor" strokeWidth="1.3"/>
          </svg>
        </button>
      )}

      {/* ── Body ── */}
      <div className={styles.body}>

        {/* Left: editor panel */}
        {showEditor && (
          <div className={styles.editorPanel}>
            <div className={styles.panelHeader} onClick={() => { setShowEditor(false); setCropMode(false) }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              </svg>
              {t('editorPanel')}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft:'auto', opacity:0.45 }}>
                <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <EditorPanel
              editState={editState}
              onChange={onChange_}
              onStartCrop={handleStartCrop}
              imgRef={imgRef}
              showOriginal={showOriginal}
              onToggleOriginal={() => setShowOriginal(v => !v)}
            />
          </div>
        )}

        {/* Nav buttons */}
        <button className={`${styles.navBtn} ${styles.prev} ${!canPrev ? styles.disabled : ''}`}
          onClick={canPrev ? onPrev : undefined} title={t('prevImage')}
          style={showEditor ? { left: 274 } : undefined}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className={`${styles.navBtn} ${styles.next} ${!canNext ? styles.disabled : ''}`}
          onClick={canNext ? onNext : undefined} title={t('nextImage')}
          style={rightOpen ? { right: 262 } : showExport ? { right: 310 } : undefined}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Image or Video */}
        <div ref={containerRef} className={styles.imgContainer}
          style={{ position:'relative', cursor: img.isVideo ? 'default' : cropMode ? 'crosshair' : scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
          onWheel={img.isVideo ? undefined : handleWheel}
          onMouseDown={img.isVideo ? undefined : handleMouseDown}
          onMouseMove={img.isVideo ? undefined : handleMouseMove}
          onMouseUp={img.isVideo ? undefined : handleMouseUp}
          onMouseLeave={img.isVideo ? undefined : handleMouseUp}>
          {img.isVideo ? (
            <VideoPlayer src={img.url} />
          ) : (
            <>
              {/* Transform wrapper — carries pan/scale/rotation so watermark moves with image instantly */}
              <div style={{
                transform: toTransformCSS(displayState, pan, scale),
                position: 'relative', display: 'inline-block', lineHeight: 0,
              }}>
                <img ref={imgRef} src={img.url} alt={img.name} className={styles.img}
                  style={{ filter: toFilterCSS(displayState), ...cropStyle }}
                  draggable={false} />
                {/* Watermark live preview — inside wrapper, zero lag */}
                {showExport && !cropMode && <WatermarkPreview wm={wm} />}
              </div>
              {/* Vignette overlay — full-container radial darkening */}
              {vigPct > 0 && !cropMode && (
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
                  background: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,${(vigPct * 0.80).toFixed(3)}) 100%)`,
                }} />
              )}
              {cropMode && (
                <CropOverlay imgRef={imgRef} initialCrop={editState.crop} aspectRatio={cropRatio}
                  onApply={(crop) => { onChange_({ ...editState, crop }); setCropMode(false) }}
                  onCancel={() => setCropMode(false)} />
              )}
            </>
          )}
        </div>

      </div>

      {/* ── Right: Export panel ── */}
      {showExport && (
        <ExportPanel imgRef={imgRef} imgPath={img.path} editState={editState}
          onClose={() => setShowExport(false)} wm={wm} setWm={setWm} />
      )}

      {/* ── Right: Info + Tags panel ── */}
      {showInfo && (
        <div className={styles.infoPanel}>
          <div className={styles.panelHeader} onClick={() => setShowInfo(false)}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M7 6.5V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="7" cy="4.8" r="0.65" fill="currentColor"/>
            </svg>
            {t('infoPanel')}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft:'auto', opacity:0.45 }}>
              <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <div className={styles.panelScroll} style={{ padding: '0 16px' }}>
            <div className={styles.infoRow}><span>{t('infoName')}</span><span>{img.name}</span></div>
            <div className={styles.infoRow}><span>{t('infoFormat')}</span><span>{img.ext}</span></div>
            <div className={styles.infoRow}><span>{t('infoSize')}</span><span>{formatSize(img.size)}</span></div>
            <div className={styles.infoRow}><span>{t('infoDate')}</span><span>{formatDate(img.mtime, t('locale'))}</span></div>
            <div className={styles.infoRowPath}><span>{t('infoPath')}</span><span title={img.path}>{img.path}</span></div>

            {/* ── EXIF ── */}
            {!img.isVideo && (
              <ExifSection exif={exif} t={t} lang={lang} />
            )}

            <div className={styles.tagSection}>
              <div className={styles.tagSectionTitle}>{t('tagsSec')}</div>
              <div className={styles.tagInputWrap}>
                <input className={styles.tagInput} type="text" placeholder={t('addTagPlaceholder')}
                  value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  maxLength={32} />
                <button className={styles.tagAddBtn} onClick={addTag} disabled={!tagInput.trim()}>+</button>
              </div>
              {imgTags.length > 0 ? (
                <div className={styles.tagPillList}>
                  {imgTags.map(tag => {
                    const c = tagColor(tag)
                    return (
                      <span key={tag} className={styles.tagPill} style={{ background:c.bg, borderColor:c.border, color:c.text }}>
                        {tag}
                        <button className={styles.tagRemove} onClick={() => removeTag(tag)}>✕</button>
                      </span>
                    )
                  })}
                </div>
              ) : (
                <div className={styles.noTags}>{t('noTags')}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Zoom indicator */}
      {scale !== 1 && !cropMode && (
        <div className={styles.zoomBadge}>{Math.round(scale * 100)}%</div>
      )}

      {/* Crop mode indicator */}
      {cropMode && (
        <div className={styles.cropBadge}>{t('cropBadge')}</div>
      )}

      {/* Filmstrip */}
      <div className={styles.filmstrip}>
        {images.map((im, i) => (
          <button key={im.path}
            className={`${styles.thumb} ${i === index ? styles.thumbActive : ''}`}
            onClick={() => onChange(i)} style={{ backgroundImage: `url(${im.url})` }}
            title={im.name} />
        ))}
      </div>
    </div>
  )
}
