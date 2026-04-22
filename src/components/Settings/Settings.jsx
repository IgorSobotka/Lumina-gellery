import { useState, useEffect, useRef } from 'react'
import AppearancePanel from './panels/AppearancePanel'
import GeneralPanel from './panels/GeneralPanel'
import AddonsPanel from './panels/AddonsPanel'
import { useLang } from '../../i18n/index'
import styles from './Settings.module.css'

function buildCategories(t) {
  return [
    {
      id: 'appearance',
      label: t('appearance'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M11.89 3.05l-1.06 1.06M4.11 11.89l-1.06 1.06"
            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'general',
      label: t('general'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M5.5 8h5M8 5.5v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'shortcuts',
      label: t('shortcuts'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1.5" y="4" width="5" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
          <rect x="9.5" y="4" width="5" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
          <rect x="1.5" y="9.5" width="13" height="3" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
      ),
      disabled: true,
    },
    {
      id: 'addons',
      label: t('addons'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
          <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
          <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M11.75 9v5.5M9 11.75h5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'about',
      label: t('about'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M8 7.5V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <circle cx="8" cy="5.5" r="0.7" fill="currentColor"/>
        </svg>
      ),
      disabled: true,
    },
  ]
}

export default function Settings({ settings, onSettingsChange, addons, onAddonsChange, onClose }) {
  const t = useLang()
  const [activeId, setActiveId] = useState('appearance')
  const overlayRef = useRef(null)
  const categories = buildCategories(t)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
      <div className={styles.panel}>

        {/* ── Nav ── */}
        <nav className={styles.nav}>
          <div className={styles.navHeader}>{t('settingsTitle')}</div>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`${styles.navItem} ${activeId === cat.id ? styles.navActive : ''} ${cat.disabled ? styles.navDisabled : ''}`}
              onClick={() => !cat.disabled && setActiveId(cat.id)}
              title={cat.disabled ? t('soon') : cat.label}
            >
              <span className={styles.navIcon}>{cat.icon}</span>
              <span className={styles.navLabel}>{cat.label}</span>
              {cat.disabled && <span className={styles.soon}>{t('soon')}</span>}
            </button>
          ))}
          <div className={styles.navFooter}>
            <span className={styles.navVersion}>Lumina v1.0</span>
          </div>
        </nav>

        {/* ── Content ── */}
        <div className={styles.content}>
          <div className={styles.contentHeader}>
            <h2 className={styles.contentTitle}>
              {categories.find(c => c.id === activeId)?.label}
            </h2>
            <button className={styles.closeBtn} onClick={onClose} title={t('closeEsc')}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className={styles.contentBody}>
            {activeId === 'appearance' && (
              <AppearancePanel settings={settings} onSettingsChange={onSettingsChange} />
            )}
            {activeId === 'general' && (
              <GeneralPanel settings={settings} onSettingsChange={onSettingsChange} />
            )}
            {activeId === 'addons' && (
              <AddonsPanel addons={addons} onAddonsChange={onAddonsChange} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
