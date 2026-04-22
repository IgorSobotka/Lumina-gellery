import { useState } from 'react'
import { useLang } from '../../../i18n/index'
import { ADDON_LIST } from '../../../constants/addons'
import { connectAddon, disconnectAddon } from '../../../utils/addons-state'
import styles from './AddonsPanel.module.css'

// ── Provider SVG icons ────────────────────────────────────────────────────────
function DropboxIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <path d="M10 4L20 11 10 18 0 11 10 4zM30 4l10 7-10 7-10-7 10-7zM0 29l10-7 10 7-10 7-10-7zM30 22l10 7-10 7-10-7 10-7zM10 31l10-7 10 7" fill="#0061ff"/>
    </svg>
  )
}

function GDriveIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M4.5 21L8.5 14H0L4.5 21z" fill="#0066da"/>
      <path d="M19.5 21L15.5 14H24L19.5 21z" fill="#00ac47"/>
      <path d="M8.5 14L12 21 15.5 14 12 7 8.5 14z" fill="#ffba00"/>
    </svg>
  )
}

function OneDriveIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <ellipse cx="8" cy="17" rx="7" ry="4.5" fill="#0078d4" opacity="0.7"/>
      <ellipse cx="17" cy="15" rx="6" ry="4.5" fill="#0078d4"/>
      <path d="M5 12a6 6 0 0110.8-3.6A5 5 0 0122 13" stroke="#0078d4" strokeWidth="1.2" fill="none" opacity="0.5"/>
    </svg>
  )
}

function AITagsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35 4.5-1.2 8-6.1 8-11.35V6l-8-4z"
        stroke="#9333ea" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 12l2 2 4-4" stroke="#9333ea" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function RawIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#ea580c" strokeWidth="1.5"/>
      <text x="12" y="15.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="#ea580c" fontFamily="monospace">RAW</text>
    </svg>
  )
}

const ICONS = {
  dropbox:    <DropboxIcon />,
  gdrive:     <GDriveIcon />,
  onedrive:   <OneDriveIcon />,
  aitags:     <AITagsIcon />,
  rawsupport: <RawIcon />,
}

