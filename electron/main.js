const { app, BrowserWindow, ipcMain, dialog, protocol, net, shell, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')
const http = require('http')
const crypto = require('crypto')
const { execSync, exec } = require('child_process')
const { pathToFileURL } = require('url')

// ── Dropbox OAuth helpers ─────────────────────────────────────────────────────
const OAUTH_PORT = 39412   // localhost port for OAuth redirect
const OAUTH_REDIRECT = `http://localhost:${OAUTH_PORT}/callback`

function pkceVerifier() {
  return crypto.randomBytes(48).toString('base64url')
}
function pkceChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

function isElevated() {
  if (process.platform !== 'win32') return process.getuid ? process.getuid() === 0 : true
  try { execSync('net session', { stdio: 'pipe', timeout: 3000 }); return true } catch { return false }
}

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
const MAX_CONCURRENT = 8

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

// ── Folder preview in-memory cache (LRU) ──
const FOLDER_CACHE_MAX = 1000
const _folderCache = new Map()

function getFolderCache(folderPath) {
  const entry = _folderCache.get(folderPath)
  if (!entry) return null
  let mtime
  try { mtime = fs.statSync(folderPath).mtimeMs }
  catch { _folderCache.delete(folderPath); return null }
  if (mtime !== entry.mtime) { _folderCache.delete(folderPath); return null }
  _folderCache.delete(folderPath); _folderCache.set(folderPath, entry)
  return entry
}

function setFolderCache(folderPath, entry) {
  if (_folderCache.has(folderPath)) _folderCache.delete(folderPath)
  _folderCache.set(folderPath, entry)
  if (_folderCache.size > FOLDER_CACHE_MAX) {
    _folderCache.delete(_folderCache.keys().next().value)
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

  // ── Cloud token store (in-memory, restored from renderer on app start) ──
  const _cloudTokens = new Map() // provider -> token

  protocol.handle('gallery', async (request) => {
    try {
      const url = new URL(request.url)

      // ── Cloud image route: gallery://cloud?provider=dropbox&path=/photo.jpg ──
      if (url.hostname === 'cloud') {
        const provider  = url.searchParams.get('provider')
        const cloudPath = url.searchParams.get('path')
        const token     = _cloudTokens.get(provider)
        if (!token || !cloudPath) return new Response('Missing cloud params', { status: 400 })

        if (provider === 'dropbox') {
          const res = await net.fetch('https://content.dropboxapi.com/2/files/download', {
            method: 'POST',
            headers: {
              'Authorization':    `Bearer ${token}`,
              'Dropbox-API-Arg':  JSON.stringify({ path: cloudPath }),
              'Content-Type':     '',
            }
          })
          if (!res.ok) return new Response('Dropbox error', { status: 502 })
          const ct = res.headers.get('content-type') || 'image/jpeg'
          return new Response(res.body, { headers: { 'Content-Type': ct } })
        }
        return new Response('Unknown provider', { status: 400 })
      }

      // ── Local image route: gallery://img?p=/path/to/file ──
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

  // ── Cloud OAuth ──
  ipcMain.handle('cloud-oauth-start', (_event, { provider, appKey }) => {
    return new Promise((resolve) => {
      if (provider !== 'dropbox') return resolve({ success: false, error: 'Unknown provider' })
      if (!appKey || !appKey.trim()) return resolve({ success: false, error: 'No App Key provided' })

      const verifier  = pkceVerifier()
      const challenge = pkceChallenge(verifier)
      let settled     = false
      let server      = null
      let authWin     = null

      function finish(result) {
        if (settled) return
        settled = true
        try { server?.close() } catch {}
        try { if (authWin && !authWin.isDestroyed()) authWin.close() } catch {}
        resolve(result)
      }

      // Temporary HTTP server to catch the OAuth redirect
      server = http.createServer(async (req, res) => {
        try {
          const reqUrl = new URL(req.url, `http://localhost:${OAUTH_PORT}`)
          const code   = reqUrl.searchParams.get('code')
          const error  = reqUrl.searchParams.get('error')

          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(`<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{font-family:-apple-system,sans-serif;background:#0d0820;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:12px}
h2{margin:0;font-size:20px}p{margin:0;opacity:.6;font-size:14px}</style></head>
<body><h2>${error ? '✕ Anulowano' : '✓ Połączono z Dropboxem!'}</h2>
<p>${error ? 'Możesz zamknąć to okno.' : 'Wróć do Lumina.'}</p>
<script>setTimeout(()=>window.close(),1800)</script></body></html>`)

          if (error || !code) { finish({ success: false, error: error || 'No code' }); return }

          // Exchange code → access token (PKCE — no secret needed)
          const tokenRes = await net.fetch('https://api.dropboxapi.com/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              code,
              grant_type:    'authorization_code',
              redirect_uri:  OAUTH_REDIRECT,
              client_id:     appKey.trim(),
              code_verifier: verifier,
            }).toString(),
          })
          const tokenData = await tokenRes.json()
          if (!tokenRes.ok || !tokenData.access_token) {
            finish({ success: false, error: tokenData.error_description || tokenData.error || 'Token exchange failed' })
            return
          }

          // Fetch account name
          let accountName = 'Dropbox'
          try {
            const accRes  = await net.fetch('https://api.dropboxapi.com/2/users/get_current_account', {
              method:  'POST',
              headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' },
              body:    'null',
            })
            const accData = await accRes.json()
            accountName   = accData.name?.display_name || accData.email || 'Dropbox'
          } catch {}

          finish({
            success:      true,
            accessToken:  tokenData.access_token,
            refreshToken: tokenData.refresh_token ?? null,
            accountName,
          })
        } catch (e) {
          finish({ success: false, error: e.message })
        }
      })

      server.on('error', (e) => finish({ success: false, error: e.message }))

      server.listen(OAUTH_PORT, '127.0.0.1', () => {
        const authUrl =
          `https://www.dropbox.com/oauth2/authorize` +
          `?client_id=${encodeURIComponent(appKey.trim())}` +
          `&response_type=code` +
          `&token_access_type=offline` +
          `&redirect_uri=${encodeURIComponent(OAUTH_REDIRECT)}` +
          `&code_challenge=${encodeURIComponent(challenge)}` +
          `&code_challenge_method=S256`

        authWin = new BrowserWindow({
          width:              500,
          height:             700,
          title:              'Zaloguj się do Dropbox',
          autoHideMenuBar:    true,
          backgroundColor:    '#1a1a1a',
          webPreferences:     { nodeIntegration: false, contextIsolation: true },
          parent:             BrowserWindow.getAllWindows()[0] ?? undefined,
        })
        authWin.loadURL(authUrl)
        authWin.on('closed', () => finish({ success: false, error: 'Zamknięto okno logowania' }))
      })
    })
  })

  // Refresh an existing Dropbox token using the refresh_token
  ipcMain.handle('cloud-refresh-token', async (_event, { provider, appKey, refreshToken }) => {
    if (provider !== 'dropbox' || !refreshToken || !appKey) return { success: false }
    try {
      const res  = await net.fetch('https://api.dropboxapi.com/oauth2/token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams({
          grant_type:    'refresh_token',
          refresh_token: refreshToken,
          client_id:     appKey.trim(),
        }).toString(),
      })
      const data = await res.json()
      if (data.access_token) return { success: true, accessToken: data.access_token }
      return { success: false }
    } catch { return { success: false } }
  })

  // ── Cloud storage IPC ──
  ipcMain.handle('cloud-set-token', (_event, { provider, token }) => {
    if (token) _cloudTokens.set(provider, token)
    else _cloudTokens.delete(provider)
    return true
  })

  ipcMain.handle('cloud-test-token', async (_event, { provider, token }) => {
    if (provider === 'dropbox') {
      try {
        const res = await net.fetch('https://api.dropboxapi.com/2/users/get_current_account', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: 'null',
        })
        if (!res.ok) return { success: false, error: 'Invalid token — check it at dropbox.com/developers/apps' }
        const data = await res.json()
        return { success: true, accountName: data.name?.display_name || data.email || 'Dropbox' }
      } catch (e) {
        return { success: false, error: e.message }
      }
    }
    return { success: false, error: 'Unknown provider' }
  })

  ipcMain.handle('cloud-list-folder', async (_event, { provider, path: folderPath }) => {
    const token = _cloudTokens.get(provider)
    if (!token) return { success: false, error: 'Not connected' }
    if (provider === 'dropbox') {
      try {
        const res = await net.fetch('https://api.dropboxapi.com/2/files/list_folder', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            path:               folderPath || '',
            recursive:          false,
            include_media_info: true,
            limit:              300,
          }),
        })
        if (!res.ok) {
          const text = await res.text()
          return { success: false, error: text }
        }
        const data = await res.json()
        return { success: true, entries: data.entries, cursor: data.cursor, hasMore: data.has_more }
      } catch (e) {
        return { success: false, error: e.message }
      }
    }
    return { success: false, error: 'Unknown provider' }
  })

  ipcMain.handle('cloud-get-thumb', async (_event, { provider, path: filePath }) => {
    const token = _cloudTokens.get(provider)
    if (!token) return null
    if (provider === 'dropbox') {
      try {
        const res = await net.fetch('https://content.dropboxapi.com/2/files/get_thumbnail', {
          method: 'POST',
          headers: {
            'Authorization':   `Bearer ${token}`,
            'Dropbox-API-Arg': JSON.stringify({ path: filePath, format: 'jpeg', size: 'w256h256' }),
            'Content-Type':    '',
          },
        })
        if (!res.ok) return null
        const buf = Buffer.from(await res.arrayBuffer())
        return 'data:image/jpeg;base64,' + buf.toString('base64')
      } catch { return null }
    }
    return null
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
  const cached = getFolderCache(folderPath)
  if (cached) return { count: cached.count, thumbs: cached.thumbs }

  try {
    const folderMtime = fs.statSync(folderPath).mtimeMs
    const entries = fs.readdirSync(folderPath, { withFileTypes: true })
    const imagePaths = []
    let count = 0
    for (const entry of entries) {
      if (!entry.isFile()) continue
      const ext = path.extname(entry.name).toLowerCase()
      if (!MEDIA_EXTENSIONS.has(ext)) continue
      count++
      if (imagePaths.length < 3 && IMAGE_EXTENSIONS.has(ext)) {
        imagePaths.push(path.join(folderPath, entry.name))
      }
    }
    const thumbs = (await Promise.all(
      imagePaths.map(fp => {
        try {
          const mtime = fs.statSync(fp).mtimeMs
          return new Promise(resolve => {
            _thumbQueue.push({ filePath: fp, mtime, resolve })
            pumpThumbQueue()
          })
        } catch { return Promise.resolve(null) }
      })
    )).filter(Boolean)

    setFolderCache(folderPath, { mtime: folderMtime, count, thumbs })
    return { count, thumbs }
  } catch { return { count: 0, thumbs: [] } }
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

// ── Private Space ────────────────────────────────────────────────────────────
// Container format:
//   [0-7]   magic "LUMINA1\0"
//   [8-39]  salt (32 bytes, for PBKDF2)
//   [40-43] manifest_block_len (uint32 LE)
//   [44 .. 44+mbl-1]  encrypted manifest: IV(12)+TAG(16)+JSON
//   [44+mbl ..]  file blocks: IV(12)+TAG(16)+ciphertext, in manifest order

const PV_MAGIC = Buffer.from('LUMINA1\0')
let _pvKey      = null   // Buffer | null — in RAM only
let _pvManifest = null   // array | null

function pvPath() {
  return path.join(app.getPath('userData'), 'private.lumina')
}

function pvDerive(pin, salt) {
  return crypto.pbkdf2Sync(Buffer.from(String(pin), 'utf8'), salt, 100000, 32, 'sha256')
}

function pvEncBlock(key, plain) {
  const iv  = crypto.randomBytes(12)
  const c   = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([c.update(plain), c.final()])
  const tag = c.getAuthTag()
  return Buffer.concat([iv, tag, enc])
}

function pvDecBlock(key, buf) {
  const iv  = buf.slice(0, 12)
  const tag = buf.slice(12, 28)
  const ct  = buf.slice(28)
  const d   = crypto.createDecipheriv('aes-256-gcm', key, iv)
  d.setAuthTag(tag)
  return Buffer.concat([d.update(ct), d.final()])
}

// Manifest v2: { v:2, folders:string[], files:[{name,size,mtime,ext,isVideo,folder}] }
// Migrates v1 (plain array) automatically on next write
function pvParseContainer(key) {
  const fp  = pvPath()
  const raw = fs.readFileSync(fp)
  if (!raw.slice(0, 8).equals(PV_MAGIC)) throw new Error('bad_magic')
  const mbl  = raw.readUInt32LE(40)
  const mEnc = raw.slice(44, 44 + mbl)
  const mDec = pvDecBlock(key, mEnc)
  const parsed = JSON.parse(mDec.toString('utf8'))
  // Migrate v1 (array) → v2 (object)
  const manifest = Array.isArray(parsed)
    ? { v: 2, folders: [], files: parsed.map(f => ({ ...f, folder: null })) }
    : parsed
  return { raw, manifest, files: manifest.files, dataStart: 44 + mbl }
}

function pvRebuild(key, manifest, fileBuffers) {
  const fp  = pvPath()
  const salt = fs.existsSync(fp) ? fs.readFileSync(fp).slice(8, 40) : crypto.randomBytes(32)
  const mEnc   = pvEncBlock(key, Buffer.from(JSON.stringify(manifest), 'utf8'))
  const mblBuf = Buffer.allocUnsafe(4)
  mblBuf.writeUInt32LE(mEnc.length, 0)
  const parts = [PV_MAGIC, salt, mblBuf, mEnc]
  for (const fb of fileBuffers) parts.push(pvEncBlock(key, fb))
  fs.writeFileSync(fp, Buffer.concat(parts))
}

function pvReadFileBuffer(raw, files, dataStart, idx) {
  let offset = dataStart
  for (let i = 0; i < idx; i++) offset += 12 + 16 + files[i].size
  return raw.slice(offset, offset + 12 + 16 + files[idx].size)
}

// IPC handlers
ipcMain.handle('private-exists',     () => fs.existsSync(pvPath()))
ipcMain.handle('private-is-unlocked', () => _pvKey !== null)

function pvFilesMeta(files) {
  return files.map(f => ({ name: f.name, size: f.size, mtime: f.mtime, ext: f.ext, isVideo: f.isVideo, folder: f.folder ?? null }))
}

ipcMain.handle('private-create', (_e, pin) => {
  if (!pin || String(pin).length < 4) return { success: false, error: 'pin_too_short' }
  const salt = crypto.randomBytes(32)
  const key  = pvDerive(pin, salt)
  const manifest = { v: 2, folders: [], files: [] }
  const mEnc   = pvEncBlock(key, Buffer.from(JSON.stringify(manifest), 'utf8'))
  const mblBuf = Buffer.allocUnsafe(4)
  mblBuf.writeUInt32LE(mEnc.length, 0)
  fs.writeFileSync(pvPath(), Buffer.concat([PV_MAGIC, salt, mblBuf, mEnc]))
  _pvKey = key; _pvManifest = manifest
  return { success: true }
})

ipcMain.handle('private-unlock', (_e, pin) => {
  try {
    if (!fs.existsSync(pvPath())) return { success: false, error: 'no_container' }
    const raw  = fs.readFileSync(pvPath())
    if (!raw.slice(0, 8).equals(PV_MAGIC)) return { success: false, error: 'bad_file' }
    const salt = raw.slice(8, 40)
    const key  = pvDerive(pin, salt)
    const { manifest } = pvParseContainer(key)
    _pvKey = key; _pvManifest = manifest
    return { success: true, files: pvFilesMeta(manifest.files), folders: manifest.folders }
  } catch { return { success: false, error: 'wrong_pin' } }
})

ipcMain.handle('private-lock', () => { _pvKey = null; _pvManifest = null; return { success: true } })

ipcMain.handle('private-list', () => {
  if (!_pvKey) return { success: false, error: 'locked' }
  return { success: true, files: pvFilesMeta(_pvManifest.files), folders: _pvManifest.folders }
})

ipcMain.handle('private-thumb', async (_e, name) => {
  if (!_pvKey) return null
  try {
    const { files } = _pvManifest
    const idx = files.findIndex(f => f.name === name)
    if (idx < 0) return null
    const { raw, dataStart } = pvParseContainer(_pvKey)
    const plain = pvDecBlock(_pvKey, pvReadFileBuffer(raw, files, dataStart, idx))
    const thumb = nativeImage.createFromBuffer(plain).resize({ width: 300, height: 300 })
    return 'data:image/jpeg;base64,' + thumb.toJPEG(85).toString('base64')
  } catch { return null }
})

ipcMain.handle('private-read', async (_e, name) => {
  if (!_pvKey) return null
  try {
    const { files } = _pvManifest
    const idx = files.findIndex(f => f.name === name)
    if (idx < 0) return null
    const { raw, dataStart } = pvParseContainer(_pvKey)
    const plain = pvDecBlock(_pvKey, pvReadFileBuffer(raw, files, dataStart, idx))
    const ext  = (files[idx].ext || 'jpg').toLowerCase()
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    return `data:${mime};base64,` + plain.toString('base64')
  } catch { return null }
})

ipcMain.handle('private-add', async (_e, filePaths, folder = null) => {
  if (!_pvKey) return { success: false, error: 'locked' }
  try {
    const { raw, files, dataStart } = pvParseContainer(_pvKey)
    const bufs = files.map((_, i) => pvDecBlock(_pvKey, pvReadFileBuffer(raw, files, dataStart, i)))
    const newFiles = [...files]
    const newBufs  = [...bufs]
    for (const fp of filePaths) {
      const buf  = fs.readFileSync(fp)
      const ext  = path.extname(fp).slice(1).toUpperCase()
      const stat = fs.statSync(fp)
      let name = path.basename(fp), n = 1
      while (newFiles.some(f => f.name === name))
        name = `${path.basename(fp, path.extname(fp))}_${n++}${path.extname(fp)}`
      newFiles.push({ name, size: buf.length, mtime: stat.mtimeMs, ext, isVideo: VIDEO_EXTENSIONS.has(path.extname(fp).toLowerCase()), folder: folder ?? null })
      newBufs.push(buf)
    }
    const newManifest = { ..._pvManifest, files: newFiles }
    pvRebuild(_pvKey, newManifest, newBufs)
    _pvManifest = newManifest
    return { success: true, files: pvFilesMeta(newFiles), folders: newManifest.folders }
  } catch (e) { return { success: false, error: e.message } }
})

ipcMain.handle('private-remove', async (_e, name) => {
  if (!_pvKey) return { success: false, error: 'locked' }
  try {
    const { raw, files, dataStart } = pvParseContainer(_pvKey)
    const idx = files.findIndex(f => f.name === name)
    if (idx < 0) return { success: false, error: 'not_found' }
    const bufs = files.map((_, i) => pvDecBlock(_pvKey, pvReadFileBuffer(raw, files, dataStart, i)))
    bufs.splice(idx, 1)
    const newFiles    = files.filter((_, i) => i !== idx)
    const newManifest = { ..._pvManifest, files: newFiles }
    pvRebuild(_pvKey, newManifest, bufs)
    _pvManifest = newManifest
    return { success: true }
  } catch (e) { return { success: false, error: e.message } }
})

// ── Folder management ──
ipcMain.handle('private-create-folder', (_e, name) => {
  if (!_pvKey) return { success: false, error: 'locked' }
  const trimmed = String(name).trim()
  if (!trimmed) return { success: false, error: 'empty_name' }
  if (_pvManifest.folders.includes(trimmed)) return { success: false, error: 'exists' }
  const newManifest = { ..._pvManifest, folders: [..._pvManifest.folders, trimmed] }
  pvRebuild(_pvKey, newManifest, _pvManifest.files.map((f, i) => {
    const { raw, files, dataStart } = pvParseContainer(_pvKey)
    return pvDecBlock(_pvKey, pvReadFileBuffer(raw, files, dataStart, i))
  }))
  _pvManifest = newManifest
  return { success: true, folders: newManifest.folders }
})

ipcMain.handle('private-rename-folder', async (_e, oldName, newName) => {
  if (!_pvKey) return { success: false, error: 'locked' }
  const trimmed = String(newName).trim()
  if (!trimmed || _pvManifest.folders.includes(trimmed)) return { success: false, error: 'invalid' }
  const { raw, files, dataStart } = pvParseContainer(_pvKey)
  const bufs = files.map((_, i) => pvDecBlock(_pvKey, pvReadFileBuffer(raw, files, dataStart, i)))
  const newFiles    = files.map(f => f.folder === oldName ? { ...f, folder: trimmed } : f)
  const newFolders  = _pvManifest.folders.map(f => f === oldName ? trimmed : f)
  const newManifest = { ..._pvManifest, folders: newFolders, files: newFiles }
  pvRebuild(_pvKey, newManifest, bufs)
  _pvManifest = newManifest
  return { success: true, folders: newFolders }
})

ipcMain.handle('private-delete-folder', async (_e, name) => {
  if (!_pvKey) return { success: false, error: 'locked' }
  const { raw, files, dataStart } = pvParseContainer(_pvKey)
  const bufs = files.map((_, i) => pvDecBlock(_pvKey, pvReadFileBuffer(raw, files, dataStart, i)))
  // Move files from deleted folder to root
  const newFiles    = files.map(f => f.folder === name ? { ...f, folder: null } : f)
  const newFolders  = _pvManifest.folders.filter(f => f !== name)
  const newManifest = { ..._pvManifest, folders: newFolders, files: newFiles }
  pvRebuild(_pvKey, newManifest, bufs)
  _pvManifest = newManifest
  return { success: true, folders: newFolders }
})

ipcMain.handle('private-move-to-folder', async (_e, name, folder) => {
  if (!_pvKey) return { success: false, error: 'locked' }
  const newFiles    = _pvManifest.files.map(f => f.name === name ? { ...f, folder: folder ?? null } : f)
  const newManifest = { ..._pvManifest, files: newFiles }
  // No file data changes — just rewrite manifest
  const { raw, files, dataStart } = pvParseContainer(_pvKey)
  const bufs = files.map((_, i) => pvDecBlock(_pvKey, pvReadFileBuffer(raw, files, dataStart, i)))
  pvRebuild(_pvKey, newManifest, bufs)
  _pvManifest = newManifest
  return { success: true }
})

ipcMain.handle('private-export', async () => {
  const result = await dialog.showSaveDialog({
    title: 'Eksportuj Private Space',
    defaultPath: 'private.lumina',
    filters: [{ name: 'Lumina Container', extensions: ['lumina'] }]
  })
  if (result.canceled) return { success: false }
  try { fs.copyFileSync(pvPath(), result.filePath); return { success: true, path: result.filePath } }
  catch (e) { return { success: false, error: e.message } }
})

ipcMain.handle('private-import', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Importuj Private Space',
    filters: [{ name: 'Lumina Container', extensions: ['lumina'] }],
    properties: ['openFile']
  })
  if (result.canceled) return { success: false }
  try {
    const src = result.filePaths[0]
    const raw = fs.readFileSync(src)
    if (!raw.slice(0, 8).equals(PV_MAGIC)) return { success: false, error: 'bad_file' }
    _pvKey = null; _pvManifest = null
    fs.copyFileSync(src, pvPath())
    return { success: true }
  } catch (e) { return { success: false, error: e.message } }
})

