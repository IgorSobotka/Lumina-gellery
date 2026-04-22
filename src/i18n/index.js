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
  wallpaperSec:       'Tapeta',
  wallpaperDesc:      'Wybierz tło aplikacji.',
  wallpaperAnimated:  'Animowane',
  wallpaperStatic:    'Statyczne',
  accentSec:          'Kolor akcentu',
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
  toneSection:      'Jasność',
  colorSection:     'Kolor',
  effectsSection:   'Efekty',
  brightness:       'Jasność',
  contrast:         'Kontrast',
  saturation:       'Nasycenie',
  exposure:         'Ekspozycja',
  highlights:       'Światła',
  shadows:          'Cienie',
  temperature:      'Temperatura',
  vignette:         'Winieta',
  sharpness:        'Ostrość',
  tabLight:         'Światło',
  tabColor:         'Kolor',
  tabGeometry:      'Geometria',
  beforeAfter:      'Przed / Po',
  exportResizeSec:      'Rozmiar wyjściowy',
  exportResizeOriginal: 'Oryginalny',
  exportResizeCustom:   'Własny',
  exportResizeWidth:    'Szerokość',
  exportResizePx:       'px',
  resetAll:         '↩ Resetuj wszystko',

  // Trash
  trashEmpty:       'Kosz jest pusty',
  restoreSelected:  'Przywróć zaznaczone',
  restoreAll:       'Przywróć wszystkie',
  emptyTrash:       'Opróżnij kosz',

  // Private Space
  pvTitle:          'Private Space',
  pvCount:          '{n} zdjęć',
  pvCreate:         'Utwórz Private Space',
  pvCreateSub:      'Ustaw PIN (min. 4 cyfry)',
  pvConfirmSub:     'Potwierdź PIN',
  pvUnlock:         'Odblokuj Private Space',
  pvUnlockSub:      'Wprowadź PIN',
  pvNext:           'Dalej',
  pvCreateBtn:      'Utwórz',
  pvUnlockBtn:      'Odblokuj',
  pvPinShort:       'PIN musi mieć min. 4 cyfry',
  pvPinMismatch:    'PINy się nie zgadzają',
  pvWrongPin:       'Nieprawidłowy PIN',
  pvBadFile:        'Nieprawidłowy plik kontenera',
  pvLoading:        'Ładowanie...',
  pvImport:         'Importuj istniejący kontener',
  pvImportExisting: 'Mam już kontener (.lumina)',
  pvAdd:            'Dodaj zdjęcia',
  pvExport:         'Eksportuj kontener',
  pvLock:           'Zablokuj',
  pvEmpty:          'Brak zdjęć w Private Space',
  pvConfirmRemove:  'Usunąć zdjęcie z Private Space?',
  pvOptions:        'Opcje',
  pvRename:         'Zmień nazwę',
  pvDeleteFolder:   'Usuń folder',
  pvMoveTo:         'Przenieś do',
  pvMoveToRoot:     '/ (główny)',
  pvRemove:         'Usuń',
  pvRenameFolder:   'Zmień nazwę folderu',
  pvCancel:         'Anuluj',

  // Cache panel
  cacheTitle:    'Pamięć podręczna miniatur',
  cacheDesc:     'Miniatury są generowane automatycznie i przechowywane lokalnie dla szybszego ładowania.',
  cacheLoading:  'Ładowanie…',
  cacheClearing: 'Czyszczenie…',
  cacheCleared:  '✓ Wyczyszczono',
  cacheClear:    'Wyczyść cache',
  cacheMbSuffix: '% z 300 MB',

  // Disk Manager
  diskBtn:         'Dysk',
  diskTitle:       'Zarządzanie dyskiem',
  diskTabDisks:    'Dyski',
  diskTabCache:    'Cache',
  diskTabLarge:    'Duże',
  diskTabDupes:    'Duplikaty',
  diskSpaceTitle:  'Przestrzeń dyskowa',
  diskSpaceSub:    'Podłączone dyski i ich użycie',
  diskFree:        'wolne',
  diskUsed:        'zajęte',
  diskOf:          'z',
  diskNoData:      'Brak danych o dyskach',
  diskCacheTitle:  'Cache miniaturek',
  diskCacheSub:    'Tymczasowe pliki przyspieszające ładowanie galerii',
  diskCacheThumbs: 'miniatury',
  diskCacheAvg:    'śr. rozmiar',
  diskCacheOf:     'z 300 MB',
  diskClearBtn:    'Wyczyść cache',
  diskLargeTitle:  'Największe pliki',
  diskLargeSub:    'Skanowanie: {folder}',
  diskNoFolder:    'Najpierw otwórz folder w galerii',
  diskScanning:    'Skanowanie...',
  diskRescan:      'Skanuj ponownie',
  diskTreeTitle:   'Struktura folderów',
  diskTreeLoading: 'Skanowanie całego dysku — może chwilę potrwać…',
  diskAdminWarning:'Niektóre foldery mogą być niedostępne bez uprawnień administratora.',
  diskAdminBtn:    'Uruchom jako administrator',
  diskAdminOk:     'Uruchomiono jako administrator — pełny dostęp',
  diskFileCount:   '{n} plików',
  diskShowExp:     'Pokaż w eksploratorze',
  diskDeleteFile:  'Usuń plik',
  diskConfirmDel:  'Usunąć "{name}"?',
  diskDupTitle:    'Duplikaty',
  diskDupSub:      'Skanowanie: {folder}',
  diskDupNone:     'Brak duplikatów 🎉',
  diskDupFound:    '{n} grup — {size} do zaoszczędzenia',
  diskDupOriginal: 'oryginał',
  diskDupEach:     'każdy',
  diskDupWasted:   '−{size} do zaoszczędzenia',
  diskDupCount:    '{n}× duplikat',

  // Folder management
  newFolder:          'Nowy folder',
  createFolder:       'Utwórz',
  folderNameLabel:    'Nazwa folderu',
  moveTo:             'Przenieś do folderu…',
  moveSelectedTo:     'Przenieś zaznaczone ({n}) do folderu…',
  renameItem:         'Zmień nazwę',
  deleteFolder:       'Usuń folder',
  folderExists:       'Folder o tej nazwie już istnieje.',
  moveError:          'Nie udało się przenieść niektórych elementów.',

  // Sidebar cloud section
  cloudSec: 'Chmura',

  // Addons
  addons:             'Dodatki',
  addonsSectionTitle: 'Dostępne dodatki',
  addonsSectionDesc:  'Połącz usługi chmurowe i inne rozszerzenia.',
  addonConnect:       'Połącz',
  addonConnected:     'Połączono',
  addonDisconnect:    'Rozłącz',
  addonTesting:       'Weryfikacja…',
  addonConnectFail:   'Błąd połączenia. Sprawdź App Key i redirect URI.',
  addonLoggingIn:     'Otwieranie przeglądarki…',
  addonLoginWith:     'Zaloguj przez',
  addonAppKey:        'App Key',
  addonAppKeyStep1:   'Przejdź na',
  addonAppKeyStep1b:  'utwórz aplikację (Full Dropbox), skopiuj App Key.',
  addonAppKeyStep2:   'W ustawieniach aplikacji dodaj redirect URI:',
  addonRedirectHint:  'Wymagane redirect URI w aplikacji Dropbox:',

  // Cloud browser
  cloudLoading:   'Ładowanie…',
  cloudEmpty:     'Ten folder jest pusty.',
  cloudFolders:   'Foldery',
  cloudPhotos:    'Zdjęcia',
  cloudFiles:     'Pliki',

  // Color labels
  labelSec:         'Etykieta',
  labelClear:       'Brak',
  labelRed:         'Czerwona',
  labelOrange:      'Pomarańczowa',
  labelYellow:      'Żółta',
  labelGreen:       'Zielona',
  labelBlue:        'Niebieska',
  labelPurple:      'Fioletowa',
  filterByLabel:    'Filtruj po etykiecie',
  clearLabelFilter: 'Wyczyść etykietę',

  // Quick presets
  presetsSection: 'Szybkie presety',
  presetBW:       'B&W',
  presetVintage:  'Vintage',
  presetVivid:    'Vivid',
  presetCool:     'Zimny',
  presetWarm:     'Ciepły',
  presetFade:     'Fade',

  // Watermark
  watermarkSec:     'Watermark',
  watermarkOpacity: 'Krycie',
  watermarkSize:    'Rozmiar',
  watermarkColor:   'Kolor',

  // Batch rename
  batchRename:       'Zmień nazwy zaznaczonych',
  batchRenameTitle:  'Zbiorowa zmiana nazw',
  batchPattern:      'Wzorzec nazwy',
  batchPatternHint:  '{name} = oryginał · {n} = numer · {date} = data · {ext} = rozszerzenie',
  batchPreview:      'Podgląd',
  batchRenameBtn:    'Zmień nazwy',
  batchRenaming:     'Zmieniam nazwy…',
  batchDone:         '✓ Gotowe!',
  batchError:        'Błąd: niektórych plików nie udało się zmienić.',

  // Slideshow
  slideshowStart:    'Pokaz slajdów',
  slideshowPause:    'Pauza',
  slideshowPlay:     'Wznów',
  slideshowSpeed:    'Prędkość',

  // Collage
  collageTitle:      'Kolaż',
  collageLayout:     'Układ',
  collageGap:        'Odstęp',
  collageBg:         'Tło',
  collageExport:     'Eksportuj PNG',
  collageExporting:  'Eksportuję…',

  // Smart search
  smartFilter:      'Filtr zaawansowany',
  sfOrientation:    'Orientacja',
  sfAll:            'Wszystkie',
  sfLandscape:      'Pozioma',
  sfPortrait:       'Pionowa',
  sfSquare:         'Kwadrat',
  sfType:           'Typ',
  sfPhotos:         'Zdjęcia',
  sfVideos:         'Wideo',
  sfSize:           'Rozmiar pliku',
  sfTiny:           'Małe (<500 KB)',
  sfSmall:          'Małe (0,5–2 MB)',
  sfMedium:         'Średnie (2–10 MB)',
  sfLarge:          'Duże (>10 MB)',
  sfDate:           'Zmodyfikowano',
  sfToday:          'Dzisiaj',
  sfThisWeek:       'Ten tydzień',
  sfThisMonth:      'Ten miesiąc',
  sfThisYear:       'Ten rok',
  sfClearAll:       'Wyczyść filtry',
  sfActive:         'aktywny filtr',
  sfActives:        'aktywne filtry',

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
  wallpaperSec:       'Wallpaper',
  wallpaperDesc:      'Choose the app background.',
  wallpaperAnimated:  'Animated',
  wallpaperStatic:    'Static',
  accentSec:          'Accent color',
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
  toneSection:      'Light',
  colorSection:     'Color',
  effectsSection:   'Effects',
  brightness:       'Brightness',
  contrast:         'Contrast',
  saturation:       'Saturation',
  exposure:         'Exposure',
  highlights:       'Highlights',
  shadows:          'Shadows',
  temperature:      'Temperature',
  vignette:         'Vignette',
  sharpness:        'Sharpness',
  tabLight:         'Light',
  tabColor:         'Color',
  tabGeometry:      'Geometry',
  beforeAfter:      'Before / After',
  exportResizeSec:      'Output size',
  exportResizeOriginal: 'Original',
  exportResizeCustom:   'Custom',
  exportResizeWidth:    'Width',
  exportResizePx:       'px',
  resetAll:         '↩ Reset all',

  // Trash
  trashEmpty:       'Trash is empty',
  restoreSelected:  'Restore selected',
  restoreAll:       'Restore all',
  emptyTrash:       'Empty trash',

  // Private Space
  pvTitle:          'Private Space',
  pvCount:          '{n} photos',
  pvCreate:         'Create Private Space',
  pvCreateSub:      'Set a PIN (min. 4 digits)',
  pvConfirmSub:     'Confirm your PIN',
  pvUnlock:         'Unlock Private Space',
  pvUnlockSub:      'Enter your PIN',
  pvNext:           'Next',
  pvCreateBtn:      'Create',
  pvUnlockBtn:      'Unlock',
  pvPinShort:       'PIN must be at least 4 digits',
  pvPinMismatch:    'PINs do not match',
  pvWrongPin:       'Wrong PIN',
  pvBadFile:        'Invalid container file',
  pvLoading:        'Loading...',
  pvImport:         'Import existing container',
  pvImportExisting: 'I have a container (.lumina)',
  pvAdd:            'Add photos',
  pvExport:         'Export container',
  pvLock:           'Lock',
  pvEmpty:          'No photos in Private Space',
  pvConfirmRemove:  'Remove photo from Private Space?',
  pvOptions:        'Options',
  pvRename:         'Rename',
  pvDeleteFolder:   'Delete folder',
  pvMoveTo:         'Move to',
  pvMoveToRoot:     '/ (root)',
  pvRemove:         'Remove',
  pvRenameFolder:   'Rename folder',
  pvCancel:         'Cancel',


  // Cache panel
  cacheTitle:    'Thumbnail cache',
  cacheDesc:     'Thumbnails are generated automatically and stored locally for faster loading.',
  cacheLoading:  'Loading…',
  cacheClearing: 'Clearing…',
  cacheCleared:  '✓ Cleared',
  cacheClear:    'Clear cache',
  cacheMbSuffix: '% of 300 MB',

  // Disk Manager
  diskBtn:         'Disk',
  diskTitle:       'Disk Manager',
  diskTabDisks:    'Disks',
  diskTabCache:    'Cache',
  diskTabLarge:    'Large',
  diskTabDupes:    'Duplicates',
  diskSpaceTitle:  'Disk space',
  diskSpaceSub:    'Connected drives and their usage',
  diskFree:        'free',
  diskUsed:        'used',
  diskOf:          'of',
  diskNoData:      'No disk data available',
  diskCacheTitle:  'Thumbnail cache',
  diskCacheSub:    'Temporary files for faster gallery loading',
  diskCacheThumbs: 'thumbnails',
  diskCacheAvg:    'avg. size',
  diskCacheOf:     'of 300 MB',
  diskClearBtn:    'Clear cache',
  diskLargeTitle:  'Largest files',
  diskLargeSub:    'Scanning: {folder}',
  diskNoFolder:    'Open a folder in the gallery first',
  diskScanning:    'Scanning...',
  diskRescan:      'Scan again',
  diskTreeTitle:   'Folder structure',
  diskTreeLoading: 'Scanning full disk — may take a moment…',
  diskAdminWarning:'Some folders may be inaccessible without administrator rights.',
  diskAdminBtn:    'Restart as Administrator',
  diskAdminOk:     'Running as Administrator — full access',
  diskFileCount:   '{n} files',
  diskShowExp:     'Show in Explorer',
  diskDeleteFile:  'Delete file',
  diskConfirmDel:  'Delete "{name}"?',
  diskDupTitle:    'Duplicates',
  diskDupSub:      'Scanning: {folder}',
  diskDupNone:     'No duplicates found 🎉',
  diskDupFound:    '{n} groups — {size} to save',
  diskDupOriginal: 'original',
  diskDupEach:     'each',
  diskDupWasted:   '−{size} to save',
  diskDupCount:    '{n}× duplicate',

  // Folder management
  newFolder:          'New folder',
  createFolder:       'Create',
  folderNameLabel:    'Folder name',
  moveTo:             'Move to folder…',
  moveSelectedTo:     'Move {n} selected to folder…',
  renameItem:         'Rename',
  deleteFolder:       'Delete folder',
  folderExists:       'A folder with this name already exists.',
  moveError:          'Failed to move some items.',

  // Sidebar cloud section
  cloudSec: 'Cloud Storage',

  // Addons
  addons:             'Add-ons',
  addonsSectionTitle: 'Available Add-ons',
  addonsSectionDesc:  'Connect cloud storage and other extensions.',
  addonConnect:       'Connect',
  addonConnected:     'Connected',
  addonDisconnect:    'Disconnect',
  addonTesting:       'Verifying…',
  addonConnectFail:   'Connection failed. Check your App Key and redirect URI.',
  addonLoggingIn:     'Opening browser…',
  addonLoginWith:     'Login with',
  addonAppKey:        'App Key',
  addonAppKeyStep1:   'Go to',
  addonAppKeyStep1b:  'create an app (Full Dropbox access), copy the App Key.',
  addonAppKeyStep2:   'In the app settings, add this redirect URI:',
  addonRedirectHint:  'Required redirect URI in your Dropbox app:',

  // Cloud browser
  cloudLoading:   'Loading…',
  cloudEmpty:     'This folder is empty.',
  cloudFolders:   'Folders',
  cloudPhotos:    'Photos',
  cloudFiles:     'Files',

  // Color labels
  labelSec:         'Label',
  labelClear:       'None',
  labelRed:         'Red',
  labelOrange:      'Orange',
  labelYellow:      'Yellow',
  labelGreen:       'Green',
  labelBlue:        'Blue',
  labelPurple:      'Purple',
  filterByLabel:    'Filter by label',
  clearLabelFilter: 'Clear label',

  // Quick presets
  presetsSection: 'Quick Presets',
  presetBW:       'B&W',
  presetVintage:  'Vintage',
  presetVivid:    'Vivid',
  presetCool:     'Cool',
  presetWarm:     'Warm',
  presetFade:     'Fade',

  // Watermark
  watermarkSec:     'Watermark',
  watermarkOpacity: 'Opacity',
  watermarkSize:    'Size',
  watermarkColor:   'Color',

  // Batch rename
  batchRename:       'Batch rename',
  batchRenameTitle:  'Batch Rename',
  batchPattern:      'Name pattern',
  batchPatternHint:  '{name} = original · {n} = number · {date} = date · {ext} = extension',
  batchPreview:      'Preview',
  batchRenameBtn:    'Rename',
  batchRenaming:     'Renaming…',
  batchDone:         '✓ Done!',
  batchError:        'Error: some files could not be renamed.',

  // Slideshow
  slideshowStart:    'Slideshow',
  slideshowPause:    'Pause',
  slideshowPlay:     'Play',
  slideshowSpeed:    'Speed',

  // Collage
  collageTitle:      'Collage',
  collageLayout:     'Layout',
  collageGap:        'Gap',
  collageBg:         'Background',
  collageExport:     'Export PNG',
  collageExporting:  'Exporting…',

  // Smart search
  smartFilter:      'Smart filter',
  sfOrientation:    'Orientation',
  sfAll:            'All',
  sfLandscape:      'Landscape',
  sfPortrait:       'Portrait',
  sfSquare:         'Square',
  sfType:           'Type',
  sfPhotos:         'Photos',
  sfVideos:         'Videos',
  sfSize:           'File size',
  sfTiny:           'Tiny (<500 KB)',
  sfSmall:          'Small (0.5–2 MB)',
  sfMedium:         'Medium (2–10 MB)',
  sfLarge:          'Large (>10 MB)',
  sfDate:           'Modified',
  sfToday:          'Today',
  sfThisWeek:       'This week',
  sfThisMonth:      'This month',
  sfThisYear:       'This year',
  sfClearAll:       'Clear all filters',
  sfActive:         'active filter',
  sfActives:        'active filters',

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
  wallpaperSec:       'Hintergrundbild',
  wallpaperDesc:      'App-Hintergrund auswählen.',
  wallpaperAnimated:  'Animiert',
  wallpaperStatic:    'Statisch',
  accentSec:          'Akzentfarbe',
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
  toneSection:      'Licht',
  colorSection:     'Farbe',
  effectsSection:   'Effekte',
  brightness:       'Helligkeit',
  contrast:         'Kontrast',
  saturation:       'Sättigung',
  exposure:         'Belichtung',
  highlights:       'Lichter',
  shadows:          'Schatten',
  temperature:      'Temperatur',
  vignette:         'Vignette',
  sharpness:        'Schärfe',
  tabLight:         'Licht',
  tabColor:         'Farbe',
  tabGeometry:      'Geometrie',
  beforeAfter:      'Vorher / Nachher',
  exportResizeSec:      'Ausgabegröße',
  exportResizeOriginal: 'Original',
  exportResizeCustom:   'Benutzerdefiniert',
  exportResizeWidth:    'Breite',
  exportResizePx:       'px',
  resetAll:         '↩ Alles zurücksetzen',

  // Trash
  trashEmpty:       'Papierkorb ist leer',
  restoreSelected:  'Ausgewählte wiederherstellen',
  restoreAll:       'Alle wiederherstellen',
  emptyTrash:       'Papierkorb leeren',

  // Private Space
  pvTitle:          'Private Space',
  pvCount:          '{n} Fotos',
  pvCreate:         'Private Space erstellen',
  pvCreateSub:      'PIN festlegen (min. 4 Ziffern)',
  pvConfirmSub:     'PIN bestätigen',
  pvUnlock:         'Private Space entsperren',
  pvUnlockSub:      'PIN eingeben',
  pvNext:           'Weiter',
  pvCreateBtn:      'Erstellen',
  pvUnlockBtn:      'Entsperren',
  pvPinShort:       'PIN muss mind. 4 Ziffern haben',
  pvPinMismatch:    'PINs stimmen nicht überein',
  pvWrongPin:       'Falscher PIN',
  pvBadFile:        'Ungültige Container-Datei',
  pvLoading:        'Laden...',
  pvImport:         'Vorhandenen Container importieren',
  pvImportExisting: 'Ich habe einen Container (.lumina)',
  pvAdd:            'Fotos hinzufügen',
  pvExport:         'Container exportieren',
  pvLock:           'Sperren',
  pvEmpty:          'Keine Fotos im Private Space',
  pvConfirmRemove:  'Foto aus Private Space entfernen?',
  pvOptions:        'Optionen',
  pvRename:         'Umbenennen',
  pvDeleteFolder:   'Ordner löschen',
  pvMoveTo:         'Verschieben nach',
  pvMoveToRoot:     '/ (Stamm)',
  pvRemove:         'Entfernen',
  pvRenameFolder:   'Ordner umbenennen',
  pvCancel:         'Abbrechen',

  // Cache panel
  cacheTitle:    'Miniaturcache',
  cacheDesc:     'Miniaturbilder werden automatisch generiert und lokal für schnelleres Laden gespeichert.',
  cacheLoading:  'Lade…',
  cacheClearing: 'Bereinige…',
  cacheCleared:  '✓ Bereinigt',
  cacheClear:    'Cache leeren',
  cacheMbSuffix: '% von 300 MB',

  // Disk Manager
  diskBtn:         'Disk',
  diskTitle:       'Datenträgerverwaltung',
  diskTabDisks:    'Laufwerke',
  diskTabCache:    'Cache',
  diskTabLarge:    'Groß',
  diskTabDupes:    'Duplikate',
  diskSpaceTitle:  'Speicherplatz',
  diskSpaceSub:    'Verbundene Laufwerke und ihre Nutzung',
  diskFree:        'frei',
  diskUsed:        'belegt',
  diskOf:          'von',
  diskNoData:      'Keine Laufwerkdaten verfügbar',
  diskCacheTitle:  'Miniatur-Cache',
  diskCacheSub:    'Temporäre Dateien für schnelleres Laden der Galerie',
  diskCacheThumbs: 'Miniaturen',
  diskCacheAvg:    'Ø Größe',
  diskCacheOf:     'von 300 MB',
  diskClearBtn:    'Cache leeren',
  diskLargeTitle:  'Größte Dateien',
  diskLargeSub:    'Scan: {folder}',
  diskNoFolder:    'Öffne zuerst einen Ordner in der Galerie',
  diskScanning:    'Wird gescannt...',
  diskRescan:      'Erneut scannen',
  diskTreeTitle:   'Ordnerstruktur',
  diskTreeLoading: 'Vollständiger Scan — kann einen Moment dauern…',
  diskAdminWarning:'Einige Ordner sind ohne Administratorrechte möglicherweise nicht zugänglich.',
  diskAdminBtn:    'Als Administrator neu starten',
  diskAdminOk:     'Läuft als Administrator — voller Zugriff',
  diskFileCount:   '{n} Dateien',
  diskShowExp:     'Im Explorer anzeigen',
  diskDeleteFile:  'Datei löschen',
  diskConfirmDel:  '"{name}" löschen?',
  diskDupTitle:    'Duplikate',
  diskDupSub:      'Scan: {folder}',
  diskDupNone:     'Keine Duplikate 🎉',
  diskDupFound:    '{n} Gruppen — {size} einzusparen',
  diskDupOriginal: 'Original',
  diskDupEach:     'je',
  diskDupWasted:   '−{size} einzusparen',
  diskDupCount:    '{n}× Duplikat',

  // Folder management
  newFolder:          'Neuer Ordner',
  createFolder:       'Erstellen',
  folderNameLabel:    'Ordnername',
  moveTo:             'In Ordner verschieben…',
  moveSelectedTo:     '{n} ausgewählte verschieben…',
  renameItem:         'Umbenennen',
  deleteFolder:       'Ordner löschen',
  folderExists:       'Ein Ordner mit diesem Namen existiert bereits.',
  moveError:          'Einige Elemente konnten nicht verschoben werden.',

  // Sidebar cloud section
  cloudSec: 'Cloud-Speicher',

  // Addons
  addons:             'Erweiterungen',
  addonsSectionTitle: 'Verfügbare Erweiterungen',
  addonsSectionDesc:  'Cloud-Speicher und andere Erweiterungen verbinden.',
  addonConnect:       'Verbinden',
  addonConnected:     'Verbunden',
  addonDisconnect:    'Trennen',
  addonTesting:       'Wird geprüft…',
  addonConnectFail:   'Verbindungsfehler. App Key und Redirect URI prüfen.',
  addonLoggingIn:     'Browser wird geöffnet…',
  addonLoginWith:     'Anmelden mit',
  addonAppKey:        'App Key',
  addonAppKeyStep1:   'Gehe zu',
  addonAppKeyStep1b:  'erstelle eine App (Full Dropbox) und kopiere den App Key.',
  addonAppKeyStep2:   'Füge in den App-Einstellungen diese Redirect URI hinzu:',
  addonRedirectHint:  'Benötigte Redirect URI in der Dropbox-App:',

  // Cloud browser
  cloudLoading:   'Laden…',
  cloudEmpty:     'Dieser Ordner ist leer.',
  cloudFolders:   'Ordner',
  cloudPhotos:    'Fotos',
  cloudFiles:     'Dateien',

  // Color labels
  labelSec:         'Etikett',
  labelClear:       'Keine',
  labelRed:         'Rot',
  labelOrange:      'Orange',
  labelYellow:      'Gelb',
  labelGreen:       'Grün',
  labelBlue:        'Blau',
  labelPurple:      'Lila',
  filterByLabel:    'Nach Etikett filtern',
  clearLabelFilter: 'Etikett löschen',

  // Quick presets
  presetsSection: 'Schnell-Presets',
  presetBW:       'S/W',
  presetVintage:  'Vintage',
  presetVivid:    'Lebhaft',
  presetCool:     'Kalt',
  presetWarm:     'Warm',
  presetFade:     'Verblasst',

  // Watermark
  watermarkSec:     'Wasserzeichen',
  watermarkOpacity: 'Deckkraft',
  watermarkSize:    'Größe',
  watermarkColor:   'Farbe',

  // Batch rename
  batchRename:       'Stapelumbenennung',
  batchRenameTitle:  'Stapelumbenennung',
  batchPattern:      'Namensmuster',
  batchPatternHint:  '{name} = Original · {n} = Nummer · {date} = Datum · {ext} = Erweiterung',
  batchPreview:      'Vorschau',
  batchRenameBtn:    'Umbenennen',
  batchRenaming:     'Umbenennen…',
  batchDone:         '✓ Fertig!',
  batchError:        'Fehler: Einige Dateien konnten nicht umbenannt werden.',

  // Slideshow
  slideshowStart:    'Diashow',
  slideshowPause:    'Pause',
  slideshowPlay:     'Abspielen',
  slideshowSpeed:    'Geschwindigkeit',

  // Collage
  collageTitle:      'Collage',
  collageLayout:     'Layout',
  collageGap:        'Abstand',
  collageBg:         'Hintergrund',
  collageExport:     'PNG exportieren',
  collageExporting:  'Exportieren…',

  // Smart search
  smartFilter:      'Intelligenter Filter',
  sfOrientation:    'Ausrichtung',
  sfAll:            'Alle',
  sfLandscape:      'Querformat',
  sfPortrait:       'Hochformat',
  sfSquare:         'Quadrat',
  sfType:           'Typ',
  sfPhotos:         'Fotos',
  sfVideos:         'Videos',
  sfSize:           'Dateigröße',
  sfTiny:           'Klein (<500 KB)',
  sfSmall:          'Klein (0,5–2 MB)',
  sfMedium:         'Mittel (2–10 MB)',
  sfLarge:          'Groß (>10 MB)',
  sfDate:           'Geändert',
  sfToday:          'Heute',
  sfThisWeek:       'Diese Woche',
  sfThisMonth:      'Diesen Monat',
  sfThisYear:       'Dieses Jahr',
  sfClearAll:       'Alle Filter löschen',
  sfActive:         'aktiver Filter',
  sfActives:        'aktive Filter',

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
