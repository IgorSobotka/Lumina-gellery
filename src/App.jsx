import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'
import Gallery from './components/Gallery'
import Lightbox from './components/Lightbox'
import Welcome from './components/Welcome'
import Settings from './components/Settings/Settings'
import { WALLPAPERS, DEFAULT_WALLPAPER } from './constants/wallpapers'
import { loadTags, saveTags, allTags as getAllTags } from './utils/tags'
import { loadEdits, saveEdits } from './utils/edits'
import {
  loadAlbums, saveAlbums, createAlbum as mkAlbum, deleteAlbum as rmAlbum,
  addImageToAlbum as addToAlbum, removeImageFromAlbum as rmFromAlbum,
} from './utils/albums'
import AlbumPicker from './components/AlbumPicker'
import TrashView from './components/TrashView'
import { loadTrash, saveTrash } from './utils/trash'
import { LangContext } from './i18n/index'
import styles from './App.module.css'

const RECENT_KEY     = 'lumina_recent_folders'
const SETTINGS_KEY   = 'lumina_settings'
const FAVORITES_KEY  = 'lumina_favorites'

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

function loadSettings() {
  try { return { wallpaper: DEFAULT_WALLPAPER, language: 'pl', ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } }
  catch { return { wallpaper: DEFAULT_WALLPAPER, language: 'pl' } }
}

function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

function saveRecent(folders) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(folders.slice(0, 10)))
}

function loadFavorites() {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') } catch { return [] }
}

function saveFavorites(favs) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs))
}

