import {
  ArrowLeftToLine,
  Copy,
  FileAudio,
  FileMusic,
  FolderInput,
  Image as ImageIcon,
  Paperclip,
  Pause,
  Play,
  Piano,
  Plus,
  Redo2,
  Repeat,
  RotateCcw,
  Sparkles,
  SquarePen,
  Trash2,
  Undo2,
  Upload,
  Wand2,
} from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'

import { MidiRecord } from '@/components/capture/MidiRecord'
import { NotePicker } from '@/components/capture/note-picker/NotePicker'
import {
  type StudioTransportHandlers,
  type StudioTransportState,
} from '@/components/capture/StudioBar'
import { IdeaDestinationSheet } from '@/components/pool/IdeaDestinationSheet'
import { ExtractMidiFromAudio } from '@/components/player/ExtractMidiFromAudio'
import { WaveformCanvas } from '@/components/player/WaveformCanvas'
import { Badge, Chip } from '@/components/kit/Chip'
import { Input, MonoLabel, Textarea } from '@/components/kit/Field'
import { IconButton } from '@/components/kit/IconButton'
import { Menu, type MenuOption } from '@/components/kit/Menu'
import { Pick } from '@/components/kit/Pick'
import { RecordButton } from '@/components/kit/RecordButton'
import { EmptyState, Recess } from '@/components/kit/Surfaces'
import { cn } from '@/components/kit/cn'
import {
  IDEA_ROLES,
  INSTRUMENT_TYPES,
  KEY_MODES,
  KEY_ROOTS,
  QUANTIZE_OPTIONS,
  SECTION_INTENTS,
  SYNTH_PATCHES,
  TIME_SIGNATURES,
} from '@/components/kit/options'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import {
  copyIdeaIntoNewSong,
  copyIdeaToPool,
  copyIdeaToSong,
  moveIdeaToPool,
  moveIdeaToSection,
  turnIdeaIntoSong,
} from '@/hooks/useIdeas'
import { createInstrument, useAllInstruments } from '@/hooks/useInstruments'
import {
  extractWaveformPeaks,
} from '@/lib/audio'
import {
  defaultSynthPatchForType,
  type PlaybackPatchId,
} from '@/lib/instrument-utils'
import {
  buildKeyValue,
  parseKeyValue,
  type KeyMode,
} from '@/lib/keys'
import type { Idea, IdeaRole, NoteEvent, SectionIntent } from '@/types/idea'
import type { InstrumentType } from '@/types/instrument'

export function ToolHead({
  children,
  right,
}: {
  children: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="flex h-9 shrink-0 items-center gap-2 border-b border-hairline bg-panel px-3">
      <MonoLabel className="text-primary">{children}</MonoLabel>
      {right ? (
        <div className="ml-auto flex items-center gap-2">{right}</div>
      ) : null}
    </div>
  )
}

