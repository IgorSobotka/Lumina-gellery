import { useLang } from '../i18n/index'
import styles from './Welcome.module.css'

export default function Welcome({ onOpenDialog, recent, onOpenFolder }) {
  const t = useLang()

  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <div className={styles.logo}>✦</div>
        <h1 className={styles.title}>Lumina Gallery</h1>
        <p className={styles.sub}>{t('subtitle')}</p>

        <button className={styles.openBtn} onClick={onOpenDialog}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 5a2 2 0 012-2h3.17a1 1 0 01.71.29L9 4.41A1 1 0 009.71 4.7H14a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9 8v5M6.5 10.5L9 8l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t('openFolderBtn')}
        </button>

        <p className={styles.hint}>{t('dragHint')}</p>
      </div>

      {recent.length > 0 && (
        <div className={styles.recent}>
          <div className={styles.recentLabel}>{t('recentlyOpened')}</div>
          <div className={styles.recentList}>
            {recent.slice(0, 5).map(r => (
              <button key={r} className={styles.recentItem} onClick={() => onOpenFolder(r)}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M1 3.5A1.5 1.5 0 012.5 2h3.086a1.5 1.5 0 011.06.44L7.72 3.5H13.5A1.5 1.5 0 0115 5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5V3.5z" fill="currentColor" fillOpacity="0.6"/>
                </svg>
                <span className={styles.recentPath}>{r}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
