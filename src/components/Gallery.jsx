import { useRef, useCallback, useState, useEffect, useLayoutEffect, memo, useMemo } from 'react'
import { VariableSizeList } from 'react-window'
import ContextMenu from './ContextMenu'
import { useLang, useLangCode, photoCount, selectedCount, exportSelectedTitle, confirmDeleteSelected } from '../i18n/index'
import { tagColor } from '../utils/tags'
import { LABEL_COLORS } from '../utils/labels'
import { exportFromUrl, DEFAULT_EDIT } from './Editor/editorUtils'
import styles from './Gallery.module.css'

const GRID_SIZES = { small: 140, medium: 200, large: 280 }
const VGRID_GAP     = 12
const VGRID_PADDING = 16
const VGRID_HEADER_H  = 38
const VGRID_DIVIDER_H = 24

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// Idle stack positions (back→front)
const IDLE = [
  { r: '-7deg', x: '-9px', y: '3px'  },
  { r: '-3deg', x: '-4px', y: '1px'  },
  { r:  '1deg', x:  '0px', y: '0px'  },
]
// Spread positions per total count
const SPREAD = {
  1: [{ r:  '0deg', x:  '0px', y: '0px' }],
  2: [{ r: '-16deg', x: '-22px', y: '5px' }, { r: '12deg', x: '18px', y: '5px' }],
  3: [{ r: '-22deg', x: '-30px', y: '7px' }, { r: '-2deg', x: '0px', y: '-5px' }, { r: '19deg', x: '28px', y: '7px' }],
}
const SPRING = '320ms cubic-bezier(0.34,1.56,0.64,1)'
const SNAP   = '60ms ease-out'

// ── Module-level drag state (same singleton pattern as _bar/_preview) ──
let _dragItems = []  // [{ src, isDir }]

// ── Folder card ──
const FolderCard = memo(function FolderCard({ folder, size, onOpen, onRightClick, onItemDrop, onFolderDragStart }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const lang = useLangCode()
  const [count,   setCount]   = useState(null)
  const [preview, setPreview] = useState([])
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState(false)
  const deckRef      = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let cancelled = false
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      window.api?.getFolderPreview(folder.path).then(res => {
        if (cancelled || !res) return
        setCount(res.count)
        setPreview(res.thumbs ?? [])
        setLoading(false)
      })
    }, { rootMargin: '300px' })
    observer.observe(el)
    return () => { cancelled = true; observer.disconnect() }
  }, [folder.path])

  // ── Tilt only the deck, not the whole card ──
  const onMouseMove = useCallback((e) => {
    const el = deckRef.current
    if (!el) return
    const r  = el.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width
    const ny = (e.clientY - r.top)  / r.height
    const rx = ((ny - 0.5) * -20).toFixed(1)
    const ry = ((nx - 0.5) *  20).toFixed(1)
    el.style.transition = 'transform 40ms linear'
    el.style.transform  = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg)`
    el.style.setProperty('--sx', `${Math.round(nx * 100)}%`)
    el.style.setProperty('--sy', `${Math.round(ny * 100)}%`)
  }, [])

  const onMouseEnter = useCallback(() => setHovered(true), [])

  const onMouseLeave = useCallback(() => {
    const el = deckRef.current
    if (el) {
      el.style.transition = 'transform 320ms cubic-bezier(0.34,1.56,0.64,1)'
      el.style.transform  = 'perspective(600px) rotateX(0deg) rotateY(0deg)'
    }
    setHovered(false)
  }, [])

  const total   = Math.min(preview.length, 3) || 1
  const thumbW  = Math.round(size * 0.68)
  const thumbH  = Math.round(thumbW * 0.72)
  const spreads = SPREAD[total] ?? SPREAD[3]

  // Positional transform (float handled entirely in CSS on hover)
  const getDeckWrapStyle = (i) => {
    const pos = hovered ? spreads[i] : (IDLE[IDLE.length - total + i] ?? IDLE[i])
    return {
      transform:  `rotate(${pos.r}) translate(${pos.x}, ${pos.y})`,
      zIndex:     i,
      transition: `transform ${SPRING}`,
    }
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.folderCard} ${isDragOver ? styles.folderDropTarget : ''}`}
      style={{ width: size, height: size }}
      onClick={onOpen}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={folder.path}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onRightClick?.(e, folder) }}
      draggable
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', 'lumina-drag')
        _dragItems = [{ src: folder.path, isDir: true }]
        onFolderDragStart?.([{ src: folder.path, isDir: true }])
      }}
      onDragEnd={() => { _dragItems = [] }}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsDragOver(true) }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false) }}
      onDrop={e => {
        e.preventDefault(); e.stopPropagation(); setIsDragOver(false)
        const items = _dragItems.filter(it => it.src !== folder.path)
        if (items.length > 0) onItemDrop?.(items, folder.path)
        _dragItems = []
      }}
    >
      <div ref={deckRef} className={styles.deck} style={{ width: thumbW, height: thumbH }}>
        {loading ? (
          <div className={styles.deckCardWrap} style={{ zIndex: 0 }}>
            <div className={`${styles.deckCard} ${styles.deckSkeleton}`} />
          </div>
        ) : preview.length > 0
          ? preview.slice(0, 3).map((url, i) => (
              <div key={i} className={styles.deckCardWrap} style={getDeckWrapStyle(i)}>
                <div className={styles.deckCard}>
                  <img src={url} alt="" draggable={false} className={styles.deckImg} />
                  {hovered && <div className={styles.deckShine} />}
                </div>
              </div>
            ))
          : (
              <div className={styles.deckCardWrap} style={{ zIndex: 0 }}>
                <div className={styles.deckCard}>
                  <div className={styles.folderIcon}>
                    <svg width="44" height="37" viewBox="0 0 52 44" fill="none">
                      <path d="M2 8a4 4 0 014-4h12l4 5h24a4 4 0 014 4v23a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" fill="currentColor" fillOpacity="0.55"/>
                      <path d="M2 8a4 4 0 014-4h12l4 5h24a4 4 0 014 4v23a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4"/>
                    </svg>
                  </div>
                </div>
              </div>
            )
        }
      </div>

      <div className={styles.folderName}>{folder.name}</div>
      {count !== null && <div className={styles.folderCount}>{photoCount(count, lang)}</div>}
    </div>
  )
})

