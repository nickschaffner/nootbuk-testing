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

/** Discrete album reference item — mirrors SongReference (text / link / audio). */
export interface AlbumReference {
  id: string
  albumId: string
  text: string | null
  url: string | null
  audioBlob: Blob | null
  attachmentBlob: Blob | null
  attachmentFilename: string | null
  attachmentMimeType: string | null
  sortOrder: number
  createdAt: string
}
