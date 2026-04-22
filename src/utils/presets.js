import { DEFAULT_EDIT } from '../components/Editor/editorUtils'

export const EDITOR_PRESETS = [
  { id: 'bw',      labelKey: 'presetBW',      edit: { ...DEFAULT_EDIT, saturation: 0, contrast: 125, brightness: 110 } },
  { id: 'vintage', labelKey: 'presetVintage',  edit: { ...DEFAULT_EDIT, saturation: 72, contrast: 88, brightness: 108, temperature: 32, vignette: 38 } },
  { id: 'vivid',   labelKey: 'presetVivid',    edit: { ...DEFAULT_EDIT, saturation: 155, contrast: 118, brightness: 100, exposure: 5 } },
  { id: 'cool',    labelKey: 'presetCool',     edit: { ...DEFAULT_EDIT, temperature: -65, saturation: 88, contrast: 105 } },
  { id: 'warm',    labelKey: 'presetWarm',     edit: { ...DEFAULT_EDIT, temperature: 65, saturation: 108 } },
  { id: 'fade',    labelKey: 'presetFade',     edit: { ...DEFAULT_EDIT, contrast: 78, brightness: 112, saturation: 82, vignette: 22 } },
]
