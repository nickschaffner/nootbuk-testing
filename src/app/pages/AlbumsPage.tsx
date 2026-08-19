import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AlbumCard } from '@/components/album/AlbumCard'
import { Button, PageHeader } from '@/components/kit'
import { createAlbum, useAllAlbums } from '@/hooks/useAlbums'

export function AlbumsPage() {
  const albums = useAllAlbums()
  const navigate = useNavigate()
  const [isCreating, setIsCreating] = useState(false)

  async function handleNewAlbum() {
    setIsCreating(true)
    try {
      const album = await createAlbum({
        title: 'Untitled Album',
        status: 'draft',
        artworkBlob: null,
        releaseDate: null,
        credits: null,
        label: null,
        globalNotes: null,
        referenceMaterial: null,
        notes: null,
      })
      navigate(`/album/${album.id}`)
    } catch {
      // createAlbum already logs the error
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Albums"
        action={
          <Button
            variant="secondary"
            size="sm"
            disabled={isCreating}
            onClick={() => void handleNewAlbum()}
          >
            {isCreating ? 'Creating...' : '+ New Album'}
          </Button>
        }
      />

      {albums === undefined ? (
        <p className="text-sm text-muted-foreground">Loading albums...</p>
      ) : albums.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No albums yet. Create one to start organizing your songs.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}
    </div>
  )
}
