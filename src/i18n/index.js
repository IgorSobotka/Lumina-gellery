import { createContext, useContext } from 'react'

// ── Translations ────────────────────────────────────────────────────────────
const pl = {
  // Sidebar
  openFolder:       'Otwórz folder',
  currentFolder:    'Aktualny folder',
  parentFolder:     'Folder nadrzędny',
  subfoldersSec:    'Podfoldery',
  recentSec:        'Ostatnie',
  favoritesSec:     'Ulubione',
  settingsBtn:      'Ustawienia',
  addToFav:         'Dodaj do ulubionych',
  removeFromFav:    'Usuń z ulubionych',
  noFavorites:      'Brak ulubionych',

  // Toolbar
  searchPlaceholder: 'Szukaj...',
  hideSubfolders:    'Ukryj podfoldery',
  showSubfoldersTip: 'Pokaż podfoldery',
  sortName:          'Nazwa',
  sortDate:          'Data',
  sortSize:          'Rozmiar',
  sortType:          'Typ',
  gridSmall:         'Małe',
  gridMedium:        'Średnie',
  gridLarge:         'Duże',
  viewToggle:        'Widok listy / siatki',

  // Welcome
  subtitle:        'Piękna galeria zdjęć',
  openFolderBtn:   'Otwórz folder ze zdjęciami',
  dragHint:        'lub przeciągnij folder tutaj',
  recentlyOpened:  'Ostatnio otwierane',

  // Gallery
  loading:    'Ładowanie...',
  noPhotos:   'Brak zdjęć w tym folderze',
  photosSec:  'Zdjęcia',
  quality:          'Jakość',
  locationLabel:    'Lokalizacja',
  nextToOriginal:   'Obok oryginału',
  exportAll:        'Eksportuj wszystkie',
  folderType:       'Folder',
  selectedLabel:    'zaznaczone',
  deleteSelected:   'Usuń zaznaczone',
  clearSelection:   'Odznacz wszystkie',

  // Context menu
  open:             'Otwórz',
  showInExplorer:   'Pokaż w Eksploratorze',
  showInFinder:     'Pokaż w Finderze',
  copyPath:         'Kopiuj ścieżkę',
  copyFilename:     'Kopiuj nazwę pliku',
  fileInfo:         'Informacje o pliku',
  openFolderAction: 'Otwórz folder',
  removeFromAlbum:  'Usuń z albumu',
  moveToTrash:      'Przenieś do kosza',
  selectAll:        'Zaznacz wszystkie',
  deselectAll:      'Odznacz wszystkie',
  exportSelected:   'Eksportuj zaznaczone',
  galleryLabel:     'Galeria',

  // Sidebar
  trash: 'Kosz',

  // Settings
  settingsTitle: 'Ustawienia',
  appearance:    'Wygląd',
  general:       'Ogólne',
  shortcuts:     'Skróty',
  about:         'O aplikacji',
  soon:          'wkrótce',
  closeEsc:      'Zamknij (Esc)',

  // Appearance panel
  wallpaperSec:    'Tapeta',
  wallpaperDesc:   'Wybierz gradient tła aplikacji.',
  blurTitle:       'Rozmycie tła',
  blurDesc:        'Dodatkowe rozmycie tapety.',
  customWallpaper: 'Własny',

  // General panel
  languageTitle: 'Język',
  languageDesc:  'Język interfejsu aplikacji.',

  // Startup
  startupTitle:    'Otwieranie przy starcie',
  startupDesc:     'Co otworzyć po uruchomieniu aplikacji.',
  startupLast:     'Ostatni album',
  startupSpecific: 'Określony album',
  startupFolder:   'Folder startowy',
  chooseFolder:    'Wybierz folder',
  noFolderChosen:  'Nie wybrano folderu',

  // Tags
  tagsSec:          'Tagi',
  addTagPlaceholder:'Dodaj tag...',
  noTags:           'Brak tagów',
  filterByTag:      'Filtruj po tagach',
  clearTagFilter:   'Wyczyść filtry',

  // Albums
  albumsSec:        'Albumy',
  newAlbum:         'Nowy album',
  albumNamePlaceholder: 'Nazwa albumu...',
  addToAlbum:       'Dodaj do albumu',
  deleteAlbum:      'Usuń album',
  noAlbums:         'Brak albumów',
  albumEmpty:       'Album jest pusty',
  createAndAdd:     'Utwórz i dodaj',
  alreadyInAlbum:   'Już w albumie',
  albumView:        'Album',

  // TitleBar window controls
  minimize:   'Minimalizuj',
  restore:    'Przywróć',
  maximize:   'Maksymalizuj',
  close:      'Zamknij',

  // Lightbox
  exportPanelTitle:  'Eksport',
  copyLocation:      'Lokalizacja kopii',
  chooseDest:        'Wybierz…',
  saveCopy:          '💾 Zapisz kopię',
  noChangesToSave:   'Brak zmian do zapisania',
  willOverwrite:     'Nadpisze plik oryginalny!',
  overwriteOriginal: '⚠ Nadpisz oryginał',
  noEditsHint:       'Brak edycji — eksportuje oryginał',
  applyCrop:         '✓ Zastosuj',
  cancelCrop:        'Anuluj',
  exportSaveBtn:     'Eksportuj / Zapisz',
  resetZoom:         'Reset zoom',
  openEditor:        'Otwórz edytor',
  editorPanel:       'Edytor',
  prevImage:         'Poprzednie (←)',
  nextImage:         'Następne (→)',
  infoPanel:         'Informacje',
  infoBtn:           'Informacje',
  infoName:          'Nazwa',
  infoFormat:        'Format',
  infoSize:          'Rozmiar',
  infoDate:          'Data',
  infoPath:          'Ścieżka',

  // EXIF
  exifSection:       'Dane EXIF',
  exifCamera:        'Aparat',
  exifLens:          'Obiektyw',
  exifFocalLength:   'Ogniskowa',
  exifExposure:      'Czas naśw.',
  exifAperture:      'Przysłona',
  exifISO:           'ISO',
  exifDateTaken:     'Data zdjęcia',
  exifGPS:           'Lokalizacja',
  exifFlash:         'Lampa',
  exifNoData:        'Brak danych EXIF',

  cropBadge:         '✂ Kadrowanie — przeciągnij uchwyty, kliknij Zastosuj',
  savedSuccess:      '✓ Zapisano!',
  saveError:         '✕ Błąd zapisu',
  errorGeneric:      '✕ Błąd',

  // Editor
  cropSection:      'Kadrowanie',
  cropBtn:          'Kadruj',
  removeCropTitle:  'Usuń kadrowanie',
  removeCropBtn:    'Usuń',
  geometrySection:  'Geometria',
  rotateLeft:       'Lewo',
  rotateRight:      'Prawo',
  toneSection:      'Ton',
  brightness:       'Jasność',
  contrast:         'Kontrast',
  saturation:       'Nasycenie',
  exposure:         'Ekspozycja',
  resetAll:         '↩ Resetuj wszystko',

  // Trash
  trashEmpty:       'Kosz jest pusty',
  restoreSelected:  'Przywróć zaznaczone',
  restoreAll:       'Przywróć wszystkie',
  emptyTrash:       'Opróżnij kosz',

  // Cache panel
  cacheTitle:    'Pamięć podręczna miniatur',
  cacheDesc:     'Miniatury są generowane automatycznie i przechowywane lokalnie dla szybszego ładowania.',
  cacheLoading:  'Ładowanie…',
  cacheClearing: 'Czyszczenie…',
  cacheCleared:  '✓ Wyczyszczono',
  cacheClear:    'Wyczyść cache',
  cacheMbSuffix: '% z 300 MB',

  // Locale for date formatting
  locale: 'pl-PL',
}

