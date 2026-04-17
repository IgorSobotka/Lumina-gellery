import { useState, useEffect, useRef } from 'react'
import { useLang } from '../i18n/index'
import styles from './AlbumPicker.module.css'

export default function AlbumPicker({ img, albums, onAdd, onCreateAndAdd, onClose }) {
  const t = useLang()
  const [newName, setNewName] = useState('')
  const inputRef = useRef(null)
  const albumList = Object.values(albums)

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) return
    onCreateAndAdd(name, img)
    setNewName('')
    onClose()
  }

  const handleAdd = (albumId) => {
    onAdd(albumId, img)
    onClose()
  }

  const isInAlbum = (album) => album.images.some(i => i.path === img.path)

  return (
    <div className={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.title}>{t('addToAlbum')}</div>
          <div className={styles.imgName}>{img.name}</div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Existing albums */}
        {albumList.length > 0 && (
          <div className={styles.albumList}>
            {albumList.map(album => {
              const already = isInAlbum(album)
              return (
                <button
                  key={album.id}
                  className={`${styles.albumRow} ${already ? styles.already : ''}`}
                  onClick={() => !already && handleAdd(album.id)}
                  disabled={already}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <rect x="1.5" y="3.5" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M5 3.5V2M11 3.5V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  <span className={styles.albumName}>{album.name}</span>
                  <span className={styles.albumCount}>{album.images.length}</span>
                  {already && <span className={styles.alreadyBadge}>{t('alreadyInAlbum')}</span>}
                </button>
              )
            })}
          </div>
        )}

        {albumList.length === 0 && (
          <div className={styles.noAlbums}>{t('noAlbums')}</div>
        )}

        {/* Create new album */}
        <div className={styles.divider} />
        <div className={styles.createRow}>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder={t('albumNamePlaceholder')}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
            maxLength={48}
          />
          <button
            className={styles.createBtn}
            onClick={handleCreate}
            disabled={!newName.trim()}
          >
            {t('createAndAdd')}
          </button>
        </div>
      </div>
    </div>
  )
}
