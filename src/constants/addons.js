// ── Addon registry ────────────────────────────────────────────────────────────
// Each addon represents an installable extension for Lumina.
// authType: 'token' | 'oauth' | 'none'
// available: false = coming soon (grayed-out card)

export const ADDONS = {
  dropbox: {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Browse and view photos stored in your Dropbox.',
    authType: 'token',
    available: true,
    tokenHint: 'Get a personal access token at dropbox.com/developers/apps',
    tokenLabel: 'Access token',
    tokenPlaceholder: 'sl.AbCdEf...',
    color: '#0061ff',
  },
  gdrive: {
    id: 'gdrive',
    name: 'Google Drive',
    description: 'Access photos from Google Drive.',
    authType: 'oauth',
    available: false,
    color: '#4285f4',
  },
  onedrive: {
    id: 'onedrive',
    name: 'OneDrive',
    description: 'Access photos from Microsoft OneDrive.',
    authType: 'oauth',
    available: false,
    color: '#0078d4',
  },
  aitags: {
    id: 'aitags',
    name: 'AI Tags',
    description: 'Automatically tag photos using AI recognition.',
    authType: 'none',
    available: false,
    color: '#9333ea',
  },
  rawsupport: {
    id: 'rawsupport',
    name: 'RAW Support',
    description: 'Preview and convert RAW files (CR2, NEF, ARW…).',
    authType: 'none',
    available: false,
    color: '#ea580c',
  },
}

export const ADDON_LIST = Object.values(ADDONS)