const en = {
  // Sidebar
  openFolder:       'Open folder',
  currentFolder:    'Current folder',
  parentFolder:     'Parent folder',
  subfoldersSec:    'Subfolders',
  recentSec:        'Recent',
  favoritesSec:     'Favorites',
  settingsBtn:      'Settings',
  addToFav:         'Add to favorites',
  removeFromFav:    'Remove from favorites',
  noFavorites:      'No favorites yet',

  // Toolbar
  searchPlaceholder: 'Search...',
  hideSubfolders:    'Hide subfolders',
  showSubfoldersTip: 'Show subfolders',
  sortName:          'Name',
  sortDate:          'Date',
  sortSize:          'Size',
  sortType:          'Type',
  gridSmall:         'Small',
  gridMedium:        'Medium',
  gridLarge:         'Large',
  viewToggle:        'List / grid view',

  // Welcome
  subtitle:        'A beautiful photo gallery',
  openFolderBtn:   'Open photo folder',
  dragHint:        'or drag a folder here',
  recentlyOpened:  'Recently opened',

  // Gallery
  loading:    'Loading...',
  noPhotos:   'No photos in this folder',
  photosSec:  'Photos',
  quality:          'Quality',
  locationLabel:    'Location',
  nextToOriginal:   'Next to original',
  exportAll:        'Export all',
  folderType:       'Folder',
  selectedLabel:    'selected',
  deleteSelected:   'Delete selected',
  clearSelection:   'Deselect all',

  // Context menu
  open:             'Open',
  showInExplorer:   'Show in Explorer',
  showInFinder:     'Show in Finder',
  copyPath:         'Copy path',
  copyFilename:     'Copy filename',
  fileInfo:         'File info',
  openFolderAction: 'Open folder',
  removeFromAlbum:  'Remove from album',
  moveToTrash:      'Move to trash',
  selectAll:        'Select all',
  deselectAll:      'Deselect all',
  exportSelected:   'Export selected',
  galleryLabel:     'Gallery',

  // Sidebar
  trash: 'Trash',

  // Settings
  settingsTitle: 'Settings',
  appearance:    'Appearance',
  general:       'General',
  shortcuts:     'Shortcuts',
  about:         'About',
  soon:          'soon',
  closeEsc:      'Close (Esc)',

  // Appearance panel
  wallpaperSec:    'Wallpaper',
  wallpaperDesc:   'Choose the app background gradient.',
  blurTitle:       'Background blur',
  blurDesc:        'Additional wallpaper blur.',
  customWallpaper: 'Custom',

  // General panel
  languageTitle: 'Language',
  languageDesc:  'App interface language.',

  // Startup
  startupTitle:    'Startup behavior',
  startupDesc:     'What to open when the app launches.',
  startupLast:     'Last album',
  startupSpecific: 'Specific album',
  startupFolder:   'Startup folder',
  chooseFolder:    'Choose folder',
  noFolderChosen:  'No folder chosen',

  // Tags
  tagsSec:          'Tags',
  addTagPlaceholder:'Add tag...',
  noTags:           'No tags',
  filterByTag:      'Filter by tag',
  clearTagFilter:   'Clear filters',

  // Albums
  albumsSec:        'Albums',
  newAlbum:         'New album',
  albumNamePlaceholder: 'Album name...',
  addToAlbum:       'Add to album',
  deleteAlbum:      'Delete album',
  noAlbums:         'No albums yet',
  albumEmpty:       'Album is empty',
  createAndAdd:     'Create & add',
  alreadyInAlbum:   'Already in album',
  albumView:        'Album',

  // TitleBar window controls
  minimize:   'Minimize',
  restore:    'Restore',
  maximize:   'Maximize',
  close:      'Close',

  // Lightbox
  exportPanelTitle:  'Export',
  copyLocation:      'Copy location',
  chooseDest:        'Choose…',
  saveCopy:          '💾 Save copy',
  noChangesToSave:   'No changes to save',
  willOverwrite:     'Will overwrite original!',
  overwriteOriginal: '⚠ Overwrite original',
  noEditsHint:       'No edits — exports original',
  applyCrop:         '✓ Apply',
  cancelCrop:        'Cancel',
  exportSaveBtn:     'Export / Save',
  resetZoom:         'Reset zoom',
  openEditor:        'Open editor',
  editorPanel:       'Editor',
  prevImage:         'Previous (←)',
  nextImage:         'Next (→)',
  infoPanel:         'Info',
  infoBtn:           'Info',
  infoName:          'Name',
  infoFormat:        'Format',
  infoSize:          'Size',
  infoDate:          'Date',
  infoPath:          'Path',

  // EXIF
  exifSection:       'EXIF Data',
  exifCamera:        'Camera',
  exifLens:          'Lens',
  exifFocalLength:   'Focal length',
  exifExposure:      'Exposure',
  exifAperture:      'Aperture',
  exifISO:           'ISO',
  exifDateTaken:     'Date taken',
  exifGPS:           'Location',
  exifFlash:         'Flash',
  exifNoData:        'No EXIF data',

  cropBadge:         '✂ Crop — drag handles, click Apply',
  savedSuccess:      '✓ Saved!',
  saveError:         '✕ Save error',
  errorGeneric:      '✕ Error',

  // Editor
  cropSection:      'Crop',
  cropBtn:          'Crop',
  removeCropTitle:  'Remove crop',
  removeCropBtn:    'Remove',
  geometrySection:  'Geometry',
  rotateLeft:       'Left',
  rotateRight:      'Right',
  toneSection:      'Tone',
  brightness:       'Brightness',
  contrast:         'Contrast',
  saturation:       'Saturation',
  exposure:         'Exposure',
  resetAll:         '↩ Reset all',

  // Trash
  trashEmpty:       'Trash is empty',
  restoreSelected:  'Restore selected',
  restoreAll:       'Restore all',
  emptyTrash:       'Empty trash',

  // Cache panel
  cacheTitle:    'Thumbnail cache',
  cacheDesc:     'Thumbnails are generated automatically and stored locally for faster loading.',
  cacheLoading:  'Loading…',
  cacheClearing: 'Clearing…',
  cacheCleared:  '✓ Cleared',
  cacheClear:    'Clear cache',
  cacheMbSuffix: '% of 300 MB',

  // Locale for date formatting
  locale: 'en-US',
}

