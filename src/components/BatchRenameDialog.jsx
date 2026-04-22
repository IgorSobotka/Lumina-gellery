import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLang } from '../i18n/index'
import styles from './BatchRenameDialog.module.css'

/**
 * Batch rename dialog.
 * Props:
 *   images    – array of image objects (filtered to selected)
 *   onClose   – close without renaming
 *   onDone    – called after rename; parent should reload folder
 */
export default function BatchRenameDialog({ images, onClose, onDone }) {
  const t       = useLang()
  const [pattern, setPattern] = useState('{name}')
  const [status,  setStatus]  = useState(null) // null | 'renaming' | 'done' | 'error'

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const buildName = useCallback((item, index) => {
    const total   = images.length
    const baseName = item.name.replace(/\.[^.]+$/, '') // strip ext
    const ext      = item.ext ? item.ext.replace(/^\./, '') : ''
    const date     = new Date(item.mtime).toISOString().slice(0, 10)
    const padded   = String(index + 1).padStart(String(total).length, '0')
    const newBase  = pattern
      .replace(/\{name\}/g, baseName)
      .replace(/\{n\}/g,    padded)
      .replace(/\{date\}/g, date)
      .replace(/\{ext\}/g,  ext)
    // Append extension if not already ends with it
    if (ext && !newBase.toLowerCase().endsWith('.' + ext.toLowerCase())) {
      return newBase + '.' + ext
    }
    return newBase
  }, [pattern, images])

  const previews = useMemo(() => images.map((img, i) => ({
    old: img.name,
    next: buildName(img, i),
  })), [images, buildName])

  const handleRename = async () => {
    if (!pattern.trim()) return
    setStatus('renaming')
    const items = images.map(img => ({ path: img.path, name: img.name, ext: img.ext, mtime: img.mtime }))
    try {
      const results = await window.api.batchRename(items, pattern)
      const anyFail = results.some(r => !r.ok)
      setStatus(anyFail ? 'error' : 'done')
      if (!anyFail) {
        setTimeout(() => { onClose(); onDone?.() }, 800)
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.dialog}>
        <div className={styles.title}>{t('batchRenameTitle')}</div>
        <div className={styles.subtitle}>{images.length} {images.length === 1 ? 'file' : 'files'}</div>

        <div className={styles.patternWrap}>
          <input
            className={styles.patternInput}
            type="text"
            value={pattern}
            onChange={e => { setPattern(e.target.value); setStatus(null) }}
            onKeyDown={e => { if (e.key === 'Enter' && status !== 'renaming') handleRename() }}
            spellCheck={false}
            autoFocus
          />
          <div className={styles.hint}>{t('batchPatternHint')}</div>
        </div>

        <div className={styles.previewTitle}>{t('batchPreview')}</div>
        <div className={styles.previewList}>
          {previews.map((p, i) => (
            <div key={i} className={styles.previewRow}>
              <span className={styles.previewOld}>{p.old}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={styles.previewArrow}>
                <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className={`${styles.previewNew} ${p.next === p.old ? styles.previewSame : ''}`}>{p.next}</span>
            </div>
          ))}
        </div>

        {status === 'error' && <div className={styles.errorMsg}>{t('batchError')}</div>}

        <div className={styles.btnRow}>
          <button className={styles.cancelBtn} onClick={onClose}>{t('pvCancel')}</button>
          <button
            className={styles.confirmBtn}
            onClick={handleRename}
            disabled={status === 'renaming' || !pattern.trim()}
          >
            {status === 'renaming' ? t('batchRenaming') : status === 'done' ? t('batchDone') : t('batchRenameBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
