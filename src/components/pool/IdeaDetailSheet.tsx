import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { RolePillSelector } from '@/components/pool/RolePillSelector'
import { IdeaActionsMenu } from '@/components/pool/IdeaActionsMenu'
import { IdeaMediaSection } from '@/components/pool/IdeaMediaSection'
import { InstrumentSelector } from '@/components/instruments/InstrumentSelector'
import { KeySelector } from '@/components/shared/KeySelector'
import { SynthPatchSelector } from '@/components/shared/SynthPatchSelector'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Textarea } from '@/components/ui/textarea'
import { deleteIdea, updateIdea } from '@/hooks/useIdeas'
import { db } from '@/lib/db'
import type {
  IdeaRole,
  IdeaStatus,
  SectionIntent,
} from '@/types/idea'

interface IdeaDetailSheetProps {
  ideaId: string | null
  onClose: () => void
}

const IDEA_STATUSES: IdeaStatus[] = ['raw', 'developed', 'used', 'archived']

const SECTION_INTENTS: SectionIntent[] = [
  'verse',
  'chorus',
  'bridge',
  'pre-chorus',
  'intro',
  'outro',
  'breakdown',
  'solo',
  'unassigned',
]

export function IdeaDetailSheet({ ideaId, onClose }: IdeaDetailSheetProps) {
  const idea = useLiveQuery(
    () => (ideaId ? db.ideas.get(ideaId) : undefined),
    [ideaId],
  )

  const [role, setRole] = useState<IdeaRole>('melody')
  const [status, setStatus] = useState<IdeaStatus>('raw')
  const [sectionIntent, setSectionIntent] = useState<SectionIntent | 'none'>(
    'none',
  )
  const [key, setKey] = useState<string | null>(null)
  const [tempo, setTempo] = useState('')
  const [timeSignature, setTimeSignature] = useState('')
  const [instrumentId, setInstrumentId] = useState<string | null>(null)
  const [instrumentName, setInstrumentName] = useState<string | null>(null)
  const [patchName, setPatchName] = useState<string | null>(null)
  const [lyrics, setLyrics] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!idea) {
      return
    }

    setRole(idea.role)
    setStatus(idea.status)
    setSectionIntent(idea.sectionIntent ?? 'none')
    setKey(idea.key ?? null)
    setTempo(idea.tempo?.toString() ?? '')
    setTimeSignature(idea.timeSignature ?? '')
    setInstrumentId(idea.instrumentId ?? null)
    setInstrumentName(idea.instrumentName ?? null)
    setPatchName(idea.patchName ?? null)
    setLyrics(idea.lyrics ?? '')
    setNotes(idea.notes ?? '')
  }, [idea])

  async function handleSave() {
    if (!ideaId) {
      return
    }

    setIsSaving(true)
    try {
      await updateIdea({
        id: ideaId,
        role,
        status,
        sectionIntent: sectionIntent === 'none' ? null : sectionIntent,
        key,
        tempo: tempo ? Number.parseInt(tempo, 10) : null,
        timeSignature: timeSignature.trim() || null,
        instrumentId,
        instrumentName,
        patchName,
        lyrics: lyrics.trim() || null,
        notes: notes.trim() || null,
      })
      onClose()
    } catch {
      // updateIdea already logs the error
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!ideaId) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteIdea(ideaId)
      onClose()
    } catch {
      // deleteIdea already logs the error
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Sheet open={ideaId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Idea Detail</SheetTitle>
        </SheetHeader>

        {!idea ? (
          <p className="py-8 text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-4 px-1 py-4">
            <IdeaMediaSection ideaId={idea.id} />

            <div className="space-y-2">
              <Label>Role</Label>
              <RolePillSelector value={role} onChange={setRole} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as IdeaStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IDEA_STATUSES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Section intent</Label>
                <Select
                  value={sectionIntent}
                  onValueChange={(value) =>
                    setSectionIntent(value as SectionIntent | 'none')
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {SECTION_INTENTS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <InstrumentSelector
              id="detail-instrument"
              value={{ instrumentId, instrumentName }}
              onChange={(next) => {
                setInstrumentId(next.instrumentId)
                setInstrumentName(next.instrumentName)
              }}
              onAutoPatch={(patch) => setPatchName(patch)}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <SynthPatchSelector
                id="detail-patch"
                value={patchName}
                onChange={setPatchName}
              />
              <KeySelector id="detail-key" value={key} onChange={setKey} />
              <div className="space-y-2">
                <Label htmlFor="detail-tempo">Tempo</Label>
                <Input
                  id="detail-tempo"
                  type="number"
                  min={1}
                  value={tempo}
                  onChange={(event) => setTempo(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="detail-time">Time</Label>
                <Input
                  id="detail-time"
                  placeholder="4/4"
                  value={timeSignature}
                  onChange={(event) => setTimeSignature(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail-lyrics">Lyrics</Label>
              <Textarea
                id="detail-lyrics"
                value={lyrics}
                onChange={(event) => setLyrics(event.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail-notes">Notes</Label>
              <Textarea
                id="detail-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
              />
            </div>

            <div className="rounded-lg border p-4">
              <Label className="mb-3 block">Idea actions</Label>
              {idea ? (
                <IdeaActionsMenu
                  idea={idea}
                  variant="button"
                  onActionComplete={onClose}
                />
              ) : null}
            </div>
          </div>
        )}

        <SheetFooter className="flex-row justify-between gap-2 sm:justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={!idea || isDeleting}>
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this idea?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the idea and any attached media. This
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={(event) => {
                    event.preventDefault()
                    void handleDelete()
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!idea || isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