const de = {
  // Sidebar
  openFolder:       'Ordner öffnen',
  currentFolder:    'Aktueller Ordner',
  parentFolder:     'Übergeordneter Ordner',
  subfoldersSec:    'Unterordner',
  recentSec:        'Zuletzt',
  favoritesSec:     'Favoriten',
  settingsBtn:      'Einstellungen',
  addToFav:         'Zu Favoriten hinzufügen',
  removeFromFav:    'Aus Favoriten entfernen',
  noFavorites:      'Keine Favoriten',

  // Toolbar
  searchPlaceholder: 'Suchen...',
  hideSubfolders:    'Unterordner ausblenden',
  showSubfoldersTip: 'Unterordner anzeigen',
  sortName:          'Name',
  sortDate:          'Datum',
  sortSize:          'Größe',
  sortType:          'Typ',
  gridSmall:         'Klein',
  gridMedium:        'Mittel',
  gridLarge:         'Groß',
  viewToggle:        'Listen- / Rasteransicht',

  // Welcome
  subtitle:        'Eine wunderschöne Fotogalerie',
  openFolderBtn:   'Fotoordner öffnen',
  dragHint:        'oder Ordner hierher ziehen',
  recentlyOpened:  'Zuletzt geöffnet',

  // Gallery
  loading:    'Laden...',
  noPhotos:   'Keine Fotos in diesem Ordner',
  photosSec:  'Fotos',
  quality:          'Qualität',
  locationLabel:    'Speicherort',
  nextToOriginal:   'Neben Original',
  exportAll:        'Alle exportieren',
  folderType:       'Ordner',
  selectedLabel:    'ausgewählt',
  deleteSelected:   'Ausgewählte löschen',
  clearSelection:   'Auswahl aufheben',

  // Context menu
  open:             'Öffnen',
  showInExplorer:   'Im Explorer anzeigen',
  showInFinder:     'Im Finder anzeigen',
  copyPath:         'Pfad kopieren',
  copyFilename:     'Dateiname kopieren',
  fileInfo:         'Dateiinfo',
  openFolderAction: 'Ordner öffnen',
  removeFromAlbum:  'Aus Album entfernen',
  moveToTrash:      'In Papierkorb verschieben',
  selectAll:        'Alle auswählen',
  deselectAll:      'Auswahl aufheben',
  exportSelected:   'Ausgewählte exportieren',
  galleryLabel:     'Galerie',

  // Sidebar
  trash: 'Papierkorb',

  // Settings
  settingsTitle: 'Einstellungen',
  appearance:    'Erscheinungsbild',
  general:       'Allgemein',
  shortcuts:     'Tastenkürzel',
  about:         'Über',
  soon:          'demnächst',
  closeEsc:      'Schließen (Esc)',

  // Appearance panel
  wallpaperSec:    'Hintergrundbild',
  wallpaperDesc:   'Hintergrundverlauf der App wählen.',
  blurTitle:       'Hintergrundunschärfe',
  blurDesc:        'Zusätzliche Tapeten-Unschärfe.',
  customWallpaper: 'Benutzerdefiniert',

  // General panel
  languageTitle: 'Sprache',
  languageDesc:  'Sprache der App-Oberfläche.',

  // Startup
  startupTitle:    'Startverhalten',
  startupDesc:     'Was beim Start der App geöffnet wird.',
  startupLast:     'Letztes Album',
  startupSpecific: 'Bestimmtes Album',
  startupFolder:   'Startordner',
  chooseFolder:    'Ordner wählen',
  noFolderChosen:  'Kein Ordner gewählt',

  // Tags
  tagsSec:          'Tags',
  addTagPlaceholder:'Tag hinzufügen...',
  noTags:           'Keine Tags',
  filterByTag:      'Nach Tag filtern',
  clearTagFilter:   'Filter löschen',

  // Albums
  albumsSec:        'Alben',
  newAlbum:         'Neues Album',
  albumNamePlaceholder: 'Albumname...',
  addToAlbum:       'Zum Album hinzufügen',
  deleteAlbum:      'Album löschen',
  noAlbums:         'Keine Alben',
  albumEmpty:       'Album ist leer',
  createAndAdd:     'Erstellen & hinzufügen',
  alreadyInAlbum:   'Bereits im Album',
  albumView:        'Album',

  // TitleBar window controls
  minimize:   'Minimieren',
  restore:    'Wiederherstellen',
  maximize:   'Maximieren',
  close:      'Schließen',

  // Lightbox
  exportPanelTitle:  'Exportieren',
  copyLocation:      'Kopienspeicherort',
  chooseDest:        'Wählen…',
  saveCopy:          '💾 Kopie speichern',
  noChangesToSave:   'Keine Änderungen zum Speichern',
  willOverwrite:     'Überschreibt Originaldatei!',
  overwriteOriginal: '⚠ Original überschreiben',
  noEditsHint:       'Keine Bearbeitung — exportiert Original',
  applyCrop:         '✓ Anwenden',
  cancelCrop:        'Abbrechen',
  exportSaveBtn:     'Exportieren / Speichern',
  resetZoom:         'Zoom zurücksetzen',
  openEditor:        'Editor öffnen',
  editorPanel:       'Editor',
  prevImage:         'Vorheriges (←)',
  nextImage:         'Nächstes (→)',
  infoPanel:         'Informationen',
  infoBtn:           'Informationen',
  infoName:          'Name',
  infoFormat:        'Format',
  infoSize:          'Größe',
  infoDate:          'Datum',
  infoPath:          'Pfad',

  // EXIF
  exifSection:       'EXIF-Daten',
  exifCamera:        'Kamera',
  exifLens:          'Objektiv',
  exifFocalLength:   'Brennweite',
  exifExposure:      'Belichtung',
  exifAperture:      'Blende',
  exifISO:           'ISO',
  exifDateTaken:     'Aufnahmedatum',
  exifGPS:           'Standort',
  exifFlash:         'Blitz',
  exifNoData:        'Keine EXIF-Daten',

  cropBadge:         '✂ Zuschneiden — Griffe ziehen, Anwenden klicken',
  savedSuccess:      '✓ Gespeichert!',
  saveError:         '✕ Speicherfehler',
  errorGeneric:      '✕ Fehler',

  // Editor
  cropSection:      'Zuschneiden',
  cropBtn:          'Zuschneiden',
  removeCropTitle:  'Zuschnitt entfernen',
  removeCropBtn:    'Entfernen',
  geometrySection:  'Geometrie',
  rotateLeft:       'Links',
  rotateRight:      'Rechts',
  toneSection:      'Ton',
  brightness:       'Helligkeit',
  contrast:         'Kontrast',
  saturation:       'Sättigung',
  exposure:         'Belichtung',
  resetAll:         '↩ Alles zurücksetzen',

  // Trash
  trashEmpty:       'Papierkorb ist leer',
  restoreSelected:  'Ausgewählte wiederherstellen',
  restoreAll:       'Alle wiederherstellen',
  emptyTrash:       'Papierkorb leeren',

  // Cache panel
  cacheTitle:    'Miniaturcache',
  cacheDesc:     'Miniaturbilder werden automatisch generiert und lokal für schnelleres Laden gespeichert.',
  cacheLoading:  'Lade…',
  cacheClearing: 'Bereinige…',
  cacheCleared:  '✓ Bereinigt',
  cacheClear:    'Cache leeren',
  cacheMbSuffix: '% von 300 MB',

  // Locale for date formatting
  locale: 'de-DE',
}

