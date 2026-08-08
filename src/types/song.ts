export type SongStatus =
  | 'sketch'
  | 'writing'
  | 'arranging'
  | 'production'
  | 'mixing'
  | 'mastering'
  | 'released'

export type SongReferenceType = 'text' | 'link' | 'audio'

export type SongAssetType = 'artwork' | 'file'

export interface Song {
  id: string
  albumId: string | null
  title: string
  key: string | null
  tempo: number | null
  timeSignature: string | null
  status: SongStatus
  genre: string | null
  lyrics: string | null
  songwriter: string | null
  publisher: string | null
  ipiNumber: string | null
  masterEngineer: string | null
  copyright: string | null
  sampleCredits: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface SongSection {
  id: string
  songId: string
  name: string
  sortOrder: number
  lyrics: string | null
  createdAt: string
}

export interface SongJournalEntry {
  id: string
  songId: string
  topic: string | null
  content: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface SongReference {
  id: string
  songId: string
  type: SongReferenceType
  content: string
  audioBlob: Blob | null
  sortOrder: number
  createdAt: string
}

export interface SongAsset {
  id: string
  songId: string
  type: SongAssetType
  filename: string
  mimeType: string
  blob: Blob
  createdAt: string
}