ipcMain.handle('private-change-pin', async (_e, oldPin, newPin) => {
  if (!_pvKey) return { success: false, error: 'locked' }
  if (!newPin || String(newPin).length < 4) return { success: false, error: 'pin_too_short' }
  try {
    const { raw, manifest, dataStart } = pvParseContainer(_pvKey)
    const buffers = manifest.map((_, i) => pvDecBlock(_pvKey, pvReadFileBuffer(raw, manifest, dataStart, i)))
    // New key with new salt
    const newSalt = crypto.randomBytes(32)
    const newKey  = pvDerive(newPin, newSalt)
    // Temporarily override pvPath write logic: write new salt
    const mEnc   = pvEncBlock(newKey, Buffer.from(JSON.stringify(manifest), 'utf8'))
    const mblBuf = Buffer.allocUnsafe(4)
    mblBuf.writeUInt32LE(mEnc.length, 0)
    const parts  = [PV_MAGIC, newSalt, mblBuf, mEnc]
    for (const fb of buffers) parts.push(pvEncBlock(newKey, fb))
    fs.writeFileSync(pvPath(), Buffer.concat(parts))
    _pvKey = newKey
    return { success: true }
  } catch (e) { return { success: false, error: e.message } }
})

// ─────────────────────────────────────────────────────────────────────────────

