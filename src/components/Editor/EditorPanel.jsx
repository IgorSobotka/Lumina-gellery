import { useCallback } from 'react'
import { DEFAULT_EDIT } from './editorUtils'
import { useLang } from '../../i18n/index'
import styles from './EditorPanel.module.css'

function Slider({ label, value, min, max, defaultVal, onChange }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <label className={styles.sliderRow}>
      <div className={styles.sliderTop}>
        <span className={styles.sliderLabel}>{label}</span>
        <span className={styles.sliderVal}>{value > 0 && min < 0 ? `+${value}` : value}</span>
      </div>
      <div className={styles.sliderTrack}>
        <div className={styles.sliderFill} style={{ width: `${pct}%` }} />
        <input type="range" min={min} max={max} value={value}
          onChange={e => onChange(Number(e.target.value))}
          onDoubleClick={() => onChange(defaultVal)}
          className={styles.sliderInput} />
      </div>
    </label>
  )
}

export default function EditorPanel({ editState, onChange, onStartCrop }) {
  const t    = useLang()
  const set  = useCallback((key, val) => onChange({ ...editState, [key]: val }), [editState, onChange])
  const rotate = (dir) => onChange({ ...editState, rotation: ((editState.rotation + dir) + 360) % 360 })
  const reset  = () => onChange({ ...DEFAULT_EDIT })
  const hasCrop = editState.crop !== null

  return (
    <div className={styles.panel}>
      {/* Crop */}
      <div className={styles.group}>
        <div className={styles.groupTitle}>{t('cropSection')}</div>
        <div className={styles.cropRow}>
          <button
            className={`${styles.toolBtn} ${styles.cropBtn} ${hasCrop ? styles.toolBtnActive : ''}`}
            onClick={onStartCrop}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 1v10a1 1 0 001 1h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M1 4h10a1 1 0 011 1v10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.1" strokeDasharray="2 1.5"/>
            </svg>
            <span>{t('cropBtn')}</span>
          </button>
          {hasCrop && (
            <button className={`${styles.toolBtn} ${styles.cropResetBtn}`}
              onClick={() => onChange({ ...editState, crop: null })} title={t('removeCropTitle')}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <span>{t('removeCropBtn')}</span>
            </button>
          )}
        </div>
        {hasCrop && (
          <div className={styles.cropInfo}>
            {Math.round(editState.crop.w * 100)}% × {Math.round(editState.crop.h * 100)}%
          </div>
        )}
      </div>

      {/* Geometry */}
      <div className={styles.group}>
        <div className={styles.groupTitle}>{t('geometrySection')}</div>
        <div className={styles.btnRow}>
          <button className={styles.toolBtn} onClick={() => rotate(-90)}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8A5 5 0 1 0 8 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M3 4v4h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>{t('rotateLeft')}</span>
          </button>
          <button className={styles.toolBtn} onClick={() => rotate(90)}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13 8A5 5 0 1 1 8 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M13 4v4H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>{t('rotateRight')}</span>
          </button>
          <button className={`${styles.toolBtn} ${editState.flipH ? styles.toolBtnActive : ''}`} onClick={() => set('flipH', !editState.flipH)}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 5l4 3-4 3M14 5l-4 3 4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Flip H</span>
          </button>
          <button className={`${styles.toolBtn} ${editState.flipV ? styles.toolBtnActive : ''}`} onClick={() => set('flipV', !editState.flipV)}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M5 2l3 4 3-4M5 14l3-4 3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Flip V</span>
          </button>
        </div>
      </div>

      {/* Tone */}
      <div className={styles.group}>
        <div className={styles.groupTitle}>{t('toneSection')}</div>
        <Slider label={t('brightness')} value={editState.brightness} min={0}    max={200} defaultVal={100} onChange={v => set('brightness', v)} />
        <Slider label={t('contrast')}   value={editState.contrast}   min={0}    max={200} defaultVal={100} onChange={v => set('contrast', v)} />
        <Slider label={t('saturation')} value={editState.saturation} min={0}    max={200} defaultVal={100} onChange={v => set('saturation', v)} />
        <Slider label={t('exposure')}   value={editState.exposure}   min={-100} max={100} defaultVal={0}   onChange={v => set('exposure', v)} />
      </div>

      {/* Reset */}
      <div className={styles.group}>
        <button className={styles.resetBtn} onClick={reset} style={{ opacity: editState === DEFAULT_EDIT ? 0.4 : 1 }}>
          {t('resetAll')}
        </button>
      </div>
    </div>
  )
}
