import { AutoSaveTextarea } from '@/components/shared/AutoSaveTextarea'
import { updateAlbum } from '@/hooks/useAlbums'
import type { Album } from '@/types/album'

interface AlbumProductionNotesTabProps {
  album: Album
}

export function AlbumProductionNotesTab({ album }: AlbumProductionNotesTabProps) {
  async function handleSave(text: string) {
    const trimmed = text.trim() || null
    if (trimmed === album.globalNotes) {
      return
    }

    try {
      await updateAlbum({ id: album.id, globalNotes: trimmed })
    } catch {
      // updateAlbum already logs the error
    }
  }

  return (
    <AutoSaveTextarea
      initialValue={album.globalNotes ?? ''}
      onSave={(text) => void handleSave(text)}
      placeholder="Album-wide production notes: signal chains, gear lists, sonic direction..."
      rows={12}
    />
  )
}
