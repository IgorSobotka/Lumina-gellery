const TRASH_KEY = 'lumina_trash'

export function loadTrash() {
  try { return JSON.parse(localStorage.getItem(TRASH_KEY) || '[]') } catch { return [] }
}

export function saveTrash(items) {
  localStorage.setItem(TRASH_KEY, JSON.stringify(items))
}
