import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { RolePillSelector } from '@/components/pool/RolePillSelector'
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
import { deleteIdea, moveIdeaToSection, updateIdea } from '@/hooks/useIdeas'
import { useSectionsForSong } from '@/hooks/useSections'
import { useAllSongs } from '@/hooks/useSongs'
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
  const [key, setKey] = useState('')
  const [tempo, setTempo] = useState('')
  const [timeSignature, setTimeSignature] = useState('')
  const [instrumentName, setInstrumentName] = useState('')
  const [patchName, setPatchName] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [targetSongId, setTargetSongId] = useState('')
  const [targetSectionId, setTargetSectionId] = useState('unassigned')
  const [isMoving, setIsMoving] = useState(false)

  const songs = useAllSongs()
  const sections = useSectionsForSong(targetSongId || undefined)

  useEffect(() => {
    if (!idea) {
      return
    }

    setRole(idea.role)
    setStatus(idea.status)
    setSectionIntent(idea.sectionIntent ?? 'none')
    setKey(idea.key ?? '')
    setTempo(idea.tempo?.toString() ?? '')
    setTimeSignature(idea.timeSignature ?? '')
    setInstrumentName(idea.instrumentName ?? '')
    setPatchName(idea.patchName ?? '')
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
        key: key.trim() || null,
        tempo: tempo ? Number.parseInt(tempo, 10) : null,
        timeSignature: timeSignature.trim() || null,
        instrumentName: instrumentName.trim() || null,
        patchName: patchName.trim() || null,
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

  async function handleMoveToSong() {
    if (!ideaId || !targetSongId) {
      return
    }

    setIsMoving(true)
    try {
      const sectionId =
        targetSectionId === 'unassigned' ? null : targetSectionId
      await moveIdeaToSection(ideaId, targetSongId, sectionId)
      onClose()
    } catch {
      // moveIdeaToSection already logs the error
    } finally {
      setIsMoving(false)
    }
  }

  async function handleMoveToPool() {
    if (!ideaId) {
      return
    }

    setIsMoving(true)
    try {
      await moveIdeaToSection(ideaId, null, null)
      onClose()
    } catch {
      // moveIdeaToSection already logs the error
    } finally {
      setIsMoving(false)
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

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="detail-key">Key</Label>
                <Input
                  id="detail-key"
                  value={key}
                  onChange={(event) => setKey(event.target.value)}
                />
              </div>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="detail-instrument">Instrument</Label>
                <Input
                  id="detail-instrument"
                  value={instrumentName}
                  onChange={(event) => setInstrumentName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="detail-patch">Patch</Label>
                <Input
                  id="detail-patch"
                  value={patchName}
                  onChange={(event) => setPatchName(event.target.value)}
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

            {idea.songId === null ? (
              <div className="space-y-3 rounded-lg border p-4">
                <Label>Move to Song</Label>
                <Select
                  value={targetSongId}
                  onValueChange={(value) => {
                    setTargetSongId(value)
                    setTargetSectionId('unassigned')
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a song" />
                  </SelectTrigger>
                  <SelectContent>
                    {(songs ?? []).map((song) => (
                      <SelectItem key={song.id} value={song.id}>
                        {song.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {targetSongId ? (
                  <Select
                    value={targetSectionId}
                    onValueChange={setTargetSectionId}
                  >
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
                ) : null}

                <Button
                  variant="secondary"
                  disabled={!targetSongId || isMoving}
                  onClick={() => void handleMoveToSong()}
                >
                  {isMoving ? 'Moving...' : 'Move to Song'}
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border p-4">
                <Button
                  variant="secondary"
                  disabled={isMoving}
                  onClick={() => void handleMoveToPool()}
                >
                  {isMoving ? 'Moving...' : 'Move to Pool'}
                </Button>
              </div>
            )}
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
