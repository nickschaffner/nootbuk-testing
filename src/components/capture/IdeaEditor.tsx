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
import { useLiveQuery } from 'dexie-react-hooks'
import { useMatch } from 'react-router-dom'

import { AudioRecorder } from '@/components/capture/AudioRecorder'
import { MidiRecord } from '@/components/capture/MidiRecord'
import { NotePicker } from '@/components/capture/note-picker/NotePicker'
import { FoldedPianoRoll } from '@/components/capture/note-picker/FoldedPianoRoll'
import {
  blockHasContent,
  createAudioImportBlock,
  createEmptyBlock,
  getBlockLabel,
  mediaItemsToBlocks,
  type QuickCaptureBlock,
  type QuickCaptureBlockType,
} from '@/components/capture/quickCaptureTypes'
import { IdeaActionsMenu } from '@/components/pool/IdeaActionsMenu'
import { RolePillSelector } from '@/components/pool/RolePillSelector'
import { SectionIntentPillSelector } from '@/components/pool/SectionIntentPillSelector'
import { InstrumentSelector } from '@/components/instruments/InstrumentSelector'
import { AudioPlayer } from '@/components/player/AudioPlayer'
import { MidiPlayer } from '@/components/player/MidiPlayer'
import { ExtractMidiFromAudio } from '@/components/player/ExtractMidiFromAudio'
import { KeySelector } from '@/components/shared/KeySelector'
import { TimeSignatureSelector } from '@/components/shared/TimeSignatureSelector'
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
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { createIdea, deleteIdea, updateIdea } from '@/hooks/useIdeas'
import {
  addMediaToIdea,
  getMediaForIdea,
  removeMedia,
} from '@/hooks/useMedia'
import { useSectionsForSong } from '@/hooks/useSections'
import { useAllSongs } from '@/hooks/useSongs'
import {
  getAudioDuration,
  getAudioMimeType,
  isAcceptedAudioFile,
  normalizeAudioBlob,
} from '@/lib/audio'
import { db } from '@/lib/db'
import { getMidiDuration, noteEventsToMidiBlob } from '@/lib/midi'
import { timeSignatureFromSong } from '@/lib/time-signature'
import {
  barCountForBlocks,
  noteEventsToTimelineBlocks,
  parseBeatsPerBar,
} from '@/lib/timeline-notes'
import { useQuickCapture } from '@/stores/quickCapture'
import type { IdeaRole, NoteEvent, SectionIntent } from '@/types/idea'

type ToolbarAction =
  | Exclude<QuickCaptureBlockType, 'audio-import'>
  | 'audio-import'

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

function ExtractionBlockView({
  noteEvents,
  bpm,
  timeSignature,
  onCopyToMidiRecord,
}: {
  noteEvents: NoteEvent[]
  bpm: number
  timeSignature: string
  onCopyToMidiRecord?: (data: { noteEvents: NoteEvent[]; bpm: number }) => void
}) {
  const beatsPerBar = parseBeatsPerBar(timeSignature)
  const blocks = noteEventsToTimelineBlocks(noteEvents, bpm)
  const barCount = Math.max(1, barCountForBlocks(blocks, beatsPerBar, 1))

  if (noteEvents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No extracted notes yet.</p>
    )
  }

  return (
    <div className="space-y-3">
      <FoldedPianoRoll
        noteEvents={noteEvents}
        bpm={bpm}
        beatsPerBar={beatsPerBar}
        barCount={barCount}
        gridBeat={0.25}
        playheadBeat={0}
        title="Extracted MIDI"
        emptyMessage="No extracted notes yet"
      />
      <MidiPlayer notes={noteEvents} />
      {onCopyToMidiRecord ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onCopyToMidiRecord({ noteEvents, bpm })}
        >
          Copy to MIDI Record
        </Button>
      ) : null}
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

