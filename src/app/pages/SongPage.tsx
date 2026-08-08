import { useParams } from 'react-router-dom'

export function SongPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Song Workspace</h1>
      <p className="text-muted-foreground">Song ID: {id}</p>
    </div>
  )
}
