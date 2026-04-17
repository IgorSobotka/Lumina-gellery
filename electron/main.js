const { app, BrowserWindow, ipcMain, dialog, protocol, net, shell, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const { pathToFileURL } = require('url')

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.avif'])
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.wmv'])
const MEDIA_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS])
const isDev = process.env.VITE_DEV_SERVER_URL !== undefined

// ── Thumbnail cache helpers ──
function getCacheDir() {
  const dir = path.join(app.getPath('userData'), 'thumb-cache')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function thumbKey(filePath, mtime) {
  return crypto.createHash('md5').update(`${filePath}:${mtime}`).digest('hex')
}

const CACHE_MAX = 300 * 1024 * 1024
function evictCache(cacheDir) {
  try {
    const files = fs.readdirSync(cacheDir).map(f => {
      const fp = path.join(cacheDir, f)
      try { const st = fs.statSync(fp); return { fp, size: st.size, atime: st.atimeMs } } catch { return null }
    }).filter(Boolean)
    let total = files.reduce((s, f) => s + f.size, 0)
    if (total <= CACHE_MAX) return
    files.sort((a, b) => a.atime - b.atime)
    for (const f of files) {
      if (total <= CACHE_MAX * 0.8) break
      try { fs.unlinkSync(f.fp); total -= f.size } catch {}
    }
  } catch {}
}

async function generateThumb(filePath, mtime) {
  const cacheDir = getCacheDir()
  const key = thumbKey(filePath, mtime)
  const cachePath = path.join(cacheDir, key + '.jpg')
  if (fs.existsSync(cachePath)) {
    const buf = fs.readFileSync(cachePath)
    return 'data:image/jpeg;base64,' + buf.toString('base64')
  }
  const img = await nativeImage.createThumbnailFromPath(filePath, { width: 300, height: 300 })
  if (!img || img.isEmpty()) return null
  const buf = img.toJPEG(85)
  fs.writeFileSync(cachePath, buf)
  evictCache(cacheDir)
  return 'data:image/jpeg;base64,' + buf.toString('base64')
}

const _thumbQueue = []
let _activeCount = 0
const MAX_CONCURRENT = 4

function pumpThumbQueue() {
  while (_activeCount < MAX_CONCURRENT && _thumbQueue.length > 0) {
    const { filePath, mtime, resolve } = _thumbQueue.shift()
    _activeCount++
    generateThumb(filePath, mtime)
      .then(resolve)
      .catch(() => resolve(null))
      .finally(() => { _activeCount--; pumpThumbQueue() })
  }
}

protocol.registerSchemesAsPrivileged([
  { scheme: 'gallery', privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true, bypassCSP: true } }
])

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: process.platform === 'darwin' ? '#00000000' : '#0d0d0d',
    transparent: process.platform === 'darwin',
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined,
    visualEffectState: process.platform === 'darwin' ? 'active' : undefined,
    frame: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  })

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Window controls via IPC
  ipcMain.on('window-minimize', () => win.minimize())
  ipcMain.on('window-maximize', () => win.isMaximized() ? win.unmaximize() : win.maximize())
  ipcMain.on('window-close', () => win.close())

  win.on('maximize', () => win.webContents.send('window-maximized', true))
  win.on('unmaximize', () => win.webContents.send('window-maximized', false))
}