export const TRANSLATIONS = { pl, en, de }

// ── Photo count helpers ──────────────────────────────────────────────────────
export function photoCount(n, lang) {
  if (lang === 'en') return `${n} ${n === 1 ? 'photo' : 'photos'}`
  if (lang === 'de') return `${n} ${n === 1 ? 'Foto' : 'Fotos'}`
  if (n === 1) return `${n} zdjęcie`
  if (n >= 2 && n <= 4) return `${n} zdjęcia`
  return `${n} zdjęć`
}

export function photoCountOf(count, total, lang) {
  if (count === total) return photoCount(total, lang)
  if (lang === 'en') return `${count} of ${total} photos`
  if (lang === 'de') return `${count} von ${total} Fotos`
  return `${count} z ${total} zdjęć`
}

export function fileCount(n, lang) {
  if (lang === 'en') return `${n} ${n === 1 ? 'file' : 'files'}`
  if (lang === 'de') return `${n} ${n === 1 ? 'Datei' : 'Dateien'}`
  if (n === 1) return `${n} plik`
  if (n >= 2 && n <= 4) return `${n} pliki`
  return `${n} plików`
}

export function savedAs(filename, lang) {
  if (lang === 'en') return `✓ Saved: ${filename}`
  if (lang === 'de') return `✓ Gespeichert: ${filename}`
  return `✓ Zapisano: ${filename}`
}

