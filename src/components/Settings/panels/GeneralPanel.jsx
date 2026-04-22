import { useState, useEffect, useCallback } from 'react'
import { useLang, useLangCode, cacheThumbs } from '../../../i18n/index'
import styles from './GeneralPanel.module.css'

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const LANGUAGES = [
  { id: 'pl', label: '🇵🇱  Polski' },
  { id: 'en', label: '🇬🇧  English' },
  { id: 'de', label: '🇩🇪  Deutsch' },
]

export default function GeneralPanel({ settings, onSettingsChange }) {
  const t          = useLang()
  const lang       = useLangCode()
  const current    = settings.language   ?? 'en'
  const openMode   = settings.openMode   ?? 'last'
  const openPath   = settings.openPath   ?? null
  const isSpecific = openMode === 'specific'

  const [cacheInfo,    setCacheInfo]    = useState(null)
  const [clearing,     setClearing]     = useState(false)
  const [clearSuccess, setClearSuccess] = useState(false)

  const loadCacheInfo = useCallback(() => {
    window.api?.getCacheInfo().then(info => setCacheInfo(info)).catch(() => {})
  }, [])

  useEffect(() => { loadCacheInfo() }, [loadCacheInfo])

  async function handleClearCache() {
    setClearing(true); setClearSuccess(false)
    await window.api?.clearCache()
    setClearing(false); setClearSuccess(true)
    loadCacheInfo()
    setTimeout(() => setClearSuccess(false), 2500)
  }

  async function handlePickFolder() {
    const p = await window.api.selectFolder()
    if (p) onSettingsChange({ ...settings, openMode: 'specific', openPath: p })
  }

  return (
    <div className={styles.panel}>

      {/* ── Language ── */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>{t('languageTitle')}</div>
        <div className={styles.sectionDesc}>{t('languageDesc')}</div>
        <div className={styles.row}>
          <div className={styles.selectWrap}>
            <select
              className={styles.select}
              value={current}
              onChange={e => onSettingsChange({ ...settings, language: e.target.value })}
            >
              {LANGUAGES.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
            <svg className={styles.chevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ── Startup behavior ── */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>{t('startupTitle')}</div>
        <div className={styles.sectionDesc}>{t('startupDesc')}</div>

        {/* Toggle */}
        <div className={styles.toggle}>
          <button
            className={`${styles.toggleBtn} ${!isSpecific ? styles.toggleActive : ''}`}
            onClick={() => onSettingsChange({ ...settings, openMode: 'last' })}
          >
            {t('startupLast')}
          </button>
          <button
            className={`${styles.toggleBtn} ${isSpecific ? styles.toggleActive : ''}`}
            onClick={() => onSettingsChange({ ...settings, openMode: 'specific' })}
          >
            {t('startupSpecific')}
          </button>
        </div>

        {/* Folder picker — enabled only when mode = specific */}
        <div className={`${styles.folderRow} ${!isSpecific ? styles.disabled : ''}`}>
          <div className={styles.folderPath} title={openPath ?? ''}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M1 3.5A1.5 1.5 0 012.5 2h3.086a1.5 1.5 0 011.06.44L7.72 3.5H13.5A1.5 1.5 0 0115 5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5V3.5z" fill="currentColor" fillOpacity="0.6"/>
            </svg>
            <span>{openPath ?? t('noFolderChosen')}</span>
          </div>
          <button
            className={styles.chooseBtn}
            onClick={handlePickFolder}
            disabled={!isSpecific}
          >
            {t('chooseFolder')}
          </button>
        </div>
      </section>

      {/* ── Thumbnail cache ── */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>{t('cacheTitle')}</div>
        <div className={styles.sectionDesc}>{t('cacheDesc')}</div>

        <div className={styles.cacheRow}>
          <div className={styles.cacheStats}>
            {cacheInfo ? (
              <>
                <span className={styles.cacheCount}>{cacheThumbs(cacheInfo.count, lang)}</span>
                <span className={styles.cacheDot}>·</span>
                <span className={styles.cacheSize}>{fmtSize(cacheInfo.sizeBytes)}</span>
              </>
            ) : (
              <span className={styles.cacheLoading}>{t('cacheLoading')}</span>
            )}
          </div>
          <button
            className={`${styles.clearBtn} ${clearSuccess ? styles.clearSuccess : ''}`}
            onClick={handleClearCache}
            disabled={clearing || (cacheInfo?.count === 0)}
          >
            {clearing ? t('cacheClearing') : clearSuccess ? t('cacheCleared') : t('cacheClear')}
          </button>
        </div>

        <div className={styles.cacheBar}>
          <div
            className={styles.cacheBarFill}
            style={{ width: cacheInfo ? `${Math.min((cacheInfo.sizeBytes / (300 * 1024 * 1024)) * 100, 100)}%` : '0%' }}
          />
          <span className={styles.cacheBarLabel}>
            {cacheInfo ? `${((cacheInfo.sizeBytes / (300 * 1024 * 1024)) * 100).toFixed(1)}${t('cacheMbSuffix')}` : ''}
          </span>
        </div>
      </section>

    </div>
  )
}