app.whenReady().then(() => {
  // ── Cache IPC ──
  ipcMain.handle('get-thumbnail', (_event, { filePath, mtime }) => {
    return new Promise(resolve => {
      _thumbQueue.push({ filePath, mtime, resolve })
      pumpThumbQueue()
    })
  })
  ipcMain.handle('get-cache-info', async () => {
    try {
      const cacheDir = getCacheDir()
      const files = fs.readdirSync(cacheDir)
      let size = 0
      for (const f of files) { try { size += fs.statSync(path.join(cacheDir, f)).size } catch {} }
      return { count: files.length, sizeBytes: size }
    } catch { return { count: 0, sizeBytes: 0 } }
  })
  ipcMain.handle('clear-cache', async () => {
    try {
      const cacheDir = getCacheDir()
      const files = fs.readdirSync(cacheDir)
      for (const f of files) { try { fs.unlinkSync(path.join(cacheDir, f)) } catch {} }
      return { success: true }
    } catch { return { success: false } }
  })

  const MIME_TYPES = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
    '.tiff': 'image/tiff', '.avif': 'image/avif',
    '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska', '.webm': 'video/webm', '.m4v': 'video/mp4',
    '.wmv': 'video/x-ms-wmv',
  }

  protocol.handle('gallery', (request) => {
    try {
      const url = new URL(request.url)
      const filePath = url.searchParams.get('p')
      if (!filePath) return new Response('Missing path', { status: 400 })

      const ext  = path.extname(filePath).toLowerCase()
      const mime = MIME_TYPES[ext] || 'application/octet-stream'
      const stat = fs.statSync(filePath)
      const total = stat.size
      const rangeHeader = request.headers.get('range')

      if (rangeHeader) {
        const m = rangeHeader.match(/bytes=(\d+)-(\d*)/)
        if (m) {
          const start = parseInt(m[1], 10)
          const end   = m[2] ? parseInt(m[2], 10) : total - 1
          return new Response(fs.createReadStream(filePath, { start, end }), {
            status: 206,
            headers: {
              'Content-Type':  mime,
              'Content-Range': `bytes ${start}-${end}/${total}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': String(end - start + 1),
            },
          })
        }
      }

      return new Response(fs.createReadStream(filePath), {
        status: 200,
        headers: {
          'Content-Type':   mime,
          'Accept-Ranges':  'bytes',
          'Content-Length': String(total),
        },
      })
    } catch (e) {
      return new Response(String(e), { status: 500 })
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// --- IPC Handlers ---

function getTrashDir() {
  const dir = path.join(app.getPath('userData'), 'lumina-trash')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function moveFile(src, dest) {
  try { fs.renameSync(src, dest) }
  catch (e) {
    if (e.code === 'EXDEV') { fs.copyFileSync(src, dest); fs.unlinkSync(src) }
    else throw e
  }
}

ipcMain.handle('delete-files', async (_event, paths) => {
  const failed = []
  for (const p of paths) {
    try { fs.unlinkSync(p) } catch { failed.push(p) }
  }
  return { success: failed.length === 0, failed }
})

ipcMain.handle('trash-files', async (_event, paths) => {
  const trashDir = getTrashDir()
  const results = []
  for (const filePath of paths) {
    try {
      const ext  = path.extname(filePath)
      const base = path.basename(filePath, ext)
      const dest = path.join(trashDir, `${base}_${Date.now()}${ext}`)
      moveFile(filePath, dest)
      const stat = fs.statSync(dest)
      results.push({
        id:           `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        originalPath: filePath,
        trashedPath:  dest,
        name:         path.basename(filePath),
        size:         stat.size,
        mtime:        stat.mtimeMs,
        ext:          ext.slice(1).toUpperCase(),
        isVideo:      VIDEO_EXTENSIONS.has(ext.toLowerCase()),
        url:          `gallery://img?p=${encodeURIComponent(dest)}`,
        trashedAt:    Date.now(),
      })
    } catch {}
  }
  return results
})

ipcMain.handle('restore-files', async (_event, items) => {
  const failed = []
  for (const item of items) {
    try { moveFile(item.trashedPath, item.originalPath) }
    catch { failed.push(item.id) }
  }
  return { success: failed.length === 0, failed }
})

ipcMain.handle('empty-trash', async (_event, trashedPaths) => {
  for (const p of trashedPaths) {
    try { if (fs.existsSync(p)) fs.unlinkSync(p) } catch {}
  }
  return { success: true }
})

ipcMain.handle('save-image-file', async (_event, { sourcePath, dataURL, mode, destDir }) => {
  try {
    const base64 = dataURL.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64, 'base64')
    const fmtMatch = dataURL.match(/^data:image\/(\w+);base64,/)
    const fmt    = fmtMatch ? fmtMatch[1] : 'jpeg'
    const outExt = fmt === 'png' ? '.png' : fmt === 'webp' ? '.webp' : '.jpg'

    if (mode === 'overwrite') {
      fs.writeFileSync(sourcePath, buffer)
      return { success: true, savedPath: sourcePath }
    }

    // save as copy — use destDir if provided, otherwise same folder as source
    const dir  = destDir || path.dirname(sourcePath)
    const base = path.basename(sourcePath, path.extname(sourcePath))
    let candidate = path.join(dir, `${base}_edit${outExt}`)
    let n = 2
    while (fs.existsSync(candidate)) {
      candidate = path.join(dir, `${base}_edit_${n}${outExt}`)
      n++
    }
    fs.writeFileSync(candidate, buffer)
    return { success: true, savedPath: candidate }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('get-images', async (_event, folderPath) => {
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true })
    const images = []

    for (const entry of entries) {
      if (!entry.isFile()) continue
      const ext = path.extname(entry.name).toLowerCase()
      if (!MEDIA_EXTENSIONS.has(ext)) continue

      const fullPath = path.join(folderPath, entry.name)
      const stat = fs.statSync(fullPath)
      images.push({
        name: entry.name,
        path: fullPath,
        url: `gallery://img?p=${encodeURIComponent(fullPath)}`,
        size: stat.size,
        mtime: stat.mtimeMs,
        ext: ext.slice(1).toUpperCase(),
        isVideo: VIDEO_EXTENSIONS.has(ext),
        width: 0,
        height: 0,
      })
    }

    return { success: true, images }
  } catch (err) {
    return { success: false, images: [], error: err.message }
  }
})

ipcMain.handle('get-subfolders', async (_event, folderPath) => {
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true })
    const folders = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => ({ name: e.name, path: path.join(folderPath, e.name) }))
    return { success: true, folders }
  } catch {
    return { success: false, folders: [] }
  }
})

