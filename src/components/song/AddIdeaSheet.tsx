import { useState } from 'react'

import { RolePillSelector } from '@/components/pool/RolePillSelector'
import { KeySelector } from '@/components/shared/KeySelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { createIdea } from '@/hooks/useIdeas'
import type { IdeaRole } from '@/types/idea'

interface AddIdeaSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  songId: string
  sectionId: string | null
  sectionLabel: string
}

export function AddIdeaSheet({
  open,
  onOpenChange,
  songId,
  sectionId,
  sectionLabel,
}: AddIdeaSheetProps) {
  const [role, setRole] = useState<IdeaRole>('melody')
  const [lyrics, setLyrics] = useState('')
  const [notes, setNotes] = useState('')
  const [instrumentName, setInstrumentName] = useState('')
  const [key, setKey] = useState<string | null>(null)
  const [tempo, setTempo] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function resetForm() {
    setRole('melody')
    setLyrics('')
    setNotes('')
    setInstrumentName('')
    setKey(null)
    setTempo('')
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      await createIdea({
        songId,
        sectionId,
        role,
        sectionIntent: null,
        key,
        tempo: tempo ? Number.parseInt(tempo, 10) : null,
        timeSignature: null,
        instrumentId: null,
        instrumentName: instrumentName.trim() || null,
        patchName: null,
        patchSettings: null,
        lyrics: lyrics.trim() || null,
        notes: notes.trim() || null,
      })
      resetForm()
      onOpenChange(false)
    } catch {
      // createIdea already logs the error
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Add Idea — {sectionLabel}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-1 py-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <RolePillSelector value={role} onChange={setRole} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <KeySelector id="section-idea-key" value={key} onChange={setKey} />
            <div className="space-y-2">
              <Label htmlFor="section-idea-tempo">Tempo</Label>
              <Input
                id="section-idea-tempo"
                type="number"
                min={1}
                placeholder="120"
                value={tempo}
                onChange={(event) => setTempo(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="section-idea-instrument">Instrument</Label>
            <Input
              id="section-idea-instrument"
              placeholder="Piano, bass, etc."
              value={instrumentName}
              onChange={(event) => setInstrumentName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="section-idea-lyrics">Lyrics</Label>
            <Textarea
              id="section-idea-lyrics"
              placeholder="Lyric lines or hooks..."
              value={lyrics}
              onChange={(event) => setLyrics(event.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="section-idea-notes">Notes</Label>
            <Textarea
              id="section-idea-notes"
              placeholder="Production notes..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
            />
          </div>
        </div>

        <SheetFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Idea'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
