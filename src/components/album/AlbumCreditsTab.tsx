import { AutoSaveTextarea } from '@/components/shared/AutoSaveTextarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateAlbum } from '@/hooks/useAlbums'
import type { Album } from '@/types/album'

interface AlbumCreditsTabProps {
  album: Album
}

type CreditField = 'credits' | 'releaseDate' | 'label'

export function AlbumCreditsTab({ album }: AlbumCreditsTabProps) {
  async function handleFieldSave(field: CreditField, value: string) {
    const trimmed = value.trim()
    const nextValue = trimmed || null
    if (nextValue === album[field]) {
      return
    }

    try {
      await updateAlbum({ id: album.id, [field]: nextValue })
    } catch {
      // updateAlbum already logs the error
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="album-credits">Credits</Label>
        <AutoSaveTextarea
          id="album-credits"
          initialValue={album.credits ?? ''}
          onSave={(v) => void handleFieldSave('credits', v)}
          rows={4}
          placeholder="Album-level credits..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="album-release-date">
          {album.status === 'released'
            ? 'Release Date'
            : 'Planned Release Date'}
        </Label>
        <Input
          id="album-release-date"
          type="date"
          value={album.releaseDate ?? ''}
          onChange={(event) =>
            void handleFieldSave('releaseDate', event.target.value)
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="album-label">Label</Label>
        <Input
          id="album-label"
          defaultValue={album.label ?? ''}
          onBlur={(event) =>
            void handleFieldSave('label', event.target.value)
          }
          placeholder="Record label"
        />
      </div>
    </div>
  )
}
