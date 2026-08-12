import {
  ImageIcon,
  Mic,
  Music2,
  Paperclip,
  Piano,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { AudioRecorder } from '@/components/capture/AudioRecorder'
import { MidiRecorder } from '@/components/capture/MidiRecorder'
import { NotePicker } from '@/components/capture/NotePicker'
import {
  blockHasContent,
  createAudioImportBlock,
  createEmptyBlock,
  getBlockLabel,
  type QuickCaptureBlock,
  type QuickCaptureBlockType,
} from '@/components/capture/quickCaptureTypes'
import { RolePillSelector } from '@/components/pool/RolePillSelector'
import { SectionIntentPillSelector } from '@/components/pool/SectionIntentPillSelector'
import { InstrumentSelector } from '@/components/instruments/InstrumentSelector'
import { AudioPlayer } from '@/components/player/AudioPlayer'
import { ExtractMidiFromAudio } from '@/components/player/ExtractMidiFromAudio'
import { MidiPlayer } from '@/components/player/MidiPlayer'
import { KeySelector } from '@/components/shared/KeySelector'
import { SynthPatchSelector } from '@/components/shared/SynthPatchSelector'
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
import { addMediaToIdea, addMidiFromSequenceNotes } from '@/hooks/useMedia'
import { useSectionsForSong } from '@/hooks/useSections'
import { useAllSongs } from '@/hooks/useSongs'
import { useSynth } from '@/hooks/useSynth'
import {
  getAudioDuration,
  getAudioMimeType,
  isAcceptedAudioFile,
  normalizeAudioBlob,
} from '@/lib/audio'
import { getMidiDuration, noteEventsToMidiBlob } from '@/lib/midi'
import { useQuickCapture } from '@/stores/quickCapture'
import type { IdeaRole, NoteEvent, SectionIntent } from '@/types/idea'

type ToolbarAction = Exclude<QuickCaptureBlockType, 'audio-import'> | 'audio-import'

const TOOLBAR_ITEMS: Array<{
  type: ToolbarAction
  label: string
  icon: typeof Mic
}> = [
  { type: 'audio', label: 'Record Audio', icon: Mic },
  { type: 'audio-import', label: 'Import Audio', icon: Upload },
  { type: 'midi', label: 'Record MIDI', icon: Piano },
  { type: 'notes', label: 'Note Picker', icon: Music2 },
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
  const { currentPatch, isMuted } = useSynth()
  const playbackPatch = isMuted ? 'muted' : currentPatch
  const audioImportInputRef = useRef<HTMLInputElement>(null)
  const [audioImportError, setAudioImportError] = useState<string | null>(null)

  const [blocks, setBlocks] = useState<QuickCaptureBlock[]>([])
  const [role, setRole] = useState<IdeaRole>('melody')
  const [sectionIntent, setSectionIntent] = useState<SectionIntent | null>(null)
  const [instrumentId, setInstrumentId] = useState<string | null>(null)
  const [instrumentName, setInstrumentName] = useState<string | null>(null)
  const [patchName, setPatchName] = useState<string | null>(null)
  const [key, setKey] = useState<string | null>(null)
  const [tempo, setTempo] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
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
    setInstrumentId(null)
    setInstrumentName(null)
    setPatchName(null)
    setKey(null)
    setTempo('')
    setLyrics('')
    setNotes('')
    setSaveError(null)
    setAudioImportError(null)
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

  function addBlock(type: Exclude<QuickCaptureBlockType, 'audio-import'>) {
    setBlocks((current) => {
      if (type === 'audio') {
        const withoutAudio = current.filter((block) => block.type !== 'audio')
        return [...withoutAudio, createEmptyBlock('audio')]
      }

      if (type === 'midi' || type === 'notes') {
        const withoutMidiSource = current.filter(
          (block) => block.type !== 'midi' && block.type !== 'notes',
        )
        return [...withoutMidiSource, createEmptyBlock(type)]
      }

      return [...current, createEmptyBlock(type)]
    })
  }

  function replaceAudioWithImport(blob: Blob, filename: string) {
    setBlocks((current) => {
      const withoutAudio = current.filter((block) => block.type !== 'audio')
      return [...withoutAudio, createAudioImportBlock(blob, filename)]
    })
  }

  function applyExtractedMidi(noteEvents: NoteEvent[]) {
    setBlocks((current) => {
      const withoutMidiSource = current.filter(
        (block) => block.type !== 'midi' && block.type !== 'notes',
      )
      return [
        ...withoutMidiSource,
        {
          id: crypto.randomUUID(),
          type: 'midi' as const,
          noteEvents,
          bpm: 120,
        },
      ]
    })
  }

  async function handleImportAudioFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) {
      return
    }

    if (!isAcceptedAudioFile(file)) {
      setAudioImportError('Only .wav, .mp3, and .aiff files are supported.')
      return
    }

    setAudioImportError(null)
    try {
      const mimeType = getAudioMimeType(file.name, file.type)
      const blob = await normalizeAudioBlob(file, mimeType, file.name)
      replaceAudioWithImport(blob, file.name)
    } catch {
      setAudioImportError('Failed to import audio file.')
    }
  }

  function handleToolbarAction(type: ToolbarAction) {
    if (type === 'audio-import') {
      audioImportInputRef.current?.click()
      return
    }

    addBlock(type)
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
    return blocks.some(blockHasContent) || lyrics.trim().length > 0
  }

  async function persistIdea(
    songId: string | null,
    sectionId: string | null,
  ) {
    const idea = await createIdea({
      songId,
      sectionId,
      role,
      sectionIntent,
      key,
      tempo: tempo ? Number.parseInt(tempo, 10) : null,
      timeSignature: null,
      instrumentId,
      instrumentName,
      patchName,
      patchSettings: null,
      lyrics: lyrics.trim() || null,
      notes: notes.trim() || null,
      status: 'raw',
    })

    for (const block of blocks) {
      if (!blockHasContent(block)) {
        continue
      }

      if (block.type === 'audio' && block.blob) {
        const duration = await getAudioDuration(block.blob)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = block.filename ?? `recording-${timestamp}.wav`

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
        await addMidiFromSequenceNotes({
          ideaId: idea.id,
          notes: block.notes,
          label: block.label,
          bpm: 120,
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
    setSaveError(null)
    try {
      await persistIdea(null, null)
      resetForm()
      close()
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Failed to save idea.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveToSong() {
    if (!hasSavableContent() || !selectedSongId) {
      return
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      await persistIdea(
        selectedSongId,
        selectedSectionId === 'unassigned' ? null : selectedSectionId,
      )
      resetForm()
      close()
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Failed to save idea.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  function renderBlock(block: QuickCaptureBlock) {
    switch (block.type) {
      case 'audio':
        return (
          <div className="space-y-4">
            {block.source === 'import' ? (
              block.blob ? (
                <div className="space-y-3">
                  <AudioPlayer
                    blob={block.blob}
                    mimeType={getAudioMimeType(
                      block.filename ?? '',
                      block.blob.type,
                    )}
                    filename={block.filename ?? undefined}
                  />
                  {block.filename ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {block.filename}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No audio imported yet.
                </p>
              )
            ) : (
              <AudioRecorder
                draft
                embedded
                onDraftChange={(blob) =>
                  updateBlock(block.id, (current) =>
                    current.type === 'audio' && current.blob !== blob
                      ? { ...current, blob, filename: null }
                      : current,
                  )
                }
              />
            )}

            {block.blob ? (
              <ExtractMidiFromAudio
                audioBlob={block.blob}
                onConfirm={(notes) => {
                  applyExtractedMidi(notes)
                }}
              />
            ) : null}
          </div>
        )
      case 'midi':
        if (block.noteEvents.length > 0) {
          return (
            <div className="space-y-3">
              <MidiPlayer notes={block.noteEvents} patchId={playbackPatch} />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  updateBlock(block.id, (current) =>
                    current.type === 'midi'
                      ? { ...current, noteEvents: [] }
                      : current,
                  )
                }
              >
                Discard MIDI
              </Button>
            </div>
          )
        }

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
        className="h-full max-h-svh w-full max-w-full overflow-y-auto p-0 sm:max-w-full md:max-w-2xl"
      >
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Quick Capture</SheetTitle>
          <SheetDescription>
            Jot down an idea fast. Stack audio, MIDI, notes, and files in one
            capture.
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
                onClick={() => handleToolbarAction(type)}
              >
                <Icon className="size-4" />
                {label}
              </Button>
            ))}
            <input
              ref={audioImportInputRef}
              type="file"
              accept=".wav,.mp3,.aiff,.aif,audio/wav,audio/mpeg,audio/aiff"
              className="hidden"
              onChange={(event) => {
                void handleImportAudioFiles(event.target.files)
                event.target.value = ''
              }}
            />
          </div>

          {audioImportError ? (
            <p className="text-xs text-destructive">{audioImportError}</p>
          ) : null}

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
                  label={getBlockLabel(block)}
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

            <InstrumentSelector
              id="capture-instrument"
              value={{ instrumentId, instrumentName }}
              onChange={(next) => {
                setInstrumentId(next.instrumentId)
                setInstrumentName(next.instrumentName)
              }}
              onAutoPatch={(patch) => setPatchName(patch)}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <SynthPatchSelector
                id="capture-patch"
                value={patchName}
                onChange={setPatchName}
              />
              <KeySelector id="capture-key" value={key} onChange={setKey} />
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
              <Label htmlFor="capture-lyrics">Lyrics</Label>
              <Textarea
                id="capture-lyrics"
                placeholder="Lyric lines, hooks, melodies..."
                value={lyrics}
                onChange={(event) => setLyrics(event.target.value)}
                rows={3}
              />
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

            {saveError ? (
              <p className="text-sm text-destructive">{saveError}</p>
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
