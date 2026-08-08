import { useParams } from 'react-router-dom'

import { SongWorkspace } from '@/components/song/SongWorkspace'

export function SongPage() {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <p className="text-sm text-muted-foreground">Invalid song.</p>
  }

  return <SongWorkspace songId={id} />
}
