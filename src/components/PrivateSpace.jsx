import { useState, useEffect, useCallback, useRef } from 'react'
import { useLang } from '../i18n/index'
import styles from './PrivateSpace.module.css'

function LockIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
        fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  )
}

// ── PIN Input ──
function PinInput({ length = 6, onChange }) {
  const [digits, setDigits] = useState(Array(length).fill(''))
  const refs = Array.from({ length }, () => useRef(null))

  const handle = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[i] = val
    setDigits(next)
    onChange(next.join(''))
    if (val && i < length - 1) refs[i + 1].current?.focus()
  }

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs[i - 1].current?.focus()
    }
  }

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!text) return
    e.preventDefault()
    const next = Array(length).fill('')
    for (let i = 0; i < text.length; i++) next[i] = text[i]
    setDigits(next)
    onChange(next.join(''))
    refs[Math.min(text.length, length - 1)].current?.focus()
  }

  return (
    <div className={styles.pinRow}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={d}
          className={`${styles.pinCell} ${d ? styles.pinFilled : ''}`}
          onChange={e => handle(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          autoFocus={i === 0}
        />
      ))}
    </div>
  )
}

// ── Lock screen ──
function LockScreen({ onUnlocked }) {
  const t = useLang()
  const [exists, setExists]   = useState(null)
  const [pin, setPin]         = useState('')
  const [confirm, setConfirm] = useState('')
  const [step, setStep]       = useState('check')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      const exists = await window.api.privateExists()
      setExists(exists)
      if (exists) {
        const alreadyUnlocked = await window.api.privateIsUnlocked()
        if (alreadyUnlocked) {
          const res = await window.api.privateList()
          if (res.success) { onUnlocked(res.files, res.folders ?? []); return }
        }
      }
      setStep(exists ? 'unlock' : 'create')
    })()
  }, [onUnlocked])

  const handleCreate = async () => {
    if (pin.length < 4) { setError(t('pvPinShort')); return }
    if (step === 'create') { setStep('confirm'); return }
    if (pin !== confirm) { setError(t('pvPinMismatch')); setConfirm(''); return }
    setLoading(true)
    const res = await window.api.privateCreate(pin)
    setLoading(false)
    if (res.success) onUnlocked([], [])
    else setError(res.error)
  }

  const handleUnlock = async () => {
    if (pin.length < 4) { setError(t('pvPinShort')); return }
    setLoading(true)
    const res = await window.api.privateUnlock(pin)
    setLoading(false)
    if (res.success) onUnlocked(res.files, res.folders ?? [])
    else { setError(t('pvWrongPin')); setPin('') }
  }

  const handleImport = async () => {
    const res = await window.api.privateImport()
    if (res.success) { setExists(true); setStep('unlock'); setError('') }
    else if (res.error === 'bad_file') setError(t('pvBadFile'))
  }

  if (step === 'check') return <div className={styles.lockWrap}><div className={styles.spinner} /></div>

  const isCreate = step === 'create' || step === 'confirm'

  return (
    <div className={styles.lockWrap}>
      <div className={styles.lockCard}>
        <div className={styles.lockIcon}><LockIcon /></div>
        <h2 className={styles.lockTitle}>{isCreate ? t('pvCreate') : t('pvUnlock')}</h2>
        <p className={styles.lockSub}>
          {step === 'create'  && t('pvCreateSub')}
          {step === 'confirm' && t('pvConfirmSub')}
          {step === 'unlock'  && t('pvUnlockSub')}
        </p>

        {step === 'confirm'
          ? <PinInput key="confirm" onChange={setConfirm} />
          : <PinInput key="enter"   onChange={setPin} />
        }

        {error && <p className={styles.lockError}>{error}</p>}

        <button
          className={styles.lockBtn}
          onClick={isCreate ? handleCreate : handleUnlock}
          disabled={loading}
        >
          {loading ? t('pvLoading') : isCreate ? (step === 'create' ? t('pvNext') : t('pvCreateBtn')) : t('pvUnlockBtn')}
        </button>

        {step === 'unlock' && (
          <button className={styles.lockLink} onClick={handleImport}>{t('pvImport')}</button>
        )}
        {step === 'create' && (
          <button className={styles.lockLink} onClick={handleImport}>{t('pvImportExisting')}</button>
        )}
      </div>
    </div>
  )
}

// ── Folder card ──
function FolderCard({ name, count, onOpen, onRename, onDelete }) {
  const [menu, setMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menu) return
    const h = (e) => { if (!menuRef.current?.contains(e.target)) setMenu(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menu])

  return (
    <div className={styles.folderCard} onDoubleClick={() => onOpen(name)}>
      <div className={styles.folderCardIcon}><FolderIcon /></div>
      <div className={styles.folderCardName}>{name}</div>
      <div className={styles.folderCardCount}>{count}</div>
      <button
        className={styles.folderCardMenu}
        onClick={e => { e.stopPropagation(); setMenu(v => !v) }}
        title="Opcje"
      >⋯</button>
      {menu && (
        <div ref={menuRef} className={styles.folderMenu}>
          <button onClick={() => { setMenu(false); onRename(name) }}>Zmień nazwę</button>
          <button onClick={() => { setMenu(false); onDelete(name) }}>Usuń folder</button>
        </div>
      )}
    </div>
  )
}