ipcMain.handle('pick-files', async (_e, { title, extensions } = {}) => {
  const result = await dialog.showOpenDialog({
    title: title || 'Wybierz pliki',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Images', extensions: extensions || ['jpg','jpeg','png','gif','webp','bmp','tiff','avif'] }]
  })
  return result.canceled ? [] : result.filePaths
})

ipcMain.handle('pick-wallpaper', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Wybierz tapetę',
    properties: ['openFile'],
    filters: [{ name: 'Obrazy', extensions: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'bmp'] }]
  })
  return result.canceled ? null : result.filePaths[0]
})

// ── Disk Manager ─────────────────────────────────────────────────────────────

ipcMain.handle('get-disks', async () => {
  try {
    const { execSync } = require('child_process')
    if (process.platform === 'win32') {
      const out = execSync(
        'powershell -NoProfile -Command "Get-PSDrive -PSProvider FileSystem | Where-Object {$_.Root} | Select-Object Name,Used,Free,Root | ConvertTo-Json"',
        { timeout: 8000 }
      ).toString()
      const data = JSON.parse(out)
      const arr = Array.isArray(data) ? data : [data]
      return arr.filter(d => d.Used != null || d.Free != null).map(d => ({
        name:  d.Name,
        root:  d.Root,
        used:  Number(d.Used  ?? 0),
        free:  Number(d.Free  ?? 0),
        total: Number(d.Used ?? 0) + Number(d.Free ?? 0),
      }))
    } else {
      const out = execSync("df -k / | tail -1").toString().trim().split(/\s+/)
      const total = Number(out[1]) * 1024
      const used  = Number(out[2]) * 1024
      return [{ name: 'disk', root: '/', used, free: total - used, total }]
    }
  } catch (e) { return [] }
})

