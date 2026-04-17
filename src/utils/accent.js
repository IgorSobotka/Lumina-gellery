export const ACCENTS = [
  { id: 'lavender', label: 'Lawenda',   hex: '#c4a3e8', hover: '#d0b4ee', r:196, g:163, b:232 },
  { id: 'blue',     label: 'Błękit',    hex: '#93b4f5', hover: '#a8c4f8', r:147, g:180, b:245 },
  { id: 'teal',     label: 'Turkus',    hex: '#7dd3c8', hover: '#91dbd1', r:125, g:211, b:200 },
  { id: 'mint',     label: 'Miętowy',   hex: '#86d9a0', hover: '#9ae0b2', r:134, g:217, b:160 },
  { id: 'peach',    label: 'Brzoskw.',  hex: '#f5a87d', hover: '#f8b892', r:245, g:168, b:125 },
  { id: 'rose',     label: 'Róż',       hex: '#f09bbf', hover: '#f4b0ce', r:240, g:155, b:191 },
  { id: 'gold',     label: 'Złoty',     hex: '#e8d07a', hover: '#ecd98f', r:232, g:208, b:122 },
]

export function accentHex(id, customHex) {
  if (id === 'custom' && customHex) return customHex
  return ACCENTS.find(x => x.id === id)?.hex ?? ACCENTS[0].hex
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return { r: 196, g: 163, b: 232 }
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

function lighten(hex, amt = 20) {
  const { r, g, b } = hexToRgb(hex)
  return `#${[r, g, b].map(c => Math.min(255, c + amt).toString(16).padStart(2, '0')).join('')}`
}

function mixWhite(hex, f = 0.62) {
  const { r, g, b } = hexToRgb(hex)
  const m = c => Math.min(255, Math.round(c + (255 - c) * f))
  return `#${[r, g, b].map(c => m(c).toString(16).padStart(2, '0')).join('')}`
}

export function applyAccent(id, customHex) {
  const hex = accentHex(id, customHex)
  const { r, g, b } = hexToRgb(hex)
  const root = document.documentElement
  root.style.setProperty('--accent',       hex)
  root.style.setProperty('--accent-rgb',   `${r}, ${g}, ${b}`)
  root.style.setProperty('--accent-hover', lighten(hex, 16))
  root.style.setProperty('--accent-text',  mixWhite(hex, 0.62))
  root.style.setProperty('--accent-glow',  `rgba(${r},${g},${b},0.55)`)
  root.style.setProperty('--accent-glass', `rgba(${r},${g},${b},0.22)`)
}