// ── Hover preview (singleton, imperative DOM) ──
const PREVIEW_DELAY = 1000
let _circle = null, _preview = null, _videoPreview = null, _raf = null, _timer = null, _startTime = null, _mouseX = 0, _mouseY = 0

const _CIRC_R    = 14
const _CIRC_DASH = 2 * Math.PI * _CIRC_R  // ≈ 87.96

function getCircle() {
  if (_circle) return _circle
  _circle = document.createElement('div')
  _circle.style.cssText = `
    position:fixed; pointer-events:none; z-index:9999;
    width:36px; height:36px;
    transform:translate(-50%,-50%);
    opacity:0; transition:opacity 150ms ease;
  `
  _circle.innerHTML = `<svg width="36" height="36" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="${_CIRC_R}" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
    <circle cx="18" cy="18" r="${_CIRC_R}" fill="none" stroke="rgba(255,255,255,0.88)" stroke-width="1.5"
      stroke-dasharray="${_CIRC_DASH}" stroke-dashoffset="${_CIRC_DASH}"
      stroke-linecap="round" transform="rotate(-90 18 18)"/>
  </svg>`
  _circle._arc = _circle.querySelector('circle:last-child')
  document.body.appendChild(_circle)
  return _circle
}

function getPreview() {
  if (_preview) return _preview
  _preview = document.createElement('div')
  _preview.style.cssText = `
    position:fixed; pointer-events:none; z-index:9998;
    border-radius:10px; overflow:hidden;
    border:1.5px solid rgba(255,255,255,0.22);
    box-shadow:0 24px 64px rgba(0,0,0,0.7),0 0 0 1px rgba(var(--accent-rgb),0.18);
    opacity:0; transition:opacity 200ms ease, transform 200ms cubic-bezier(0.34,1.56,0.64,1);
    transform:scale(0.92); will-change:transform,opacity;
  `
  const img = document.createElement('img')
  img.style.cssText = 'display:block; width:100%; height:100%; object-fit:cover;'
  _preview._img = img
  _preview.appendChild(img)
  document.body.appendChild(_preview)
  return _preview
}

function getVideoPreview() {
  if (_videoPreview) return _videoPreview
  _videoPreview = document.createElement('div')
  _videoPreview.style.cssText = `
    position:fixed; pointer-events:none; z-index:9998;
    border-radius:10px; overflow:hidden;
    border:1.5px solid rgba(255,255,255,0.22);
    box-shadow:0 24px 64px rgba(0,0,0,0.7),0 0 0 1px rgba(var(--accent-rgb),0.18);
    opacity:0; transition:opacity 200ms ease, transform 200ms cubic-bezier(0.34,1.56,0.64,1);
    transform:scale(0.92); will-change:transform,opacity;
  `
  const vid = document.createElement('video')
  vid.style.cssText = 'display:block; width:100%; height:100%; object-fit:cover;'
  vid.muted = true
  vid.playsInline = true
  vid.loop = true
  _videoPreview._vid = vid
  _videoPreview.appendChild(vid)
  document.body.appendChild(_videoPreview)
  return _videoPreview
}

function cancelPreview() {
  cancelAnimationFrame(_raf)
  clearTimeout(_timer)
  _startTime = null
  if (_circle) { _circle.style.opacity = '0'; _circle._arc.style.strokeDashoffset = _CIRC_DASH }
  if (_preview) { _preview.style.opacity = '0'; _preview.style.transform = 'scale(0.92)' }
  if (_videoPreview) {
    _videoPreview.style.opacity = '0'
    _videoPreview.style.transform = 'scale(0.92)'
    if (_videoPreview._vid) { _videoPreview._vid.pause(); _videoPreview._vid.currentTime = 0 }
  }
}