ipcMain.handle('get-large-files', async (_e, folderPath, limit = 30) => {
  const results = []
  function walk(dir, depth) {
    if (depth > 6) return
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) { walk(full, depth + 1) }
      else if (e.isFile()) {
        try {
          const st = fs.statSync(full)
          results.push({ path: full, name: e.name, size: st.size })
        } catch {}
      }
    }
  }
  walk(folderPath, 0)
  results.sort((a, b) => b.size - a.size)
  return results.slice(0, limit)
})

ipcMain.handle('find-duplicates', async (_e, folderPath) => {
  const bySize = new Map()
  function walk(dir, depth) {
    if (depth > 6) return
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) { walk(full, depth + 1) }
      else if (e.isFile()) {
        try {
          const st = fs.statSync(full)
          if (st.size < 1024) continue // skip tiny files
          const key = String(st.size)
          if (!bySize.has(key)) bySize.set(key, [])
          bySize.get(key).push({ path: full, name: e.name, size: st.size })
        } catch {}
      }
    }
  }
  walk(folderPath, 0)

  const groups = []
  for (const [, files] of bySize) {
    if (files.length < 2) continue
    // hash first 64 KB to confirm duplicate
    const byHash = new Map()
    for (const f of files) {
      try {
        const fd = fs.openSync(f.path, 'r')
        const buf = Buffer.alloc(Math.min(65536, f.size))
        fs.readSync(fd, buf, 0, buf.length, 0)
        fs.closeSync(fd)
        const h = crypto.createHash('md5').update(buf).digest('hex')
        if (!byHash.has(h)) byHash.set(h, [])
        byHash.get(h).push(f)
      } catch {}
    }
    for (const [, group] of byHash) {
      if (group.length > 1) groups.push(group)
    }
  }
  groups.sort((a, b) => b[0].size * b.length - a[0].size * a.length)
  return groups.slice(0, 50)
})