export function WiredMobileStudioReadout({
  playing,
  loop,
  tempo,
  timeSig,
  grid,
  patch,
  onPlayToggle,
  onRestart,
  onLoopToggle,
  onUndo,
  onRedo,
  onTempoChange,
  onTimeSigChange,
  onGridChange,
  onPatchChange,
}: {
  playing: boolean
  loop: boolean
  tempo: number
  timeSig: string
  grid: string
  patch: string
  onPlayToggle: () => void
  onRestart: () => void
  onLoopToggle: () => void
  onUndo: () => void
  onRedo: () => void
  onTempoChange: (v: number) => void
  onTimeSigChange: (v: string) => void
  onGridChange: (v: string) => void
  onPatchChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="studio-bar-transport noise flex items-center gap-1.5 border-b border-hairline bg-panel px-2 py-2">
        <IconButton
          aria-label={playing ? 'Pause' : 'Play'}
          variant={playing ? 'solid' : 'outline'}
          size="sm"
          onClick={onPlayToggle}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </IconButton>
        <IconButton aria-label="Restart" variant="ghost" size="sm" onClick={onRestart}>
          <RotateCcw size={15} />
        </IconButton>
        <IconButton
          aria-label="Loop"
          aria-pressed={loop}
          variant={loop ? 'solid' : 'ghost'}
          size="sm"
          onClick={onLoopToggle}
        >
          <Repeat size={15} />
        </IconButton>
        <span className="mx-0.5 h-5 w-px bg-hairline" aria-hidden />
        <IconButton aria-label="Undo" variant="ghost" size="sm" onClick={onUndo}>
          <Undo2 size={15} />
        </IconButton>
        <IconButton aria-label="Redo" variant="ghost" size="sm" onClick={onRedo}>
          <Redo2 size={15} />
        </IconButton>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focusable ml-auto flex items-center gap-1.5 rounded-xs border border-hairline bg-card px-2.5 py-1.5"
          aria-label="Studio settings"
        >
          <span className="label-mono text-foreground">
            {tempo} · {timeSig}
          </span>
          <span className="leading-none text-muted-foreground">⋯</span>
        </button>
      </div>
      {open ? (
        <div className="absolute inset-0 z-20 flex flex-col justify-end bg-foreground/40">
          <div className="border-t-2 border-foreground bg-card">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <span className="font-display text-xs font-extrabold uppercase tracking-wide">
                Studio settings
              </span>
              <IconButton
                aria-label="Close settings"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                <span className="text-sm">✕</span>
              </IconButton>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 p-4">
              <label className="block">
                <MonoLabel className="mb-1.5 block">Time</MonoLabel>
                <Pick
                  aria-label="Time signature"
                  options={TIME_SIGNATURES}
                  value={timeSig}
                  onChange={(event) => onTimeSigChange(event.target.value)}
                  className="h-10"
                />
              </label>
              <label className="block">
                <MonoLabel className="mb-1.5 block">Tempo</MonoLabel>
                <Input
                  type="number"
                  value={tempo}
                  onChange={(event) => onTempoChange(Number(event.target.value))}
                  className="h-10"
                />
              </label>
              <label className="block">
                <MonoLabel className="mb-1.5 block">Grid</MonoLabel>
                <Pick
                  aria-label="Grid"
                  options={QUANTIZE_OPTIONS}
                  value={grid}
                  onChange={(event) => onGridChange(event.target.value)}
                  className="h-10"
                />
              </label>
              <label className="block">
                <MonoLabel className="mb-1.5 block">Patch</MonoLabel>
                <Pick
                  aria-label="Patch"
                  options={SYNTH_PATCHES}
                  value={patch}
                  onChange={(event) => onPatchChange(event.target.value)}
                  className="h-10"
                />
              </label>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

const WAVEFORM_PEAKS = { mobile: 288, desktop: 480 } as const

function formatClock(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0')
  const seconds = String(safe % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

type WiredAudioPanelBase = {
  mobile?: boolean
  playbackProgress?: number
  onExtractConfirm: (notes: NoteEvent[]) => void | Promise<void>
}

export type WiredAudioPanelProps =
  | (WiredAudioPanelBase & {
      mode: 'record'
      blob: Blob | null
      onActiveBlobChange?: (blob: Blob | null) => void
      onRecordingSaved: (blob: Blob) => void
    })
  | (WiredAudioPanelBase & {
      mode: 'import'
      blob: Blob
      playing: boolean
      currentTime: number
      duration: number
      onPlayToggle: () => void
    })

export function WiredAudioPanel(props: WiredAudioPanelProps) {
  const {
    mode,
    mobile = false,
    blob: savedBlob,
    playbackProgress = 0,
    onExtractConfirm,
  } = props

  const onActiveBlobChange = mode === 'record' ? props.onActiveBlobChange : undefined
  const onRecordingSaved = mode === 'record' ? props.onRecordingSaved : undefined
  const playing = mode === 'import' ? props.playing : false
  const currentTime = mode === 'import' ? props.currentTime : 0
  const duration = mode === 'import' ? props.duration : 0
  const onPlayToggle = mode === 'import' ? props.onPlayToggle : undefined

  const {
    startRecording,
    stopRecording,
    isRecording,
    audioBlob,
    error,
    analyser,
  } = useAudioRecorder()
  const [elapsed, setElapsed] = useState(0)
  const [peaks, setPeaks] = useState<number[]>([])
  const startedAtRef = useRef<number | null>(null)
  const persistedBlobRef = useRef<Blob | null>(null)

  const displayBlob = mode === 'record' ? (audioBlob ?? savedBlob) : savedBlob
  const live = mode === 'record' && isRecording

  useEffect(() => {
    if (mode !== 'record') {
      return
    }
    onActiveBlobChange?.(displayBlob)
  }, [mode, displayBlob, onActiveBlobChange])

  useEffect(() => {
    if (!displayBlob || live) {
      if (!displayBlob) {
        setPeaks([])
      }
      return
    }

    let cancelled = false
    void extractWaveformPeaks(
      displayBlob,
      mobile ? WAVEFORM_PEAKS.mobile : WAVEFORM_PEAKS.desktop,
    ).then((next) => {
      if (!cancelled) {
        setPeaks(next)
      }
    })

    return () => {
      cancelled = true
    }
  }, [displayBlob, live, mobile])

  useEffect(() => {
    if (mode !== 'record' || !isRecording) {
      startedAtRef.current = null
      return
    }
    startedAtRef.current = Date.now()
    setElapsed(0)
    const timer = window.setInterval(() => {
      const start = startedAtRef.current
      if (start) {
        setElapsed(Math.floor((Date.now() - start) / 1000))
      }
    }, 250)
    return () => window.clearInterval(timer)
  }, [mode, isRecording])

  useEffect(() => {
    if (mode !== 'record' || !onRecordingSaved || !audioBlob) {
      return
    }
    if (persistedBlobRef.current === audioBlob) {
      return
    }
    persistedBlobRef.current = audioBlob
    onRecordingSaved(audioBlob)
  }, [mode, audioBlob, onRecordingSaved])

  const clockSeconds =
    mode === 'record' ? elapsed : playing ? currentTime : duration
  const clock = formatClock(clockSeconds)
  const controlSize = mobile ? 'lg' : 'md'
  const glyphSize = controlSize === 'lg' ? 24 : 18
  const title = mode === 'record' ? 'Record Audio' : 'Imported Audio'

  const strip = (
    <>
      <div
        className={cn(
          'bg-deepest flex gap-3 p-3',
          mobile ? 'flex-col items-stretch' : 'items-center',
        )}
      >
        {mode === 'record' ? (
          <RecordButton
            recording={isRecording}
            onClick={() => {
              if (isRecording) {
                stopRecording()
              } else {
                void startRecording()
              }
            }}
            size={controlSize}
            className={mobile ? 'self-center' : ''}
          />
        ) : (
          <button
            type="button"
            aria-label={playing ? 'Pause' : 'Play'}
            aria-pressed={playing}
            onClick={onPlayToggle}
            className={cn(
              'focusable inline-flex items-center justify-center rounded-full border-2 border-primary bg-transparent text-primary transition-colors hover:bg-primary/10',
              controlSize === 'lg' ? 'size-16' : 'size-12',
              mobile ? 'self-center' : '',
            )}
          >
            {playing ? (
              <Pause size={glyphSize} fill="currentColor" aria-hidden />
            ) : (
              <Play size={glyphSize} fill="currentColor" aria-hidden />
            )}
          </button>
        )}
        <Recess
          className={cn('flex items-center gap-3 px-3 py-2', mobile ? '' : 'flex-1')}
        >
          <span className="label-mono shrink-0 text-primary">
            {live || (mode === 'import' && playing) ? `● ${clock}` : clock}
          </span>
          <div className="min-w-0 flex-1 overflow-hidden">
            <WaveformCanvas
              peaks={live ? [] : peaks}
              analyser={live ? analyser : null}
              isLive={live}
              progress={live ? 0 : playbackProgress}
              className="h-9 w-full"
            />
          </div>
        </Recess>
      </div>
      {mode === 'record' && error ? (
        <p className="px-3 pb-3 text-xs text-destructive">{error}</p>
      ) : null}
    </>
  )

  if (!displayBlob) {
    return (
      <div>
        <ToolHead>{title}</ToolHead>
        {strip}
      </div>
    )
  }

  return (
    <ExtractMidiFromAudio
      audioBlob={displayBlob}
      confirmLabel="Use This"
      onConfirm={onExtractConfirm}
    >
      {({ trigger, preview, error: extractError }) => (
        <div>
          <ToolHead right={trigger}>{title}</ToolHead>
          {strip}
          {extractError}
          {preview}
        </div>
      )}
    </ExtractMidiFromAudio>
  )
}

export function WiredImportPanel({
  mobile = false,
  onImportAudio,
  onImportMidi,
}: {
  mobile?: boolean
  onImportAudio: (file: File) => void
  onImportMidi: (file: File) => void
}) {
  const audioRef = useRef<HTMLInputElement>(null)
  const midiRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <ToolHead>Import</ToolHead>
      <div className={cn('gap-3 p-3', mobile ? 'flex flex-col' : 'grid grid-cols-2')}>
        <button
          type="button"
          onClick={() => audioRef.current?.click()}
          className="focusable flex flex-col items-center justify-center gap-1.5 rounded-xs border border-dashed border-hairline bg-panel px-4 py-6 text-center transition-colors hover:border-foreground hover:bg-muted"
        >
          <span className="text-primary" aria-hidden>
            <FileAudio size={18} />
          </span>
          <span className="text-sm font-bold uppercase tracking-wide">Import Audio</span>
          <span className="label-mono text-muted-foreground">WAV · MP3 · AIFF</span>
        </button>
        <button
          type="button"
          onClick={() => midiRef.current?.click()}
          className="focusable flex flex-col items-center justify-center gap-1.5 rounded-xs border border-dashed border-hairline bg-panel px-4 py-6 text-center transition-colors hover:border-foreground hover:bg-muted"
        >
          <span className="text-primary" aria-hidden>
            <FileMusic size={18} />
          </span>
          <span className="text-sm font-bold uppercase tracking-wide">Import MIDI</span>
          <span className="label-mono text-muted-foreground">.mid file</span>
        </button>
      </div>
      <input
        ref={audioRef}
        type="file"
        accept=".wav,.mp3,.aiff,.aif,audio/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            onImportAudio(file)
          }
          event.target.value = ''
        }}
      />
      <input
        ref={midiRef}
        type="file"
        accept=".mid,.midi,audio/midi"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            onImportMidi(file)
          }
          event.target.value = ''
        }}
      />
    </div>
  )
}

