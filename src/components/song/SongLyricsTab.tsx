import { Label } from '@/components/ui/label'
import { AutoSaveTextarea } from '@/components/shared/AutoSaveTextarea'
import { updateSong } from '@/hooks/useSongs'
import type { Song } from '@/types/song'

interface SongLyricsTabProps {
  song: Song
}

export function SongLyricsTab({ song }: SongLyricsTabProps) {
  async function handleSave(text: string) {
    const nextLyrics = text.trim() || null
    if (nextLyrics === song.lyrics) {
      return
    }

    try {
      await updateSong({ id: song.id, lyrics: nextLyrics })
    } catch {
      // updateSong already logs the error
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="song-lyrics">Song lyrics</Label>
      <AutoSaveTextarea
        id="song-lyrics"
        initialValue={song.lyrics ?? ''}
        onSave={(text) => void handleSave(text)}
        placeholder="Full lyric sheet for this song..."
        rows={16}
        className="min-h-64 resize-y font-mono text-sm"
      />
    </div>
  )
}