ipcMain.handle('get-parent-folder', (_event, folderPath) => {
  const parent = path.dirname(folderPath)
  return parent !== folderPath ? parent : null
})

ipcMain.handle('get-folder-image-count', (_event, folderPath) => {
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true })
    const count = entries.filter(e => e.isFile() && MEDIA_EXTENSIONS.has(path.extname(e.name).toLowerCase())).length
    return count
  } catch { return 0 }
})

ipcMain.handle('get-folder-preview', async (_event, folderPath) => {
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true })
    const urls = []
    let count = 0
    for (const entry of entries) {
      if (!entry.isFile()) continue
      if (!MEDIA_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue
      count++
      if (urls.length < 3) {
        const fp = path.join(folderPath, entry.name)
        urls.push(`gallery://img?p=${encodeURIComponent(fp)}`)
      }
    }
    return { count, urls }
  } catch { return { count: 0, urls: [] } }
})

ipcMain.handle('open-file', (_event, filePath) => shell.openPath(filePath))
ipcMain.handle('show-in-explorer', (_event, filePath) => shell.showItemInFolder(filePath))

ipcMain.handle('get-exif', async (_event, filePath) => {
  try {
    const exifr = require('exifr')
    const data = await exifr.parse(filePath, {
      pick: [
        'Make','Model','LensModel','LensMake',
        'ExposureTime','FNumber','ISO','FocalLength','FocalLengthIn35mmFormat',
        'DateTimeOriginal','CreateDate',
        'GPSLatitude','GPSLongitude','GPSLatitudeRef','GPSLongitudeRef',
        'ImageWidth','ImageHeight','ExifImageWidth','ExifImageHeight',
        'Orientation','Flash','WhiteBalance','ExposureProgram','MeteringMode',
      ]
    })
    return { success: true, data: data || {} }
  } catch (e) {
    return { success: false, data: {} }
  }
})

ipcMain.handle('pick-wallpaper', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Wybierz tapetę',
    properties: ['openFile'],
    filters: [{ name: 'Obrazy', extensions: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'bmp'] }]
  })
  return result.canceled ? null : result.filePaths[0]
})
