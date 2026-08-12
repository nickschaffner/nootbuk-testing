export type AlbumStatus = 'draft' | 'in-progress' | 'released'

export type AlbumFormat = 'single' | 'ep' | 'lp'

export interface Album {
  id: string
  title: string
  status: AlbumStatus
  format: AlbumFormat
  artworkBlob: Blob | null
  releaseDate: string | null
  credits: string | null
  label: string | null
  catalogNumber: string | null
  globalNotes: string | null
  referenceMaterial: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface AlbumSong {
  id: string
  albumId: string
  songId: string
  trackNumber: number
}

export interface AlbumReferenceFile {
  id: string
  albumId: string
  filename: string
  mimeType: string
  blob: Blob
  createdAt: string
}
