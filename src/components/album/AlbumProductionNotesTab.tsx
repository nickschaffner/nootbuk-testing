import { useEffect, useState } from 'react'

import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { updateAlbum } from '@/hooks/useAlbums'
import type { Album } from '@/types/album'

interface AlbumProductionNotesTabProps {
  album: Album
}

export function AlbumProductionNotesTab({ album }: AlbumProductionNotesTabProps) {
  const [content, setContent] = useState(album.globalNotes ?? '')

  useEffect(() => {
    setContent(album.globalNotes ?? '')
  }, [album.globalNotes])

  async function handleChange(html: string) {
    setContent(html)
    try {
      await updateAlbum({
        id: album.id,
        globalNotes: html === '<p></p>' ? null : html,
      })
    } catch {
      // updateAlbum already logs the error
    }
  }

  return (
    <RichTextEditor
      content={content}
      onChange={(html) => void handleChange(html)}
      placeholder="Album-wide production notes: signal chains, gear lists, sonic direction..."
    />
  )
}