export function WiredMidiNoDevicePanel({
  mobile = false,
  onUseKeys,
  onImportMidi,
  onRescan,
}: {
  mobile?: boolean
  onUseKeys: () => void
  onImportMidi: () => void
  onRescan: () => void
}) {
  return (
    <div>
      <ToolHead>Record MIDI</ToolHead>
      <div className="p-3">
        <EmptyState
          icon={<Piano size={22} />}
          title="No MIDI controller detected"
          hint="Connect a device, or capture without one."
          action={
            <div
              className={cn(
                'mt-1 flex gap-2',
                mobile ? 'w-full flex-col' : 'flex-wrap justify-center',
              )}
            >
              <button
                type="button"
                onClick={onUseKeys}
                className="focusable rounded-xs border-2 border-primary bg-primary px-3 py-2 text-xs font-bold uppercase tracking-wide text-primary-foreground"
              >
                Use on-screen keys
              </button>
              <button
                type="button"
                onClick={onImportMidi}
                className="focusable rounded-xs border border-foreground px-3 py-2 text-xs font-bold uppercase tracking-wide hover:bg-foreground hover:text-background"
              >
                Import .mid file
              </button>
              <button
                type="button"
                onClick={onRescan}
                className="focusable px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:text-primary"
              >
                <RotateCcw className="mr-1 inline" size={12} />
                Re-scan
              </button>
            </div>
          }
        />
        <p className="label-mono mt-2 text-center text-muted-foreground">
          Web MIDI needs Chrome / Edge
        </p>
      </div>
    </div>
  )
}

