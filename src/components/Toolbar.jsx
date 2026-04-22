import { useState, useRef, useEffect } from 'react'
import { useLang, useLangCode, photoCountOf } from '../i18n/index'
import { tagColor } from '../utils/tags'
import { LABEL_COLORS, LABEL_ORDER } from '../utils/labels'
import styles from './Toolbar.module.css'

function ListIcon() {
  return <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <rect x="0" y="1" width="14" height="2" rx="1" fill="currentColor"/>
    <rect x="0" y="6" width="14" height="2" rx="1" fill="currentColor"/>
    <rect x="0" y="11" width="14" height="2" rx="1" fill="currentColor"/>
  </svg>
}
function GridIcon() {
  return <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <rect x="0" y="0" width="6" height="6" rx="1" fill="currentColor"/>
    <rect x="8" y="0" width="6" height="6" rx="1" fill="currentColor"/>
    <rect x="0" y="8" width="6" height="6" rx="1" fill="currentColor"/>
    <rect x="8" y="8" width="6" height="6" rx="1" fill="currentColor"/>
  </svg>
}

export default function Toolbar({ folder, albumName, count, total, gridSize, onGridSize, sortBy, onSort, search, onSearch, showSubfolders, onToggleSubfolders, subfolderCount, availableTags, tagFilter, onTagFilter, viewMode, onViewMode, labelFilter, onLabelFilter, onSlideshow, smartFilter, onSmartFilter }) {
  const t    = useLang()
  const lang = useLangCode()
  const folderName = albumName ?? (folder ? folder.split(/[\\/]/).pop() : '')
  const [tagOpen, setTagOpen] = useState(false)
  const tagRef = useRef(null)
  const [sfOpen, setSfOpen] = useState(false)
  const sfRef = useRef(null)

  // Close tag dropdown on outside click
  useEffect(() => {
    if (!tagOpen) return
    const handler = (e) => { if (tagRef.current && !tagRef.current.contains(e.target)) setTagOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [tagOpen])

  // Close smart filter panel on outside click
  useEffect(() => {
    if (!sfOpen) return
    const handler = (e) => { if (sfRef.current && !sfRef.current.contains(e.target)) setSfOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sfOpen])

  const toggleTag = (tag) => {
    onTagFilter(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <span className={styles.folderName}>{folderName}</span>
        <span className={styles.count}>{photoCountOf(count, total, lang)}</span>
      </div>

      <div className={styles.center}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="13" height="13" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            className={styles.search}
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => onSearch('')}>✕</button>
          )}
        </div>
      </div>

      <div className={styles.right}>
        {subfolderCount > 0 && (
          <button
            className={`${styles.iconToggle} ${showSubfolders ? styles.active : ''}`}
            onClick={onToggleSubfolders}
            title={showSubfolders ? t('hideSubfolders') : t('showSubfoldersTip')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M1 4.5A1.5 1.5 0 012.5 3h3.086a1.5 1.5 0 011.06.44L7.72 4.5H13.5A1.5 1.5 0 0115 6v6a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5V4.5z" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M5 9.5h6M8 7v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            {subfolderCount}
          </button>
        )}

        {/* Tag filter */}
        {availableTags?.length > 0 && (
          <div ref={tagRef} className={styles.tagFilterWrap}>
            <button
              className={`${styles.iconToggle} ${tagFilter?.length > 0 ? styles.active : ''}`}
              onClick={() => setTagOpen(v => !v)}
              title={t('filterByTag')}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {tagFilter?.length > 0 ? tagFilter.length : ''}
            </button>

            {tagOpen && (
              <div className={styles.tagDropdown}>
                <div className={styles.tagDropdownTitle}>{t('filterByTag')}</div>
                <div className={styles.tagDropdownList}>
                  {availableTags.map(tag => {
                    const c = tagColor(tag)
                    const active = tagFilter?.includes(tag)
                    return (
                      <button
                        key={tag}
                        className={`${styles.tagChip} ${active ? styles.tagChipActive : ''}`}
                        style={active ? { background: c.bg, borderColor: c.border, color: c.text } : {}}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
                {tagFilter?.length > 0 && (
                  <button className={styles.clearTagsBtn} onClick={() => { onTagFilter([]); setTagOpen(false) }}>
                    {t('clearTagFilter')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Label filter */}
        {onLabelFilter && (
          <div className={styles.labelFilterWrap}>
            {LABEL_ORDER.map(color => (
              <button
                key={color}
                className={`${styles.labelFilterBtn} ${labelFilter === color ? styles.labelFilterActive : ''}`}
                style={{ '--lc': LABEL_COLORS[color].dot }}
                title={t(`label${color.charAt(0).toUpperCase() + color.slice(1)}`)}
                onClick={() => onLabelFilter(labelFilter === color ? null : color)}
              >
                <span className={styles.labelFilterDot} />
              </button>
            ))}
          </div>
        )}

        {/* Smart Filter */}
        {onSmartFilter && (() => {
          const activeCount = Object.values(smartFilter ?? {}).filter(Boolean).length
          return (
            <div ref={sfRef} className={styles.sfWrap}>
              <button
                className={`${styles.iconToggle} ${activeCount > 0 ? styles.active : ''}`}
                onClick={() => setSfOpen(v => !v)}
                title={t('smartFilter')}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M1 3h14M3 7h10M6 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {activeCount > 0 ? activeCount : ''}
              </button>
              {sfOpen && <SmartFilterPanel filter={smartFilter} onChange={onSmartFilter} onClose={() => setSfOpen(false)} t={t} />}
            </div>
          )
        })()}

        {/* Slideshow */}
        {onSlideshow && (
          <button className={styles.iconToggle} onClick={onSlideshow} title={t('slideshowStart')}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M6.5 5.5l5 2.5-5 2.5V5.5z" fill="currentColor"/>
            </svg>
          </button>
        )}

        <button
          className={`${styles.iconToggle} ${viewMode === 'list' ? styles.active : ''}`}
          onClick={() => onViewMode(viewMode === 'list' ? 'grid' : 'list')}
          title={t('viewToggle')}
        >
          {viewMode === 'list' ? <GridIcon /> : <ListIcon />}
        </button>

        <select className={styles.select} value={sortBy} onChange={e => onSort(e.target.value)}>
          <option value="name">{t('sortName')}</option>
          <option value="date">{t('sortDate')}</option>
          <option value="size">{t('sortSize')}</option>
          <option value="type">{t('sortType')}</option>
        </select>

        {viewMode !== 'list' && (
          <div className={styles.sizeGroup}>
            {['small', 'medium', 'large'].map(s => (
              <button
                key={s}
                className={`${styles.sizeBtn} ${gridSize === s ? styles.active : ''}`}
                onClick={() => onGridSize(s)}
                title={s === 'small' ? t('gridSmall') : s === 'medium' ? t('gridMedium') : t('gridLarge')}
              >
                {s === 'small' && <GridSmall />}
                {s === 'medium' && <GridMedium />}
                {s === 'large' && <GridLarge />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SmartFilterPanel({ filter, onChange, onClose, t }) {
  const set = (key, val) => onChange({ ...filter, [key]: val === filter[key] ? null : val })
  const activeCount = Object.values(filter ?? {}).filter(Boolean).length

  return (
    <div className={styles.sfPanel}>
      <div className={styles.sfTitle}>{t('smartFilter')}</div>

      {/* Orientation */}
      <div className={styles.sfSection}>
        <div className={styles.sfSectionLabel}>{t('sfOrientation')}</div>
        <div className={styles.sfChips}>
          {[['landscape','sfLandscape'],['portrait','sfPortrait'],['square','sfSquare']].map(([val, key]) => (
            <button key={val} className={`${styles.sfChip} ${filter.orientation === val ? styles.sfChipActive : ''}`}
              onClick={() => set('orientation', val)}>{t(key)}</button>
          ))}
        </div>
      </div>

      {/* Type */}
      <div className={styles.sfSection}>
        <div className={styles.sfSectionLabel}>{t('sfType')}</div>
        <div className={styles.sfChips}>
          {[['photos','sfPhotos'],['videos','sfVideos']].map(([val, key]) => (
            <button key={val} className={`${styles.sfChip} ${filter.type === val ? styles.sfChipActive : ''}`}
              onClick={() => set('type', val)}>{t(key)}</button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div className={styles.sfSection}>
        <div className={styles.sfSectionLabel}>{t('sfSize')}</div>
        <div className={styles.sfChips}>
          {[['tiny','sfTiny'],['small','sfSmall'],['medium','sfMedium'],['large','sfLarge']].map(([val, key]) => (
            <button key={val} className={`${styles.sfChip} ${filter.sizeRange === val ? styles.sfChipActive : ''}`}
              onClick={() => set('sizeRange', val)}>{t(key)}</button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div className={styles.sfSection}>
        <div className={styles.sfSectionLabel}>{t('sfDate')}</div>
        <div className={styles.sfChips}>
          {[['today','sfToday'],['thisweek','sfThisWeek'],['thismonth','sfThisMonth'],['thisyear','sfThisYear']].map(([val, key]) => (
            <button key={val} className={`${styles.sfChip} ${filter.dateRange === val ? styles.sfChipActive : ''}`}
              onClick={() => set('dateRange', val)}>{t(key)}</button>
          ))}
        </div>
      </div>

      {activeCount > 0 && (
        <button className={styles.sfClearBtn} onClick={() => { onChange({ orientation: null, type: null, sizeRange: null, dateRange: null }); onClose() }}>
          {t('sfClearAll')}
        </button>
      )}
    </div>
  )
}

function GridSmall() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <rect x="0" y="0" width="3" height="3"/><rect x="4" y="0" width="3" height="3"/><rect x="8" y="0" width="3" height="3"/><rect x="12" y="0" width="2" height="3"/>
    <rect x="0" y="4" width="3" height="3"/><rect x="4" y="4" width="3" height="3"/><rect x="8" y="4" width="3" height="3"/><rect x="12" y="4" width="2" height="3"/>
    <rect x="0" y="8" width="3" height="3"/><rect x="4" y="8" width="3" height="3"/><rect x="8" y="8" width="3" height="3"/>
  </svg>
}

function GridMedium() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <rect x="0" y="0" width="4" height="4"/><rect x="5" y="0" width="4" height="4"/><rect x="10" y="0" width="4" height="4"/>
    <rect x="0" y="5" width="4" height="4"/><rect x="5" y="5" width="4" height="4"/><rect x="10" y="5" width="4" height="4"/>
    <rect x="0" y="10" width="4" height="4"/><rect x="5" y="10" width="4" height="4"/>
  </svg>
}

function GridLarge() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <rect x="0" y="0" width="6" height="6"/><rect x="8" y="0" width="6" height="6"/>
    <rect x="0" y="8" width="6" height="6"/><rect x="8" y="8" width="6" height="6"/>
  </svg>
}
