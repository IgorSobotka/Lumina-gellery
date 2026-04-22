import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useLang } from '../i18n/index'
import styles from './DiskManager.module.css'

// ── Formatters ──────────────────────────────────────────────────────────────
function fmt(bytes) {
  if (bytes == null) return '—'
  if (bytes >= 1e12) return (bytes / 1e12).toFixed(1) + ' TB'
  if (bytes >= 1e9)  return (bytes / 1e9).toFixed(1) + ' GB'
  if (bytes >= 1e6)  return (bytes / 1e6).toFixed(1) + ' MB'
  if (bytes >= 1e3)  return (bytes / 1e3).toFixed(0) + ' KB'
  return bytes + ' B'
}

function pct(used, total) {
  if (!total) return 0
  return Math.min(100, (used / total) * 100)
}

function barColor(p) {
  if (p > 90) return 'var(--c-red)'
  if (p > 70) return 'var(--c-orange)'
  return 'var(--accent)'
}

// ── Squarified treemap ───────────────────────────────────────────────────────
function buildLayout(items, x, y, w, h) {
  if (!items.length || w <= 0 || h <= 0) return []
  const nodes = [...items].sort((a, b) => b.size - a.size).filter(n => n.size > 0)
  if (!nodes.length) return []
  const total = nodes.reduce((s, n) => s + n.size, 0)
  if (!total) return []
  const out = []
  squarify(nodes, x, y, w, h, total, w * h, out)
  return out
}

function squarify(nodes, x, y, w, h, total, area, out) {
  if (!nodes.length || w <= 0 || h <= 0) return
  if (nodes.length === 1) {
    out.push({ ...nodes[0], rx: x, ry: y, rw: w, rh: h })
    return
  }
  const horiz  = w >= h
  const shorter = Math.min(w, h)

  let row = [nodes[0]], rowSum = nodes[0].size
  let prevW = worstAspect(row, rowSum, shorter, total, area)

  for (let i = 1; i < nodes.length; i++) {
    const newSum = rowSum + nodes[i].size
    const newW   = worstAspect([...row, nodes[i]], newSum, shorter, total, area)
    if (newW <= prevW) { row.push(nodes[i]); rowSum = newSum; prevW = newW }
    else {
      placeRow(row, rowSum, x, y, w, h, horiz, total, area, out)
      const frac = rowSum / total
      const span = frac * (horiz ? w : h)
      const rem  = nodes.slice(i)
      const remT = rem.reduce((s, n) => s + n.size, 0)
      if (horiz) squarify(rem, x + span, y, w - span, h, remT, (w - span) * h, out)
      else       squarify(rem, x, y + span, w, h - span, remT, w * (h - span), out)
      return
    }
  }
  placeRow(row, rowSum, x, y, w, h, horiz, total, area, out)
}

function worstAspect(row, rowSum, shorter, total, area) {
  const rowArea = (rowSum / total) * area
  const span = rowArea / shorter
  if (span <= 0) return Infinity
  let worst = 0
  for (const n of row) {
    const nArea = (n.size / total) * area
    const len = nArea / span
    if (len <= 0) return Infinity
    const r = Math.max(span / len, len / span)
    if (r > worst) worst = r
  }
  return worst
}

function placeRow(row, rowSum, x, y, w, h, horiz, total, area, out) {
  const rowArea = (rowSum / total) * area
  const span    = rowArea / Math.min(w, h)
  let pos = horiz ? y : x
  for (const n of row) {
    const len = (n.size / rowSum) * (horiz ? h : w)
    out.push({
      ...n,
      rx: horiz ? x   : pos,
      ry: horiz ? pos : y,
      rw: horiz ? span : len,
      rh: horiz ? len  : span,
    })
    pos += len
  }
}

