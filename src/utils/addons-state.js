// ── Addon state (localStorage) ────────────────────────────────────────────────
// Shape: { dropbox: { token: '...', accountName: '...' } | null, ... }

const KEY = 'lumina_addons'

export function loadAddons() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') }
  catch { return {} }
}

export function saveAddons(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function connectAddon(state, id, data) {
  const next = { ...state, [id]: data }
  saveAddons(next)
  return next
}

export function disconnectAddon(state, id) {
  const next = { ...state, [id]: null }
  saveAddons(next)
  return next
}

export function isConnected(state, id) {
  return !!(state?.[id])
}
