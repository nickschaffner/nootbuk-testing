import { useState } from 'react'

import { RolePillSelector } from '@/components/pool/RolePillSelector'
import { KeySelector } from '@/components/shared/KeySelector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createIdea } from '@/hooks/useIdeas'
import type { IdeaRole } from '@/types/idea'

export function NewIdeaForm() {
  const [role, setRole] = useState<IdeaRole>('melody')
  const [lyrics, setLyrics] = useState('')
  const [notes, setNotes] = useState('')
  const [instrumentName, setInstrumentName] = useState('')
  const [key, setKey] = useState<string | null>(null)
  const [tempo, setTempo] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    try {
      await createIdea({
        songId: null,
        sectionId: null,
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

      setLyrics('')
      setNotes('')
      setInstrumentName('')
      setKey(null)
      setTempo('')
    } catch {
      // createIdea already logs the error
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">New Idea</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Role</Label>
          <RolePillSelector value={role} onChange={setRole} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <KeySelector id="new-idea-key" value={key} onChange={setKey} />
          <div className="space-y-2">
            <Label htmlFor="new-idea-tempo">Tempo</Label>
            <Input
              id="new-idea-tempo"
              type="number"
              min={1}
              placeholder="120"
              value={tempo}
              onChange={(event) => setTempo(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-idea-instrument">Instrument</Label>
          <Input
            id="new-idea-instrument"
            placeholder="Piano, bass, etc."
            value={instrumentName}
            onChange={(event) => setInstrumentName(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-idea-lyrics">Lyrics</Label>
          <Textarea
            id="new-idea-lyrics"
            placeholder="Lyric lines or hooks..."
            value={lyrics}
            onChange={(event) => setLyrics(event.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-idea-notes">Notes</Label>
          <Textarea
            id="new-idea-notes"
            placeholder="Production notes, directions..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
          />
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save to Pool'}
        </Button>
      </CardContent>
    </Card>
  )
}