export function WiredMidiPanel({
  preloaded,
  initialNoteEvents,
  tempo,
  timeSignature,
  patchName,
  gridBeat,
  onGridBeatChange,
  onTransportStateChange,
  onRegisterTransportHandlers,
  onDraftChange,
}: {
  preloaded?: 'extracted' | 'imported'
  initialNoteEvents: NoteEvent[]
  tempo: number | null
  timeSignature: string
  patchName: string | null
  gridBeat: number
  onGridBeatChange: (value: number) => void
  onTransportStateChange: (state: StudioTransportState) => void
  onRegisterTransportHandlers: (handlers: StudioTransportHandlers) => void
  onDraftChange: (data: { noteEvents: NoteEvent[]; bpm: number }) => void
}) {
  const title = preloaded
    ? preloaded === 'extracted'
      ? 'Extracted MIDI'
      : 'Imported MIDI'
    : 'Record MIDI'

  return (
    <div>
      <ToolHead
        right={
          preloaded ? (
            <Badge tone="outline">
              {preloaded === 'extracted' ? 'From audio' : 'From .mid'}
            </Badge>
          ) : null
        }
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-recorder-red" aria-hidden />
          {title}
        </span>
      </ToolHead>
      <div className="p-3">
        <MidiRecord
          draft
          embedded
          initialNoteEvents={initialNoteEvents}
          tempo={tempo}
          timeSignature={timeSignature}
          patchName={patchName}
          gridBeat={gridBeat}
          onGridBeatChange={onGridBeatChange}
          onTransportStateChange={onTransportStateChange}
          onRegisterTransportHandlers={onRegisterTransportHandlers}
          onDraftChange={onDraftChange}
        />
      </div>
    </div>
  )
}