ipcMain.handle('is-elevated', () => isElevated())

ipcMain.handle('relaunch-as-admin', () => {
  if (process.platform !== 'win32') return
  const exePath = process.execPath.replace(/'/g, "''")
  const args    = process.argv.slice(1).map(a => `'${a.replace(/'/g, "''")}'`).join(', ')
  const argsStr = args ? `-ArgumentList @(${args})` : ''
  exec(`powershell -Command "Start-Process -FilePath '${exePath}' ${argsStr} -Verb RunAs"`)
  setTimeout(() => app.quit(), 500)
})

ipcMain.handle('scan-folder-tree', async (_e, rootPath) => {
  // Only skip true system/unreadable roots — NOT user folders with $ in the name
  const SKIP_ROOT = new Set([
    '$Recycle.Bin', 'System Volume Information', '$WINDOWS.~BT',
    '$WinREAgent', 'Recovery', 'Config.Msi', 'MSOCache',
  ])

  function walk(dir, isRoot) {
    const node = { name: path.basename(dir) || dir, path: dir, size: 0, children: [] }
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return node }
    for (const e of entries) {
      // At root level skip Windows system junk; deeper — skip nothing by name
      if (isRoot && (SKIP_ROOT.has(e.name) || e.name.startsWith('$'))) continue
      const full = path.join(dir, e.name)
      try {
        // Skip reparse points / junctions to avoid infinite loops
        const st = fs.lstatSync(full)
        if (st.isSymbolicLink()) continue
        if (e.isFile()) {
          node.size += st.size
        } else if (e.isDirectory()) {
          const child = walk(full, false)
          node.size += child.size
          node.children.push(child)
        }
      } catch {}
    }
    node.children.sort((a, b) => b.size - a.size)
    return node
  }

  return walk(rootPath, true)
})