// ── Color palette (dark vivid, Space-Sniffer style) ──────────────────────────
const PALETTE = [
  '#6D28D9', '#1D4ED8', '#047857', '#B45309', '#9D174D',
  '#0E7490', '#7C2D12', '#4338CA', '#065F46', '#92400E',
  '#1E3A8A', '#6B21A8', '#064E3B', '#78350F', '#831843',
]

// ── TreeMap single rect ──────────────────────────────────────────────────────
function TreeRect({ rect, onHover, onClick, isHovered }) {
  const color = PALETTE[rect._ci % PALETTE.length]
  const GAP = 1
  const canShowName = rect.rw > 55  && rect.rh > 22
  const canShowSize = rect.rw > 70  && rect.rh > 40
  const hasChildren = rect.children?.length > 0

  return (
    <div
      className={`${styles.treeRect} ${isHovered ? styles.treeRectHovered : ''} ${hasChildren ? styles.treeRectClickable : ''}`}
      style={{
        left:   rect.rx + GAP,
        top:    rect.ry + GAP,
        width:  Math.max(0, rect.rw - GAP * 2),
        height: Math.max(0, rect.rh - GAP * 2),
        '--rc': color,
      }}
      onMouseEnter={() => onHover(rect)}
      onMouseLeave={() => onHover(null)}
      onClick={() => hasChildren && onClick(rect)}
      title={`${rect.name}\n${fmt(rect.size)}`}
    >
      {canShowName && (
        <div className={styles.treeRectLabel}>
          <span className={styles.treeRectName}>{rect.name}</span>
          {canShowSize && <span className={styles.treeRectSize}>{fmt(rect.size)}</span>}
        </div>
      )}
    </div>
  )
}

// ── TreeMap view ─────────────────────────────────────────────────────────────
function TreeMapView({ rootNode }) {
  const [navPath, setNavPath] = useState([{ node: rootNode, ci: null }])
  const containerRef = useRef(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })
  const [hovered, setHovered] = useState(null)

  // Reset nav when rootNode changes
  useEffect(() => {
    setNavPath([{ node: rootNode, ci: null }])
    setHovered(null)
  }, [rootNode])

  // Observe container size
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([e]) => {
      setDims({ w: Math.floor(e.contentRect.width), h: Math.floor(e.contentRect.height) })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const currentEntry = navPath[navPath.length - 1]
  const currentNode  = currentEntry.node
  const parentCi     = currentEntry.ci

  const rects = useMemo(() => {
    const children = currentNode?.children ?? []
    if (!children.length || !dims.w || !dims.h) return []
    const isRoot = navPath.length === 1
    const items = children.map((c, i) => ({
      ...c,
      _ci: isRoot ? i : (parentCi ?? 0),
    }))
    return buildLayout(items, 0, 0, dims.w, dims.h)
  }, [currentNode, dims, navPath, parentCi])

  const navigate = useCallback((rect) => {
    if (!rect.children?.length) return
    setNavPath(p => [...p, { node: rect, ci: rect._ci }])
    setHovered(null)
  }, [])

  const goToLevel = useCallback((idx) => {
    setNavPath(p => p.slice(0, idx + 1))
    setHovered(null)
  }, [])

  return (
    <div className={styles.treeView}>
      {/* Breadcrumb */}
      <div className={styles.treeCrumbBar}>
        {navPath.map((entry, i) => (
          <span key={i} className={styles.treeCrumbGroup}>
            {i > 0 && <span className={styles.treeCrumbSep}>›</span>}
            <button
              className={`${styles.treeCrumb} ${i === navPath.length - 1 ? styles.treeCrumbCurrent : ''}`}
              onClick={() => goToLevel(i)}
            >
              {entry.node.name || entry.node.path}
            </button>
          </span>
        ))}
        {hovered
          ? <span className={styles.treeHoverInfo}>
              <span className={styles.treeHoverName}>{hovered.name}</span>
              <span className={styles.treeHoverSize}>{fmt(hovered.size)}</span>
              {hovered.children?.length > 0 && (
                <span className={styles.treeHoverSub}>{hovered.children.length} dirs</span>
              )}
            </span>
          : <span className={styles.treeTotalSize}>{fmt(currentNode?.size)}</span>
        }
      </div>

      {/* Map canvas */}
      <div className={styles.treeCanvas} ref={containerRef}>
        {rects.map((rect) => (
          <TreeRect
            key={rect.path}
            rect={rect}
            onHover={setHovered}
            onClick={navigate}
            isHovered={hovered?.path === rect.path}
          />
        ))}
        {!rects.length && dims.w > 0 && (
          <div className={styles.treeEmpty}>—</div>
        )}
      </div>
    </div>
  )
}