// ── Private gallery card ──
function PrivateCard({ file, onSelect, onRemove, onMove, folders }) {
  const [thumb, setThumb] = useState(null)
  const [menu, setMenu] = useState(false)
  const cardRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menu) return
    const h = (e) => { if (!menuRef.current?.contains(e.target)) setMenu(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menu])

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      window.api.privateThumb(file.name).then(url => { if (url) setThumb(url) })
    }, { rootMargin: '300px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [file.name])

  return (
    <div ref={cardRef} className={styles.pvCard} onClick={() => onSelect(file)}>
      {thumb
        ? <img src={thumb} className={styles.pvThumb} draggable={false} />
        : <div className={styles.pvThumbSkeleton} />
      }
      <div className={styles.pvCardName}>{file.name}</div>
      <button
        className={styles.pvCardMenuBtn}
        onClick={e => { e.stopPropagation(); setMenu(v => !v) }}
        title="Opcje"
      >⋯</button>
      {menu && (
        <div ref={menuRef} className={styles.pvCardMenu} onClick={e => e.stopPropagation()}>
          {folders.length > 0 && (
            <div className={styles.pvCardMenuSub}>
              <div className={styles.pvCardMenuLabel}>Przenieś do</div>
              {file.folder && (
                <button onClick={() => { setMenu(false); onMove(file.name, null) }}>/ (główny)</button>
              )}
              {folders.filter(f => f !== file.folder).map(f => (
                <button key={f} onClick={() => { setMenu(false); onMove(file.name, f) }}>{f}</button>
              ))}
            </div>
          )}
          <button onClick={e => { e.stopPropagation(); setMenu(false); onRemove(file.name) }}>Usuń</button>
        </div>
      )}
    </div>
  )
}

// ── Lightbox for private ──
function PrivateLightbox({ file, onClose }) {
  const [src, setSrc] = useState(null)

  useEffect(() => {
    window.api.privateRead(file.name).then(setSrc)
  }, [file.name])

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className={styles.pvLightbox} onClick={onClose}>
      {src
        ? <img src={src} className={styles.pvLightboxImg} onClick={e => e.stopPropagation()} draggable={false} />
        : <div className={styles.spinner} />
      }
      <button className={styles.pvLightboxClose} onClick={onClose}>✕</button>
    </div>
  )
}

// ── Rename dialog ──
function RenameDialog({ initial, onConfirm, onCancel }) {
  const [val, setVal] = useState(initial)
  return (
    <div className={styles.dialogOverlay} onClick={onCancel}>
      <div className={styles.dialogBox} onClick={e => e.stopPropagation()}>
        <div className={styles.dialogTitle}>Zmień nazwę folderu</div>
        <input
          autoFocus
          className={styles.dialogInput}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onConfirm(val.trim()); if (e.key === 'Escape') onCancel() }}
          maxLength={48}
        />
        <div className={styles.dialogBtns}>
          <button className={styles.dialogCancel} onClick={onCancel}>Anuluj</button>
          <button className={styles.dialogOk} onClick={() => onConfirm(val.trim())} disabled={!val.trim()}>OK</button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ──