export default function App() {
  const [folder, setFolder] = useState(null)
  const [images, setImages] = useState([])
  const [subfolders, setSubfolders] = useState([])
  const [loading, setLoading] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [gridSize, setGridSize] = useState('medium') // small | medium | large
  const [sortBy, setSortBy] = useState('name') // name | date | size | type
  const [viewMode, setViewMode] = useState('grid') // grid | list
  const [search, setSearch] = useState('')
  const [recent, setRecent] = useState(loadRecent)
  const [showSubfolders, setShowSubfolders] = useState(true)
  const [settings, setSettings] = useState(loadSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [navHistory, setNavHistory] = useState([]) // back stack
  const [navFuture,  setNavFuture]  = useState([]) // forward stack
  const [favorites,  setFavorites]  = useState(loadFavorites)
  const [tags,       setTags]       = useState(loadTags)
  const [tagFilter,  setTagFilter]  = useState([])
  const [albums,     setAlbums]     = useState(loadAlbums)
  const [albumView,  setAlbumView]  = useState(null)
  const [albumPickerImg, setAlbumPickerImg] = useState(null)
  const [edits,      setEdits]      = useState(loadEdits)
  const [selected,   setSelected]   = useState(new Set())
  const [trash,      setTrash]      = useState(loadTrash)
  const [trashView,  setTrashView]  = useState(false)

  // Ref so callbacks always read the latest folder without re-creating
  const folderRef = useRef(null)

  const handleSettingsChange = useCallback((next) => {
    setSettings(next)
    saveSettings(next)
  }, [])

  // Pure data loader — does NOT touch history stacks
  const loadFolder = useCallback(async (path) => {
    if (!path) return
    setLoading(true)
    setSearch('')
    setFolder(path)
    folderRef.current = path

    const [imgRes, subRes] = await Promise.all([
      window.api.getImages(path),
      window.api.getSubfolders(path),
    ])

    setImages(imgRes.success ? imgRes.images : [])
    setSubfolders(subRes.success ? subRes.folders : [])
    setLoading(false)

    setRecent(prev => {
      const next = [path, ...prev.filter(r => r !== path)]
      saveRecent(next)
      return next
    })
  }, [])

  // Normal navigation — pushes to back stack, clears forward stack
  const openFolder = useCallback(async (path) => {
    if (!path) return
    setAlbumView(null)
    setTrashView(false)
    const cur = folderRef.current
    if (cur) setNavHistory(h => [...h, cur])
    setNavFuture([])
    await loadFolder(path)
  }, [loadFolder])

  const goBack = useCallback(async () => {
    setNavHistory(h => {
      if (!h.length) return h
      const prev = h[h.length - 1]
      const cur  = folderRef.current
      if (cur) setNavFuture(f => [cur, ...f])
      loadFolder(prev)
      return h.slice(0, -1)
    })
  }, [loadFolder])

  const goForward = useCallback(async () => {
    setNavFuture(f => {
      if (!f.length) return f
      const next = f[0]
      const cur  = folderRef.current
      if (cur) setNavHistory(h => [...h, cur])
      loadFolder(next)
      return f.slice(1)
    })
  }, [loadFolder])

  const setImageEdit = useCallback((imagePath, editState) => {
    setEdits(prev => {
      const next = { ...prev, [imagePath]: editState }
      saveEdits(next)
      return next
    })
  }, [])

  const setImageTags = useCallback((imagePath, newTags) => {
    setTags(prev => {
      const next = { ...prev, [imagePath]: newTags }
      saveTags(next)
      return next
    })
  }, [])

  const openAlbum = useCallback((albumId) => {
    const album = albums[albumId]
    if (!album) return
    setImages(album.images)
    setFolder(null)
    setSubfolders([])
    setAlbumView(albumId)
    setSearch('')
    setTagFilter([])
    setNavHistory([])
    setNavFuture([])
    setLoading(false)
  }, [albums])

  const handleAddToAlbum = useCallback((albumId, img) => {
    setAlbums(prev => addToAlbum(prev, albumId, img))
    // if currently viewing this album, refresh images
    setAlbumView(cur => {
      if (cur === albumId) {
        setImages(prev => {
          if (prev.some(i => i.path === img.path)) return prev
          return [...prev, img]
        })
      }
      return cur
    })
  }, [])

  const handleCreateAlbum = useCallback((name) => {
    let newId = null
    setAlbums(prev => {
      const next = mkAlbum(prev, name)
      // find the new id
      newId = Object.keys(next).find(k => !prev[k])
      return next
    })
    return newId
  }, [])

  const handleRemoveFromAlbum = useCallback((imgPath) => {
    if (!albumView) return
    setAlbums(prev => {
      const next = rmFromAlbum(prev, albumView, imgPath)
      saveAlbums(next)
      return next
    })
    setImages(prev => prev.filter(i => i.path !== imgPath))
  }, [albumView])

  const handleDeleteAlbum = useCallback((albumId) => {
    setAlbums(prev => rmAlbum(prev, albumId))
    setAlbumView(cur => {
      if (cur === albumId) {
        setImages([])
        setFolder(null)
        return null
      }
      return cur
    })
  }, [])

  const handleTrashFiles = useCallback(async (paths) => {
    const results = await window.api.trashFiles(paths)
    if (results.length > 0) {
      setTrash(prev => { const next = [...prev, ...results]; saveTrash(next); return next })
      setSelected(new Set())
      if (folderRef.current) loadFolder(folderRef.current)
    }
  }, [loadFolder])

  const handleRestoreFiles = useCallback(async (items) => {
    await window.api.restoreFiles(items)
    setTrash(prev => {
      const ids = new Set(items.map(i => i.id))
      const next = prev.filter(i => !ids.has(i.id))
      saveTrash(next)
      return next
    })
  }, [])

  const handleEmptyTrash = useCallback(async () => {
    await window.api.emptyTrash(trash.map(i => i.trashedPath))
    setTrash([])
    saveTrash([])
  }, [trash])

  const toggleFavorite = useCallback((path) => {
    setFavorites(prev => {
      const next = prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
      saveFavorites(next)
      return next
    })
  }, [])

  const handleOpenDialog = useCallback(async () => {
    const path = await window.api.selectFolder()
    if (path) openFolder(path)
  }, [openFolder])

  const handleGoUp = useCallback(async () => {
    const cur = folderRef.current
    if (!cur) return
    const parent = await window.api.getParentFolder(cur)
    if (parent) openFolder(parent)
  }, [openFolder])

  const filteredImages = useMemo(() =>
    images
      .filter(img => {
        if (search && !img.name.toLowerCase().includes(search.toLowerCase())) return false
        if (tagFilter.length > 0) {
          const imgTags = tags[img.path] ?? []
          if (!tagFilter.every(t => imgTags.includes(t))) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        if (sortBy === 'date') return b.mtime - a.mtime
        if (sortBy === 'size') return b.size - a.size
        if (sortBy === 'type') return (a.isVideo === b.isVideo) ? a.name.localeCompare(b.name) : (a.isVideo ? 1 : -1)
        return 0
      }),
    [images, search, sortBy, tags, tagFilter]
  )

  const availableTags = useMemo(() => getAllTags(tags), [tags])

  const selectAll = useCallback(() => {
    setSelected(new Set(filteredImages.map(img => img.path)))
  }, [filteredImages])

  // Startup — open last or specific album
  useEffect(() => {
    const { openMode, openPath } = settings
    if (openMode === 'specific' && openPath) { loadFolder(openPath); return }
    if ((openMode === 'last' || !openMode) && recent.length > 0) loadFolder(recent[0])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally runs once on mount

  // Keyboard navigation in lightbox
  useEffect(() => {
    const handler = (e) => {
      if (lightboxIndex === null) return
      if (e.key === 'ArrowRight') setLightboxIndex(i => Math.min(i + 1, filteredImages.length - 1))
      if (e.key === 'ArrowLeft') setLightboxIndex(i => Math.max(i - 1, 0))
      if (e.key === 'Escape') setLightboxIndex(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIndex, filteredImages.length])

  // Mouse side buttons — back (3) / forward (4)
  useEffect(() => {
    const handler = (e) => {
      if (e.button === 3) { e.preventDefault(); goBack() }
      if (e.button === 4) { e.preventDefault(); goForward() }
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [goBack, goForward])

  // Drag and drop folder
  useEffect(() => {
    const onDrop = (e) => {
      e.preventDefault()
      const item = e.dataTransfer.items[0]
      if (item?.kind === 'file') {
        const file = item.getAsFile()
        const p = file.path
        if (p) openFolder(p)
      }
    }
    const onDragover = (e) => e.preventDefault()
    window.addEventListener('drop', onDrop)
    window.addEventListener('dragover', onDragover)
    return () => {
      window.removeEventListener('drop', onDrop)
      window.removeEventListener('dragover', onDragover)
    }
  }, [openFolder])

  const isCustom = settings.wallpaper === 'custom' && settings.customWallpaperPath
  const blurPx   = settings.wallpaperBlur ?? 0

  const bgStyle = isCustom
    ? {
        backgroundImage: `url("gallery://img?p=${encodeURIComponent(settings.customWallpaperPath)}")`,
        filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
      }
    : {
        background: (WALLPAPERS[settings.wallpaper]?.background ?? WALLPAPERS[DEFAULT_WALLPAPER].background)
          .replace(/\s+/g, ' ').trim(),
        filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
      }

  const isVibrancy = window.api?.platform === 'darwin'

  return (
    <LangContext.Provider value={settings.language ?? 'pl'}>
    <div className={`${styles.app}${isVibrancy ? ' ' + styles.vibrancy : ''}`}>

      {!isVibrancy && <div className={styles.bg} style={bgStyle} />}
      <TitleBar folder={folder} />
      <div className={styles.body}>
        <Sidebar
          folder={folder}
          subfolders={subfolders}
          recent={recent}
          favorites={favorites}
          albums={albums}
          albumView={albumView}
          onOpenFolder={openFolder}
          onGoUp={handleGoUp}
          onOpenDialog={handleOpenDialog}
          onOpenSettings={() => setSettingsOpen(true)}
          onToggleFavorite={toggleFavorite}
          onOpenAlbum={openAlbum}
          onDeleteAlbum={handleDeleteAlbum}
          onCreateAlbum={handleCreateAlbum}
          trashCount={trash.length}
          onOpenTrash={() => { setTrashView(true); setAlbumView(null); setFolder(null) }}
        />
        <div className={styles.main}>
          {trashView ? (
            <TrashView
              items={trash}
              onRestore={handleRestoreFiles}
              onEmpty={handleEmptyTrash}
            />
          ) : (folder || albumView) ? (
            <>
              <Toolbar
                folder={folder}
                albumName={albumView ? albums[albumView]?.name : null}
                count={filteredImages.length}
                total={images.length}
                gridSize={gridSize}
                onGridSize={setGridSize}
                sortBy={sortBy}
                onSort={setSortBy}
                search={search}
                onSearch={setSearch}
                showSubfolders={showSubfolders}
                onToggleSubfolders={() => setShowSubfolders(v => !v)}
                subfolderCount={subfolders.length}
                availableTags={availableTags}
                tagFilter={tagFilter}
                onTagFilter={setTagFilter}
                viewMode={viewMode}
                onViewMode={setViewMode}
              />
              <Gallery
                images={filteredImages}
                subfolders={albumView ? [] : subfolders}
                showSubfolders={albumView ? false : showSubfolders}
                loading={loading}
                gridSize={gridSize}
                onSelect={(i) => { setSelected(new Set()); setLightboxIndex(i) }}
                onOpenFolder={openFolder}
                tags={tags}
                onAddToAlbum={setAlbumPickerImg}
                selected={selected}
                onToggleSelect={(path) => setSelected(prev => {
                  const next = new Set(prev)
                  next.has(path) ? next.delete(path) : next.add(path)
                  return next
                })}
                onClearSelect={() => setSelected(new Set())}
                onAfterDelete={() => { if (folder) loadFolder(folder) }}
                edits={edits}
                albumView={albumView}
                onRemoveFromAlbum={albumView ? handleRemoveFromAlbum : null}
                viewMode={viewMode}
                onSelectAll={selectAll}
                onTrashFiles={handleTrashFiles}
              />
            </>
          ) : (
            <Welcome onOpenDialog={handleOpenDialog} recent={recent} onOpenFolder={openFolder} />
          )}

        </div>
      </div>

      {settingsOpen && (
        <Settings
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {albumPickerImg && (
        <AlbumPicker
          img={albumPickerImg}
          albums={albums}
          onAdd={handleAddToAlbum}
          onCreateAndAdd={(name, img) => {
            setAlbums(prev => {
              const withAlbum = mkAlbum(prev, name)
              const newId = Object.keys(withAlbum).find(k => !prev[k])
              return addToAlbum(withAlbum, newId, img)
            })
          }}
          onClose={() => setAlbumPickerImg(null)}
        />
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={filteredImages}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex(i => Math.max(i - 1, 0))}
          onNext={() => setLightboxIndex(i => Math.min(i + 1, filteredImages.length - 1))}
          onChange={setLightboxIndex}
          tags={tags}
          onTagsChange={setImageTags}
          edits={edits}
          onEditChange={setImageEdit}
        />
      )}
    </div>
    </LangContext.Provider>
  )
}
