import { useState } from 'react'
import { useLang } from '../i18n/index'
import styles from './Sidebar.module.css'

function AlbumIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="3.5" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M5 3.5V2M11 3.5V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
      <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M12 3.5L11 12a1 1 0 01-1 1H4a1 1 0 01-1-1L2 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M1 3.5A1.5 1.5 0 012.5 2h3.086a1.5 1.5 0 011.06.44L7.72 3.5H13.5A1.5 1.5 0 0115 5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5V3.5z" fill="currentColor" fillOpacity="0.7"/>
    </svg>
  )
}

function StarIcon({ filled }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1.5l1.8 3.6 4 .58-2.9 2.83.68 4-3.58-1.88L4.42 12.5l.68-4L2.2 5.68l4-.58L8 1.5z"
        fill={filled ? 'rgba(255,200,60,0.9)' : 'none'}
        stroke={filled ? 'rgba(255,200,60,0.9)' : 'currentColor'}
        strokeWidth="1.2" strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="10" height="10" viewBox="0 0 10 10" fill="none"
      style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 200ms ease' }}
    >
      <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function formatPath(p) {
  if (!p) return ''
  const parts = p.split(/[\\/]/)
  return parts[parts.length - 1] || p
}

function FolderItem({ path, label, isFav, onOpen, onToggleFav, addFavTitle, removeFavTitle }) {
  return (
    <div className={styles.itemRow}>
      <button className={styles.item} onClick={onOpen} title={path}>
        <FolderIcon />
        <span className={styles.itemLabel}>{label ?? formatPath(path)}</span>
      </button>
      <button
        className={`${styles.starBtn} ${isFav ? styles.starActive : ''}`}
        onClick={e => { e.stopPropagation(); onToggleFav(path) }}
        title={isFav ? removeFavTitle : addFavTitle}
      >
        <StarIcon filled={isFav} />
      </button>
    </div>
  )
}

// Collapsible section with label
function Section({ label, rightAction, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <button className={styles.labelBtn} onClick={() => setOpen(v => !v)}>
          <span>{label}</span>
          <ChevronIcon open={open} />
        </button>
        {rightAction}
      </div>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  )
}

export default function Sidebar({
  folder, subfolders, recent, favorites,
  albums, albumView,
  onOpenFolder, onGoUp, onOpenDialog, onOpenSettings, onToggleFavorite,
  onOpenAlbum, onDeleteAlbum, onCreateAlbum,
  trashCount = 0, onOpenTrash, onOpenPrivate,
}) {
  const t           = useLang()
  const favSet      = new Set(favorites ?? [])
  const albumList   = Object.values(albums ?? {})
  const [newAlbumInput, setNewAlbumInput] = useState(false)
  const [newAlbumName, setNewAlbumName]   = useState('')

  const handleCreateAlbum = () => {
    const name = newAlbumName.trim()
    if (!name) return
    onCreateAlbum(name)
    setNewAlbumName('')
    setNewAlbumInput(false)
  }

  return (
    <aside className={styles.sidebar}>

      {/* Open folder button — always on top, no collapse */}
      <div className={styles.topSection}>
        <button className={styles.openBtn} onClick={onOpenDialog}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {t('openFolder')}
        </button>
      </div>

      {/* ── Favorites (top) ── */}
      {favorites?.length > 0 && (
        <Section label={t('favoritesSec')} defaultOpen={true}>
          <div className={styles.list}>
            {favorites.map(p => (
              <FolderItem
                key={p} path={p} isFav={true}
                onOpen={() => onOpenFolder(p)}
                onToggleFav={onToggleFavorite}
                addFavTitle={t('addToFav')}
                removeFavTitle={t('removeFromFav')}
              />
            ))}
          </div>
        </Section>
      )}

      {/* ── Albums ── */}
      <Section
        label={t('albumsSec')}
        rightAction={
          <button
            className={styles.sectionAddBtn}
            onClick={e => { e.stopPropagation(); setNewAlbumInput(v => !v); setNewAlbumName('') }}
            title={t('newAlbum')}
          >+</button>
        }
        defaultOpen={true}
      >
        {newAlbumInput && (
          <div className={styles.newAlbumRow}>
            <input
              autoFocus
              className={styles.newAlbumInput}
              type="text"
              placeholder={t('albumNamePlaceholder')}
              value={newAlbumName}
              onChange={e => setNewAlbumName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateAlbum()
                if (e.key === 'Escape') { setNewAlbumInput(false); setNewAlbumName('') }
              }}
              maxLength={48}
            />
            <button className={styles.newAlbumConfirm} onClick={handleCreateAlbum} disabled={!newAlbumName.trim()}>✓</button>
          </div>
        )}
        {albumList.length === 0 && !newAlbumInput && (
          <div className={styles.emptyHint}>{t('noAlbums')}</div>
        )}
        <div className={styles.list}>
          {albumList.map(album => (
            <div key={album.id} className={styles.itemRow}>
              <button
                className={`${styles.item} ${albumView === album.id ? styles.itemActive : ''}`}
                onClick={() => onOpenAlbum(album.id)}
                title={`${album.name} (${album.images.length})`}
              >
                <AlbumIcon />
                <span className={styles.itemLabel}>{album.name}</span>
                <span className={styles.albumCountBadge}>{album.images.length}</span>
              </button>
              <button
                className={styles.deleteBtn}
                onClick={e => { e.stopPropagation(); onDeleteAlbum(album.id) }}
                title={t('deleteAlbum')}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Current folder ── */}
      {folder && (
        <Section label={t('currentFolder')} defaultOpen={true}>
          <div className={styles.currentFolder} title={folder}>
            <FolderIcon />
            <span>{formatPath(folder)}</span>
            <button
              className={`${styles.starBtn} ${favSet.has(folder) ? styles.starActive : ''}`}
              onClick={() => onToggleFavorite(folder)}
              title={favSet.has(folder) ? t('removeFromFav') : t('addToFav')}
            >
              <StarIcon filled={favSet.has(folder)} />
            </button>
          </div>
          <button className={styles.item} onClick={onGoUp}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 10V2M2 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('parentFolder')}
          </button>

          {subfolders.length > 0 && (
            <Section label={t('subfoldersSec')} defaultOpen={true}>
              <div className={styles.list}>
                {subfolders.map(sf => (
                  <FolderItem
                    key={sf.path} path={sf.path} label={sf.name}
                    isFav={favSet.has(sf.path)}
                    onOpen={() => onOpenFolder(sf.path)}
                    onToggleFav={onToggleFavorite}
                    addFavTitle={t('addToFav')}
                    removeFavTitle={t('removeFromFav')}
                  />
                ))}
              </div>
            </Section>
          )}
        </Section>
      )}

      {/* ── Recent ── */}
      {recent.filter(r => r !== folder).slice(0, 6).length > 0 && (
        <Section label={t('recentSec')} defaultOpen={true}>
          <div className={styles.list}>
            {recent.filter(r => r !== folder).slice(0, 6).map(r => (
              <FolderItem
                key={r} path={r} isFav={favSet.has(r)}
                onOpen={() => onOpenFolder(r)}
                onToggleFav={onToggleFavorite}
                addFavTitle={t('addToFav')}
                removeFavTitle={t('removeFromFav')}
              />
            ))}
          </div>
        </Section>
      )}

      <div className={styles.bottom}>
        <button className={styles.settingsBtn} onClick={onOpenPrivate}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"
              stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t('pvTitle')}
        </button>
        <button className={styles.settingsBtn} onClick={onOpenTrash}>
          <TrashIcon />
          {t('trash')}
          {trashCount > 0 && <span className={styles.trashBadge}>{trashCount}</span>}
        </button>
        <button className={styles.settingsBtn} onClick={onOpenSettings}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M6.5 1.5l-.5 1.5a5 5 0 00-1.2.7L3 3.2l-1.5 2.6 1.2 1a5.1 5.1 0 000 1.4l-1.2 1L3 11.8l1.8-.5a5 5 0 001.2.7l.5 1.5h3l.5-1.5a5 5 0 001.2-.7l1.8.5 1.5-2.6-1.2-1a5.1 5.1 0 000-1.4l1.2-1L13 3.2l-1.8.5A5 5 0 0010 3L9.5 1.5h-3z"
              stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25"/>
          </svg>
          {t('settingsBtn')}
        </button>
      </div>
    </aside>
  )
}
