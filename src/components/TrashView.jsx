import { useState } from 'react'
import { useLang, useLangCode, fileCount, confirmDeleteFiles } from '../i18n/index'
import styles from './TrashView.module.css'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(ts, locale) {
  return new Date(ts).toLocaleDateString(locale ?? 'pl-PL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function TrashView({ items, onRestore, onEmpty }) {
  const t    = useLang()
  const lang = useLangCode()
  const [selected, setSelected] = useState(new Set())

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const selectedItems = items.filter(i => selected.has(i.id))

  const handleRestore = async (toRestore) => {
    await onRestore(toRestore)
    setSelected(new Set())
  }

  const handleEmpty = async () => {
    if (!window.confirm(confirmDeleteFiles(items.length, lang))) return
    await onEmpty()
    setSelected(new Set())
  }

  if (items.length === 0) return (
    <div className={styles.empty}>
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none" opacity="0.18">
        <path d="M8 14h36M18 14V9a1 1 0 011-1h14a1 1 0 011 1v5M42 14L40 44a2 2 0 01-2 2H14a2 2 0 01-2-2L10 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 24v12M30 24v12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      <span className={styles.emptyLabel}>{t('trashEmpty')}</span>
    </div>
  )

  return (
    <div className={styles.view}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.title}>{t('trash')}</span>
          <span className={styles.count}>{fileCount(items.length, lang)}</span>
        </div>
        <div className={styles.headerActions}>
          {selectedItems.length > 0 ? (
            <button className={styles.restoreBtn} onClick={() => handleRestore(selectedItems)}>
              <RestoreIcon /> {t('restoreSelected')} ({selectedItems.length})
            </button>
          ) : (
            <button className={styles.restoreBtn} onClick={() => handleRestore(items)}>
              <RestoreIcon /> {t('restoreAll')}
            </button>
          )}
          <button className={styles.emptyBtn} onClick={handleEmpty}>
            <TrashIcon /> {t('emptyTrash')}
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {items.map(item => (
          <div
            key={item.id}
            className={`${styles.row} ${selected.has(item.id) ? styles.rowSelected : ''}`}
            onClick={() => toggle(item.id)}
          >
            <div className={`${styles.checkBox} ${selected.has(item.id) ? styles.checkBoxOn : ''}`}>
              {selected.has(item.id) && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div className={styles.thumb}>
              {item.isVideo
                ? <video src={item.url} className={styles.thumbImg} preload="metadata" muted playsInline />
                : <img src={item.url} alt={item.name} className={styles.thumbImg} loading="lazy" />
              }
            </div>
            <div className={styles.info}>
              <span className={styles.name}>{item.name}</span>
              <span className={styles.origPath}>{item.originalPath}</span>
            </div>
            <span className={styles.ext}>{item.ext}</span>
            <span className={styles.meta}>{formatSize(item.size)}</span>
            <span className={styles.date}>{formatDate(item.trashedAt, t('locale'))}</span>
            <button
              className={styles.rowRestoreBtn}
              onClick={e => { e.stopPropagation(); handleRestore([item]) }}
              title={t('restore')}
            >
              <RestoreIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function RestoreIcon() {
  return <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
    <path d="M2 7a5 5 0 1010 0A5 5 0 002 7z" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M2 4V7h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
}

function TrashIcon() {
  return <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
    <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M12 3.5L11 12a1 1 0 01-1 1H4a1 1 0 01-1-1L2 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
}