// ── Folder & file management ──────────────────────────────────────────────────

ipcMain.handle('create-folder', async (_event, { parentPath, name }) => {
  try {
    const full = path.join(parentPath, name.trim())
    if (fs.existsSync(full)) return { success: false, error: 'exists' }
    fs.mkdirSync(full)
    return { success: true, path: full }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('move-items', async (_event, { items, dest }) => {
  const failed = []
  for (const item of items) {
    try {
      const base    = path.basename(item.src)
      const newPath = path.join(dest, base)
      if (item.src === newPath) continue
      moveFile(item.src, newPath)
    } catch (e) {
      failed.push({ path: item.src, error: e.message })
    }
  }
  return { success: failed.length === 0, failed }
})

ipcMain.handle('rename-item', async (_event, { src, newName }) => {
  try {
    const dir     = path.dirname(src)
    const newPath = path.join(dir, newName.trim())
    if (fs.existsSync(newPath)) return { success: false, error: 'exists' }
    fs.renameSync(src, newPath)
    return { success: true, newPath }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('trash-folder', async (_event, folderPath) => {
  try {
    await shell.trashItem(folderPath)
    return { success: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

// batch-rename: renames multiple files using a pattern
// items: [{ path, name, ext, mtime }], pattern: string with {name}/{n}/{date}/{ext}
ipcMain.handle('batch-rename', async (_event, { items, pattern }) => {
  const path = require('path')
  const fs   = require('fs')
  const results = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const dir  = path.dirname(item.path)
    const date = new Date(item.mtime).toISOString().slice(0, 10)
    const newName = pattern
      .replace(/\{name\}/g, path.parse(item.name).name)
      .replace(/\{n\}/g,    String(i + 1).padStart(String(items.length).length, '0'))
      .replace(/\{date\}/g, date)
      .replace(/\{ext\}/g,  item.ext ? item.ext.replace(/^\./, '') : '')
    const finalName = newName.endsWith('.' + item.ext?.replace(/^\./, ''))
      ? newName
      : `${newName}.${item.ext?.replace(/^\./, '') ?? ''}`
    const newPath = path.join(dir, finalName)
    try {
      fs.renameSync(item.path, newPath)
      results.push({ ok: true, oldPath: item.path, newPath })
    } catch (e) {
      results.push({ ok: false, oldPath: item.path, error: e.message })
    }
  }
  return results
})
