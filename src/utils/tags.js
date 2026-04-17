const KEY = 'lumina_tags'

export function loadTags() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function saveTags(tags) {
  localStorage.setItem(KEY, JSON.stringify(tags))
}

// Consistent color per tag name (hash → 6 presets)
const COLORS = [
  { bg: 'rgba(var(--accent-rgb),0.22)',  border: 'rgba(var(--accent-rgb),0.55)', text: 'rgba(220,170,255,0.95)' },
  { bg: 'rgba(10,132,255,0.22)',  border: 'rgba(10,132,255,0.55)',  text: 'rgba(140,200,255,0.95)' },
  { bg: 'rgba(52,199,89,0.22)',   border: 'rgba(52,199,89,0.55)',   text: 'rgba(140,230,160,0.95)' },
  { bg: 'rgba(255,149,0,0.22)',   border: 'rgba(255,149,0,0.55)',   text: 'rgba(255,200,110,0.95)' },
  { bg: 'rgba(255,55,95,0.22)',   border: 'rgba(255,55,95,0.55)',   text: 'rgba(255,150,170,0.95)' },
  { bg: 'rgba(90,200,250,0.22)',  border: 'rgba(90,200,250,0.55)', text: 'rgba(170,235,255,0.95)' },
]

export function tagColor(tag) {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) & 0xffff
  return COLORS[h % COLORS.length]
}

// All unique tags across all images
export function allTags(tags) {
  return [...new Set(Object.values(tags).flat())].sort()
}