export function WiredStepInputPanel({
  initialNoteEvents,
  tempo,
  timeSignature,
  patchName,
  gridBeat,
  onGridBeatChange,
  onTransportStateChange,
  onRegisterTransportHandlers,
  onDraftChange,
  onCopyToMidiRecord,
}: {
  initialNoteEvents: NoteEvent[]
  tempo: number | null
  timeSignature: string
  patchName: string | null
  gridBeat: number
  onGridBeatChange: (value: number) => void
  onTransportStateChange: (state: StudioTransportState) => void
  onRegisterTransportHandlers: (handlers: StudioTransportHandlers) => void
  onDraftChange: (data: { noteEvents: NoteEvent[]; bpm: number }) => void
  onCopyToMidiRecord: (data: { noteEvents: NoteEvent[]; bpm: number }) => void
}) {
  return (
    <div>
      <ToolHead>Step Input</ToolHead>
      <div className="p-3">
        <NotePicker
          draft
          embedded
          initialNoteEvents={initialNoteEvents}
          tempo={tempo}
          timeSignature={timeSignature}
          patchName={patchName}
          gridBeat={gridBeat}
          onGridBeatChange={onGridBeatChange}
          onTransportStateChange={onTransportStateChange}
          onRegisterTransportHandlers={onRegisterTransportHandlers}
          onDraftChange={onDraftChange}
          onCopyToMidiRecord={onCopyToMidiRecord}
        />
      </div>
    </div>
  )
}

function keyRootFromStored(key: string | null): string {
  const parsed = parseKeyValue(key)
  if (!parsed) {
    return 'C'
  }
  const match = KEY_ROOTS.find((item) => {
    const stored = parseKeyValue(item.value.split('/')[0] ?? item.value)
    return stored?.rootId === parsed.rootId
  })
  return match?.value ?? 'C'
}

function keyModeFromStored(key: string | null): KeyMode {
  return parseKeyValue(key)?.mode ?? 'major'
}