// ── Disk card ────────────────────────────────────────────────────────────────
function DiskCard({ disk, t, isSelected, onClick }) {
  const p = pct(disk.used, disk.total)
  return (
    <div
      className={`${styles.diskCard} ${isSelected ? styles.diskCardSelected : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      <div className={styles.diskTop}>
        <div className={styles.diskIcon}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="6" width="20" height="12" rx="3" stroke="currentColor" strokeWidth="1.4"/>
            <circle cx="17" cy="12" r="1.5" fill="currentColor" opacity="0.6"/>
            <circle cx="13" cy="12" r="1.5" fill="currentColor" opacity="0.4"/>
            <path d="M2 9h20" stroke="currentColor" strokeWidth="1.2" opacity="0.3"/>
          </svg>
        </div>
        <div className={styles.diskInfo}>
          <div className={styles.diskName}>{disk.root || disk.name}</div>
          <div className={styles.diskSub}>{fmt(disk.free)} {t('diskFree')} {t('diskOf')} {fmt(disk.total)}</div>
        </div>
        <div className={styles.diskPct} style={{ color: barColor(p) }}>{Math.round(p)}%</div>
      </div>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${p}%`, background: barColor(p) }} />
      </div>
      <div className={styles.diskBytes}>
        <span>{fmt(disk.used)} {t('diskUsed')}</span>
        <span>{fmt(disk.free)} {t('diskFree')}</span>
      </div>
      {isSelected && (
        <div className={styles.diskSelectedArrow}>▾</div>
      )}
    </div>
  )
}

