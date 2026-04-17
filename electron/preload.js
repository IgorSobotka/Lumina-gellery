const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
  selectFolder:          ()   => ipcRenderer.invoke('select-folder'),
  getImages:             (p)  => ipcRenderer.invoke('get-images', p),
  getSubfolders:         (p)  => ipcRenderer.invoke('get-subfolders', p),
  getParentFolder:       (p)  => ipcRenderer.invoke('get-parent-folder', p),
  getFolderImageCount:   (p)  => ipcRenderer.invoke('get-folder-image-count', p),
  getFolderPreview:      (p)  => ipcRenderer.invoke('get-folder-preview', p),
  openFile:              (p)  => ipcRenderer.invoke('open-file', p),
  pickWallpaper:         ()   => ipcRenderer.invoke('pick-wallpaper'),
  showInExplorer:        (p)  => ipcRenderer.invoke('show-in-explorer', p),
  saveImageFile:         (o)  => ipcRenderer.invoke('save-image-file', o),
  deleteFiles:           (ps)    => ipcRenderer.invoke('delete-files', ps),
  trashFiles:            (ps)    => ipcRenderer.invoke('trash-files', ps),
  restoreFiles:          (items) => ipcRenderer.invoke('restore-files', items),
  emptyTrash:            (ps)    => ipcRenderer.invoke('empty-trash', ps),
  getExif:               (p)  => ipcRenderer.invoke('get-exif', p),
  getThumbnail:          (o)  => ipcRenderer.invoke('get-thumbnail', o),
  getCacheInfo:          ()   => ipcRenderer.invoke('get-cache-info'),
  clearCache:            ()   => ipcRenderer.invoke('clear-cache'),

  // Private Space
  pickFiles:         (opts)      => ipcRenderer.invoke('pick-files', opts),
  privateExists:     ()          => ipcRenderer.invoke('private-exists'),
  privateIsUnlocked: ()          => ipcRenderer.invoke('private-is-unlocked'),
  privateCreate:     (pin)       => ipcRenderer.invoke('private-create', pin),
  privateUnlock:     (pin)       => ipcRenderer.invoke('private-unlock', pin),
  privateLock:       ()          => ipcRenderer.invoke('private-lock'),
  privateList:       ()          => ipcRenderer.invoke('private-list'),
  privateThumb:      (name)      => ipcRenderer.invoke('private-thumb', name),
  privateRead:       (name)      => ipcRenderer.invoke('private-read', name),
  privateAdd:        (paths)     => ipcRenderer.invoke('private-add', paths),
  privateRemove:     (name)      => ipcRenderer.invoke('private-remove', name),
  privateExport:     ()          => ipcRenderer.invoke('private-export'),
  privateImport:     ()          => ipcRenderer.invoke('private-import'),
  privateChangePin:  (old, next) => ipcRenderer.invoke('private-change-pin', old, next),
  privateCreateFolder: (name)        => ipcRenderer.invoke('private-create-folder', name),
  privateRenameFolder: (old, next)   => ipcRenderer.invoke('private-rename-folder', old, next),
  privateDeleteFolder: (name)        => ipcRenderer.invoke('private-delete-folder', name),
  privateMoveToFolder: (file, folder) => ipcRenderer.invoke('private-move-to-folder', file, folder),

  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose:    () => ipcRenderer.send('window-close'),
  onWindowMaximized: (cb) => {
    ipcRenderer.on('window-maximized', (_e, val) => cb(val))
    return () => ipcRenderer.removeAllListeners('window-maximized')
  },
})
