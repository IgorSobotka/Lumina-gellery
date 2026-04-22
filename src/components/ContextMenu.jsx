import { useEffect, useRef } from 'react'
import { useLang } from '../i18n/index'
import { LABEL_COLORS, LABEL_ORDER } from '../utils/labels'
import { EDITOR_PRESETS } from '../utils/presets'
import styles from './ContextMenu.module.css'

// image  → right-click on image card
// folder → right-click on folder card
// neither → right-click on empty grid space
export default function ContextMenu({
  x, y,
  image, folder,
  onClose,
  onOpenLightbox,
  onOpenFolder,
  onAddToAlbum,
  onRemoveFromAlbum,
  onSelectAll, onDeselectAll, hasSelection,
  onExportSelected,
  onTrashFile,
  // folder management
  onMoveImage,
  onMoveSelected,
  onNewFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveFolder,
  // color labels
  currentLabel,
  onSetLabel,
  // presets
  onApplyPreset,
}) {
  const ref   = useRef(null)
  const t     = useLang()
  const isMac = window.api?.platform === 'darwin'

  const pad   = 8
  const menuW = 230
  const menuH = 400
  const left  = Math.min(x, window.innerWidth  - menuW - pad)
  const top   = Math.min(y, window.innerHeight - menuH - pad)

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', close)
      window.addEventListener('keydown', onKey)
    }, 50)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousedown', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const action = (fn) => () => { if (fn) fn(); onClose() }

  function formatSize(b) {
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
    return `${(b / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div
      ref={ref}
      className={styles.menu}
      style={{ left, top }}
      onContextMenu={e => e.preventDefault()}
    >
      {/* ── Header ── */}
      {image && (
        <div className={styles.header}>
          <div className={styles.fileName}>{image.name}</div>
          <div className={styles.fileMeta}>{image.ext} · {formatSize(image.size)}</div>
        </div>
      )}
      {folder && (
        <div className={styles.header}>
          <div className={styles.fileName}>{folder.name}</div>
          <div className={styles.fileMeta}>{t('folderType')}</div>
        </div>
      )}
      {!image && !folder && (
        <div className={styles.header}>
          <div className={styles.fileName}>{t('galleryLabel')}</div>
        </div>
      )}

      <div className={styles.divider} />

      {/* ── Image actions ── */}
      {image && <>
        <button className={styles.item} onClick={action(() => window.api?.openFile(image.path))}>
          <IconOpen /> {t('open')}
        </button>
        <button className={styles.item} onClick={action(() => window.api?.showInExplorer(image.path))}>
          <IconFolder /> {isMac ? t('showInFinder') : t('showInExplorer')}
        </button>
        <div className={styles.divider} />
        <button className={styles.item} onClick={action(() => navigator.clipboard.writeText(image.path))}>
          <IconCopy /> {t('copyPath')}
        </button>
        <button className={styles.item} onClick={action(() => navigator.clipboard.writeText(image.name))}>
          <IconCopyName /> {t('copyFilename')}
        </button>
        {onAddToAlbum && <>
          <div className={styles.divider} />
          <button className={styles.item} onClick={action(onAddToAlbum)}>
            <IconAlbum /> {t('addToAlbum')}
          </button>
        </>}
        {onRemoveFromAlbum && <>
          <div className={styles.divider} />
          <button className={`${styles.item} ${styles.itemDeselect}`} onClick={action(onRemoveFromAlbum)}>
            <IconRemoveAlbum /> {t('removeFromAlbum')}
          </button>
        </>}
        <div className={styles.divider} />
        <button className={styles.item} onClick={action(onOpenLightbox)}>
          <IconInfo /> {t('fileInfo')}
        </button>
        {(onMoveImage || (onMoveSelected && hasSelection > 1)) && (
          <>
            <div className={styles.divider} />
            {onMoveImage && (
              <button className={styles.item} onClick={action(onMoveImage)}>
                <IconMove /> {t('moveTo')}
              </button>
            )}
            {onMoveSelected && hasSelection > 1 && (
              <button className={styles.item} onClick={action(onMoveSelected)}>
                <IconMove /> {t('moveSelectedTo').replace('{n}', hasSelection)}
              </button>
            )}
          </>
        )}
        {onSetLabel && <>
          <div className={styles.divider} />
          <div className={styles.labelRow}>
            <span className={styles.labelRowTitle}>{t('labelSec')}</span>
            <div className={styles.labelDots}>
              {currentLabel && (
                <button
                  className={styles.labelDotBtn}
                  title={t('labelClear')}
                  onClick={action(() => onSetLabel(null))}
                >
                  <span className={styles.labelDotClear}>✕</span>
                </button>
              )}
              {LABEL_ORDER.map(color => (
                <button
                  key={color}
                  className={`${styles.labelDotBtn} ${currentLabel === color ? styles.labelDotActive : ''}`}
                  style={{ '--lc': LABEL_COLORS[color].dot }}
                  title={t(`label${color.charAt(0).toUpperCase() + color.slice(1)}`)}
                  onClick={action(() => onSetLabel(color))}
                >
                  <span className={styles.labelDotInner} />
                </button>
              ))}
            </div>
          </div>
        </>}
        {onApplyPreset && <>
          <div className={styles.divider} />
          <div className={styles.presetsRow}>
            <span className={styles.presetsTitle}>{t('presetsSection')}</span>
            <div className={styles.presetsChips}>
              {EDITOR_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  className={styles.presetChip}
                  onClick={action(() => onApplyPreset(preset.id))}
                >
                  {t(preset.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </>}
        {onTrashFile && <>
          <div className={styles.divider} />
          <button className={`${styles.item} ${styles.itemDanger}`} onClick={action(onTrashFile)}>
            <IconTrash /> {t('moveToTrash')}
          </button>
        </>}
        <div className={styles.divider} />
      </>}

      {/* ── Folder actions ── */}
      {folder && <>
        <button className={styles.item} onClick={action(onOpenFolder)}>
          <IconFolderOpen /> {t('openFolderAction')}
        </button>
        <button className={styles.item} onClick={action(() => window.api?.showInExplorer(folder.path))}>
          <IconFolder /> {isMac ? t('showInFinder') : t('showInExplorer')}
        </button>
        <div className={styles.divider} />
        {onRenameFolder && (
          <button className={styles.item} onClick={action(onRenameFolder)}>
            <IconRename /> {t('renameItem')}
          </button>
        )}
        {onMoveFolder && (
          <button className={styles.item} onClick={action(onMoveFolder)}>
            <IconMove /> {t('moveTo')}
          </button>
        )}
        {onDeleteFolder && (
          <button className={`${styles.item} ${styles.itemDanger}`} onClick={action(onDeleteFolder)}>
            <IconTrash /> {t('deleteFolder')}
          </button>
        )}
        <div className={styles.divider} />
      </>}

      {/* ── New folder (empty space only) ── */}
      {!image && !folder && onNewFolder && (
        <>
          <button className={styles.item} onClick={action(onNewFolder)}>
            <IconNewFolder /> {t('newFolder')}
          </button>
          <div className={styles.divider} />
        </>
      )}

      {/* ── Selection (always visible) ── */}
      <button className={styles.item} onClick={action(onSelectAll)}>
        <IconSelectAll /> {t('selectAll')}
      </button>
      {hasSelection > 0 && (
        <button className={`${styles.item} ${styles.itemDeselect}`} onClick={action(onDeselectAll)}>
          <IconDeselectAll /> {t('deselectAll')}
        </button>
      )}
      {onExportSelected && <>
        <div className={styles.divider} />
        <button className={styles.item} onClick={action(onExportSelected)}>
          <IconExport /> {t('exportSelected')} ({hasSelection > 0 ? hasSelection : ''})
        </button>
      </>}
    </div>
  )
}

function IconOpen() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M5 3V2.5a.5.5 0 011 0V3M10 3V2.5a.5.5 0 011 0V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
}
function IconFolder() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M1 4.5A1.5 1.5 0 012.5 3h3.086a1.5 1.5 0 011.06.44L7.72 4.5H13.5A1.5 1.5 0 0115 6v6a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12V4.5z" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
}
function IconFolderOpen() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M1 4.5A1.5 1.5 0 012.5 3h3.086a1.5 1.5 0 011.06.44L7.72 4.5H13.5A1.5 1.5 0 0115 6v6a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12V4.5z" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M4 8h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M9 6l3 2-3 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
}
function IconCopy() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M3 11H2.5A1.5 1.5 0 011 9.5v-7A1.5 1.5 0 012.5 1h7A1.5 1.5 0 0111 2.5V3" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
}
function IconCopyName() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M4 8h8M4 11h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <rect x="1.5" y="2" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
}
function IconInfo() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M8 7.5V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="8" cy="5.5" r="0.7" fill="currentColor"/>
  </svg>
}
function IconAlbum() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="3.5" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M5 3.5V2M11 3.5V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M5 10l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
}
function IconSelectAll() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M4 8l2.5 2.5 5-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
}
function IconDeselectAll() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
}
function IconExport() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 13h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
}
function IconTrash() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M12 3.5L11 12a1 1 0 01-1 1H4a1 1 0 01-1-1L2 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
}
function IconRemoveAlbum() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="3.5" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M5 3.5V2M11 3.5V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M6 10.5l4-4M10 10.5l-4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
}
function IconMove() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M2 8h10M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 3v10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.4"/>
  </svg>
}
function IconRename() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M2 13h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M9.5 3.5L12 6 6 12H3.5V9.5L9.5 3.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>
}
function IconNewFolder() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M1 4.5A1.5 1.5 0 012.5 3h3.086a1.5 1.5 0 011.06.44L7.72 4.5H13.5A1.5 1.5 0 0115 6v6a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12V4.5z" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M8 8v4M6 10h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
}