function startVideoPreview(url, mx, my) {
  cancelPreview()
  _startTime = performance.now()
  const circle = getCircle()
  circle.style.left = mx + 'px'
  circle.style.top  = my + 'px'

  const tick = (now) => {
    if (!_startTime) return
    const pct = Math.min((now - _startTime) / PREVIEW_DELAY * 100, 100)
    circle._arc.style.strokeDashoffset = (_CIRC_DASH * (1 - pct / 100)).toFixed(2)
    circle.style.left = _mouseX + 'px'
    circle.style.top  = _mouseY + 'px'
    if (pct >= 50) circle.style.opacity = '1'
    if (pct < 100) { _raf = requestAnimationFrame(tick); return }
    circle.style.opacity = '0'
    const pv = getVideoPreview()
    const showAt = (natW, natH) => {
      const maxW = Math.min(window.innerWidth  * 0.42, 520)
      const maxH = Math.min(window.innerHeight * 0.72, 480)
      const ratio = (natW || 16) / (natH || 9)
      let W = maxW, H = Math.round(maxW / ratio)
      if (H > maxH) { H = maxH; W = Math.round(maxH * ratio) }
      let left = _mouseX - W / 2
      let top  = _mouseY - H - 18
      left = Math.max(12, Math.min(left, window.innerWidth  - W - 12))
      top  = Math.max(12, Math.min(top,  window.innerHeight - H - 12))
      pv.style.width  = W + 'px'
      pv.style.height = H + 'px'
      pv.style.left   = left + 'px'
      pv.style.top    = top  + 'px'
      pv.style.opacity = '1'
      pv.style.transform = 'scale(1)'
      pv._vid.play().catch(() => {})
    }
    if (pv._vid.src === url && pv._vid.videoWidth) {
      showAt(pv._vid.videoWidth, pv._vid.videoHeight)
    } else {
      pv._vid.onloadedmetadata = () => showAt(pv._vid.videoWidth, pv._vid.videoHeight)
      pv._vid.src = url
      pv._vid.load()
    }
  }
  _raf = requestAnimationFrame(tick)
}

function startPreview(url, mx, my) {
  cancelPreview()
  _startTime = performance.now()
  const circle = getCircle()
  circle.style.left = mx + 'px'
  circle.style.top  = my + 'px'

  const tick = (now) => {
    if (!_startTime) return
    const pct = Math.min((now - _startTime) / PREVIEW_DELAY * 100, 100)
    circle._arc.style.strokeDashoffset = (_CIRC_DASH * (1 - pct / 100)).toFixed(2)
    circle.style.left = _mouseX + 'px'
    circle.style.top  = _mouseY + 'px'
    if (pct >= 50) circle.style.opacity = '1'
    if (pct < 100) { _raf = requestAnimationFrame(tick); return }
    circle.style.opacity = '0'
    const pv = getPreview()
    const showAt = (natW, natH) => {
      const maxW = Math.min(window.innerWidth  * 0.42, 520)
      const maxH = Math.min(window.innerHeight * 0.72, 480)
      const ratio = natW / natH
      let W = maxW, H = Math.round(maxW / ratio)
      if (H > maxH) { H = maxH; W = Math.round(maxH * ratio) }
      let left = _mouseX - W / 2
      let top  = _mouseY - H - 18
      left = Math.max(12, Math.min(left, window.innerWidth  - W - 12))
      top  = Math.max(12, Math.min(top,  window.innerHeight - H - 12))
      pv.style.width  = W + 'px'
      pv.style.height = H + 'px'
      pv.style.left   = left + 'px'
      pv.style.top    = top  + 'px'
      pv.style.opacity = '1'
      pv.style.transform = 'scale(1)'
    }
    if (pv._img.src === url && pv._img.naturalWidth) {
      // already cached
      showAt(pv._img.naturalWidth, pv._img.naturalHeight)
    } else {
      pv._img.onload = () => showAt(pv._img.naturalWidth, pv._img.naturalHeight)
      pv._img.src = url
    }
  }
  _raf = requestAnimationFrame(tick)
}