export function WiredCaptureMetadata({
  mobile = false,
  location,
  idea,
  notes,
  lyrics,
  role,
  sectionIntent,
  instrumentId,
  keyValue,
  tempo,
  timeSignature,
  onNotesChange,
  onLyricsChange,
  onNotesBlur,
  onLyricsBlur,
  onRoleChange,
  onSectionIntentChange,
  onInstrumentChange,
  onKeyChange,
  onTempoChange,
  onTimeSignatureChange,
  attachments,
  onAddAttachment,
  onOpenImage,
  onDownloadFile,
  onDelete,
  onActionComplete,
}: {
  mobile?: boolean
  location: 'pool' | 'song'
  idea: Idea | null
  notes: string
  lyrics: string
  role: IdeaRole
  sectionIntent: SectionIntent | null
  instrumentId: string | null
  keyValue: string | null
  tempo: number
  timeSignature: string
  onNotesChange: (value: string) => void
  onLyricsChange: (value: string) => void
  onNotesBlur: () => void
  onLyricsBlur: () => void
  onRoleChange: (value: IdeaRole) => void
  onSectionIntentChange: (value: SectionIntent | null) => void
  onInstrumentChange: (
    instrumentId: string | null,
    instrumentName: string | null,
    patch: PlaybackPatchId | null,
  ) => void
  onKeyChange: (value: string | null) => void
  onTempoChange: (value: number) => void
  onTimeSignatureChange: (value: string) => void
  attachments: Array<{
    id: string
    type: 'image' | 'file'
    filename: string
    blob: Blob
    mimeType: string
  }>
  onAddAttachment: (file: File) => void
  onOpenImage: (blob: Blob, filename: string) => void
  onDownloadFile: (blob: Blob, filename: string) => void
  onDelete: () => void
  onActionComplete: () => void
}) {
  const navigate = useNavigate()
  const instruments = useAllInstruments()
  const [addingInstrument, setAddingInstrument] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<InstrumentType>('bass')
  const [destinationMode, setDestinationMode] = useState<'move' | 'copy' | null>(
    null,
  )
  const fileRef = useRef<HTMLInputElement>(null)
  const imageUrls = useRef<Map<string, string>>(new Map())

  const images = attachments.filter((item) => item.type === 'image')
  const files = attachments.filter((item) => item.type === 'file')

  useEffect(() => {
    const urls = imageUrls.current
    return () => {
      for (const url of urls.values()) {
        URL.revokeObjectURL(url)
      }
      urls.clear()
    }
  }, [])

  function imageUrl(id: string, blob: Blob) {
    const existing = imageUrls.current.get(id)
    if (existing) {
      return existing
    }
    const url = URL.createObjectURL(blob)
    imageUrls.current.set(id, url)
    return url
  }

  const instrumentOptions = [
    { value: '', label: 'None' },
    ...(instruments ?? []).map((instrument) => ({
      value: instrument.id,
      label: instrument.name,
    })),
    { value: '__add', label: '+ Add new instrument…' },
  ]

  const actionItems: MenuOption[] = idea
    ? location === 'pool'
      ? [
          {
            label: 'Turn into Song',
            icon: <Sparkles size={15} />,
            onSelect: () => {
              void turnIdeaIntoSong(idea.id).then(({ song }) => {
                onActionComplete()
                navigate(`/song/${song.id}`)
              })
            },
          },
          {
            label: 'Move to Song',
            icon: <FolderInput size={15} />,
            onSelect: () => setDestinationMode('move'),
          },
          {
            label: 'Copy to Song',
            icon: <Copy size={15} />,
            onSelect: () => setDestinationMode('copy'),
          },
          {
            label: 'Copy into New Song',
            icon: <Plus size={15} />,
            onSelect: () => {
              void copyIdeaIntoNewSong(idea.id).then(onActionComplete)
            },
          },
          {
            label: 'Delete',
            icon: <Trash2 size={15} />,
            destructive: true,
            onSelect: onDelete,
          },
        ]
      : [
          {
            label: 'Move to Song',
            icon: <FolderInput size={15} />,
            onSelect: () => setDestinationMode('move'),
          },
          {
            label: 'Copy to Song',
            icon: <Copy size={15} />,
            onSelect: () => setDestinationMode('copy'),
          },
          {
            label: 'Copy into New Song',
            icon: <Plus size={15} />,
            onSelect: () => {
              void copyIdeaIntoNewSong(idea.id).then(onActionComplete)
            },
          },
          {
            label: 'Move to Pool',
            icon: <ArrowLeftToLine size={15} />,
            onSelect: () => {
              void moveIdeaToPool(idea.id).then(onActionComplete)
            },
          },
          {
            label: 'Copy to Pool',
            icon: <Copy size={15} />,
            onSelect: () => {
              void copyIdeaToPool(idea.id).then(onActionComplete)
            },
          },
        ]
    : []

  return (
    <div className={cn('space-y-3 rounded-xs border border-hairline bg-card p-3')}>
      <label className="block">
        <MonoLabel>Notes</MonoLabel>
        <Textarea
          rows={2}
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          onBlur={onNotesBlur}
          className="mt-1"
        />
      </label>
      <label className="block">
        <MonoLabel>Lyrics</MonoLabel>
        <Textarea
          rows={2}
          placeholder="Add lyrics…"
          value={lyrics}
          onChange={(event) => onLyricsChange(event.target.value)}
          onBlur={onLyricsBlur}
          className="mt-1"
        />
      </label>

      <div className={cn('gap-3', mobile ? 'space-y-3' : 'grid grid-cols-3')}>
        <div>
          <MonoLabel>Key</MonoLabel>
          <div className="mt-1 flex gap-1.5">
            <Pick
              aria-label="Key root"
              options={KEY_ROOTS}
              value={keyRootFromStored(keyValue)}
              onChange={(event) =>
                onKeyChange(
                  buildKeyValueFromRootPick(
                    event.target.value,
                    keyModeFromStored(keyValue),
                  ),
                )
              }
              className="flex-1"
            />
            <Pick
              aria-label="Key mode"
              options={KEY_MODES}
              value={keyModeFromStored(keyValue)}
              onChange={(event) =>
                onKeyChange(
                  buildKeyValueFromRootPick(
                    keyRootFromStored(keyValue),
                    event.target.value === 'minor' ? 'minor' : 'major',
                  ),
                )
              }
              className="flex-1"
            />
          </div>
        </div>
        <label className="block">
          <MonoLabel>Tempo</MonoLabel>
          <Input
            type="number"
            value={tempo}
            onChange={(event) => onTempoChange(Number(event.target.value))}
            className="mt-1 h-8"
          />
        </label>
        <div>
          <MonoLabel>Time Signature</MonoLabel>
          <div className="mt-1">
            <Pick
              aria-label="Time signature"
              options={TIME_SIGNATURES}
              value={timeSignature}
              onChange={(event) => onTimeSignatureChange(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <MonoLabel>Role</MonoLabel>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {IDEA_ROLES.map((item) => (
            <Chip
              key={item.value}
              selected={role === item.value}
              onClick={() => onRoleChange(item.value as IdeaRole)}
            >
              {item.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className={cn('gap-3', mobile ? 'space-y-3' : 'grid grid-cols-2')}>
        <div>
          <MonoLabel>Section Intent</MonoLabel>
          <div className="mt-1">
            <Pick
              aria-label="Section intent"
              options={SECTION_INTENTS}
              value={sectionIntent ?? 'unassigned'}
              onChange={(event) => {
                const next = event.target.value as SectionIntent
                onSectionIntentChange(next === 'unassigned' ? null : next)
              }}
            />
          </div>
        </div>
        <div>
          <MonoLabel>Instrument</MonoLabel>
          <div className="mt-1">
            <Pick
              aria-label="Instrument"
              options={instrumentOptions}
              value={addingInstrument ? '__add' : (instrumentId ?? '')}
              onChange={(event) => {
                const next = event.target.value
                if (next === '__add') {
                  setAddingInstrument(true)
                  return
                }
                setAddingInstrument(false)
                if (!next) {
                  onInstrumentChange(null, null, null)
                  return
                }
                const instrument = (instruments ?? []).find((item) => item.id === next)
                if (!instrument) {
                  return
                }
                onInstrumentChange(
                  instrument.id,
                  instrument.name,
                  defaultSynthPatchForType(instrument.type),
                )
              }}
            />
          </div>
          {addingInstrument ? (
            <div className="mt-2 space-y-2">
              <Input
                placeholder="Instrument name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />
              <Pick
                aria-label="Instrument type"
                options={INSTRUMENT_TYPES}
                value={newType}
                onChange={(event) => setNewType(event.target.value as InstrumentType)}
              />
              <button
                type="button"
                className="focusable rounded-xs border border-foreground px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
                onClick={() => {
                  const name = newName.trim()
                  if (!name) {
                    return
                  }
                  const patch = defaultSynthPatchForType(newType)
                  void createInstrument({
                    name,
                    type: newType,
                    defaultPatch: patch === 'muted' ? null : patch,
                  }).then((created) => {
                    setAddingInstrument(false)
                    setNewName('')
                    onInstrumentChange(
                      created.id,
                      created.name,
                      defaultSynthPatchForType(created.type),
                    )
                  })
                }}
              >
                Add
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <MonoLabel>Attachments</MonoLabel>
        <div className="mt-1.5 space-y-2">
          {images.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {images.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="focusable relative size-14 overflow-hidden rounded-xs border border-hairline hover:border-foreground"
                  aria-label={`Open ${item.filename}`}
                  onClick={() => onOpenImage(item.blob, item.filename)}
                >
                  <img
                    src={imageUrl(item.id, item.blob)}
                    alt=""
                    className="size-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
          {files.map((item) => (
            <button
              key={item.id}
              type="button"
              className="focusable flex w-full items-center gap-2 rounded-xs border border-hairline bg-panel px-2.5 py-1.5 text-left text-xs font-medium hover:border-foreground"
              onClick={() => onDownloadFile(item.blob, item.filename)}
            >
              <span className="text-primary" aria-hidden>
                {item.mimeType.startsWith('audio/') ? (
                  <FileAudio size={14} />
                ) : item.mimeType.startsWith('image/') ? (
                  <ImageIcon size={14} />
                ) : (
                  <Paperclip size={14} />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate">{item.filename}</span>
            </button>
          ))}
          <button
            type="button"
            className="focusable flex w-full items-center justify-center gap-1.5 rounded-xs border border-dashed border-hairline py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:border-foreground hover:text-foreground"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={13} /> Add attachment
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                onAddAttachment(file)
              }
              event.target.value = ''
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-hairline pt-3">
        <button
          type="button"
          disabled={!idea}
          onClick={onDelete}
          className="focusable inline-flex items-center gap-1.5 rounded-xs border border-primary px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
        >
          <Trash2 size={13} /> Delete
        </button>
        <Menu
          label="Idea actions"
          items={actionItems}
          trigger={
            <button
              type="button"
              disabled={!idea}
              className="focusable inline-flex items-center gap-1.5 rounded-xs border border-foreground px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide hover:bg-foreground hover:text-background disabled:opacity-40"
            >
              <SquarePen size={13} /> Actions
            </button>
          }
        />
      </div>

      <IdeaDestinationSheet
        open={destinationMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDestinationMode(null)
          }
        }}
        mode={destinationMode ?? 'move'}
        excludeSongId={idea?.songId}
        onConfirm={async (songId, sectionId) => {
          if (!idea || !destinationMode) {
            return
          }
          if (destinationMode === 'move') {
            await moveIdeaToSection(idea.id, songId, sectionId)
          } else {
            await copyIdeaToSong(idea.id, songId, sectionId)
          }
          onActionComplete()
        }}
      />
    </div>
  )
}

function buildKeyValueFromRootPick(rootPick: string, mode: KeyMode): string | null {
  const token = rootPick.includes('/') ? rootPick.split('/')[1] ?? rootPick : rootPick
  const parsed = parseKeyValue(token) ?? parseKeyValue(rootPick.split('/')[0] ?? rootPick)
  if (!parsed) {
    return null
  }
  return buildKeyValue(parsed.rootId, mode)
}