export function selectedCount(n, lang) {
  if (lang === 'en') return `${n} selected`
  if (lang === 'de') return `${n} ausgewählt`
  return `${n} zaznaczone`
}

export function exportSelectedTitle(n, lang) {
  if (lang === 'en') return `Export selected (${n})`
  if (lang === 'de') return `Ausgewählte exportieren (${n})`
  return `Eksport zaznaczonych (${n})`
}

export function cacheThumbs(n, lang) {
  if (lang === 'en') return `${n} thumbnail${n !== 1 ? 's' : ''}`
  if (lang === 'de') return `${n} Miniaturbild${n !== 1 ? 'er' : ''}`
  return `${n} miniatur`
}

export function confirmDeleteFiles(n, lang) {
  if (lang === 'en') return `Permanently delete ${n} ${n === 1 ? 'file' : 'files'} from trash? This cannot be undone.`
  if (lang === 'de') return `${n} ${n === 1 ? 'Datei' : 'Dateien'} dauerhaft aus dem Papierkorb löschen? Dies kann nicht rückgängig gemacht werden.`
  const noun = n === 1 ? 'plik' : n <= 4 ? 'pliki' : 'plików'
  return `Trwale usunąć ${n} ${noun} z kosza? Tego nie można cofnąć.`
}

export function confirmDeleteSelected(n, lang) {
  if (lang === 'en') return `Delete ${n} ${n === 1 ? 'photo' : 'photos'}? This cannot be undone.`
  if (lang === 'de') return `${n} ${n === 1 ? 'Foto' : 'Fotos'} löschen? Dies kann nicht rückgängig gemacht werden.`
  const noun = n === 1 ? 'zdjęcie' : n <= 4 ? 'zdjęcia' : 'zdjęć'
  return `Usunąć ${n} ${noun}? Tego nie można cofnąć.`
}

// ── Context ──────────────────────────────────────────────────────────────────
export const LangContext = createContext('pl')

export function useLangCode() {
  return useContext(LangContext)
}

export function useLang() {
  const lang = useContext(LangContext)
  return (key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.pl[key] ?? key
}