// ── Image card ──
const ImageCard = memo(function ImageCard({ img, index, size, onSelect, onRightClick, imgTags, isSelected, selected, onToggleSelect, onImageDragStart, label }) {
  const imgRef   = useRef(null)
  const videoRef = useRef(null)
  const cardRef  = useRef(null)
  const [thumbUrl, setThumbUrl] = useState(null)

  useEffect(() => {
    if (img.isVideo) return
    const el = cardRef.current
    if (!el) return
    let cancelled = false
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      window.api?.getThumbnail({ filePath: img.path, mtime: img.mtime })
        .then(url => { if (!cancelled && url) setThumbUrl(url) })
        .catch(() => {})
    }, { rootMargin: '400px' })
    observer.observe(el)
    return () => { cancelled = true; observer.disconnect() }
  }, [img.path, img.mtime, img.isVideo])

  const onLoad = useCallback(() => imgRef.current?.classList.add(styles.loaded), [])

  const visibleTags = imgTags?.slice(0, 2) ?? []
  const extraCount  = (imgTags?.length ?? 0) - visibleTags.length

  const handleMouseEnter = useCallback((e) => {
    _mouseX = e.clientX; _mouseY = e.clientY
    if (img.isVideo) {
      if (videoRef.current) { videoRef.current.muted = true; videoRef.current.play().catch(() => {}) }
      startVideoPreview(img.url, e.clientX, e.clientY)
    } else {
      startPreview(img.url, e.clientX, e.clientY)
    }
  }, [img.url, img.isVideo])

  const handleMouseMove = useCallback((e) => { _mouseX = e.clientX; _mouseY = e.clientY }, [])
  const handleMouseLeave = useCallback(() => {
    cancelPreview()
    if (img.isVideo && videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [img.isVideo])

  const handleClick = useCallback((e) => {
    cancelPreview()
    if (e.ctrlKey || e.metaKey || e.shiftKey) { onToggleSelect(img.path); return }
    onSelect(index)
  }, [index, img.path, onSelect, onToggleSelect])

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
      style={{ width: size, height: size }}
      onClick={handleClick}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); cancelPreview(); onRightClick(e, img, index) }}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      title={img.name}
      draggable
      onDragStart={e => {
        cancelPreview()
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', 'lumina-drag')
        onImageDragStart?.(img.path)

        // Custom ghost for multi-select drag
        if (isSelected && selected && selected.size >= 2) {
          const ghost = document.createElement('div')
          ghost.style.cssText = `
            position: fixed; top: -9999px; left: -9999px;
            width: 140px; height: 105px; pointer-events: none;
          `
          const rotations = [-4, 2.5, -1.5, 3.5]
          const count = Math.min(selected.size, 4)
          // Back cards (shadow layers)
          rotations.slice(0, count).forEach((rot, idx) => {
            if (idx === 0) return
            const card = document.createElement('div')
            card.style.cssText = `
              position: absolute; inset: 4px;
              background: rgba(40,40,60,0.7);
              border-radius: 8px;
              transform: rotate(${rot}deg);
              box-shadow: 0 2px 14px rgba(0,0,0,0.5);
              border: 1.5px solid rgba(255,255,255,0.15);
            `
            ghost.appendChild(card)
          })
          // Top card with actual image
          const topCard = document.createElement('div')
          topCard.style.cssText = `
            position: absolute; inset: 4px;
            background: url(${img.url}) center/cover no-repeat;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.6);
            border: 2px solid rgba(255,255,255,0.35);
          `
          ghost.appendChild(topCard)
          // Badge
          const badge = document.createElement('div')
          badge.style.cssText = `
            position: absolute; top: 6px; right: 6px;
            background: rgba(var(--accent-rgb, 110, 86, 207), 0.9);
            color: white; font-size: 11px; font-weight: 700;
            border-radius: 10px; padding: 1px 6px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            font-family: -apple-system, sans-serif;
          `
          badge.textContent = `${selected.size}`
          ghost.appendChild(badge)
          document.body.appendChild(ghost)
          e.dataTransfer.setDragImage(ghost, 70, 52)
          setTimeout(() => { if (ghost.parentNode) document.body.removeChild(ghost) }, 100)
        }
      }}
      onDragEnd={() => { _dragItems = [] }}
    >
      {/* Checkbox */}
      <div
        className={`${styles.checkBox} ${isSelected ? styles.checkBoxOn : ''}`}
        onClick={(e) => { e.stopPropagation(); cancelPreview(); onToggleSelect(img.path) }}
      >
        {isSelected && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      {/* Color label dot */}
      {label && LABEL_COLORS[label] && (
        <div className={styles.labelDot} style={{ background: LABEL_COLORS[label].dot }} />
      )}

      <div className={styles.imgWrap}>
        {img.isVideo ? (
          <>
            <video ref={videoRef} src={img.url} className={`${styles.img} ${styles.loaded}`}
              preload="metadata" muted playsInline draggable={false} />
            <div className={styles.videoPlayBadge}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2"/>
                <path d="M8 7l6 3-6 3V7z" fill="white"/>
              </svg>
            </div>
          </>
        ) : (
          <img ref={imgRef} src={thumbUrl || img.url} alt={img.name} className={styles.img} loading="lazy" onLoad={onLoad} draggable={false} />
        )}
        <div className={styles.overlay}>
          <span className={styles.ext}>{img.ext}</span>
        </div>
      </div>
      <div className={styles.name}>{img.name}</div>
      <div className={styles.meta}>{formatSize(img.size)}</div>
      {visibleTags.length > 0 && (
        <div className={styles.tagRow}>
          {visibleTags.map(tag => {
            const c = tagColor(tag)
            return (
              <span key={tag} className={styles.tagPill} style={{ background: c.bg, borderColor: c.border, color: c.text }}>
                {tag}
              </span>
            )
          })}
          {extraCount > 0 && <span className={styles.tagMore}>+{extraCount}</span>}
        </div>
      )}
    </div>
  )
})

