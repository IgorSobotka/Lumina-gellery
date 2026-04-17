const KEY = 'lumina_albums'

export function loadAlbums() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function saveAlbums(albums) {
  localStorage.setItem(KEY, JSON.stringify(albums))
}

export function createAlbum(albums, name) {
  const id   = `album_${Date.now()}`
  const next = { ...albums, [id]: { id, name, images: [] } }
  saveAlbums(next)
  return next
}

export function deleteAlbum(albums, id) {
  const next = { ...albums }
  delete next[id]
  saveAlbums(next)
  return next
}

export function addImageToAlbum(albums, albumId, img) {
  const album = albums[albumId]
  if (!album) return albums
  if (album.images.some(i => i.path === img.path)) return albums
  const next = { ...albums, [albumId]: { ...album, images: [...album.images, img] } }
  saveAlbums(next)
  return next
}

export function removeImageFromAlbum(albums, albumId, imgPath) {
  const album = albums[albumId]
  if (!album) return albums
  const next = { ...albums, [albumId]: { ...album, images: album.images.filter(i => i.path !== imgPath) } }
  saveAlbums(next)
  return next
}
