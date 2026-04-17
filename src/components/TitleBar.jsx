import { useState, useEffect } from 'react'
import { useLang } from '../i18n/index'
import styles from './TitleBar.module.css'

const isMac = window.api?.platform === 'darwin'

export default function TitleBar({ folder }) {
  const t = useLang()
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    if (!window.api) return
    const unsub = window.api.onWindowMaximized(setMaximized)
    return unsub
  }, [])

  const name = folder ? folder.split(/[\\/]/).pop() : 'Lumina Gallery'

  return (
    <div className={styles.bar}>
      {/* Na macOS padding-left zostawia miejsce na natywne traffic lights */}
      <div className={`${styles.drag} ${isMac ? styles.dragMac : ''}`}>
        <span className={styles.icon}>✦</span>
        <span className={styles.title}>{name}</span>
      </div>
      {/* Custom przyciski tylko na Windows/Linux */}
      {!isMac && <div className={styles.controls}>
        <button className={styles.btn} onClick={() => window.api?.windowMinimize()} title={t('minimize')}>
          <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor"/></svg>
        </button>
        <button className={styles.btn} onClick={() => window.api?.windowMaximize()} title={maximized ? t('restore') : t('maximize')}>
          {maximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="2" y="0" width="8" height="8" stroke="currentColor"/>
              <rect x="0" y="2" width="8" height="8" stroke="currentColor" fill="var(--bg-1)"/>
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor"/>
            </svg>
          )}
        </button>
        <button className={`${styles.btn} ${styles.close}`} onClick={() => window.api?.windowClose()} title={t('close')}>
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
        </button>
      </div>}
    </div>
  )
}
