import { useState, useEffect, useCallback, useRef } from 'react'
import { useLang } from '../i18n/index'
import styles from './Slideshow.module.css'

const SPEEDS = [
  { label: '1s', ms: 1000 },
  { label: '2s', ms: 2000 },
  { label: '3s', ms: 3000 },
  { label: '5s', ms: 5000 },
  { label: '10s', ms: 10000 },
]

export default function Slideshow({ images, startIndex = 0, onClose }) {
  const t           = useLang()
  const [index, setIndex]     = useState(startIndex)
  const [playing, setPlaying] = useState(true)
  const [speedIdx, setSpeedIdx] = useState(1) // default 2s
  const [progress, setProgress] = useState(0)
  const timerRef = useRef(null)
  const rafRef   = useRef(null)
  const startRef = useRef(null)

  const img = images[index] ?? images[0]
  const speedMs = SPEEDS[speedIdx].ms

  const goNext = useCallback(() => {
    setIndex(i => (i + 1) % images.length)
    setProgress(0)
  }, [images.length])

  const goPrev = useCallback(() => {
    setIndex(i => (i - 1 + images.length) % images.length)
    setProgress(0)
  }, [images.length])

  // Progress bar + auto-advance
  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(timerRef.current)
      return
    }
    setProgress(0)
    startRef.current = performance.now()

    const tick = (now) => {
      const elapsed = now - startRef.current
      const pct = Math.min(elapsed / speedMs, 1)
      setProgress(pct)
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        goNext()
        startRef.current = performance.now()
        setProgress(0)
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(rafRef.current) }
  }, [playing, speedMs, index, goNext])

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape')      { onClose(); return }
      if (e.key === 'ArrowRight')  { goNext(); return }
      if (e.key === 'ArrowLeft')   { goPrev(); return }
      if (e.key === ' ')           { e.preventDefault(); setPlaying(p => !p) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, goNext, goPrev])

  return (
    <div className={styles.overlay}>
      {/* Image */}
      <div className={styles.imgWrap}>
        {img?.isVideo
          ? <video key={img.path} src={img.url} className={styles.img} autoPlay muted loop playsInline />
          : <img key={img.path} src={img.url} alt={img?.name} className={styles.img} />
        }
      </div>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Top controls */}
      <div className={styles.topBar}>
        <div className={styles.counter}>{index + 1} / {images.length}</div>
        <div className={styles.fileName}>{img?.name}</div>
        <button className={styles.closeBtn} onClick={onClose} title="Esc">✕</button>
      </div>

      {/* Left / Right arrows */}
      <button className={`${styles.navBtn} ${styles.navLeft}`} onClick={goPrev}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button className={`${styles.navBtn} ${styles.navRight}`} onClick={goNext}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M8 4l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Bottom controls */}
      <div className={styles.bottomBar}>
        {/* Play / Pause */}
        <button className={styles.playBtn} onClick={() => setPlaying(p => !p)}>
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="4" y="3" width="4" height="12" rx="1.5" fill="currentColor"/>
              <rect x="10" y="3" width="4" height="12" rx="1.5" fill="currentColor"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M5 3l11 6-11 6V3z" fill="currentColor"/>
            </svg>
          )}
          <span>{playing ? t('slideshowPause') : t('slideshowPlay')}</span>
        </button>

        {/* Speed */}
        <div className={styles.speedGroup}>
          <span className={styles.speedLabel}>{t('slideshowSpeed')}</span>
          {SPEEDS.map((s, i) => (
            <button
              key={s.label}
              className={`${styles.speedBtn} ${speedIdx === i ? styles.speedBtnActive : ''}`}
              onClick={() => setSpeedIdx(i)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className={styles.thumbStrip}>
        {images.map((im, i) => (
          <button
            key={im.path}
            className={`${styles.thumb} ${i === index ? styles.thumbActive : ''}`}
            onClick={() => { setIndex(i); setProgress(0) }}
          >
            {im.isVideo
              ? <video src={im.url} className={styles.thumbImg} preload="metadata" muted playsInline />
              : <img src={im.url} alt={im.name} className={styles.thumbImg} loading="lazy" />
            }
          </button>
        ))}
      </div>
    </div>
  )
}
