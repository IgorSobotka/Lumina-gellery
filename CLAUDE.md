# Lumina — Photo Gallery App

## Stack
- **Electron 28** + **React 18** + **Vite** + **CSS Modules**
- Custom protocol `gallery://img?p=<encoded-path>` for local images
- All persistence: `localStorage` — keys: `lumina_tags`, `lumina_albums`, `lumina_edits`, `lumina_recent_folders`, `lumina_settings`, `lumina_favorites`

## File Map (critical files only)

| File | Purpose |
|------|---------|
| `electron/main.js` | IPC handlers: `get-images`, `get-subfolders`, `save-image-file`, `delete-files`, `select-folder`, `get-folder-preview`, `open-file`, `show-in-explorer` |
| `electron/preload.js` | `contextBridge.exposeInMainWorld('api', {...})` |
| `src/App.jsx` | Root state: folder, images, selected, tags, albums, edits, settings |
| `src/components/Gallery.jsx` | Grid + ImageCard + FolderCard + hover preview singleton + selBar |
| `src/components/Lightbox.jsx` | Full-screen viewer + VideoPlayer + CropOverlay + ExportPanel + EditorPanel |
| `src/components/Editor/EditorPanel.jsx` | Crop / Geometry / Tone sliders (left panel) |
| `src/components/Editor/editorUtils.js` | DEFAULT_EDIT, toFilterCSS, toTransformCSS, toCropCSS, exportCanvas, exportFromUrl |
| `src/components/Sidebar.jsx` | Favorites, recent folders, albums, nav |
| `src/components/ContextMenu.jsx` | Right-click menu (image / folder / empty space) |
| `src/utils/tags.js` | loadTags / saveTags / allTags / tagColor |
| `src/utils/albums.js` | loadAlbums / saveAlbums / createAlbum / deleteAlbum / addImageToAlbum |
| `src/utils/edits.js` | loadEdits / saveEdits |
| `src/i18n/index.js` | LangContext, useLang, useLangCode, photoCount (pl/en) |

## Key Data Shapes

```js
// image object (from get-images IPC)
{ name, path, url, size, mtime, ext, isVideo, width, height }

// editState (DEFAULT_EDIT)
{ brightness:100, contrast:100, saturation:100, exposure:0, rotation:0, flipH:false, flipV:false, crop:null }
// crop: null | { x, y, w, h }  — normalised 0–1 fractions

// album
{ id: { name, images: [imageObj, ...] } }
```

## IPC via `window.api`
```js
getImages(path)           → { success, images }
getSubfolders(path)       → { success, folders }
getFolderPreview(path)    → { count, urls }
selectFolder()            → path | null
openFile(path)
showInExplorer(path)
getParentFolder(path)     → path | null
saveImageFile({ sourcePath, dataURL, mode:'copy'|'overwrite', destDir? }) → { success, savedPath }
deleteFiles(paths[])      → { success, failed[] }
```

## Patterns to remember
- **CSS Modules active state**: use `.iconBtnActive` class, NOT `.iconBtn.active` (hashing issue)
- **Hover preview**: imperative DOM singleton in Gallery.jsx — `_bar`, `_preview`, module-level vars. `PREVIEW_DELAY = 1000ms`
- **Deck float animation**: CSS `translate` property (independent of `transform`) — only on hover, only on `.deckCardWrap`
- **Non-destructive edits**: CSS filters for live preview, canvas only at export (`exportCanvas`)
- **Video**: `isVideo` flag on image object; VIDEO_EXTENSIONS in main.js; VideoPlayer component in Lightbox.jsx
- **Panel layout (Lightbox)**: Left = EditorPanel (260px), Center = image, Right = InfoPanel OR ExportPanel (248px). Left and right are independent (can both be open).
- **Editor tab**: floating left-edge tab (`.editorTab`), not in topBar
- **Right nav arrow** offsets when panels open: `style={showEditor ? {left:274} : undefined}` / `style={rightOpen ? {right:262} : undefined}`
- **Context menu**: single `ContextMenu` component handles image / folder / empty-space — pass `image`, `folder`, or neither
- **Selection bar**: in Gallery, bottom floating pill — format (JPG/PNG/WEBP) + dest folder + progress + delete + clear
- **After delete**: call `onAfterDelete()` → App.jsx reloads folder via `loadFolder(folder)`

## CSS variables (from index.css)
`--accent`, `--glass-bg`, `--glass-blur-sm`, `--glass-blur-xs`, `--radius`, `--radius-sm`, `--radius-pill`, `--transition`, `--spring`, `--text-1/2/3`, `--prism-top/bottom/cool/warm`

## Media extensions
- Images: `.jpg .jpeg .png .gif .webp .bmp .tiff .avif`
- Video: `.mp4 .mov .avi .mkv .webm .m4v .wmv`