export default function PrivateSpace() {
  const t = useLang()
  const [unlocked,      setUnlocked]      = useState(false)
  const [files,         setFiles]         = useState([])
  const [folders,       setFolders]       = useState([])
  const [currentFolder, setCurrentFolder] = useState(null)
  const [lightbox,      setLightbox]      = useState(null)
  const [newFolderInput, setNewFolderInput] = useState(false)
  const [newFolderName,  setNewFolderName]  = useState('')
  const [renameDialog,  setRenameDialog]  = useState(null) // { name }

  const handleUnlocked = useCallback((fileList, folderList) => {
    setFiles(fileList)
    setFolders(folderList)
    setUnlocked(true)
  }, [])

  const handleLock = useCallback(async () => {
    await window.api.privateLock()
    setUnlocked(false)
    setFiles([])
    setFolders([])
    setCurrentFolder(null)
  }, [])

  const handleAdd = useCallback(async () => {
    const paths = await window.api.pickFiles({
      title: 'Wybierz zdjęcia do Private Space',
      extensions: ['jpg','jpeg','png','gif','webp','bmp','tiff','avif']
    })
    if (!paths.length) return
    const res = await window.api.privateAdd(paths, currentFolder)
    if (res.success) setFiles(res.files)
  }, [currentFolder])

  const handleRemove = useCallback(async (name) => {
    if (!window.confirm(t('pvConfirmRemove'))) return
    const res = await window.api.privateRemove(name)
    if (res.success) setFiles(f => f.filter(x => x.name !== name))
  }, [t])

  const handleMove = useCallback(async (name, folder) => {
    const res = await window.api.privateMoveToFolder(name, folder)
    if (res.success) setFiles(res.files)
  }, [])

  const handleExport = useCallback(async () => {
    await window.api.privateExport()
  }, [])

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return
    const res = await window.api.privateCreateFolder(name)
    if (res.success) setFolders(res.folders)
    setNewFolderInput(false)
    setNewFolderName('')
  }

  const handleRenameFolder = async (oldName, newName) => {
    if (!newName || newName === oldName) { setRenameDialog(null); return }
    const res = await window.api.privateRenameFolder(oldName, newName)
    if (res.success) { setFolders(res.folders); setFiles(res.files) }
    setRenameDialog(null)
  }

  const handleDeleteFolder = async (name) => {
    if (!window.confirm(`Usunąć folder "${name}"? Zdjęcia wrócą do głównego widoku.`)) return
    const res = await window.api.privateDeleteFolder(name)
    if (res.success) { setFolders(res.folders); setFiles(res.files) }
    if (currentFolder === name) setCurrentFolder(null)
  }

  if (!unlocked) return <LockScreen onUnlocked={handleUnlocked} />

  const visibleFiles = files.filter(f =>
    currentFolder === null ? f.folder == null : f.folder === currentFolder
  )

  const folderFileCounts = {}
  for (const f of files) {
    if (f.folder) folderFileCounts[f.folder] = (folderFileCounts[f.folder] ?? 0) + 1
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.shieldIcon}><ShieldIcon /></div>
          <div>
            <div className={styles.headerTitle}>{t('pvTitle')}</div>
            <div className={styles.headerSub}>
              {currentFolder
                ? <><span className={styles.breadcrumbRoot} onClick={() => setCurrentFolder(null)}>{t('pvTitle')}</span> › {currentFolder}</>
                : t('pvCount').replace('{n}', files.length)
              }
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          {!currentFolder && (
            <button className={styles.actionBtn} onClick={() => { setNewFolderInput(v => !v); setNewFolderName('') }} title="Nowy folder">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M12 11v6M9 14h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Folder
            </button>
          )}
          <button className={styles.actionBtn} onClick={handleAdd} title={t('pvAdd')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            {t('pvAdd')}
          </button>
          <button className={styles.actionBtn} onClick={handleExport} title={t('pvExport')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 12h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            {t('pvExport')}
          </button>
          <button className={`${styles.actionBtn} ${styles.actionBtnLock}`} onClick={handleLock} title={t('pvLock')}>
            <LockIcon />
            {t('pvLock')}
          </button>
        </div>
      </div>

      {newFolderInput && (
        <div className={styles.newFolderRow}>
          <input
            autoFocus
            className={styles.newFolderInput}
            placeholder="Nazwa folderu"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreateFolder()
              if (e.key === 'Escape') { setNewFolderInput(false); setNewFolderName('') }
            }}
            maxLength={48}
          />
          <button className={styles.newFolderConfirm} onClick={handleCreateFolder} disabled={!newFolderName.trim()}>✓</button>
          <button className={styles.newFolderCancel} onClick={() => { setNewFolderInput(false); setNewFolderName('') }}>✕</button>
        </div>
      )}

      {currentFolder === null && folders.length === 0 && files.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}><ShieldIcon /></div>
          <p className={styles.emptyText}>{t('pvEmpty')}</p>
          <button className={styles.emptyAddBtn} onClick={handleAdd}>{t('pvAdd')}</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {currentFolder === null && folders.map(name => (
            <FolderCard
              key={name}
              name={name}
              count={folderFileCounts[name] ?? 0}
              onOpen={setCurrentFolder}
              onRename={name => setRenameDialog({ name })}
              onDelete={handleDeleteFolder}
            />
          ))}
          {visibleFiles.map(f => (
            <PrivateCard
              key={f.name}
              file={f}
              onSelect={setLightbox}
              onRemove={handleRemove}
              onMove={handleMove}
              folders={folders}
            />
          ))}
          {visibleFiles.length === 0 && currentFolder !== null && (
            <div className={styles.emptyFolder}>
              <p>Ten folder jest pusty</p>
              <button className={styles.emptyAddBtn} onClick={handleAdd}>{t('pvAdd')}</button>
            </div>
          )}
        </div>
      )}

      {lightbox && <PrivateLightbox file={lightbox} onClose={() => setLightbox(null)} />}

      {renameDialog && (
        <RenameDialog
          initial={renameDialog.name}
          onConfirm={newName => handleRenameFolder(renameDialog.name, newName)}
          onCancel={() => setRenameDialog(null)}
        />
      )}
    </div>
  )
}
