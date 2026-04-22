import { useState, useEffect, useRef, useCallback } from 'react'
import { useLang } from '../i18n/index'
import styles from './CloudBrowser.module.css'

const IMG_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.avif', '.tiff'])

function isImage(name) {
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase()
  return IMG_EXTS.has(ext)
}

function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ── Folder icon ───────────────────────────────────────────────────────────────
function FolderSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M3 7a2 2 0 012-2h4.5l2 2H19a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
        fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
    </svg>
  )
}

// ── Image card with lazy thumbnail ────────────────────────────────────────────
function CloudImageCard({ entry, provider, addonState, onPreview }) {
  const [thumb, setThumb] = useState(null)
  const ref = useRef(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!ref.current || loadedRef.current) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !loadedRef.current) {
        loadedRef.current = true
        obs.disconnect()
        window.api.cloudGetThumb(provider, entry.path_lower)
          .then(b64 => { if (b64) setThumb(b64) })
          .catch(() => {})
      }
    }, { rootMargin: '80px' })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [provider, entry.path_lower])

  return (
    <button ref={ref} className={styles.imageCard} onClick={() => onPreview(entry)} title={entry.name}>
      {thumb ? (
        <img src={thumb} alt={entry.name} className={styles.thumb} draggable={false} />
      ) : (
        <div className={styles.thumbPlaceholder}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.3" opacity="0.4"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" opacity="0.4"/>
            <path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
          </svg>
        </div>
      )}
      <div className={styles.imageName}>{entry.name}</div>
    </button>
  )
}

// ── Folder card ───────────────────────────────────────────────────────────────
function CloudFolderCard({ entry, onOpen }) {
  return (
    <button className={styles.folderCard} onClick={() => onOpen(entry)} title={entry.name}>
      <FolderSvg />
      <div className={styles.folderName}>{entry.name}</div>
    </button>
  )
}

// ── Image preview overlay ─────────────────────────────────────────────────────
function ImagePreview({ entry, provider, addonState, onClose }) {
  const t = useLang()
  const [src, setSrc] = useState(null)

  useEffect(() => {
    // Build the gallery://cloud URL which main process serves from Dropbox
    const url = `gallery://cloud?provider=${encodeURIComponent(provider)}&path=${encodeURIComponent(entry.path_lower)}`
    setSrc(url)
  }, [provider, entry.path_lower])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className={styles.previewOverlay} onClick={onClose}>
      <div className={styles.previewContent} onClick={e => e.stopPropagation()}>
        <button className={styles.previewClose} onClick={onClose} title={t('close')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        {src ? (
          <img src={src} alt={entry.name} className={styles.previewImg} />
        ) : (
          <div className={styles.previewLoading}>Loading…</div>
        )}
        <div className={styles.previewName}>{entry.name}</div>
      </div>
    </div>
  )
}

// ── Main CloudBrowser ─────────────────────────────────────────────────────────
export default function CloudBrowser({ provider, addonState, onClose }) {
  const t = useLang()
  const [path, setPath] = useState('')           // current dropbox path
  const [breadcrumbs, setBreadcrumbs] = useState([{ name: provider, path: '' }])
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)   // entry being previewed

  const loadFolder = useCallback(async (folderPath) => {
    setLoading(true)
    setError(null)
    setEntries([])
    const res = await window.api.cloudListFolder(provider, folderPath)
    setLoading(false)
    if (!res.success) { setError(res.error || 'Error'); return }
    // Sort: folders first, then images, then others
    const sorted = [...res.entries].sort((a, b) => {
      const af = a['.tag'] === 'folder', bf = b['.tag'] === 'folder'
      if (af !== bf) return af ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    setEntries(sorted)
  }, [provider])

  useEffect(() => { loadFolder('') }, [loadFolder])

  const openFolder = (entry) => {
    const newPath = entry.path_lower
    setBreadcrumbs(prev => [...prev, { name: entry.name, path: newPath }])
    setPath(newPath)
    loadFolder(newPath)
  }

  const goToBreadcrumb = (index) => {
    const crumb = breadcrumbs[index]
    setBreadcrumbs(prev => prev.slice(0, index + 1))
    setPath(crumb.path)
    loadFolder(crumb.path)
  }

  // Escape to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && !preview) onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, preview])

  const folders = entries.filter(e => e['.tag'] === 'folder')
  const images  = entries.filter(e => e['.tag'] === 'file' && isImage(e.name))
  const others  = entries.filter(e => e['.tag'] === 'file' && !isImage(e.name))

  const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1)

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {/* Provider logo pill */}
            <div className={styles.providerPill}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L12 6.5 6 11 0 6.5 6 2zM18 2l6 4.5-6 4.5-6-4.5L18 2zM0 17.5L6 13l6 4.5-6 4.5-6-4.5zM18 13l6 4.5-6 4.5-6-4.5L18 13z" fill="currentColor"/>
              </svg>
              {providerLabel}
            </div>
            {/* Breadcrumbs */}
            <div className={styles.breadcrumbs}>
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className={styles.crumbItem}>
                  {i > 0 && <span className={styles.crumbSep}>›</span>}
                  <button
                    className={`${styles.crumbBtn} ${i === breadcrumbs.length - 1 ? styles.crumbActive : ''}`}
                    onClick={() => i < breadcrumbs.length - 1 && goToBreadcrumb(i)}
                  >
                    {crumb.name}
                  </button>
                </span>
              ))}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title={t('closeEsc')}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              {t('cloudLoading')}
            </div>
          )}

          {error && (
            <div className={styles.errorBox}>{error}</div>
          )}

          {!loading && !error && entries.length === 0 && (
            <div className={styles.empty}>{t('cloudEmpty')}</div>
          )}

          {!loading && !error && entries.length > 0 && (
            <div className={styles.content}>
              {/* Folders */}
              {folders.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionLabel}>{t('cloudFolders')} ({folders.length})</div>
                  <div className={styles.folderGrid}>
                    {folders.map(e => (
                      <CloudFolderCard key={e.id} entry={e} onOpen={openFolder} />
                    ))}
                  </div>
                </div>
              )}

              {/* Images */}
              {images.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionLabel}>{t('cloudPhotos')} ({images.length})</div>
                  <div className={styles.imageGrid}>
                    {images.map(e => (
                      <CloudImageCard
                        key={e.id}
                        entry={e}
                        provider={provider}
                        addonState={addonState}
                        onPreview={setPreview}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Other files */}
              {others.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionLabel}>{t('cloudFiles')} ({others.length})</div>
                  <div className={styles.fileList}>
                    {others.map(e => (
                      <div key={e.id} className={styles.fileRow}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <path d="M4 2h6l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.5"/>
                        </svg>
                        <span className={styles.fileName}>{e.name}</span>
                        <span className={styles.fileSize}>{fmtSize(e.size)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Image preview ── */}
      {preview && (
        <ImagePreview
          entry={preview}
          provider={provider}
          addonState={addonState}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  )
}
