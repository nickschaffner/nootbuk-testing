import { useParams } from 'react-router-dom'

export function AlbumPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Album</h1>
      <p className="text-muted-foreground">Album ID: {id}</p>
    </div>
  )
}
