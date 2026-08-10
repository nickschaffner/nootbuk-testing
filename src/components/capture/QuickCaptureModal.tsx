import {
  FileText,
  ImageIcon,
  Mic,
  Music2,
  Paperclip,
  Piano,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { AudioImport } from '@/components/capture/AudioImport'
import { AudioRecorder } from '@/components/capture/AudioRecorder'
import { MidiRecorder } from '@/components/capture/MidiRecorder'
import { NotePicker } from '@/components/capture/NotePicker'
import {
  BLOCK_LABELS,
  blockHasContent,
  createEmptyBlock,
  type QuickCaptureBlock,
  type QuickCaptureBlockType,
} from '@/components/capture/quickCaptureTypes'
import { RolePillSelector } from '@/components/pool/RolePillSelector'
import { SectionIntentPillSelector } from '@/components/pool/SectionIntentPillSelector'
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
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { createIdea } from '@/hooks/useIdeas'
import { addMediaToIdea } from '@/hooks/useMedia'
import { createNoteSequence } from '@/hooks/useNoteSequences'
import { useSectionsForSong } from '@/hooks/useSections'
import { useAllSongs } from '@/hooks/useSongs'
import { getAudioDuration, getAudioMimeType } from '@/lib/audio'
import { getMidiDuration, noteEventsToMidiBlob } from '@/lib/midi'
import { useQuickCapture } from '@/stores/quickCapture'
import type { IdeaRole, SectionIntent } from '@/types/idea'

const TOOLBAR_ITEMS: Array<{
  type: QuickCaptureBlockType
  label: string
  icon: typeof Mic
}> = [
  { type: 'audio', label: 'Record Audio', icon: Mic },
  { type: 'audio-import', label: 'Import Audio', icon: Upload },
  { type: 'midi', label: 'Record MIDI', icon: Piano },
  { type: 'notes', label: 'Note Picker', icon: Music2 },
  { type: 'text', label: 'Text / Lyrics', icon: FileText },
  { type: 'image', label: 'Photo / Image', icon: ImageIcon },
  { type: 'file', label: 'File', icon: Paperclip },
]

function CaptureBlockShell({
  label,
  onRemove,
  children,
}: {
  label: string
  onRemove: () => void
  children: ReactNode
}) {
  return (
    <div className="relative rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7"
          onClick={onRemove}
        >
          <X className="size-4" />
          <span className="sr-only">Remove block</span>
        </Button>
      </div>
      {children}
    </div>
  )
}

function TextCaptureBlock({
  content,
  onChange,
}: {
  content: string
  onChange: (content: string) => void
}) {
  return (
    <Textarea
      placeholder="Lyrics, lines, ideas, descriptions..."
      value={content}
      onChange={(event) => onChange(event.target.value)}
      rows={4}
    />
  )
}

function ImageCaptureBlock({
  file,
  previewUrl,
  onChange,
}: {
  file: File | null
  previewUrl: string | null
  onChange: (file: File | null, previewUrl: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(nextFile: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    if (!nextFile) {
      onChange(null, null)
      return
    }

    onChange(nextFile, URL.createObjectURL(nextFile))
  }

  return (
    <div className="space-y-3">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={file?.name ?? 'Selected image'}
          className="max-h-48 rounded-md border object-contain"
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Choose an image to attach to this idea.
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          {file ? 'Replace Image' : 'Choose Image'}
        </Button>
        {file ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleFile(null)}
          >
            Remove
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const nextFile = event.target.files?.[0] ?? null
          handleFile(nextFile)
          event.target.value = ''
        }}
      />
    </div>
  )
}

function FileCaptureBlock({
  file,
  onChange,
}: {
  file: File | null
  onChange: (file: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-3">
      {file ? (
        <p className="text-sm">{file.name}</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Attach any file to this idea.
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          {file ? 'Replace File' : 'Choose File'}
        </Button>
        {file ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
          >
            Remove
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          onChange(event.target.files?.[0] ?? null)
          event.target.value = ''
        }}
      />
    </div>
  )
}

export function QuickCaptureModal() {
  const { isOpen, target, close } = useQuickCapture()
  const songs = useAllSongs()

  const [blocks, setBlocks] = useState<QuickCaptureBlock[]>([])
  const [role, setRole] = useState<IdeaRole>('melody')
  const [sectionIntent, setSectionIntent] = useState<SectionIntent | null>(null)
  const [instrumentName, setInstrumentName] = useState('')
  const [key, setKey] = useState('')
  const [tempo, setTempo] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSongSave, setShowSongSave] = useState(false)
  const [selectedSongId, setSelectedSongId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('unassigned')

  const sections = useSectionsForSong(selectedSongId || undefined)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (target) {
      setSelectedSongId(target.songId)
      setSelectedSectionId(target.sectionId ?? 'unassigned')
      setShowSongSave(true)
    } else {
      setSelectedSongId('')
      setSelectedSectionId('unassigned')
      setShowSongSave(false)
    }
  }, [isOpen, target])

  function resetForm() {
    for (const block of blocks) {
      if (block.type === 'image' && block.previewUrl) {
        URL.revokeObjectURL(block.previewUrl)
      }
    }

    setBlocks([])
    setRole('melody')
    setSectionIntent(null)
    setInstrumentName('')
    setKey('')
    setTempo('')
    setNotes('')
    setShowSongSave(false)
    setSelectedSongId('')
    setSelectedSectionId('unassigned')
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      resetForm()
      close()
    }
  }

  function addBlock(type: QuickCaptureBlockType) {
    setBlocks((current) => [...current, createEmptyBlock(type)])
  }

  function removeBlock(id: string) {
    setBlocks((current) => {
      const block = current.find((item) => item.id === id)
      if (block?.type === 'image' && block.previewUrl) {
        URL.revokeObjectURL(block.previewUrl)
      }
      return current.filter((item) => item.id !== id)
    })
  }

  function updateBlock(
    id: string,
    updater: (block: QuickCaptureBlock) => QuickCaptureBlock,
  ) {
    setBlocks((current) => {
      let changed = false
      const nextBlocks = current.map((block) => {
        if (block.id !== id) {
          return block
        }

        const nextBlock = updater(block)
        if (nextBlock !== block) {
          changed = true
        }
        return nextBlock
      })

      return changed ? nextBlocks : current
    })
  }

  function hasSavableContent() {
    return blocks.some(blockHasContent)
  }

  async function persistIdea(
    songId: string | null,
    sectionId: string | null,
  ) {
    const lyrics = blocks
      .filter((block) => block.type === 'text')
      .map((block) => block.content.trim())
      .filter(Boolean)
      .join('\n\n')

    const idea = await createIdea({
      songId,
      sectionId,
      role,
      sectionIntent,
      key: key.trim() || null,
      tempo: tempo ? Number.parseInt(tempo, 10) : null,
      timeSignature: null,
      instrumentName: instrumentName.trim() || null,
      patchName: null,
      patchSettings: null,
      lyrics: lyrics || null,
      notes: notes.trim() || null,
      status: 'raw',
    })

    for (const block of blocks) {
      if (!blockHasContent(block)) {
        continue
      }

      if (
        (block.type === 'audio' || block.type === 'audio-import') &&
        block.blob
      ) {
        const duration = await getAudioDuration(block.blob)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename =
          block.filename ??
          (block.type === 'audio-import'
            ? `import-${timestamp}.wav`
            : `recording-${timestamp}.wav`)

        await addMediaToIdea({
          ideaId: idea.id,
          type: 'audio',
          filename,
          mimeType: getAudioMimeType(filename, block.blob.type),
          blob: block.blob,
          duration,
          noteData: null,
        })
      }

      if (block.type === 'midi' && block.noteEvents.length > 0) {
        const blob = noteEventsToMidiBlob(block.noteEvents, block.bpm)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        await addMediaToIdea({
          ideaId: idea.id,
          type: 'midi',
          filename: `recording-${timestamp}.mid`,
          mimeType: 'audio/midi',
          blob,
          duration: getMidiDuration(block.noteEvents),
          noteData: block.noteEvents,
        })
      }

      if (block.type === 'notes' && block.notes.length > 0) {
        await createNoteSequence({
          ideaId: idea.id,
          notes: block.notes,
          label: block.label,
        })
      }

      if (block.type === 'image' && block.file) {
        await addMediaToIdea({
          ideaId: idea.id,
          type: 'image',
          filename: block.file.name,
          mimeType: block.file.type || 'image/*',
          blob: block.file,
          duration: null,
          noteData: null,
        })
      }

      if (block.type === 'file' && block.file) {
        await addMediaToIdea({
          ideaId: idea.id,
          type: 'file',
          filename: block.file.name,
          mimeType: block.file.type || 'application/octet-stream',
          blob: block.file,
          duration: null,
          noteData: null,
        })
      }
    }

    return idea
  }

  async function handleSaveToPool() {
    if (!hasSavableContent()) {
      return
    }

    setIsSaving(true)
    try {
      await persistIdea(null, null)
      resetForm()
      close()
    } catch {
      // createIdea already logs the error
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveToSong() {
    if (!hasSavableContent() || !selectedSongId) {
      return
    }

    setIsSaving(true)
    try {
      await persistIdea(
        selectedSongId,
        selectedSectionId === 'unassigned' ? null : selectedSectionId,
      )
      resetForm()
      close()
    } catch {
      // createIdea already logs the error
    } finally {
      setIsSaving(false)
    }
  }

  function renderBlock(block: QuickCaptureBlock) {
    switch (block.type) {
      case 'audio':
        return (
          <AudioRecorder
            draft
            embedded
            onDraftChange={(blob) =>
              updateBlock(block.id, (current) =>
                current.type === 'audio' &&
                (current.blob !== blob || current.filename !== null)
                  ? { ...current, blob, filename: null }
                  : current,
              )
            }
          />
        )
      case 'audio-import':
        return (
          <AudioImport
            draft
            embedded
            onDraftChange={(data) =>
              updateBlock(block.id, (current) => {
                if (current.type !== 'audio-import') {
                  return current
                }

                const blob = data?.blob ?? null
                const filename = data?.filename ?? null
                if (current.blob === blob && current.filename === filename) {
                  return current
                }

                return { ...current, blob, filename }
              })
            }
          />
        )
      case 'midi':
        return (
          <MidiRecorder
            draft
            embedded
            onDraftChange={(data) =>
              updateBlock(block.id, (current) => {
                if (current.type !== 'midi') {
                  return current
                }

                const noteEvents = data?.noteEvents ?? []
                const bpm = data?.bpm ?? current.bpm
                if (
                  current.noteEvents === noteEvents &&
                  current.bpm === bpm
                ) {
                  return current
                }

                return { ...current, noteEvents, bpm }
              })
            }
          />
        )
      case 'notes':
        return (
          <NotePicker
            draft
            embedded
            onDraftChange={(data) =>
              updateBlock(block.id, (current) => {
                if (current.type !== 'notes') {
                  return current
                }

                if (
                  current.notes === data.notes &&
                  current.label === data.label
                ) {
                  return current
                }

                return {
                  ...current,
                  notes: data.notes,
                  label: data.label,
                }
              })
            }
          />
        )
      case 'text':
        return (
          <TextCaptureBlock
            content={block.content}
            onChange={(content) =>
              updateBlock(block.id, (current) =>
                current.type === 'text' && current.content !== content
                  ? { ...current, content }
                  : current,
              )
            }
          />
        )
      case 'image':
        return (
          <ImageCaptureBlock
            file={block.file}
            previewUrl={block.previewUrl}
            onChange={(file, previewUrl) =>
              updateBlock(block.id, (current) =>
                current.type === 'image' &&
                current.file === file &&
                current.previewUrl === previewUrl
                  ? current
                  : current.type === 'image'
                    ? { ...current, file, previewUrl }
                    : current,
              )
            }
          />
        )
      case 'file':
        return (
          <FileCaptureBlock
            file={block.file}
            onChange={(file) =>
              updateBlock(block.id, (current) =>
                current.type === 'file' && current.file !== file
                  ? { ...current, file }
                  : current,
              )
            }
          />
        )
    }
  }

  const selectedSong = songs?.find((song) => song.id === selectedSongId)

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="h-full max-h-svh w-full overflow-y-auto p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Quick Capture</SheetTitle>
          <SheetDescription>
            Jot down an idea fast. Stack audio, MIDI, notes, text, and files in
            one capture.
            <span className="mt-1 block text-xs">
              Shortcut: Ctrl+Shift+C
            </span>
          </SheetDescription>
          {target ? (
            <p className="text-sm text-muted-foreground">
              Target: {selectedSong?.title ?? 'Song'} —{' '}
              {target.sectionLabel ?? 'Unassigned'}
            </p>
          ) : null}
        </SheetHeader>

        <div className="space-y-4 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {TOOLBAR_ITEMS.map(({ type, label, icon: Icon }) => (
              <Button
                key={type}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addBlock(type)}
              >
                <Icon className="size-4" />
                {label}
              </Button>
            ))}
          </div>

          {blocks.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Add content blocks with the toolbar above. Mix and match any
              combination.
            </div>
          ) : (
            <div className="space-y-4">
              {blocks.map((block) => (
                <CaptureBlockShell
                  key={block.id}
                  label={BLOCK_LABELS[block.type]}
                  onRemove={() => removeBlock(block.id)}
                >
                  {renderBlock(block)}
                </CaptureBlockShell>
              ))}
            </div>
          )}

          <div className="space-y-4 rounded-lg border p-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <RolePillSelector value={role} onChange={setRole} />
            </div>

            <div className="space-y-2">
              <Label>Section intent (optional)</Label>
              <SectionIntentPillSelector
                value={sectionIntent}
                onChange={setSectionIntent}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capture-instrument">Instrument</Label>
              <Input
                id="capture-instrument"
                placeholder="Piano, Minitaur, etc."
                value={instrumentName}
                onChange={(event) => setInstrumentName(event.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capture-key">Key</Label>
                <Input
                  id="capture-key"
                  placeholder="Cm, F#, Bb"
                  value={key}
                  onChange={(event) => setKey(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capture-tempo">Tempo</Label>
                <Input
                  id="capture-tempo"
                  type="number"
                  min={1}
                  placeholder="120"
                  value={tempo}
                  onChange={(event) => setTempo(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capture-notes">Notes</Label>
              <Textarea
                id="capture-notes"
                placeholder="Play with a pick, sounds like..."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <div className="flex w-full flex-col gap-3">
            {showSongSave ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Song</Label>
                  <Select
                    value={selectedSongId || undefined}
                    onValueChange={(value) => {
                      setSelectedSongId(value)
                      setSelectedSectionId('unassigned')
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select song" />
                    </SelectTrigger>
                    <SelectContent>
                      {(songs ?? []).map((song) => (
                        <SelectItem key={song.id} value={song.id}>
                          {song.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select
                    value={selectedSectionId}
                    onValueChange={setSelectedSectionId}
                    disabled={!selectedSongId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select section" />
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
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={!hasSavableContent() || isSaving}
                onClick={() => void handleSaveToPool()}
              >
                {isSaving ? 'Saving...' : 'Save to Pool'}
              </Button>

              {!showSongSave ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasSavableContent() || isSaving}
                  onClick={() => setShowSongSave(true)}
                >
                  Save to Song
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    !hasSavableContent() || isSaving || !selectedSongId
                  }
                  onClick={() => void handleSaveToSong()}
                >
                  {isSaving ? 'Saving...' : 'Save to Song'}
                </Button>
              )}
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