// ── Large file row ───────────────────────────────────────────────────────────
function LargeFileRow({ file, maxSize, onDelete, onShow, t }) {
  const p = maxSize ? (file.size / maxSize) * 100 : 0
  return (
    <div className={styles.fileRow}>
      <div className={styles.fileBar} style={{ width: `${p}%` }} />
      <div className={styles.fileContent}>
        <div className={styles.fileName} title={file.path}>{file.name}</div>
        <div className={styles.fileSize}>{fmt(file.size)}</div>
        <div className={styles.fileActions}>
          <button className={styles.iconBtn} onClick={() => onShow(file.path)} title={t('diskShowExp')}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M1 3.5A1.5 1.5 0 012.5 2h3.086a1.5 1.5 0 011.06.44L7.72 3.5H13.5A1.5 1.5 0 0115 5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5V3.5z" fill="currentColor" fillOpacity="0.5"/>
            </svg>
          </button>
          <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => onDelete(file)} title={t('diskDeleteFile')}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M12 3.5L11 12a1 1 0 01-1 1H4a1 1 0 01-1-1L2 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Duplicate group ──────────────────────────────────────────────────────────
function DupGroup({ group, onDelete, onShow, t }) {
  const [expanded, setExpanded] = useState(false)
  const wasted = group[0].size * (group.length - 1)
  return (
    <div className={styles.dupGroup}>
      <button className={styles.dupHeader} onClick={() => setExpanded(v => !v)}>
        <div className={styles.dupHeaderLeft}>
          <svg width="12" height="12" viewBox="0 0 10 10" fill="none"
            style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: '180ms ease', flexShrink: 0 }}>
            <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className={styles.dupCount}>{t('diskDupCount').replace('{n}', group.length)}</span>
          <span className={styles.dupSize}>{fmt(group[0].size)} {t('diskDupEach')}</span>
        </div>
        <span className={styles.dupWasted}>{t('diskDupWasted').replace('{size}', fmt(wasted))}</span>
      </button>
      {expanded && (
        <div className={styles.dupFiles}>
          {group.map((f, i) => (
            <div key={f.path} className={styles.dupFile}>
              <div className={styles.dupFilePath} title={f.path}>
                {i === 0 && <span className={styles.dupOriginal}>{t('diskDupOriginal')}</span>}
                {f.path}
              </div>
              <div className={styles.dupFileActions}>
                <button className={styles.iconBtn} onClick={() => onShow(f.path)} title={t('diskShowExp')}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M1 3.5A1.5 1.5 0 012.5 2h3.086a1.5 1.5 0 011.06.44L7.72 3.5H13.5A1.5 1.5 0 0115 5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5V3.5z" fill="currentColor" fillOpacity="0.5"/>
                  </svg>
                </button>
                {i > 0 && (
                  <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => onDelete(f)} title={t('diskDeleteFile')}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M12 3.5L11 12a1 1 0 01-1 1H4a1 1 0 01-1-1L2 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SectionHead({ icon, title, sub }) {
  return (
    <div className={styles.sectionHead}>
      <div className={styles.sectionHeadIcon}>{icon}</div>
      <div>
        <div className={styles.sectionTitle}>{title}</div>
        {sub && <div className={styles.sectionSub}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function DiskManager({ folder }) {
  const t = useLang()
  const [tab, setTab]               = useState('disks')
  const [disks, setDisks]           = useState(null)
  const [cache, setCache]           = useState(null)
  const [largeFiles, setLargeFiles] = useState(null)
  const [dupes, setDupes]           = useState(null)
  const [scanning, setScanning]     = useState(false)

  // Admin / elevation
  const [elevated, setElevated] = useState(null)   // null = checking

  // Treemap state
  const [selectedDisk, setSelectedDisk] = useState(null)
  const [treeData,     setTreeData]     = useState(null)
  const [treeLoading,  setTreeLoading]  = useState(false)

  useEffect(() => {
    window.api.getDisks().then(setDisks)
    window.api.getCacheInfo().then(setCache)
    window.api.isElevated().then(setElevated)
  }, [])

  const handleDiskClick = useCallback(async (disk) => {
    // Toggle off if same disk clicked again
    if (selectedDisk?.root === disk.root && selectedDisk?.name === disk.name) {
      setSelectedDisk(null)
      setTreeData(null)
      return
    }
    setSelectedDisk(disk)
    setTreeData(null)
    setTreeLoading(true)
    try {
      const tree = await window.api.scanFolderTree(disk.root || disk.path || disk.name)
      setTreeData(tree)
    } catch (e) {
      console.error('scan-folder-tree failed', e)
      setTreeData(null)
    }
    setTreeLoading(false)
  }, [selectedDisk])

  const scanLarge = useCallback(async () => {
    if (!folder) return
    setScanning(true)
    const res = await window.api.getLargeFiles(folder)
    setLargeFiles(res)
    setScanning(false)
  }, [folder])

  const scanDupes = useCallback(async () => {
    if (!folder) return
    setScanning(true)
    const res = await window.api.findDuplicates(folder)
    setDupes(res)
    setScanning(false)
  }, [folder])

  useEffect(() => {
    if (tab === 'large' && largeFiles === null) scanLarge()
    if (tab === 'dupes' && dupes === null) scanDupes()
  }, [tab])

  const handleClearCache = async () => {
    await window.api.clearCache()
    const info = await window.api.getCacheInfo()
    setCache(info)
  }

  const handleDelete = async (file) => {
    if (!window.confirm(t('diskConfirmDel').replace('{name}', file.name))) return
    await window.api.deleteFiles([file.path])
    if (largeFiles) setLargeFiles(f => f.filter(x => x.path !== file.path))
    if (dupes) setDupes(d => d.map(g => g.filter(x => x.path !== file.path)).filter(g => g.length > 1))
  }

  const handleShow = (filePath) => window.api.showInExplorer(filePath)

  const tabs = [
    { id: 'disks', label: t('diskTabDisks'), icon: '💾' },
    { id: 'cache', label: t('diskTabCache'), icon: '🗂️' },
    { id: 'large', label: t('diskTabLarge'), icon: '📦' },
    { id: 'dupes', label: t('diskTabDupes'), icon: '🔁' },
  ]

  const diskIcon  = <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="3" stroke="currentColor" strokeWidth="1.4"/><circle cx="17" cy="12" r="1.5" fill="currentColor"/></svg>
  const cacheIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/></svg>
  const fileIcon  = <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.4"/><path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
  const dupIcon   = <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="8" y="8" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M3 16V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="6" width="20" height="12" rx="3" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="17" cy="12" r="1.5" fill="currentColor" opacity="0.7"/>
            <circle cx="13" cy="12" r="1.5" fill="currentColor" opacity="0.4"/>
          </svg>
          {t('diskTitle')}
        </div>
        <div className={styles.tabs}>
          {tabs.map(tb => (
            <button
              key={tb.id}
              className={`${styles.tab} ${tab === tb.id ? styles.tabActive : ''}`}
              onClick={() => setTab(tb.id)}
            >
              {tb.icon} {tb.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.body}>

        {/* ── Disks tab ── */}
        {tab === 'disks' && (
          <div className={styles.section}>
            <SectionHead icon={diskIcon} title={t('diskSpaceTitle')} sub={t('diskSpaceSub')} />

            {/* Admin banner */}
            {elevated === false && (
              <div className={styles.adminBanner}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className={styles.adminBannerIcon}>
                  <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"
                    stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className={styles.adminBannerText}>{t('diskAdminWarning')}</span>
                <button className={styles.adminBannerBtn} onClick={() => window.api.relaunchAsAdmin()}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"
                      fill="currentColor" opacity="0.8"/>
                    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {t('diskAdminBtn')}
                </button>
              </div>
            )}
            {elevated === true && (
              <div className={styles.adminBannerOk}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"
                    fill="currentColor" opacity="0.6"/>
                  <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t('diskAdminOk')}
              </div>
            )}

            {disks === null && <div className={styles.spinnerWrap}><div className={styles.spinner} /></div>}
            {disks?.length === 0 && <div className={styles.empty}>{t('diskNoData')}</div>}

            <div className={styles.diskGrid}>
              {disks?.map(d => (
                <DiskCard
                  key={d.root || d.name}
                  disk={d}
                  t={t}
                  isSelected={selectedDisk?.root === d.root && selectedDisk?.name === d.name}
                  onClick={() => handleDiskClick(d)}
                />
              ))}
            </div>

            {/* ── TreeMap panel ── */}
            {selectedDisk && (
              <div className={styles.treePanel}>
                <div className={styles.treePanelHeader}>
                  <div className={styles.treePanelTitle}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                      <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                      <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
                    </svg>
                    {t('diskTreeTitle')} — <span style={{ color: 'var(--accent-text)' }}>{selectedDisk.root || selectedDisk.name}</span>
                  </div>
                  <button className={styles.treePanelClose} onClick={() => { setSelectedDisk(null); setTreeData(null) }}>✕</button>
                </div>

                {treeLoading && (
                  <div className={styles.treeLoading}>
                    <div className={styles.treeLoadingSpinner} />
                    <span>{t('diskTreeLoading')}</span>
                  </div>
                )}

                {!treeLoading && treeData && (
                  <TreeMapView rootNode={treeData} />
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Cache tab ── */}
        {tab === 'cache' && (
          <div className={styles.section}>
            <SectionHead icon={cacheIcon} title={t('diskCacheTitle')} sub={t('diskCacheSub')} />
            {cache && (
              <div className={styles.cacheCard}>
                <div className={styles.cacheVisual}>
                  <div className={styles.cacheCircle}>
                    <svg viewBox="0 0 80 80" className={styles.cacheSvg}>
                      <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8"/>
                      <circle cx="40" cy="40" r="34" fill="none" stroke="var(--accent)" strokeWidth="8"
                        strokeDasharray={`${Math.min(100, cache.sizeBytes / (300 * 1024 * 1024) * 100) * 2.136} 213.6`}
                        strokeLinecap="round"
                        transform="rotate(-90 40 40)"
                        style={{ transition: 'stroke-dasharray 600ms ease' }}
                      />
                    </svg>
                    <div className={styles.cacheCircleText}>
                      <div className={styles.cacheSize}>{fmt(cache.sizeBytes)}</div>
                      <div className={styles.cacheLabel}>{t('diskCacheOf')}</div>
                    </div>
                  </div>
                  <div className={styles.cacheStats}>
                    <div className={styles.cacheStat}>
                      <div className={styles.cacheStatVal}>{cache.count}</div>
                      <div className={styles.cacheStatLabel}>{t('diskCacheThumbs')}</div>
                    </div>
                    <div className={styles.cacheStat}>
                      <div className={styles.cacheStatVal}>{fmt(cache.count ? Math.round(cache.sizeBytes / cache.count) : 0)}</div>
                      <div className={styles.cacheStatLabel}>{t('diskCacheAvg')}</div>
                    </div>
                  </div>
                </div>
                <button className={styles.clearBtn} onClick={handleClearCache}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {t('diskClearBtn')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Large files tab ── */}
        {tab === 'large' && (
          <div className={styles.section}>
            <SectionHead
              icon={fileIcon}
              title={t('diskLargeTitle')}
              sub={folder ? t('diskLargeSub').replace('{folder}', folder) : t('diskNoFolder')}
            />
            {!folder && <div className={styles.empty}>{t('diskNoFolder')}</div>}
            {folder && scanning && <div className={styles.spinnerWrap}><div className={styles.spinner} /><span>{t('diskScanning')}</span></div>}
            {folder && !scanning && largeFiles !== null && (
              <>
                <div className={styles.rescanRow}>
                  <span className={styles.rescanInfo}>{t('diskFileCount').replace('{n}', largeFiles.length)}</span>
                  <button className={styles.rescanBtn} onClick={scanLarge}>{t('diskRescan')}</button>
                </div>
                <div className={styles.fileList}>
                  {largeFiles.map(f => (
                    <LargeFileRow key={f.path} file={f} maxSize={largeFiles[0]?.size} onDelete={handleDelete} onShow={handleShow} t={t} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Duplicates tab ── */}
        {tab === 'dupes' && (
          <div className={styles.section}>
            <SectionHead
              icon={dupIcon}
              title={t('diskDupTitle')}
              sub={folder ? t('diskDupSub').replace('{folder}', folder) : t('diskNoFolder')}
            />
            {!folder && <div className={styles.empty}>{t('diskNoFolder')}</div>}
            {folder && scanning && <div className={styles.spinnerWrap}><div className={styles.spinner} /><span>{t('diskScanning')}</span></div>}
            {folder && !scanning && dupes !== null && (
              <>
                <div className={styles.rescanRow}>
                  <span className={styles.rescanInfo}>
                    {dupes.length === 0
                      ? t('diskDupNone')
                      : t('diskDupFound').replace('{n}', dupes.length).replace('{size}', fmt(dupes.reduce((s, g) => s + g[0].size * (g.length - 1), 0)))
                    }
                  </span>
                  <button className={styles.rescanBtn} onClick={scanDupes}>{t('diskRescan')}</button>
                </div>
                <div className={styles.dupList}>
                  {dupes.map((g, i) => (
                    <DupGroup key={i} group={g} onDelete={handleDelete} onShow={handleShow} t={t} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
