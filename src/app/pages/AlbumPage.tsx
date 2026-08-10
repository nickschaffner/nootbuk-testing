import { useParams } from 'react-router-dom'

import { AlbumView } from '@/components/album/AlbumView'

export function AlbumPage() {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <p className="text-sm text-muted-foreground">Album not found.</p>
  }

  return <AlbumView albumId={id} />
}
