const KEY = 'lumina_labels'

export const LABEL_COLORS = {
  red:    { dot: '#ff3b30', bg: 'rgba(255,59,48,0.20)',  border: 'rgba(255,59,48,0.55)'  },
  orange: { dot: '#ff9500', bg: 'rgba(255,149,0,0.20)',  border: 'rgba(255,149,0,0.55)'  },
  yellow: { dot: '#ffd60a', bg: 'rgba(255,214,10,0.20)', border: 'rgba(255,214,10,0.55)' },
  green:  { dot: '#34c759', bg: 'rgba(52,199,89,0.20)',  border: 'rgba(52,199,89,0.55)'  },
  blue:   { dot: '#0a84ff', bg: 'rgba(10,132,255,0.20)', border: 'rgba(10,132,255,0.55)' },
  purple: { dot: '#bf5af2', bg: 'rgba(191,90,242,0.20)', border: 'rgba(191,90,242,0.55)' },
}

export const LABEL_ORDER = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']

export function loadLabels() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function saveLabels(labels) {
  localStorage.setItem(KEY, JSON.stringify(labels))
}
