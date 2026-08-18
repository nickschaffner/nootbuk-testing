export type SongStatus =
  | 'sketch'
  | 'writing'
  | 'arranging'
  | 'production'
  | 'mixing'
  | 'mastering'
  | 'released'

export type SongAssetType = 'artwork' | 'file'

export interface Song {
  id: string
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
  artworkBlob: Blob | null
  createdAt: string
  updatedAt: string
}

export interface SongSection {
  id: string
  songId: string
  name: string
  sortOrder: number
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
  text: string | null
  url: string | null
  audioBlob: Blob | null
  attachmentBlob: Blob | null
  attachmentFilename: string | null
  attachmentMimeType: string | null
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

export interface SongTodo {
  id: string
  songId: string
  text: string
  timestamp: number | null
  completed: boolean
  sortOrder: number
  createdAt: string
}

export interface SongVersion {
  id: string
  songId: string
  label: string | null
  filename: string
  mimeType: string
  blob: Blob
  /** Duration in seconds; null if unknown / undecodable. */
  duration: number | null
  isMain: boolean
  createdAt: string
}