export function IdeaEditor() {
  const { isOpen, mode, target, ideaId, close } = useQuickCapture()
  const isEdit = mode === 'edit' && ideaId !== null
  const songRoute = useMatch('/song/:id')
  const routeSongId = songRoute?.params.id

  const idea = useLiveQuery(
    () => (isEdit && ideaId ? db.ideas.get(ideaId) : undefined),
    [isEdit, ideaId],
  )

  const songs = useAllSongs()
  const audioImportInputRef = useRef<HTMLInputElement>(null)
  const notesPickerRef = useRef<HTMLDivElement>(null)
  const midiRecordRef = useRef<HTMLDivElement>(null)
  const extractionRef = useRef<HTMLDivElement>(null)
  const [audioImportError, setAudioImportError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [hydratedIdeaId, setHydratedIdeaId] = useState<string | null>(null)
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([])

  const [blocks, setBlocks] = useState<QuickCaptureBlock[]>([])
  const [role, setRole] = useState<IdeaRole>('melody')
  const [sectionIntent, setSectionIntent] = useState<SectionIntent | null>(null)
  const [instrumentId, setInstrumentId] = useState<string | null>(null)
  const [instrumentName, setInstrumentName] = useState<string | null>(null)
  const [patchName, setPatchName] = useState<string | null>(null)
  const [key, setKey] = useState<string | null>(null)
  const [tempo, setTempo] = useState('')
  const [timeSignature, setTimeSignature] = useState('4/4')
  const [lyrics, setLyrics] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showSongSave, setShowSongSave] = useState(false)
  const [selectedSongId, setSelectedSongId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('unassigned')
  const tempoSeededRef = useRef(false)

  const sections = useSectionsForSong(selectedSongId || undefined)

  function revokeImageUrls(items: QuickCaptureBlock[]) {
    for (const block of items) {
      if (block.type === 'image' && block.previewUrl) {
        URL.revokeObjectURL(block.previewUrl)
      }
    }
  }

  function resetForm() {
    revokeImageUrls(blocks)
    setBlocks([])
    setRole('melody')
    setSectionIntent(null)
    setInstrumentId(null)
    setInstrumentName(null)
    setPatchName(null)
    setKey(null)
    setTempo('')
    setTimeSignature('4/4')
    setLyrics('')
    setNotes('')
    setSaveError(null)
    setLoadError(null)
    setAudioImportError(null)
    setShowSongSave(false)
    setSelectedSongId('')
    setSelectedSectionId('unassigned')
    setRemovedMediaIds([])
    setHydratedIdeaId(null)
  }

  useEffect(() => {
    if (!isOpen || isEdit) {
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
  }, [isOpen, isEdit, target])

  useEffect(() => {
    if (!isOpen) {
      tempoSeededRef.current = false
      return
    }
    if (isEdit || tempoSeededRef.current) {
      return
    }

    const songId = target?.songId ?? routeSongId
    if (!songId) {
      return
    }
    if (!songs) {
      return
    }

    const song = songs.find((item) => item.id === songId)
    const bpm = song?.tempo && song.tempo > 0 ? song.tempo : 120
    setTempo(String(bpm))
    setTimeSignature(timeSignatureFromSong(song?.timeSignature))
    tempoSeededRef.current = true
  }, [isOpen, isEdit, target, routeSongId, songs])

  useEffect(() => {
    if (!isOpen || !isEdit || !ideaId || !idea) {
      return
    }

    if (hydratedIdeaId === ideaId) {
      return
    }

    let cancelled = false

    async function hydrate() {
      setLoadError(null)
      try {
        const media = await getMediaForIdea(ideaId!)
        if (cancelled) {
          return
        }

        setBlocks((prev) => {
          revokeImageUrls(prev)
          return mediaItemsToBlocks(media)
        })
        setRole(idea!.role)
        setSectionIntent(idea!.sectionIntent)
        setInstrumentId(idea!.instrumentId ?? null)
        setInstrumentName(idea!.instrumentName ?? null)
        setPatchName(idea!.patchName ?? null)
        setKey(idea!.key ?? null)
        setTempo(idea!.tempo?.toString() ?? '')
        setTimeSignature(idea!.timeSignature ?? '')
        setLyrics(idea!.lyrics ?? '')
        setNotes(idea!.notes ?? '')
        setRemovedMediaIds([])
        setShowSongSave(false)
        setHydratedIdeaId(ideaId)
      } catch {
        if (!cancelled) {
          setLoadError('Failed to load idea media.')
        }
      }
    }

    void hydrate()

    return () => {
      cancelled = true
    }
    // Intentionally hydrate once per opened ideaId; blocks are snapshot drafts.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate gate uses hydratedIdeaId
  }, [isOpen, isEdit, ideaId, idea, hydratedIdeaId])

  function handleOpenChange(open: boolean) {
    if (!open) {
      resetForm()
      close()
    }
  }

  function queueRemovedMediaIds(mediaIds: Array<string | undefined>) {
    const next = mediaIds.filter(
      (id): id is string => typeof id === 'string' && id.length > 0,
    )
    if (next.length === 0) {
      return
    }
    setRemovedMediaIds((current) => {
      const merged = [...current]
      for (const id of next) {
        if (!merged.includes(id)) {
          merged.push(id)
        }
      }
      return merged
    })
  }

  function addBlock(type: Exclude<QuickCaptureBlockType, 'audio-import'>) {
    setBlocks((current) => {
      if (type === 'audio') {
        queueRemovedMediaIds(
          current
            .filter((block) => block.type === 'audio')
            .map((block) => block.mediaId),
        )
        const withoutAudio = current.filter((block) => block.type !== 'audio')
        return [...withoutAudio, createEmptyBlock('audio')]
      }

      if (type === 'midi' || type === 'notes' || type === 'extraction') {
        if (current.some((block) => block.type === type)) {
          return current
        }
        return [...current, createEmptyBlock(type)]
      }

      return [...current, createEmptyBlock(type)]
    })
  }

  function copyNotesToMidiRecord(noteEvents: NoteEvent[], bpm: number) {
    setBlocks((current) => {
      const existing = current.find((block) => block.type === 'midi')
      if (existing && existing.type === 'midi') {
        if (existing.mediaId) {
          queueRemovedMediaIds([existing.mediaId])
        }
        return current.map((block) =>
          block.id === existing.id
            ? {
                ...existing,
                noteEvents,
                bpm,
                mediaId: undefined,
                dirty: true,
              }
            : block,
        )
      }
      return [
        ...current,
        {
          id: crypto.randomUUID(),
          type: 'midi' as const,
          noteEvents,
          bpm,
          dirty: true,
        },
      ]
    })
    window.setTimeout(() => {
      midiRecordRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 0)
  }

  function replaceAudioWithImport(blob: Blob, filename: string) {
    setBlocks((current) => {
      queueRemovedMediaIds(
        current
          .filter((block) => block.type === 'audio')
          .map((block) => block.mediaId),
      )
      const withoutAudio = current.filter((block) => block.type !== 'audio')
      return [...withoutAudio, createAudioImportBlock(blob, filename)]
    })
  }

  function applyExtractedMidi(noteEvents: NoteEvent[]) {
    setBlocks((current) => {
      const existingIndex = current.findIndex(
        (block) => block.type === 'extraction',
      )
      const existing =
        existingIndex >= 0 ? current[existingIndex] : null

      if (existing && existing.type === 'extraction') {
        if (existing.mediaId) {
          queueRemovedMediaIds([existing.mediaId])
        }

        const next = [...current]
        next[existingIndex] = {
          id: crypto.randomUUID(),
          type: 'extraction' as const,
          noteEvents,
          bpm: existing.bpm,
          dirty: true,
        }
        return next
      }

      return [
        ...current,
        {
          id: crypto.randomUUID(),
          type: 'extraction' as const,
          noteEvents,
          bpm: 120,
          dirty: true,
        },
      ]
    })
    window.setTimeout(() => {
      extractionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 0)
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
    if (type === 'notes') {
      window.setTimeout(() => {
        notesPickerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 0)
    }
    if (type === 'midi') {
      window.setTimeout(() => {
        midiRecordRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 0)
    }
  }

  function removeBlock(id: string) {
    const block = blocks.find((item) => item.id === id)
    if (block?.type === 'image' && block.previewUrl) {
      URL.revokeObjectURL(block.previewUrl)
    }
    if (block) {
      queueRemovedMediaIds([block.mediaId])
    }
    setBlocks((current) => current.filter((item) => item.id !== id))
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
          return { ...nextBlock, dirty: true }
        }
        return nextBlock
      })

      return changed ? nextBlocks : current
    })
  }

  function hasSavableContent() {
    return blocks.some(blockHasContent) || lyrics.trim().length > 0
  }

  async function persistMediaForIdea(targetIdeaId: string) {
    for (const mediaId of removedMediaIds) {
      await removeMedia(mediaId)
    }

    for (const block of blocks) {
      if (!blockHasContent(block)) {
        if (block.mediaId && block.dirty) {
          await removeMedia(block.mediaId)
        }
        continue
      }

      const needsWrite = block.dirty !== false || !block.mediaId
      if (!needsWrite) {
        continue
      }

      if (block.mediaId && (block.type === 'image' || block.type === 'file')) {
        await removeMedia(block.mediaId)
      }

      if (block.type === 'audio' && block.blob) {
        const duration = await getAudioDuration(block.blob)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = block.filename ?? `recording-${timestamp}.wav`

        await addMediaToIdea({
          ideaId: targetIdeaId,
          type: 'audio',
          source: null,
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
          ideaId: targetIdeaId,
          type: 'midi',
          source: 'recording',
          filename: `recording-${timestamp}.mid`,
          mimeType: 'audio/midi',
          blob,
          duration: getMidiDuration(block.noteEvents),
          noteData: block.noteEvents,
        })
      }

      if (block.type === 'notes' && block.noteEvents.length > 0) {
        const bpm =
          tempo && Number.parseInt(tempo, 10) > 0
            ? Number.parseInt(tempo, 10)
            : block.bpm
        const blob = noteEventsToMidiBlob(block.noteEvents, bpm)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        await addMediaToIdea({
          ideaId: targetIdeaId,
          type: 'midi',
          source: 'notepicker',
          filename: `notes-${timestamp}.mid`,
          mimeType: 'audio/midi',
          blob,
          duration: getMidiDuration(block.noteEvents),
          noteData: block.noteEvents,
        })
      }

      if (block.type === 'extraction' && block.noteEvents.length > 0) {
        const bpm =
          tempo && Number.parseInt(tempo, 10) > 0
            ? Number.parseInt(tempo, 10)
            : block.bpm
        const blob = noteEventsToMidiBlob(block.noteEvents, bpm)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        await addMediaToIdea({
          ideaId: targetIdeaId,
          type: 'midi',
          source: 'extraction',
          filename: `extraction-${timestamp}.mid`,
          mimeType: 'audio/midi',
          blob,
          duration: getMidiDuration(block.noteEvents),
          noteData: block.noteEvents,
        })
      }

      if (block.type === 'image' && block.file) {
        await addMediaToIdea({
          ideaId: targetIdeaId,
          type: 'image',
          source: null,
          filename: block.file.name,
          mimeType: block.file.type || 'image/*',
          blob: block.file,
          duration: null,
          noteData: null,
        })
      }

      if (block.type === 'file' && block.file) {
        await addMediaToIdea({
          ideaId: targetIdeaId,
          type: 'file',
          source: null,
          filename: block.file.name,
          mimeType: block.file.type || 'application/octet-stream',
          blob: block.file,
          duration: null,
          noteData: null,
        })
      }
    }
  }

  async function persistNewIdea(
    songId: string | null,
    sectionId: string | null,
  ) {
    const created = await createIdea({
      songId,
      sectionId,
      role,
      sectionIntent,
      key,
      tempo: tempo ? Number.parseInt(tempo, 10) : null,
      timeSignature: timeSignature.trim() || null,
      instrumentId,
      instrumentName,
      patchName,
      patchSettings: null,
      lyrics: lyrics.trim() || null,
      notes: notes.trim() || null,
      status: 'raw',
    })

    await persistMediaForIdea(created.id)
    return created
  }

  async function handleSaveToPool() {
    if (!hasSavableContent()) {
      return
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      await persistNewIdea(null, null)
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
      await persistNewIdea(
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

  async function handleSaveEdit() {
    if (!ideaId || !idea) {
      return
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      await updateIdea({
        id: ideaId,
        role,
        sectionIntent,
        key,
        tempo: tempo ? Number.parseInt(tempo, 10) : null,
        timeSignature: timeSignature.trim() || null,
        instrumentId,
        instrumentName,
        patchName,
        lyrics: lyrics.trim() || null,
        notes: notes.trim() || null,
        // Preserve fields not shown in the unified layout
        status: idea.status,
      })
      await persistMediaForIdea(ideaId)
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

  async function handleDelete() {
    if (!ideaId) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteIdea(ideaId)
      resetForm()
      close()
    } catch {
      // deleteIdea already logs
    } finally {
      setIsDeleting(false)
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
                confirmLabel="Use This"
                confirmHint="Saves as Extracted MIDI. Does not overwrite Note Picker or MIDI Record."
                previewHint="Listen to the extracted MIDI by itself. Timing is not quantized."
                onConfirm={(extracted) => {
                  applyExtractedMidi(extracted)
                }}
              />
            ) : null}
          </div>
        )
      case 'midi':
        return (
          <MidiRecord
            draft
            embedded
            initialNoteEvents={block.noteEvents}
            tempo={tempo ? Number.parseInt(tempo, 10) : null}
            timeSignature={timeSignature}
            onTimeSignatureChange={setTimeSignature}
            onTempoChange={(next) =>
              setTempo(next && next > 0 ? String(next) : '')
            }
            patchName={patchName}
            onPatchChange={setPatchName}
            onDraftChange={(data) =>
              updateBlock(block.id, (current) => {
                if (current.type !== 'midi') {
                  return current
                }
                if (
                  current.noteEvents === data.noteEvents &&
                  current.bpm === data.bpm
                ) {
                  return current
                }
                return {
                  ...current,
                  noteEvents: data.noteEvents,
                  bpm: data.bpm,
                  dirty: true,
                }
              })
            }
          />
        )
      case 'notes':
        return (
          <NotePicker
            draft
            embedded
            initialNoteEvents={block.noteEvents}
            tempo={tempo ? Number.parseInt(tempo, 10) : null}
            timeSignature={timeSignature}
            onTimeSignatureChange={setTimeSignature}
            onTempoChange={(next) =>
              setTempo(next && next > 0 ? String(next) : '')
            }
            patchName={patchName}
            onPatchChange={setPatchName}
            onCopyToMidiRecord={(data) =>
              copyNotesToMidiRecord(data.noteEvents, data.bpm)
            }
            onDraftChange={(data) =>
              updateBlock(block.id, (current) => {
                if (current.type !== 'notes') {
                  return current
                }
                if (
                  current.noteEvents === data.noteEvents &&
                  current.bpm === data.bpm
                ) {
                  return current
                }
                return {
                  ...current,
                  noteEvents: data.noteEvents,
                  bpm: data.bpm,
                  dirty: true,
                }
              })
            }
          />
        )
      case 'extraction':
        return (
          <ExtractionBlockView
            noteEvents={block.noteEvents}
            bpm={
              tempo && Number.parseInt(tempo, 10) > 0
                ? Number.parseInt(tempo, 10)
                : block.bpm
            }
            timeSignature={timeSignature}
            onCopyToMidiRecord={(data) =>
              copyNotesToMidiRecord(data.noteEvents, data.bpm)
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
  const editReady = !isEdit || (idea !== undefined && hydratedIdeaId === ideaId)

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="h-full max-h-svh w-full max-w-full overflow-y-auto p-0 sm:max-w-full md:max-w-2xl"
      >
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{isEdit ? 'Edit Idea' : 'Quick Capture'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update content and metadata. Use the toolbar to replace audio, MIDI, or add files.'
              : 'Jot down an idea fast. Stack audio, MIDI, notes, and files in one capture.'}
            {!isEdit ? (
              <span className="mt-1 block text-xs">Shortcut: Ctrl+Shift+C</span>
            ) : null}
          </SheetDescription>
          {!isEdit && target ? (
            <p className="text-sm text-muted-foreground">
              Target: {selectedSong?.title ?? 'Song'} —{' '}
              {target.sectionLabel ?? 'Unassigned'}
            </p>
          ) : null}
        </SheetHeader>

        {!editReady ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">Loading...</p>
        ) : (
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
            {loadError ? (
              <p className="text-xs text-destructive">{loadError}</p>
            ) : null}

            {blocks.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Add content blocks with the toolbar above. Mix and match any
                combination.
              </div>
            ) : (
              <div className="space-y-4">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    ref={
                      block.type === 'notes'
                        ? notesPickerRef
                        : block.type === 'midi'
                          ? midiRecordRef
                          : block.type === 'extraction'
                            ? extractionRef
                            : undefined
                    }
                  >
                    <CaptureBlockShell
                      label={getBlockLabel(block)}
                      onRemove={() => removeBlock(block.id)}
                    >
                      {renderBlock(block)}
                    </CaptureBlockShell>
                  </div>
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
                id="idea-editor-instrument"
                value={{ instrumentId, instrumentName }}
                onChange={(next) => {
                  setInstrumentId(next.instrumentId)
                  setInstrumentName(next.instrumentName)
                }}
                onAutoPatch={(patch) => setPatchName(patch)}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <KeySelector
                  id="idea-editor-key"
                  value={key}
                  onChange={setKey}
                />
                <div className="space-y-2">
                  <Label htmlFor="idea-editor-tempo">Tempo</Label>
                  <Input
                    id="idea-editor-tempo"
                    type="number"
                    min={1}
                    placeholder="120"
                    value={tempo}
                    onChange={(event) => setTempo(event.target.value)}
                  />
                </div>
                <TimeSignatureSelector
                  id="idea-editor-time"
                  value={timeSignature}
                  onChange={setTimeSignature}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idea-editor-lyrics">Lyrics</Label>
                <Textarea
                  id="idea-editor-lyrics"
                  placeholder="Lyric lines, hooks, melodies..."
                  value={lyrics}
                  onChange={(event) => setLyrics(event.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idea-editor-notes">Notes</Label>
                <Textarea
                  id="idea-editor-notes"
                  placeholder="Play with a pick, sounds like..."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {isEdit && idea ? (
              <div className="rounded-lg border p-4">
                <Label className="mb-3 block">Idea actions</Label>
                <IdeaActionsMenu
                  idea={idea}
                  variant="button"
                  onActionComplete={() => {
                    resetForm()
                    close()
                  }}
                />
              </div>
            ) : null}
          </div>
        )}

        <SheetFooter className="border-t px-6 py-4">
          {isEdit ? (
            <div className="flex w-full flex-col gap-3">
              {saveError ? (
                <p className="text-sm text-destructive">{saveError}</p>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={!idea || isDeleting || isSaving}
                    >
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this idea?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently removes the idea and any attached
                        media. This cannot be undone.
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
                  <Button
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => void handleSaveEdit()}
                    disabled={!idea || !editReady || isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
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
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}