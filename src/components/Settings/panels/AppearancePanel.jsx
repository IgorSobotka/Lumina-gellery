import { useLang } from '../../../i18n/index'
import { WALLPAPERS } from '../../../constants/wallpapers'
import styles from './AppearancePanel.module.css'

export default function AppearancePanel({ settings, onSettingsChange }) {
  const t = useLang()
  const current   = settings.wallpaper
  const blurValue = settings.wallpaperBlur ?? 0

  async function handlePickCustom() {
    const p = await window.api.pickWallpaper()
    if (p) onSettingsChange({ ...settings, wallpaper: 'custom', customWallpaperPath: p })
  }

  return (
    <div className={styles.panel}>

      {/* ── Wallpaper presets ── */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>{t('wallpaperSec')}</div>
        <div className={styles.sectionDesc}>{t('wallpaperDesc')}</div>

        <div className={styles.wallpaperGrid}>
          {Object.values(WALLPAPERS).map(wp => (
            <button
              key={wp.id}
              className={`${styles.wallpaperCard} ${current === wp.id ? styles.selected : ''}`}
              onClick={() => onSettingsChange({ ...settings, wallpaper: wp.id })}
              title={wp.label}
            >
              <div className={styles.swatch} style={{ background: wp.background }}>
                {current === wp.id && (
                  <div className={styles.checkmark}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
              <span className={styles.wallpaperLabel}>{wp.label}</span>
            </button>
          ))}

          {/* Custom image card */}
          <button
            className={`${styles.wallpaperCard} ${current === 'custom' ? styles.selected : ''}`}
            onClick={handlePickCustom}
            title={t('customWallpaper')}
          >
            <div
              className={styles.swatch}
              style={
                current === 'custom' && settings.customWallpaperPath
                  ? {
                      backgroundImage: `url("gallery://img?p=${encodeURIComponent(settings.customWallpaperPath)}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : { background: 'rgba(255,255,255,0.06)' }
              }
            >
              {current === 'custom' && (
                <div className={styles.checkmark}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              {current !== 'custom' && (
                <div className={styles.customPlaceholder}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
              )}
            </div>
            <span className={styles.wallpaperLabel}>{t('customWallpaper')}</span>
          </button>
        </div>
      </section>

      {/* ── Blur slider ── */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>{t('blurTitle')}</div>
        <div className={styles.sectionDesc}>{t('blurDesc')}</div>

        <div className={styles.sliderRow}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" className={styles.sliderIcon}>
            <circle cx="12" cy="12" r="9"/>
          </svg>
          <input
            type="range"
            className={styles.slider}
            min={0} max={20} step={1}
            value={blurValue}
            onChange={e => onSettingsChange({ ...settings, wallpaperBlur: Number(e.target.value) })}
          />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" className={`${styles.sliderIcon} ${styles.sliderIconLarge}`}>
            <circle cx="12" cy="12" r="9"/>
            <circle cx="12" cy="12" r="4" fill="var(--text-3)" stroke="none"/>
          </svg>
          <span className={styles.sliderValue}>{blurValue}px</span>
        </div>
      </section>

    </div>
  )
}
