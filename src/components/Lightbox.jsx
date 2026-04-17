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

// ── Slider (shared) ──────────────────────────────────────────────────────────
function Slider({ label, value, min, max, defaultVal, onChange }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <label className={styles.sliderRow}>
      <div className={styles.sliderTop}>
        <span className={styles.sliderLabel}>{label}</span>
        <span className={styles.sliderVal}>{value > 0 && min < 0 ? `+${value}` : value}</span>
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

// ── Export panel (right side) ────────────────────────────────────────────────
function ExportPanel({ imgRef, imgPath, editState, onClose }) {
  const t    = useLang()
  const lang = useLangCode()
  const [format,  setFormat]  = useState('jpeg')
  const [quality, setQuality] = useState(92)
  const [destDir, setDestDir] = useState(null)   // null = same as source
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState(null)

  const edited = isEdited(editState)

  const pickFolder = async () => {
    const p = await window.api?.selectFolder()
    if (p) setDestDir(p)
  }

  const save = async (mode) => {
    if (!imgRef.current || !imgPath) return
    setSaving(true); setMsg(null)
    try {
      const dataURL = exportCanvas(imgRef.current, editState, format, quality / 100)
      const res = await window.api.saveImageFile({ sourcePath: imgPath, dataURL, mode, destDir: mode === 'copy' ? destDir : null })
      if (res.success) {
        setMsg(mode === 'overwrite' ? t('savedSuccess') : savedAs(res.savedPath?.split(/[\\/]/).pop(), lang))
      } else { setMsg(t('saveError')) }
      setTimeout(() => setMsg(null), 3000)
    } catch { setMsg(t('errorGeneric')) }
    setSaving(false)
  }

  return (
    <div className={styles.exportPanel}>
      {/* Header */}
      <div className={styles.panelHeader} onClick={onClose}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M2 12V10a6 6 0 016-6h1M13 6l2-2-2-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="1" y="12" width="14" height="2.5" rx="1.2" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
        {t('exportPanelTitle')}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft:'auto', opacity: 0.45 }}>
          <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </div>

      <div className={styles.panelScroll}>
        {/* Format */}
        <div className={styles.epGroup}>
          <div className={styles.epLabel}>{t('infoFormat')}</div>
          <div className={styles.epFmtRow}>
            {['jpeg','png','webp'].map(f => (
              <button key={f}
                className={`${styles.epFmtBtn} ${format === f ? styles.epFmtActive : ''}`}
                onClick={() => setFormat(f)}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Quality */}
        {format !== 'png' && (
          <div className={styles.epGroup}>
            <div className={styles.epLabel}>{t('quality')}</div>
            <Slider label={`${quality}%`} value={quality} min={10} max={100} defaultVal={92} onChange={setQuality} />
          </div>
        )}

        {/* Location */}
        <div className={styles.epGroup}>
          <div className={styles.epLabel}>{t('copyLocation')}</div>
          <div className={styles.epLocRow}>
            <button
              className={`${styles.epLocBtn} ${!destDir ? styles.epLocActive : ''}`}
              onClick={() => setDestDir(null)}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M1 3.5A1.5 1.5 0 012.5 2h3l1.5 2H12a1.5 1.5 0 011.5 1.5v6A1.5 1.5 0 0112 13H2a1.5 1.5 0 01-1.5-1.5v-8z" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              {t('nextToOriginal')}
            </button>
            <button className={`${styles.epLocBtn} ${destDir ? styles.epLocActive : ''}`} onClick={pickFolder}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v8M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 12h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              {t('chooseDest')}
            </button>
          </div>
          {destDir && (
            <div className={styles.epPath} title={destDir}>
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <path d="M1 3.5A1.5 1.5 0 012.5 2h3l1.5 2H12a1.5 1.5 0 011.5 1.5v6A1.5 1.5 0 0112 13H2a1.5 1.5 0 01-1.5-1.5v-8z" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              {destDir}
            </div>
          )}
        </div>

        {/* Save buttons */}
        <div className={styles.epGroup}>
          <button className={styles.epSaveBtn} onClick={() => save('copy')} disabled={saving}>
            {saving ? '…' : t('saveCopy')}
          </button>
          <button className={`${styles.epSaveBtn} ${styles.epSaveBtnOver}`} onClick={() => save('overwrite')} disabled={saving || !edited}
            title={!edited ? t('noChangesToSave') : t('willOverwrite')}>
            {t('overwriteOriginal')}
          </button>
        </div>

        {msg && <div className={`${styles.epMsg} ${msg.startsWith('✕') ? styles.epMsgErr : ''}`}>{msg}</div>}
        {!edited && <div className={styles.epHint}>{t('noEditsHint')}</div>}
      </div>
    </div>
  )
}

// ── Crop overlay ─────────────────────────────────────────────────────────────
const HANDLE = 10

function CropOverlay({ imgRef, onApply, onCancel, initialCrop }) {
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
      setBox({ x: b.x + initialCrop.x * b.w, y: b.y + initialCrop.y * b.h,
               w: initialCrop.w * b.w,        h: initialCrop.h * b.h })
    } else {
      setBox({ x: b.x, y: b.y, w: b.w, h: b.h })
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
      if (h === 'move') {
        x = clamp(sb.x + dx, b.x, b.x + b.w - sb.w)
        y = clamp(sb.y + dy, b.y, b.y + b.h - sb.h)
      } else {
        if (h.includes('e')) w  = clamp(sb.w + dx, 20, b.x + b.w - sb.x)
        if (h.includes('s')) ht = clamp(sb.h + dy, 20, b.y + b.h - sb.y)
        if (h.includes('w')) { const nx = clamp(sb.x + dx, b.x, sb.x + sb.w - 20); w = sb.w + (sb.x - nx); x = nx }
        if (h.includes('n')) { const ny = clamp(sb.y + dy, b.y, sb.y + sb.h - 20); ht = sb.h + (sb.y - ny); y = ny }
      }
      setBox({ x, y, w, h: ht })
    }
    const onUp = () => { drag.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [box])

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
        <button onClick={handleApply} style={{ ...btnS, background:'rgba(191,90,242,0.82)', borderColor:'rgba(191,90,242,0.95)', color:'white' }}>{t('applyCrop')}</button>
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
export default function Lightbox({ images, index, onClose, onPrev, onNext, onChange, tags, onTagsChange, edits, onEditChange }) {
  const t    = useLang()
  const lang = useLangCode()
  const [scale,      setScale]      = useState(1)
  const [pan,        setPan]        = useState({ x: 0, y: 0 })
  const [dragging,   setDragging]   = useState(false)
  const [showInfo,   setShowInfo]   = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [cropMode,   setCropMode]   = useState(false)
  const [editState,  setEditState]  = useState(() => edits?.[images[index]?.path] ?? DEFAULT_EDIT)
  const [tagInput,   setTagInput]   = useState('')
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
  }, [index]) // eslint-disable-line

  // Panels are independent — left (editor) and right (info/export) can coexist
  // Info and Export share the right slot, so they stay mutually exclusive with each other
  const openInfo   = () => { setShowInfo(true);  setShowExport(false) }
  const openExport = () => { setShowExport(true); setShowInfo(false)  }
  const openEditor = () => { setShowEditor(true) }

  const handleStartCrop = () => {
    setScale(1); setPan({ x: 0, y: 0 })
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
  const cropStyle = !cropMode && editState.crop ? { clipPath: toCropCSS(editState) } : {}
  const rightOpen = showInfo || showExport

  return (
    <div className={styles.overlay} onClick={handleBgClick}>

      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <span className={styles.imgName}>{img.name}</span>
          <span className={styles.imgCounter}>{index + 1} / {images.length}</span>
        </div>
        <div className={styles.topRight}>
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
            <EditorPanel editState={editState} onChange={onChange_} onStartCrop={handleStartCrop} />
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
          style={rightOpen ? { right: 262 } : undefined}>
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
              <img ref={imgRef} src={img.url} alt={img.name} className={styles.img}
                style={{ transform: toTransformCSS(editState, pan, scale), filter: toFilterCSS(editState), ...cropStyle }}
                draggable={false} />
              {cropMode && (
                <CropOverlay imgRef={imgRef} initialCrop={editState.crop}
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
          onClose={() => setShowExport(false)} />
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
