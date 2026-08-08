export type AlbumStatus = 'draft' | 'in-progress' | 'released'

export interface Album {
  id: string
  title: string
  subtitle: string | null
  status: AlbumStatus
  artworkBlob: Blob | null
  releaseDate: string | null
  credits: string | null
  globalNotes: string | null
  referenceMaterial: string | null
  createdAt: string
  updatedAt: string
}
