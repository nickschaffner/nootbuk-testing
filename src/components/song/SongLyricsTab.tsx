import { useEffect, useState } from 'react'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateSong } from '@/hooks/useSongs'
import type { Song } from '@/types/song'

interface SongLyricsTabProps {
  song: Song
}

export function SongLyricsTab({ song }: SongLyricsTabProps) {
  const [lyrics, setLyrics] = useState(song.lyrics ?? '')

  useEffect(() => {
    setLyrics(song.lyrics ?? '')
  }, [song.id, song.lyrics])

  async function handleBlur() {
    const trimmed = lyrics.trim()
    const nextLyrics = trimmed || null

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
      <Textarea
        id="song-lyrics"
        value={lyrics}
        onChange={(event) => setLyrics(event.target.value)}
        onBlur={() => void handleBlur()}
        placeholder="Full lyric sheet for this song..."
        rows={16}
        className="min-h-64 resize-y font-mono text-sm"
      />
    </div>
  )
}
