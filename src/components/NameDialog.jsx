import { useState, useEffect, useRef } from 'react'
import { useLang } from '../i18n/index'
import styles from './NameDialog.module.css'

/**
 * Generic name-input dialog — used for "New folder" and "Rename".
 *
 * Props:
 *   mode         – 'create' | 'rename'  (auto-sets title + confirmLabel)
 *   initialValue – pre-filled value (empty for new folder, current name for rename)
 *   onConfirm(name) – called with trimmed name
 *   onClose      – called on cancel / Escape
 *   error        – optional external error string (e.g. "already exists")
 */
export default function NameDialog({ mode = 'create', initialValue = '', onConfirm, onClose, error: externalError }) {
  const t            = useLang()
  const title        = mode === 'create' ? t('newFolder') : t('renameItem')
  const confirmLabel = mode === 'create' ? t('createFolder') : t('renameItem')
  const [value, setValue]   = useState(initialValue)
  const [error, setError]   = useState(null)
  const inputRef            = useRef(null)

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.focus()
    el.select()
  }, [])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleConfirm = () => {
    const trimmed = value.trim()
    if (!trimmed) { setError(t('folderNameLabel') + '?'); return }
    // basic invalid char check (Windows)
    if (/[<>:"/\\|?*\x00-\x1f]/.test(trimmed)) { setError('Invalid characters in name.'); return }
    setError(null)
    onConfirm(trimmed)
  }

  const displayError = externalError || error

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.dialog}>
        <div className={styles.title}>{title}</div>

        <input
          ref={inputRef}
          className={`${styles.input} ${displayError ? styles.inputError : ''}`}
          type="text"
          placeholder={t('folderNameLabel')}
          value={value}
          onChange={e => { setValue(e.target.value); setError(null) }}
          onKeyDown={e => { if (e.key === 'Enter') handleConfirm() }}
          maxLength={128}
          spellCheck={false}
        />

        {displayError && <div className={styles.error}>{displayError}</div>}

        <div className={styles.btnRow}>
          <button className={styles.cancelBtn} onClick={onClose}>{t('pvCancel')}</button>
          <button className={styles.confirmBtn} onClick={handleConfirm} disabled={!value.trim()}>
            {confirmLabel || t('createFolder')}
          </button>
        </div>
      </div>
    </div>
  )
}
