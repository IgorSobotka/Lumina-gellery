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
import PrivateSpace from './components/PrivateSpace'
import DiskManager from './components/DiskManager'
import { loadTrash, saveTrash } from './utils/trash'
import { LangContext } from './i18n/index'
import { applyAccent } from './utils/accent'
import LightPillar from './components/LightPillar'
import CloudBrowser from './components/CloudBrowser'
import NameDialog from './components/NameDialog'
import BatchRenameDialog from './components/BatchRenameDialog'
import Slideshow from './components/Slideshow'
import CollageMaker from './components/CollageMaker'
import { loadAddons, saveAddons } from './utils/addons-state'
import { loadLabels, saveLabels } from './utils/labels'
import { EDITOR_PRESETS } from './utils/presets'
import styles from './App.module.css'

const RECENT_KEY     = 'lumina_recent_folders'
const SETTINGS_KEY   = 'lumina_settings'
const FAVORITES_KEY  = 'lumina_favorites'

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

function loadSettings() {
  try { return { wallpaper: DEFAULT_WALLPAPER, language: 'en', ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } }
  catch { return { wallpaper: DEFAULT_WALLPAPER, language: 'en' } }
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
  const [settings, setSettings] = useState(() => { const s = loadSettings(); applyAccent(s.accentColor, s.accentCustom); return s })
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
  const [trashView,   setTrashView]   = useState(false)
  const [privateView, setPrivateView] = useState(false)
  const [diskView,    setDiskView]    = useState(false)
  const [addons,      setAddons]      = useState(loadAddons)
  const [cloudProvider, setCloudProvider] = useState(null) // null or provider id string
  // null | { mode:'create', parentPath } | { mode:'rename', src, currentName, isDir }
  const [nameDialog,  setNameDialog]  = useState(null)
  const [nameDialogError, setNameDialogError] = useState(null)
  const [labels,      setLabels]      = useState(loadLabels)
  const [labelFilter, setLabelFilter] = useState(null)
  const [smartFilter, setSmartFilter] = useState({ orientation: null, type: null, sizeRange: null, dateRange: null })
  const [slideshow,   setSlideshow]   = useState(false)
  const [batchRenameOpen, setBatchRenameOpen] = useState(false)
  const [collageOpen, setCollageOpen] = useState(false)

  // Ref so callbacks always read the latest folder without re-creating
  const folderRef = useRef(null)

  const handleSettingsChange = useCallback((next) => {
    applyAccent(next.accentColor, next.accentCustom)
    setSettings(next)
    saveSettings(next)
  }, [])

  const handleAddonsChange = useCallback((next) => {
    setAddons(next)
    saveAddons(next)
    // Sync tokens to main process
    Object.entries(next).forEach(([id, data]) => {
      window.api.cloudSetToken?.(id, data?.token ?? null)
    })
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

  // ── Folder management ─────────────────────────────────────────────────────
  const handleCreateFolder = useCallback(() => {
    if (!folder) return
    setNameDialogError(null)
    setNameDialog({ mode: 'create', parentPath: folder })
  }, [folder])

  const handleCreateFolderConfirm = useCallback(async (name) => {
    if (!nameDialog?.parentPath) return
    const res = await window.api.createFolder(nameDialog.parentPath, name)
    if (res.success) {
      setNameDialog(null)
      if (folderRef.current) loadFolder(folderRef.current)
    } else {
      setNameDialogError(res.error === 'exists' ? null : res.error)
      if (res.error === 'exists') setNameDialogError('A folder with this name already exists.')
    }
  }, [nameDialog, loadFolder])

  const handleRenameFolder = useCallback((folderObj) => {
    setNameDialogError(null)
    setNameDialog({ mode: 'rename', src: folderObj.path, currentName: folderObj.name, isDir: true })
  }, [])

  const handleRenameConfirm = useCallback(async (newName) => {
    if (!nameDialog?.src) return
    const res = await window.api.renameItem(nameDialog.src, newName)
    if (res.success) {
      setNameDialog(null)
      if (folderRef.current) loadFolder(folderRef.current)
    } else {
      setNameDialogError(res.error === 'exists' ? 'A file or folder with this name already exists.' : res.error)
    }
  }, [nameDialog, loadFolder])

  const handleDeleteFolder = useCallback(async (folderPath) => {
    const res = await window.api.trashFolder(folderPath)
    if (res.success && folderRef.current) loadFolder(folderRef.current)
  }, [loadFolder])

  const handleMoveItems = useCallback(async (items, destPath) => {
    const res = await window.api.moveItems(items, destPath)
    setSelected(new Set())
    if (folderRef.current) loadFolder(folderRef.current)
    // if moved into a subfolder that's currently shown, reload won't show it — that's fine
  }, [loadFolder])

  const handleSetLabel = useCallback((imagePath, color) => {
    setLabels(prev => {
      const next = { ...prev }
      if (color === null) { delete next[imagePath] }
      else { next[imagePath] = color }
      saveLabels(next)
      return next
    })
  }, [])

  // On mount: restore cloud tokens to main process
  useEffect(() => {
    Object.entries(addons).forEach(([id, data]) => {
      if (data?.token) window.api.cloudSetToken?.(id, data.token)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Normal navigation — pushes to back stack, clears forward stack
  const openFolder = useCallback(async (path) => {
    if (!path) return
    setAlbumView(null)
    setTrashView(false)
    setPrivateView(false)
    setDiskView(false)
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

  const applyPreset = useCallback((imagePath, presetId) => {
    const preset = EDITOR_PRESETS.find(p => p.id === presetId)
    if (!preset || !imagePath) return
    setImageEdit(imagePath, preset.edit)
  }, [setImageEdit])

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
        if (labelFilter && labels[img.path] !== labelFilter) return false
        // Smart filter - orientation
        if (smartFilter.orientation) {
          const w = img.width ?? 0, h = img.height ?? 0
          if (smartFilter.orientation === 'landscape' && !(w > h)) return false
          if (smartFilter.orientation === 'portrait'  && !(h > w)) return false
          if (smartFilter.orientation === 'square'    && !(Math.abs(w - h) <= Math.max(w, h) * 0.1)) return false
        }
        // Smart filter - type
        if (smartFilter.type === 'photos' && img.isVideo) return false
        if (smartFilter.type === 'videos' && !img.isVideo) return false
        // Smart filter - size
        const SR = { tiny: [0, 500*1024], small: [500*1024, 2*1024*1024], medium: [2*1024*1024, 10*1024*1024], large: [10*1024*1024, Infinity] }
        if (smartFilter.sizeRange && SR[smartFilter.sizeRange]) {
          const [lo, hi] = SR[smartFilter.sizeRange]
          if (img.size < lo || img.size >= hi) return false
        }
        // Smart filter - date
        const DR = { today: 86400000, thisweek: 7*86400000, thismonth: 30*86400000, thisyear: 365*86400000 }
        if (smartFilter.dateRange && DR[smartFilter.dateRange]) {
          if (Date.now() - img.mtime > DR[smartFilter.dateRange]) return false
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
    [images, search, sortBy, tags, tagFilter, labelFilter, labels, smartFilter]
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
  const activeWp = WALLPAPERS[settings.wallpaper] ?? WALLPAPERS[DEFAULT_WALLPAPER]
  const isPillar  = activeWp?.type === 'pillar'

  const bgStyle = isPillar
    ? undefined
    : isCustom
      ? {
          backgroundImage: `url("gallery://img?p=${encodeURIComponent(settings.customWallpaperPath)}")`,
          filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
        }
      : {
          background: (activeWp.background ?? WALLPAPERS[DEFAULT_WALLPAPER].background)
            .replace(/\s+/g, ' ').trim(),
          filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
        }

  const isVibrancy = window.api?.platform === 'darwin'

  return (
    <LangContext.Provider value={settings.language ?? 'en'}>
    <div className={`${styles.app}${isVibrancy ? ' ' + styles.vibrancy : ''}`}>

      {!isVibrancy && !isPillar && <div className={styles.bg} style={bgStyle} />}
      {!isVibrancy && isPillar && (
        <>
          <div className={styles.pillarBg}>
            <LightPillar
              topColor={activeWp.topColor}
              bottomColor={activeWp.bottomColor}
              pillarWidth={activeWp.pillarWidth ?? 3.0}
              glowAmount={activeWp.glowAmount ?? 0.005}
              intensity={1.0}
              rotationSpeed={0.3}
              mixBlendMode="normal"
              quality="high"
            />
          </div>
          <div className={styles.pillarVeil} />
        </>
      )}
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
          onOpenTrash={() => { setTrashView(true); setPrivateView(false); setDiskView(false); setAlbumView(null); setFolder(null) }}
          onOpenPrivate={() => { setPrivateView(true); setTrashView(false); setDiskView(false); setAlbumView(null) }}
          onOpenDisk={() => { setDiskView(true); setTrashView(false); setPrivateView(false); setAlbumView(null) }}
          addons={addons}
          onOpenCloud={(provider) => setCloudProvider(provider)}
        />
        <div className={styles.main}>
          {privateView ? (
            <PrivateSpace />
          ) : diskView ? (
            <DiskManager folder={folder} />
          ) : trashView ? (
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
                labelFilter={labelFilter}
                onLabelFilter={setLabelFilter}
                onSlideshow={filteredImages.length > 0 ? () => setSlideshow(true) : null}
                smartFilter={smartFilter}
                onSmartFilter={setSmartFilter}
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
                onMoveItems={!albumView ? handleMoveItems : null}
                onCreateFolder={!albumView && folder ? handleCreateFolder : null}
                onRenameFolder={!albumView ? handleRenameFolder : null}
                onDeleteFolder={!albumView ? handleDeleteFolder : null}
                labels={labels}
                onSetLabel={handleSetLabel}
                onBatchRename={selected.size > 0 ? () => setBatchRenameOpen(true) : null}
                onSlideshow={filteredImages.length > 0 ? () => setSlideshow(true) : null}
                onCollage={selected.size >= 2 ? () => setCollageOpen(true) : null}
                onApplyPreset={applyPreset}
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
          addons={addons}
          onAddonsChange={handleAddonsChange}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {cloudProvider && addons[cloudProvider] && (
        <CloudBrowser
          provider={cloudProvider}
          addonState={addons[cloudProvider]}
          onClose={() => setCloudProvider(null)}
        />
      )}

      {nameDialog && (
        <NameDialog
          mode={nameDialog.mode}
          initialValue={nameDialog.mode === 'rename' ? nameDialog.currentName : ''}
          onConfirm={nameDialog.mode === 'create' ? handleCreateFolderConfirm : handleRenameConfirm}
          onClose={() => { setNameDialog(null); setNameDialogError(null) }}
          error={nameDialogError}
        />
      )}

      {collageOpen && selected.size >= 2 && (
        <CollageMaker
          images={filteredImages.filter(img => selected.has(img.path) && !img.isVideo)}
          onClose={() => setCollageOpen(false)}
        />
      )}

      {slideshow && filteredImages.length > 0 && (
        <Slideshow
          images={filteredImages.filter(img => !img.isVideo)}
          startIndex={0}
          onClose={() => setSlideshow(false)}
        />
      )}

      {batchRenameOpen && selected.size > 0 && (
        <BatchRenameDialog
          images={filteredImages.filter(img => selected.has(img.path))}
          onClose={() => setBatchRenameOpen(false)}
          onDone={() => { setBatchRenameOpen(false); setSelected(new Set()); if (folder) loadFolder(folder) }}
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