// ── Dropbox OAuth card ────────────────────────────────────────────────────────
function DropboxCard({ addon, addonState, onConnect, onDisconnect }) {
  const t = useLang()
  const connected = !!addonState
  const [expanded, setExpanded]     = useState(false)
  const [appKey,   setAppKey]       = useState(addonState?.appKey ?? '')
  const [loading,  setLoading]      = useState(false)
  const [error,    setError]        = useState(null)

  const handleLogin = async () => {
    if (!appKey.trim()) return
    setLoading(true); setError(null)
    const res = await window.api.cloudOAuthStart('dropbox', appKey.trim())
    setLoading(false)
    if (res.success) {
      onConnect('dropbox', {
        appKey:       appKey.trim(),
        token:        res.accessToken,
        refreshToken: res.refreshToken,
        accountName:  res.accountName,
      })
      setExpanded(false)
    } else {
      setError(res.error || t('addonConnectFail'))
    }
  }

  const handleDisconnect = () => {
    onDisconnect('dropbox')
  }

  return (
    <div className={`${styles.card} ${connected ? styles.cardConnected : ''}`}>
      {/* Header row */}
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}>{ICONS.dropbox}</div>
        <div className={styles.cardInfo}>
          <div className={styles.cardName}>{addon.name}</div>
          <div className={styles.cardDesc}>{addon.description}</div>
        </div>
        {connected && (
          <div className={styles.connectedBadge}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="5" fill="#22c55e"/>
              <path d="M3 5l1.5 1.5L7 3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Connected state */}
      {connected && (
        <div className={styles.connectedRow}>
          <div className={styles.accountInfo}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="rgba(34,197,94,0.8)" strokeWidth="1.4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(34,197,94,0.8)" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span className={styles.accountName}>{addonState.accountName || 'Dropbox'}</span>
          </div>
          <button className={styles.disconnectBtn} onClick={handleDisconnect}>
            {t('addonDisconnect')}
          </button>
        </div>
      )}

      {/* Not connected: connect button or expanded App Key form */}
      {!connected && !expanded && (
        <div className={styles.actionRow}>
          <button className={styles.connectBtn} onClick={() => { setExpanded(true); setError(null) }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M6 2L12 6.5 6 11 0 6.5 6 2zM18 2l6 4.5-6 4.5-6-4.5L18 2zM0 17.5L6 13l6 4.5-6 4.5-6-4.5zM18 13l6 4.5-6 4.5-6-4.5L18 13z" fill="currentColor"/>
            </svg>
            {t('addonConnect')} Dropbox
          </button>
        </div>
      )}

      {!connected && expanded && (
        <div className={styles.oauthForm}>
          {/* Step 1 hint */}
          <div className={styles.oauthStep}>
            <span className={styles.stepNum}>1</span>
            <span className={styles.stepText}>
              {t('addonAppKeyStep1')}
              {' '}
              <a
                href="https://www.dropbox.com/developers/apps/create"
                target="_blank"
                rel="noreferrer"
                className={styles.stepLink}
                onClick={e => { e.preventDefault(); window.api?.openFile?.('https://www.dropbox.com/developers/apps/create') || require?.('electron')?.shell?.openExternal?.('https://www.dropbox.com/developers/apps/create') }}
              >
                dropbox.com/developers/apps
              </a>
              {' '}→ {t('addonAppKeyStep1b')}
            </span>
          </div>

          {/* Step 2 */}
          <div className={styles.oauthStep}>
            <span className={styles.stepNum}>2</span>
            <span className={styles.stepText}>{t('addonAppKeyStep2')}</span>
          </div>

          {/* App Key input */}
          <div className={styles.appKeyRow}>
            <label className={styles.appKeyLabel}>{t('addonAppKey')}</label>
            <input
              className={styles.tokenInput}
              type="text"
              placeholder="abc123xyz..."
              value={appKey}
              onChange={e => { setAppKey(e.target.value); setError(null) }}
              onKeyDown={e => { if (e.key === 'Enter') handleLogin(); if (e.key === 'Escape') { setExpanded(false) } }}
              autoFocus
              spellCheck={false}
            />
          </div>

          {error && <div className={styles.tokenError}>{error}</div>}

          <div className={styles.tokenBtns}>
            <button className={styles.cancelBtn} onClick={() => { setExpanded(false); setError(null) }}>
              {t('pvCancel')}
            </button>
            <button
              className={`${styles.confirmBtn} ${styles.oauthBtn}`}
              onClick={handleLogin}
              disabled={!appKey.trim() || loading}
            >
              {loading ? (
                <><span className={styles.miniSpinner} />{t('addonLoggingIn')}</>
              ) : (
                <>{t('addonLoginWith')} Dropbox</>
              )}
            </button>
          </div>

          <div className={styles.redirectHint}>
            {t('addonRedirectHint')} <code className={styles.redirectCode}>http://localhost:39412/callback</code>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Generic "coming soon" card ────────────────────────────────────────────────
function SoonCard({ addon }) {
  const t = useLang()
  return (
    <div className={`${styles.card} ${styles.cardSoon}`}>
      <div className={styles.soonBadge}>{t('soon')}</div>
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}>{ICONS[addon.id]}</div>
        <div className={styles.cardInfo}>
          <div className={styles.cardName}>{addon.name}</div>
          <div className={styles.cardDesc}>{addon.description}</div>
        </div>
      </div>
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export default function AddonsPanel({ addons, onAddonsChange }) {
  const t = useLang()

  const handleConnect = (id, data) => {
    window.api.cloudSetToken(id, data.token)
    onAddonsChange(connectAddon(addons, id, data))
  }

  const handleDisconnect = (id) => {
    window.api.cloudSetToken(id, null)
    onAddonsChange(disconnectAddon(addons, id))
  }

  return (
    <div className={styles.panel}>
      <div className={styles.sectionTitle}>{t('addonsSectionTitle')}</div>
      <div className={styles.sectionDesc}>{t('addonsSectionDesc')}</div>
      <div className={styles.grid}>
        {ADDON_LIST.map(addon => {
          if (!addon.available) return <SoonCard key={addon.id} addon={addon} />
          if (addon.id === 'dropbox') return (
            <DropboxCard
              key={addon.id}
              addon={addon}
              addonState={addons?.[addon.id] ?? null}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          )
          return null
        })}
      </div>
    </div>
  )
}