// ── Bulk Export Panel ──
function BulkExportPanel({ images, selected, edits, onClose, onDone }) {
  const t            = useLang()
  const lang         = useLangCode()
  const selectedImgs = images.filter(img => selected.has(img.path))
  const [format,  setFormat]  = useState('jpeg')
  const [quality, setQuality] = useState(92)
  const [dest,    setDest]    = useState(null)
  const [prog,    setProg]    = useState(null)

  const handlePickDest = async () => {
    const p = await window.api?.selectFolder()
    if (p) setDest(p)
  }

  const handleExport = async () => {
    const total = selectedImgs.length
    setProg({ done: 0, total })
    for (let i = 0; i < selectedImgs.length; i++) {
      const img  = selectedImgs[i]
      const edit = edits?.[img.path] ?? DEFAULT_EDIT
      try {
        const dataURL = await exportFromUrl(img.url, edit, format, format === 'jpeg' ? quality / 100 : 0.92)
        await window.api.saveImageFile({ sourcePath: img.path, dataURL, mode: 'copy', destDir: dest })
      } catch {}
      setProg({ done: i + 1, total })
    }
    setProg(null)
    onDone?.()
  }

  return (
    <div className={styles.bulkPanel}>
      <div className={styles.bulkHeader}>
        <span className={styles.bulkTitle}>{exportSelectedTitle(selectedImgs.length, lang)}</span>
        <button className={styles.bulkClose} onClick={onClose}>✕</button>
      </div>

      <div className={styles.bulkThumbGrid}>
        {selectedImgs.map(img => (
          img.isVideo
            ? <video key={img.path} src={img.url} className={styles.bulkThumb} preload="metadata" muted playsInline />
            : <img   key={img.path} src={img.url} className={styles.bulkThumb} draggable={false} />
        ))}
      </div>

      <div className={styles.bulkSection}>
        <div className={styles.bulkLabel}>Format</div>
        <div className={styles.bulkFmtRow}>
          {['jpeg','png','webp'].map(f => (
            <button key={f}
              className={`${styles.bulkFmtBtn} ${format === f ? styles.bulkFmtActive : ''}`}
              onClick={() => setFormat(f)}>
              {f === 'jpeg' ? 'JPG' : f.toUpperCase()}
            </button>
          ))}
        </div>
        {format === 'jpeg' && (
          <div className={styles.bulkQualityRow}>
            <span className={styles.bulkQualityLabel}>{t('quality')}</span>
            <input type="range" min="10" max="100" step="1"
              className={styles.bulkQualityRange}
              value={quality} onChange={e => setQuality(Number(e.target.value))} />
            <span className={styles.bulkQualityVal}>{quality}%</span>
          </div>
        )}
      </div>

      <div className={styles.bulkSection}>
        <div className={styles.bulkLabel}>{t('locationLabel')}</div>
        <button className={`${styles.bulkDestBtn} ${dest ? styles.bulkDestSet : ''}`}
          onClick={handlePickDest} title={dest || t('nextToOriginal')}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M1 3.5A1.5 1.5 0 012.5 2h3l1.5 2H12a1.5 1.5 0 011.5 1.5v6A1.5 1.5 0 0112 13H2a1.5 1.5 0 01-1.5-1.5v-8z" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
          <span className={styles.bulkDestLabel}>{dest ? dest.split(/[\\/]/).pop() : t('nextToOriginal')}</span>
          {dest && (
            <span className={styles.bulkDestClear}
              onClick={e => { e.stopPropagation(); setDest(null) }}>✕</span>
          )}
        </button>
      </div>

      <div className={styles.bulkActions}>
        {prog ? (
          <div className={styles.bulkProgress}>
            <div className={styles.bulkProgressBar} style={{ width: `${(prog.done / prog.total) * 100}%` }} />
            <span>{prog.done} / {prog.total}</span>
          </div>
        ) : (
          <button className={styles.bulkExportBtn} onClick={handleExport}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 12h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            {t('exportAll')}
          </button>
        )}
      </div>
    </div>
  )
}

