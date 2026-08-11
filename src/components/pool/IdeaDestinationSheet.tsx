import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useSectionsForSong } from '@/hooks/useSections'
import { useAllSongs } from '@/hooks/useSongs'

export type IdeaDestinationMode = 'move' | 'copy'

interface IdeaDestinationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: IdeaDestinationMode
  excludeSongId?: string | null
  onConfirm: (songId: string, sectionId: string | null) => Promise<void>
}

export function IdeaDestinationSheet({
  open,
  onOpenChange,
  mode,
  excludeSongId,
  onConfirm,
}: IdeaDestinationSheetProps) {
  const songs = useAllSongs()
  const [songId, setSongId] = useState('')
  const [sectionId, setSectionId] = useState('unassigned')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sections = useSectionsForSong(songId || undefined)

  const availableSongs = (songs ?? []).filter((song) => song.id !== excludeSongId)

  async function handleConfirm() {
    if (!songId) {
      return
    }

    setIsSubmitting(true)
    try {
      await onConfirm(songId, sectionId === 'unassigned' ? null : sectionId)
      onOpenChange(false)
      setSongId('')
      setSectionId('unassigned')
    } catch {
      // caller logs
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {mode === 'move' ? 'Move to Song' : 'Copy to Song'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-1 py-4">
          <div className="space-y-2">
            <Label>Song</Label>
            <Select
              value={songId}
              onValueChange={(value) => {
                setSongId(value)
                setSectionId('unassigned')
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a song" />
              </SelectTrigger>
              <SelectContent>
                {availableSongs.map((song) => (
                  <SelectItem key={song.id} value={song.id}>
                    {song.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {songId ? (
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {(sections ?? []).map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <SheetFooter>
          <Button
            disabled={!songId || isSubmitting}
            onClick={() => void handleConfirm()}
          >
            {isSubmitting
              ? mode === 'move'
                ? 'Moving...'
                : 'Copying...'
              : mode === 'move'
                ? 'Move'
                : 'Copy'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