// ── List Row ──
const ListRow = memo(function ListRow({ img, index, onSelect, onRightClick, isSelected, onToggleSelect, imgTags, label }) {
  const t = useLang()
  const handleClick = useCallback((e) => {
    cancelPreview()
    if (e.ctrlKey || e.metaKey || e.shiftKey) { onToggleSelect(img.path); return }
    onSelect(index)
  }, [index, img.path, onSelect, onToggleSelect])

  return (
    <div
      className={`${styles.listRow} ${isSelected ? styles.listRowSelected : ''}`}
      onClick={handleClick}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onRightClick(e, img, index) }}
      title={img.path}
    >
      <div
        className={`${styles.listCheckBox} ${isSelected ? styles.listCheckBoxOn : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggleSelect(img.path) }}
      >
        {isSelected && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      {label && LABEL_COLORS[label] && (
        <div className={styles.listLabelDot} style={{ background: LABEL_COLORS[label].dot }} />
      )}
      <div className={styles.listThumb}>
        {img.isVideo
          ? <video src={img.url} className={styles.listThumbImg} preload="metadata" muted playsInline />
          : <img src={img.url} alt={img.name} className={styles.listThumbImg} loading="lazy" />
        }
      </div>
      <span className={styles.listName}>{img.name}</span>
      <span className={styles.listExt}>{img.ext}</span>
      <span className={styles.listMeta}>{formatSize(img.size)}</span>
      <span className={styles.listDate}>{new Date(img.mtime).toLocaleDateString(t('locale'))}</span>
    </div>
  )
})

// ── Main Gallery ──
// ── Virtual grid helpers ──────────────────────────────────────────────────────
function useGridLayout(el, size) {
  const [layout, setLayout] = useState({ cols: 4, height: 0, width: 0 })
  useLayoutEffect(() => {
    if (!el) return
    const update = (w, h) => setLayout({
      cols: Math.max(1, Math.floor((w - VGRID_PADDING * 2 + VGRID_GAP) / (size + VGRID_GAP))),
      height: h,
      width: w,
    })
    update(el.offsetWidth, el.offsetHeight)
    const ro = new ResizeObserver(([e]) => update(e.target.offsetWidth, e.target.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [el, size])
  return layout
}

function buildVirtualRows(hasFolders, subfolders, hasImages, images, cols, size, t) {
  const rowH = size + VGRID_GAP + 4
  const rows = []
  if (hasFolders) {
    rows.push({ type: 'header', label: `${t('subfoldersSec')} (${subfolders.length})`, h: VGRID_HEADER_H })
    for (let i = 0; i < subfolders.length; i += cols)
      rows.push({ type: 'folders', items: subfolders.slice(i, i + cols), h: rowH })
    if (hasImages) rows.push({ type: 'divider', h: VGRID_DIVIDER_H })
  }
  if (hasImages) {
    if (hasFolders) rows.push({ type: 'header', label: `${t('photosSec')} (${images.length})`, h: VGRID_HEADER_H })
    for (let i = 0; i < images.length; i += cols)
      rows.push({ type: 'images', items: images.slice(i, i + cols), startIndex: i, h: rowH })
  }
  return rows
}

export default function Gallery({ images, subfolders, showSubfolders, loading, gridSize, onSelect, onOpenFolder, tags, onAddToAlbum, selected, onToggleSelect, onClearSelect, onAfterDelete, edits, albumView, onRemoveFromAlbum, viewMode = 'grid', onSelectAll, onTrashFiles = null, onMoveItems = null, onCreateFolder = null, onRenameFolder = null, onDeleteFolder = null, labels = {}, onSetLabel, onBatchRename, onSlideshow, onCollage, onApplyPreset }) {
  const t    = useLang()
  const lang = useLangCode()
  const size = GRID_SIZES[gridSize]
  const [ctxMenu,         setCtxMenu]         = useState(null)
  const [showBulkExport,  setShowBulkExport]  = useState(false)

  // Virtual grid — callback ref so useLayoutEffect fires when element mounts
  const [gridEl, setGridEl] = useState(null)
  const listRef             = useRef(null)
  const { cols, height: gridHeight, width: gridWidth } = useGridLayout(gridEl, size)

  const handleRightClick = useCallback((e, img, index) => {
    setCtxMenu({ x: e.clientX, y: e.clientY, image: img, index })
  }, [])

  const handleFolderRightClick = useCallback((e, folder) => {
    setCtxMenu({ x: e.clientX, y: e.clientY, folder })
  }, [])

  // ── Drag handlers ──
  const handleImageDragStart = useCallback((draggedPath) => {
    const inSel = selected?.has(draggedPath) && (selected?.size ?? 0) > 1
    _dragItems = inSel
      ? images.filter(img => selected.has(img.path)).map(img => ({ src: img.path, isDir: false }))
      : [{ src: draggedPath, isDir: false }]
  }, [selected, images])

  const handleItemDrop = useCallback((items, destPath) => {
    if (onMoveItems && items.length > 0) onMoveItems(items, destPath)
  }, [onMoveItems])

  const handleMoveImageViaDialog = useCallback(async (imagePath) => {
    const dest = await window.api.selectFolder()
    if (dest) onMoveItems?.([{ src: imagePath, isDir: false }], dest)
  }, [onMoveItems])

  const handleMoveSelectedViaDialog = useCallback(async () => {
    const dest = await window.api.selectFolder()
    if (!dest || !selected?.size) return
    const items = images.filter(img => selected.has(img.path)).map(img => ({ src: img.path, isDir: false }))
    onMoveItems?.(items, dest)
  }, [onMoveItems, selected, images])

  const handleMoveFolderViaDialog = useCallback(async (folderPath) => {
    const dest = await window.api.selectFolder()
    if (dest) onMoveItems?.([{ src: folderPath, isDir: true }], dest)
  }, [onMoveItems])

  const closeCtx = useCallback(() => setCtxMenu(null), [])

  const handleDeleteSelected = useCallback(async () => {
    if (!selected?.size) return
    const paths = images.filter(img => selected.has(img.path)).map(img => img.path)
    if (onTrashFiles) {
      onTrashFiles(paths)
    } else {
      if (!window.confirm(confirmDeleteSelected(paths.length, lang))) return
      const result = await window.api.deleteFiles(paths)
      if (result.success || result.failed?.length < paths.length) {
        onClearSelect?.()
        onAfterDelete?.()
      }
    }
  }, [selected, images, onTrashFiles, onClearSelect, onAfterDelete, lang])

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'Escape') { onClearSelect?.(); return }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') { e.preventDefault(); onSelectAll?.(); return }
      if (e.key === 'Delete' && selected?.size > 0) handleDeleteSelected()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, onClearSelect, onSelectAll, handleDeleteSelected])

  const hasFolders = showSubfolders && subfolders.length > 0
  const hasImages  = images.length > 0

  // ── Virtual rows — hooki MUSZĄ być przed early returns ──
  const virtualRows = useMemo(
    () => buildVirtualRows(hasFolders, subfolders, hasImages, images, cols, size, t),
    [hasFolders, subfolders, hasImages, images, cols, size, t]
  )
  useEffect(() => { listRef.current?.resetAfterIndex(0) }, [virtualRows])

  const VRow = useCallback(({ index, style }) => {
    const row = virtualRows[index]
    if (row.type === 'header') return (
      <div style={{ ...style, padding: `0 ${VGRID_PADDING}px`, display:'flex', alignItems:'flex-end' }}>
        <div className={styles.sectionLabel}>{row.label}</div>
      </div>
    )
    if (row.type === 'divider') return (
      <div style={style}><div className={styles.sectionDivider} /></div>
    )
    return (
      <div style={{ ...style, display:'flex', gap: VGRID_GAP, padding: `0 ${VGRID_PADDING}px`, alignItems:'flex-start', boxSizing:'border-box' }}>
        {row.type === 'folders' && row.items.map(sf => (
          <FolderCard key={sf.path} folder={sf} size={size}
            onOpen={() => onOpenFolder(sf.path)}
            onRightClick={handleFolderRightClick}
            onItemDrop={handleItemDrop}
            onFolderDragStart={() => {}} />
        ))}
        {row.type === 'images' && row.items.map((img, j) => (
          <ImageCard key={img.path} img={img} index={row.startIndex + j} size={size}
            onSelect={onSelect}
            onRightClick={handleRightClick}
            imgTags={tags?.[img.path] ?? []}
            isSelected={selected?.has(img.path) ?? false}
            selected={selected}
            onToggleSelect={onToggleSelect ?? (() => {})}
            onImageDragStart={handleImageDragStart}
            label={labels?.[img.path] ?? null} />
        ))}
      </div>
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [virtualRows, size, selected, tags, handleItemDrop, handleImageDragStart])

  const selectedSize = images.filter(img => selected?.has(img.path)).reduce((s, img) => s + img.size, 0)

  if (loading) return (
    <div className={styles.center}>
      <div className={styles.spinner} />
      <span className={styles.hint}>{t('loading')}</span>
    </div>
  )

  if (!hasFolders && !hasImages) return (
    <div className={styles.center}>
      <div className={styles.emptyIcon}>🖼️</div>
      <span className={styles.hint}>{t('noPhotos')}</span>
    </div>
  )

  return (
    <>
      {viewMode === 'list' ? (
        <div className={styles.listView}>
          {hasFolders && subfolders.map(sf => (
            <div key={sf.path} className={styles.listFolderRow}
              onClick={() => onOpenFolder(sf.path)}
              onContextMenu={e => { e.preventDefault(); e.stopPropagation(); handleFolderRightClick(e, sf) }}
              draggable
              onDragStart={e => { e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain','lumina-drag'); _dragItems=[{src:sf.path,isDir:true}] }}
              onDragEnd={() => { _dragItems=[] }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{flexShrink:0,color:'rgba(255,255,255,0.5)'}}>
                <path d="M1 3.5A1.5 1.5 0 012.5 2h3.086a1.5 1.5 0 011.06.44L7.72 3.5H13.5A1.5 1.5 0 0115 5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5V3.5z" fill="currentColor" fillOpacity="0.55"/>
              </svg>
              <span className={styles.listName}>{sf.name}</span>
              <span className={styles.listMeta}>{t('folderType')}</span>
            </div>
          ))}
          {images.map((img, i) => (
            <ListRow
              key={img.path}
              img={img}
              index={i}
              onSelect={onSelect}
              onRightClick={handleRightClick}
              isSelected={selected?.has(img.path) ?? false}
              onToggleSelect={onToggleSelect ?? (() => {})}
              imgTags={tags?.[img.path] ?? []}
              label={labels?.[img.path] ?? null}
            />
          ))}
        </div>
      ) : (
        <div
          ref={setGridEl}
          className={styles.virtualGridOuter}
          onContextMenu={e => {
            if (!e.target.closest(`.${styles.card}`) && !e.target.closest(`.${styles.folderCard}`)) {
              e.preventDefault()
              setCtxMenu({ x: e.clientX, y: e.clientY })
            }
          }}
        >
          {gridWidth > 0 && gridHeight > 0 && (
            <VariableSizeList
              ref={listRef}
              height={gridHeight}
              width={gridWidth}
              itemCount={virtualRows.length}
              itemSize={i => virtualRows[i].h}
              overscanCount={4}
            >
              {VRow}
            </VariableSizeList>
          )}
        </div>
      )}

      {/* Selection bar */}
      {selected?.size > 0 && (
        <div className={styles.selBar}>
          <div className={styles.selCount}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M3.5 7l2.5 2.5 4-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {selectedCount(selected.size, lang)} · {formatSize(selectedSize)}
          </div>
          <div className={styles.selSep} />
          {onSlideshow && (
            <button className={styles.selMoveBtn} onClick={onSlideshow} title={t('slideshowStart')}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M6.5 5.5l5 2.5-5 2.5V5.5z" fill="currentColor"/>
              </svg>
            </button>
          )}
          {onBatchRename && (
            <button className={styles.selMoveBtn} onClick={onBatchRename} title={t('batchRename')}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M2 13h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M9.5 3.5L12 6 6 12H3.5V9.5L9.5 3.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {onCollage && selected?.size >= 2 && (
            <button className={styles.selMoveBtn} onClick={onCollage} title={t('collageTitle')}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <rect x="1.5" y="1.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="8.5" y="1.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="1.5" y="8.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="8.5" y="8.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
            </button>
          )}
          {onMoveItems && (
            <button className={styles.selMoveBtn} onClick={handleMoveSelectedViaDialog} title={t('moveTo')}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M2 8h10M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13 3v10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.5"/>
              </svg>
            </button>
          )}
          <button className={styles.selDeleteBtn} onClick={handleDeleteSelected} title={onTrashFiles ? t('moveToTrash') : t('deleteSelected')}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M12 3.5L11 12a1 1 0 01-1 1H4a1 1 0 01-1-1L2 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className={styles.selClearBtn} onClick={onClearSelect} title={t('clearSelection')}>✕</button>
        </div>
      )}

      {showBulkExport && selected?.size > 0 && (
        <BulkExportPanel
          images={images}
          selected={selected}
          edits={edits}
          onClose={() => setShowBulkExport(false)}
          onDone={() => { setShowBulkExport(false); onClearSelect?.() }}
        />
      )}

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          image={ctxMenu.image}
          folder={ctxMenu.folder}
          onClose={closeCtx}
          onOpenLightbox={ctxMenu.image ? () => onSelect(ctxMenu.index) : undefined}
          onOpenFolder={ctxMenu.folder ? () => { onOpenFolder(ctxMenu.folder.path); closeCtx() } : undefined}
          onAddToAlbum={onAddToAlbum && ctxMenu.image && !albumView ? () => { onAddToAlbum(ctxMenu.image); closeCtx() } : null}
          onRemoveFromAlbum={onRemoveFromAlbum && ctxMenu.image ? () => { onRemoveFromAlbum(ctxMenu.image.path); closeCtx() } : null}
          onSelectAll={() => images.forEach(img => onToggleSelect && !selected?.has(img.path) && onToggleSelect(img.path))}
          onDeselectAll={() => onClearSelect?.()}
          hasSelection={selected?.size ?? 0}
          onExportSelected={selected?.size > 0 ? () => { setShowBulkExport(true); closeCtx() } : null}
          onTrashFile={onTrashFiles && ctxMenu?.image ? () => { onTrashFiles([ctxMenu.image.path]); closeCtx() } : null}
          onMoveImage={onMoveItems && ctxMenu?.image ? () => handleMoveImageViaDialog(ctxMenu.image.path) : null}
          onMoveSelected={onMoveItems && (selected?.size ?? 0) > 1 ? handleMoveSelectedViaDialog : null}
          onNewFolder={onCreateFolder ? () => { onCreateFolder(); closeCtx() } : null}
          onRenameFolder={onRenameFolder && ctxMenu?.folder ? () => { onRenameFolder(ctxMenu.folder); closeCtx() } : null}
          onDeleteFolder={onDeleteFolder && ctxMenu?.folder ? () => { onDeleteFolder(ctxMenu.folder.path); closeCtx() } : null}
          onMoveFolder={onMoveItems && ctxMenu?.folder ? () => handleMoveFolderViaDialog(ctxMenu.folder.path) : null}
          currentLabel={ctxMenu?.image ? (labels?.[ctxMenu.image.path] ?? null) : null}
          onSetLabel={onSetLabel && ctxMenu?.image ? (color) => { onSetLabel(ctxMenu.image.path, color); closeCtx() } : null}
          onApplyPreset={onApplyPreset && ctxMenu?.image ? (presetId) => { onApplyPreset(ctxMenu.image.path, presetId); closeCtx() } : null}
        />
      )}
    </>
  )
}
