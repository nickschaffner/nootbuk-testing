import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMatch } from 'react-router-dom'

import {
  WiredAudioPanel,
  WiredCaptureMetadata,
  WiredImportPanel,
  WiredMidiNoDevicePanel,
  WiredMidiPanel,
  WiredMobileStudioReadout,
  WiredStepInputPanel,
} from '@/components/capture/CaptureWired'
import {
  IDLE_STUDIO_TRANSPORT,
  NOOP_STUDIO_HANDLERS,
  type StudioTransportHandlers,
  type StudioTransportState,
} from '@/components/capture/StudioBar'
import {
  PlaySourcesBar,
  type CaptureSource,
  type CaptureTab,
} from '@/components/kit/CaptureSuite'
import { Button } from '@/components/kit/Button'
import { PageHeader } from '@/components/kit/PageHeader'
import { CaptureModeTabs } from '@/components/kit/CaptureModeTabs'
import { CaptureStudioStack } from '@/components/kit/CaptureStudioStack'
import { StudioBar } from '@/components/kit/StudioBar'
import type { Option } from '@/components/kit/options'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { createIdea, deleteIdea, updateIdea } from '@/hooks/useIdeas'
import { addMediaToIdea, getMediaForIdea } from '@/hooks/useMedia'
import { useAllSongs } from '@/hooks/useSongs'
import { useSynth } from '@/hooks/useSynth'
import {
  getAudioDuration,
  getAudioMimeType,
  isAcceptedAudioFile,
} from '@/lib/audio'
import { db } from '@/lib/db'
import { inferIdeaMediaSource } from '@/lib/idea-media-source'
import { parsePlaybackPatch } from '@/lib/instrument-utils'
import { getMidiDuration, midiBlobToNoteEvents, noteEventsToMidiBlob } from '@/lib/midi'
import { GRID_BEAT } from '@/lib/timeline-notes'
import { timeSignatureFromSong } from '@/lib/time-signature'
import { useQuickCapture } from '@/stores/quickCapture'
import type { IdeaMedia, IdeaMediaSource, IdeaRole, NoteEvent, SectionIntent } from '@/types/idea'

const ALWAYS_TAB: CaptureTab = 'record-audio'
const ALWAYS_TABS: CaptureTab[] = [
  'record-audio',
  'record-midi',
  'step-input',
  'import',
]
const MIDI_SOURCES: CaptureSource[] = [
  'midi-recording',
  'step-input',
  'midi-extraction',
  'midi-import',
]
const AUDIO_SOURCES = ['audio-recording', 'audio-import'] as const
type AudioCaptureSource = (typeof AUDIO_SOURCES)[number]

function isAudioSource(source: CaptureSource): source is AudioCaptureSource {
  return (AUDIO_SOURCES as readonly CaptureSource[]).includes(source)
}

function audioSourceForTab(tab: CaptureTab): 'audio-recording' | 'audio-import' | null {
  if (tab === 'record-audio') {
    return 'audio-recording'
  }
  if (tab === 'imported-audio') {
    return 'audio-import'
  }
  return null
}

function isAudioTab(tab: CaptureTab): boolean {
  return audioSourceForTab(tab) !== null
}
const CONDITIONAL_TAB_SOURCE: Partial<Record<CaptureTab, CaptureSource>> = {
  'extracted-midi': 'midi-extraction',
  'imported-midi': 'midi-import',
  'imported-audio': 'audio-import',
}

function RecordDot() {
  return (
    <span
      className="size-2 shrink-0 rounded-full bg-recorder-red shadow-[0_0_0_1px_var(--primary-foreground)]"
      aria-hidden
    />
  )
}

function tabLabel(tab: CaptureTab): ReactNode {
  if (tab === 'record-audio') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <RecordDot />
        Audio
      </span>
    )
  }
  if (tab === 'record-midi') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <RecordDot />
        MIDI
      </span>
    )
  }
  if (tab === 'step-input') {
    return 'Step Input'
  }
  if (tab === 'import') {
    return 'Import'
  }
  if (tab === 'extracted-midi') {
    return 'Extr. MIDI'
  }
  if (tab === 'imported-midi') {
    return 'Imp. MIDI'
  }
  return 'Imp. Audio'
}

function midiFilename(source: IdeaMediaSource) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  if (source === 'midi-extraction') {
    return `extraction-${stamp}.mid`
  }
  if (source === 'midi-import') {
    return `import-${stamp}.mid`
  }
  if (source === 'step-input') {
    return `notes-${stamp}.mid`
  }
  return `recording-${stamp}.mid`
}

function mediaForSource(media: IdeaMedia[] | undefined, source: CaptureSource) {
  return (media ?? []).find((item) => inferIdeaMediaSource(item) === source) ?? null
}

function presentSources(media: IdeaMedia[] | undefined): CaptureSource[] {
  const present: CaptureSource[] = []
  for (const item of media ?? []) {
    const source = inferIdeaMediaSource(item)
    if (!source || present.includes(source)) {
      continue
    }
    if (item.type === 'midi' && (!item.noteData || item.noteData.length === 0) && !item.blob) {
      continue
    }
    present.push(source)
  }
  return present
}

function useIsMobile() {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  )
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const onChange = () => setMobile(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return mobile
}

export function IdeaEditor({
  sidebarCollapsed = false,
}: {
  sidebarCollapsed?: boolean
}) {
  const { isOpen, mode, target, ideaId, close } = useQuickCapture()
  const isEdit = mode === 'edit' && ideaId !== null
  const songRoute = useMatch('/song/:id')
  const routeSongId = songRoute?.params.id
  const mobile = useIsMobile()
  const songs = useAllSongs()
  const synth = useSynth()

  const [persistedId, setPersistedId] = useState<string | null>(null)
  const ideaIdRef = useRef<string | null>(null)
  const pendingSongIdRef = useRef<string | null>(null)
  const pendingSectionIdRef = useRef<string | null>(null)

  const storedIdea = useLiveQuery(
    () => (persistedId ? db.ideas.get(persistedId) : undefined),
    [persistedId],
  )
  const media = useLiveQuery(
    () => (persistedId ? getMediaForIdea(persistedId) : Promise.resolve([])),
    [persistedId],
  )

  const [tab, setTab] = useState<CaptureTab>(ALWAYS_TAB)
  const [role, setRole] = useState<IdeaRole>('melody')
  const [sectionIntent, setSectionIntent] = useState<SectionIntent | null>(null)
  const [instrumentId, setInstrumentId] = useState<string | null>(null)
  const [instrumentName, setInstrumentName] = useState<string | null>(null)
  const [patchName, setPatchName] = useState<string | null>('piano')
  const [key, setKey] = useState<string | null>(null)
  const [tempo, setTempo] = useState(120)
  const [timeSignature, setTimeSignature] = useState('4/4')
  const [gridBeat, setGridBeat] = useState(GRID_BEAT)
  const [lyrics, setLyrics] = useState('')
  const [notes, setNotes] = useState('')
  const [hydratedIdeaId, setHydratedIdeaId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [recSeed, setRecSeed] = useState<NoteEvent[]>([])
  const [stepSeed, setStepSeed] = useState<NoteEvent[]>([])
  const [extractSeed, setExtractSeed] = useState<NoteEvent[]>([])
  const [importSeed, setImportSeed] = useState<NoteEvent[]>([])
  const [recKey, setRecKey] = useState(0)
  const stepKey = 0
  const [extractKey, setExtractKey] = useState(0)
  const [importKey, setImportKey] = useState(0)

  const lyricsRef = useRef(lyrics)
  const notesRef = useRef(notes)
  lyricsRef.current = lyrics
  notesRef.current = notes

  const [notesTransport, setNotesTransport] = useState<StudioTransportState>(
    IDLE_STUDIO_TRANSPORT,
  )
  const [midiRecTransport, setMidiRecTransport] = useState<StudioTransportState>(
    IDLE_STUDIO_TRANSPORT,
  )
  const [midiExtractTransport, setMidiExtractTransport] =
    useState<StudioTransportState>(IDLE_STUDIO_TRANSPORT)
  const [midiImportTransport, setMidiImportTransport] =
    useState<StudioTransportState>(IDLE_STUDIO_TRANSPORT)
  const notesHandlersRef = useRef<StudioTransportHandlers>(NOOP_STUDIO_HANDLERS)
  const midiRecHandlersRef = useRef<StudioTransportHandlers>(NOOP_STUDIO_HANDLERS)
  const midiExtractHandlersRef = useRef<StudioTransportHandlers>(NOOP_STUDIO_HANDLERS)
  const midiImportHandlersRef = useRef<StudioTransportHandlers>(NOOP_STUDIO_HANDLERS)

  const [playingSources, setPlayingSources] = useState<CaptureSource[]>([])
  const [audioLoopEnabled, setAudioLoopEnabled] = useState(true)
  const audioHandlersRef = useRef<StudioTransportHandlers>(NOOP_STUDIO_HANDLERS)
  const draftAudioBlobRef = useRef<Blob | null>(null)
  const audioElementsRef = useRef<Partial<Record<'audio-recording' | 'audio-import', HTMLAudioElement>>>({})
  const audioUrlsRef = useRef<Partial<Record<'audio-recording' | 'audio-import', string>>>({})
  const [audioUi, setAudioUi] = useState({ current: 0, duration: 0, progress: 0 })
  const midiTimersRef = useRef<Partial<Record<CaptureSource, number[]>>>({})
  const midiLoopRef = useRef<Partial<Record<CaptureSource, boolean>>>({})
  const persistChain = useRef(Promise.resolve())

  const midiSupported =
    typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator

  const present = useMemo((): CaptureSource[] => {
    const sources = presentSources(media)
    if (extractSeed.length > 0 && !sources.includes('midi-extraction')) {
      return [...sources, 'midi-extraction']
    }
    return sources
  }, [media, extractSeed])
  const tabOptions = useMemo((): Option<CaptureTab>[] => {
    const tabs: CaptureTab[] = [
      ...ALWAYS_TABS,
      ...(Object.entries(CONDITIONAL_TAB_SOURCE) as [CaptureTab, CaptureSource][])
        .filter(([, source]) => present.includes(source))
        .map(([next]) => next),
    ]
    return tabs.map((next) => ({
      value: next,
      label: tabLabel(next) as unknown as string,
    }))
  }, [present])

  useEffect(() => {
    const source = CONDITIONAL_TAB_SOURCE[tab]
    if (source && !present.includes(source)) {
      setTab(ALWAYS_TAB)
    }
  }, [tab, present])

  function resetForm() {
    ideaIdRef.current = null
    pendingSongIdRef.current = null
    pendingSectionIdRef.current = null
    setPersistedId(null)
    setTab(ALWAYS_TAB)
    setRole('melody')
    setSectionIntent(null)
    setInstrumentId(null)
    setInstrumentName(null)
    setPatchName('piano')
    setKey(null)
    setTempo(120)
    setTimeSignature('4/4')
    setGridBeat(GRID_BEAT)
    setLyrics('')
    setNotes('')
    setHydratedIdeaId(null)
    setPlayingSources([])
    draftAudioBlobRef.current = null
    setRecSeed([])
    setStepSeed([])
    setExtractSeed([])
    setImportSeed([])
    stopAllPlaybar()
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }
    if (isEdit && ideaId) {
      ideaIdRef.current = ideaId
      setPersistedId(ideaId)
      pendingSongIdRef.current = null
      pendingSectionIdRef.current = null
      return
    }
    ideaIdRef.current = null
    setPersistedId(null)
    pendingSongIdRef.current = target?.songId ?? null
    pendingSectionIdRef.current = target?.sectionId ?? null
  }, [isOpen, isEdit, ideaId, target])

  useEffect(() => {
    if (!isOpen || isEdit) {
      return
    }
    const songId = target?.songId ?? routeSongId
    if (!songId || !songs) {
      return
    }
    const song = songs.find((item) => item.id === songId)
    if (song?.tempo && song.tempo > 0) {
      setTempo(song.tempo)
    }
    setTimeSignature(timeSignatureFromSong(song?.timeSignature))
  }, [isOpen, isEdit, target, routeSongId, songs])

  useEffect(() => {
    if (!isOpen || !isEdit || !ideaId || !storedIdea) {
      return
    }
    if (hydratedIdeaId === ideaId) {
      return
    }
    setRole(storedIdea.role)
    setSectionIntent(storedIdea.sectionIntent)
    setInstrumentId(storedIdea.instrumentId)
    setInstrumentName(storedIdea.instrumentName)
    setPatchName(storedIdea.patchName ?? 'piano')
    setKey(storedIdea.key)
    setTempo(storedIdea.tempo && storedIdea.tempo > 0 ? storedIdea.tempo : 120)
    setTimeSignature(storedIdea.timeSignature ?? '4/4')
    setLyrics(storedIdea.lyrics ?? '')
    setNotes(storedIdea.notes ?? '')
    setHydratedIdeaId(ideaId)
  }, [isOpen, isEdit, ideaId, storedIdea, hydratedIdeaId])

  useEffect(() => {
    if (!media) {
      return
    }
    const rec = mediaForSource(media, 'midi-recording')?.noteData
    const step = mediaForSource(media, 'step-input')?.noteData
    const extracted = mediaForSource(media, 'midi-extraction')?.noteData
    const imported = mediaForSource(media, 'midi-import')?.noteData
    if (rec && rec.length > 0) {
      setRecSeed((current) => (current.length > 0 ? current : rec))
    }
    if (step && step.length > 0) {
      setStepSeed((current) => (current.length > 0 ? current : step))
    }
    if (extracted && extracted.length > 0) {
      setExtractSeed((current) => (current.length > 0 ? current : extracted))
    }
    if (imported && imported.length > 0) {
      setImportSeed((current) => (current.length > 0 ? current : imported))
    }
  }, [media])

  const draftRef = useRef({
    role,
    sectionIntent,
    key,
    tempo,
    timeSignature,
    instrumentId,
    instrumentName,
    patchName,
  })
  draftRef.current = {
    role,
    sectionIntent,
    key,
    tempo,
    timeSignature,
    instrumentId,
    instrumentName,
    patchName,
  }

  const snapshotFields = useCallback(
    () => ({
      songId: pendingSongIdRef.current,
      sectionId: pendingSectionIdRef.current,
      ...draftRef.current,
      patchSettings: null,
      lyrics: lyricsRef.current.trim() ? lyricsRef.current : null,
      notes: notesRef.current.trim() ? notesRef.current : null,
    }),
    [],
  )

  const ensureIdea = useCallback(async (): Promise<string> => {
    if (ideaIdRef.current) {
      return ideaIdRef.current
    }
    const created = await createIdea(snapshotFields())
    ideaIdRef.current = created.id
    pendingSongIdRef.current = created.songId
    pendingSectionIdRef.current = created.sectionId
    setPersistedId(created.id)
    return created.id
  }, [snapshotFields])

  const persistIdeaFields = useCallback(async () => {
    const id = ideaIdRef.current
    if (!id) {
      return
    }
    const snap = snapshotFields()
    // Location is owned by move/copy actions — never rewrite song/section on field persist.
    await updateIdea({
      id,
      role: snap.role,
      sectionIntent: snap.sectionIntent,
      key: snap.key,
      tempo: snap.tempo,
      timeSignature: snap.timeSignature,
      instrumentId: snap.instrumentId,
      instrumentName: snap.instrumentName,
      patchName: snap.patchName,
      patchSettings: snap.patchSettings,
      lyrics: snap.lyrics,
      notes: snap.notes,
    })
  }, [snapshotFields])

  const queuePersist = useCallback((task: () => Promise<void>) => {
    persistChain.current = persistChain.current.then(task).catch((error) => {
      console.warn('capture persist failed:', error)
    })
    return persistChain.current
  }, [])

  const flushTextFields = useCallback(async () => {
    const nextNotes = notesRef.current
    const nextLyrics = lyricsRef.current
    const notesValue = nextNotes.trim() ? nextNotes : null
    const lyricsValue = nextLyrics.trim() ? nextLyrics : null

    if (!ideaIdRef.current && !notesValue && !lyricsValue) {
      return
    }
    if (!ideaIdRef.current && (notesValue || lyricsValue)) {
      await ensureIdea()
    }
    const id = ideaIdRef.current
    if (!id) {
      return
    }
    await updateIdea({
      id,
      notes: notesValue,
      lyrics: lyricsValue,
    })
  }, [ensureIdea])

  useEffect(() => {
    return () => {
      void flushTextFields()
    }
  }, [flushTextFields])

  async function persistMidiSource(
    source: IdeaMediaSource,
    noteEvents: NoteEvent[],
    bpm: number,
    filename?: string,
  ) {
    const id = await ensureIdea()
    if (noteEvents.length === 0) {
      return
    }
    await addMediaToIdea({
      ideaId: id,
      type: 'midi',
      source,
      filename: filename ?? midiFilename(source),
      mimeType: 'audio/midi',
      blob: noteEventsToMidiBlob(noteEvents, bpm),
      duration: getMidiDuration(noteEvents),
      noteData: noteEvents,
    })
  }

  async function persistAudioSource(
    source: 'audio-recording' | 'audio-import',
    blob: Blob,
    filename: string,
  ) {
    const id = await ensureIdea()
    const duration = await getAudioDuration(blob)
    await addMediaToIdea({
      ideaId: id,
      type: 'audio',
      source,
      filename,
      mimeType: getAudioMimeType(filename, blob.type),
      blob,
      duration,
      noteData: null,
    })
  }

  function pauseAudio(source: 'audio-recording' | 'audio-import') {
    const element = audioElementsRef.current[source]
    if (element) {
      element.pause()
    }
    setPlayingSources((current) => current.filter((item) => item !== source))
  }

  function stopAudio(source?: 'audio-recording' | 'audio-import') {
    const targets = source ? [source] : AUDIO_SOURCES
    for (const item of targets) {
      const element = audioElementsRef.current[item]
      if (element) {
        element.pause()
        element.currentTime = 0
      }
    }
    setPlayingSources((current) => current.filter((item) => !isAudioSource(item)))
  }

  function stopMidiSource(source: CaptureSource) {
    midiLoopRef.current[source] = false
    for (const timer of midiTimersRef.current[source] ?? []) {
      window.clearTimeout(timer)
    }
    midiTimersRef.current[source] = []
    setPlayingSources((current) => current.filter((item) => item !== source))
  }

  function stopAllMidi() {
    for (const source of MIDI_SOURCES) {
      stopMidiSource(source)
    }
  }

  function stopAllPlaybar() {
    stopAudio()
    stopAllMidi()
    for (const url of Object.values(audioUrlsRef.current)) {
      if (url) {
        URL.revokeObjectURL(url)
      }
    }
    audioUrlsRef.current = {}
  }

  const audioBlobRef = useRef<Partial<Record<'audio-recording' | 'audio-import', Blob>>>({})

  function ensureAudioElement(source: 'audio-recording' | 'audio-import', blob: Blob) {
    const existing = audioElementsRef.current[source]
    if (existing && audioBlobRef.current[source] === blob) {
      existing.loop = audioLoopEnabled
      return existing
    }
    if (existing) {
      existing.pause()
      const oldUrl = audioUrlsRef.current[source]
      if (oldUrl) {
        URL.revokeObjectURL(oldUrl)
      }
    }
    const url = URL.createObjectURL(blob)
    audioUrlsRef.current[source] = url
    audioBlobRef.current[source] = blob
    const element = new Audio(url)
    element.loop = audioLoopEnabled
    element.addEventListener('timeupdate', () => {
      if (element.paused) {
        return
      }
      setAudioUi({
        current: element.currentTime,
        duration: element.duration || 0,
        progress:
          element.duration > 0 ? element.currentTime / element.duration : 0,
      })
    })
    element.addEventListener('pause', () => {
      setPlayingSources((current) => current.filter((item) => item !== source))
    })
    audioElementsRef.current[source] = element
    return element
  }

  async function startMidiSource(source: CaptureSource, noteEvents: NoteEvent[]) {
    stopMidiSource(source)
    if (noteEvents.length === 0) {
      return
    }
    await synth.ensureStarted()
    const parsed = parsePlaybackPatch(patchName)
    if (parsed && parsed !== 'muted') {
      await synth.setPatch(parsed)
    }
    midiLoopRef.current[source] = true
    setPlayingSources((current) =>
      current.includes(source) ? current : [...current, source],
    )

    const run = () => {
      if (!midiLoopRef.current[source]) {
        return
      }
      const timers: number[] = []
      for (const note of noteEvents) {
        timers.push(
          window.setTimeout(() => {
            void synth.playNote(note.pitch, note.velocity, note.duration)
          }, Math.max(0, note.startTime * 1000)),
        )
      }
      const durationMs =
        noteEvents.reduce(
          (max, note) => Math.max(max, note.startTime + note.duration),
          0,
        ) *
          1000 +
        80
      timers.push(
        window.setTimeout(() => {
          if (midiLoopRef.current[source]) {
            run()
          } else {
            setPlayingSources((current) => current.filter((item) => item !== source))
          }
        }, durationMs),
      )
      midiTimersRef.current[source] = timers
    }
    run()
  }

  const audioRecording = mediaForSource(media, 'audio-recording')
  const audioImport = mediaForSource(media, 'audio-import')

  function activeTabAudioBlob(): Blob | null {
    const source = audioSourceForTab(tab)
    if (source === 'audio-recording') {
      return draftAudioBlobRef.current ?? audioRecording?.blob ?? null
    }
    if (source === 'audio-import') {
      return audioImport?.blob ?? null
    }
    return null
  }

  async function toggleActiveTabAudio() {
    const source = audioSourceForTab(tab)
    if (!source) {
      return
    }
    const blob = activeTabAudioBlob()
    if (!blob) {
      return
    }

    if (playingSources.includes(source)) {
      pauseAudio(source)
      return
    }

    stopAudio()
    stopAllMidi()
    const element = ensureAudioElement(source, blob)
    element.loop = audioLoopEnabled
    try {
      await element.play()
      setPlayingSources((current) => [
        ...current.filter((item) => !isAudioSource(item)),
        source,
      ])
    } catch (caught) {
      console.warn('Audio playback failed:', caught)
    }
  }

  function restartActiveTabAudio() {
    const source = audioSourceForTab(tab)
    if (!source) {
      return
    }
    const blob = activeTabAudioBlob()
    if (!blob) {
      return
    }

    stopAllMidi()
    const element = ensureAudioElement(source, blob)
    element.currentTime = 0
    element.loop = audioLoopEnabled
    setAudioUi({
      current: 0,
      duration: element.duration || 0,
      progress: 0,
    })
    void element.play()
    setPlayingSources((current) => [
      ...current.filter((item) => !isAudioSource(item)),
      source,
    ])
  }

  function toggleActiveTabAudioLoop() {
    setAudioLoopEnabled((current) => {
      const next = !current
      for (const item of AUDIO_SOURCES) {
        const element = audioElementsRef.current[item]
        if (element) {
          element.loop = next
        }
      }
      return next
    })
  }

  useEffect(() => {
    audioHandlersRef.current = {
      playPause: () => {
        void toggleActiveTabAudio()
      },
      restart: restartActiveTabAudio,
      toggleLoop: toggleActiveTabAudioLoop,
      undo: () => {},
      redo: () => {},
    }
  })

  const activeHandlers = useMemo(() => {
    if (isAudioTab(tab)) {
      return audioHandlersRef
    }
    if (tab === 'step-input') {
      return notesHandlersRef
    }
    if (tab === 'record-midi') {
      return midiRecHandlersRef
    }
    if (tab === 'extracted-midi') {
      return midiExtractHandlersRef
    }
    if (tab === 'imported-midi') {
      return midiImportHandlersRef
    }
    return { current: NOOP_STUDIO_HANDLERS }
  }, [tab])

  const activeTransport: StudioTransportState = useMemo(() => {
    const source = audioSourceForTab(tab)
    if (source) {
      return {
        isPlaying: playingSources.includes(source),
        loopEnabled: audioLoopEnabled,
        canUndo: false,
        canRedo: false,
        transportLocked: false,
      }
    }
    if (tab === 'step-input') {
      return notesTransport
    }
    if (tab === 'record-midi') {
      return midiRecTransport
    }
    if (tab === 'extracted-midi') {
      return midiExtractTransport
    }
    if (tab === 'imported-midi') {
      return midiImportTransport
    }
    return IDLE_STUDIO_TRANSPORT
  }, [
    tab,
    playingSources,
    audioLoopEnabled,
    notesTransport,
    midiRecTransport,
    midiExtractTransport,
    midiImportTransport,
  ])

  function handleStudioPlay() {
    if (isAudioTab(tab)) {
      stopAllMidi()
      void toggleActiveTabAudio()
      return
    }
    stopAudio()
    activeHandlers.current.playPause()
  }

  const activeAudioSource = audioSourceForTab(tab)
  const activeAudioPlaying =
    activeAudioSource !== null && playingSources.includes(activeAudioSource)

  async function toggleSource(source: CaptureSource) {
    if (playingSources.includes(source)) {
      if (isAudioSource(source)) {
        pauseAudio(source)
      } else {
        stopMidiSource(source)
      }
      return
    }

    if (isAudioSource(source)) {
      stopAudio()
      stopAllMidi()
      const item = mediaForSource(media, source)
      if (!item) {
        return
      }
      const element = ensureAudioElement(source, item.blob)
      element.loop = audioLoopEnabled
      void element.play()
      setPlayingSources((current) => [
        ...current.filter((itemSource) => !isAudioSource(itemSource)),
        source,
      ])
      return
    }

    if (activeTransport.isPlaying) {
      activeHandlers.current.playPause()
    }
    stopAudio()
    const item = mediaForSource(media, source)
    await startMidiSource(source, item?.noteData ?? [])
  }

  const location: 'pool' | 'song' =
    (storedIdea?.songId ?? pendingSongIdRef.current) ? 'song' : 'pool'

  const attachments = (media ?? [])
    .filter((item) => item.type === 'image' || item.type === 'file')
    .map((item) => ({
      id: item.id,
      type: item.type as 'image' | 'file',
      filename: item.filename,
      blob: item.blob,
      mimeType: item.mimeType,
    }))

  const studioPatch = parsePlaybackPatch(patchName)
  const studioPatchValue =
    studioPatch && studioPatch !== 'muted' ? studioPatch : 'piano'

  function applyPatch(next: string) {
    setPatchName(next)
    draftRef.current = { ...draftRef.current, patchName: next }
    const parsed = parsePlaybackPatch(next)
    if (parsed && parsed !== 'muted') {
      void synth.setPatch(parsed)
    }
    queuePersist(async () => {
      if (ideaIdRef.current) {
        await persistIdeaFields()
      }
    })
  }

  function applyTempo(next: number) {
    const bpm = Number.isFinite(next) && next > 0 ? next : 120
    setTempo(bpm)
    draftRef.current = { ...draftRef.current, tempo: bpm }
    queuePersist(async () => {
      if (ideaIdRef.current) {
        await persistIdeaFields()
      }
    })
  }

  function applyTimeSig(next: string) {
    setTimeSignature(next)
    draftRef.current = { ...draftRef.current, timeSignature: next }
    queuePersist(async () => {
      if (ideaIdRef.current) {
        await persistIdeaFields()
      }
    })
  }

  function applyKey(next: string | null) {
    setKey(next)
    draftRef.current = { ...draftRef.current, key: next }
    queuePersist(async () => {
      if (ideaIdRef.current) {
        await persistIdeaFields()
      }
    })
  }

  useEffect(() => {
    const parsed = parsePlaybackPatch(patchName)
    if (parsed && parsed !== 'muted') {
      void synth.setPatch(parsed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync on open/patch only
  }, [patchName])

  const importedPlaying =
    activeAudioSource === 'audio-import' && activeAudioPlaying

  function handleOpenChange(open: boolean) {
    if (open) {
      return
    }
    stopAllPlaybar()
    void flushTextFields()
    resetForm()
    close()
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side={mobile ? 'bottom' : 'right'}
        showCloseButton={false}
        className={
          mobile
            ? 'flex h-full w-full flex-col gap-0 overflow-y-auto p-0'
            : sidebarCollapsed
              ? 'flex h-full w-full flex-col gap-0 overflow-y-auto p-0 md:w-[calc(100vw-3.5rem)] md:max-w-[calc(100vw-3.5rem)]'
              : 'flex h-full w-full flex-col gap-0 overflow-y-auto p-0 md:w-[calc(100vw-14rem)] md:max-w-[calc(100vw-14rem)]'
        }
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Quick Capture</SheetTitle>
          <SheetDescription>Capture an idea</SheetDescription>
        </SheetHeader>

        <div className="relative flex min-h-0 flex-1 flex-col px-4 md:px-6">
          <PageHeader
            title="Quick Capture"
            className="shrink-0"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
            }
          />
          <CaptureStudioStack
            tabs={
              <CaptureModeTabs
                value={tab}
                onChange={setTab}
                options={tabOptions}
              />
            }
            studio={
              mobile ? (
                <WiredMobileStudioReadout
                  playing={activeTransport.isPlaying}
                  loop={activeTransport.loopEnabled}
                  tempo={tempo}
                  timeSig={timeSignature}
                  grid={String(gridBeat)}
                  patch={studioPatchValue}
                  onPlayToggle={handleStudioPlay}
                  onRestart={() => activeHandlers.current.restart()}
                  onLoopToggle={() => activeHandlers.current.toggleLoop()}
                  onUndo={() => activeHandlers.current.undo()}
                  onRedo={() => activeHandlers.current.redo()}
                  onTempoChange={applyTempo}
                  onTimeSigChange={applyTimeSig}
                  onGridChange={(value) => setGridBeat(Number(value))}
                  onPatchChange={applyPatch}
                />
              ) : (
                <StudioBar
                  embedded
                  playing={activeTransport.isPlaying}
                  loop={activeTransport.loopEnabled}
                  tempo={tempo}
                  timeSig={timeSignature}
                  grid={String(gridBeat)}
                  patch={studioPatchValue}
                  onPlayToggle={handleStudioPlay}
                  onRestart={() => activeHandlers.current.restart()}
                  onLoopToggle={() => activeHandlers.current.toggleLoop()}
                  onUndo={() => activeHandlers.current.undo()}
                  onRedo={() => activeHandlers.current.redo()}
                  onTempoChange={applyTempo}
                  onTimeSigChange={applyTimeSig}
                  onGridChange={(value) => setGridBeat(Number(value))}
                  onPatchChange={applyPatch}
                />
              )
            }
            footer={
              <PlaySourcesBar
                embedded
                present={present}
                playing={playingSources}
                onToggle={(source) => {
                  void toggleSource(source)
                }}
                mobile={mobile}
              />
            }
          >
            {tab === 'record-audio' ? (
              <WiredAudioPanel
                mode="record"
                mobile={mobile}
                blob={audioRecording?.blob ?? null}
                playbackProgress={
                  activeAudioPlaying && activeAudioSource === 'audio-recording'
                    ? audioUi.progress
                    : 0
                }
                onActiveBlobChange={(blob) => {
                  draftAudioBlobRef.current = blob
                }}
                onRecordingSaved={(blob) => {
                  queuePersist(async () => {
                    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
                    await persistAudioSource(
                      'audio-recording',
                      blob,
                      `recording-${stamp}.wav`,
                    )
                  })
                }}
                onExtractConfirm={async (extracted) => {
                  setExtractSeed(extracted)
                  setExtractKey((value) => value + 1)
                  setTab('extracted-midi')
                  await persistMidiSource('midi-extraction', extracted, tempo)
                }}
              />
            ) : null}

            {tab === 'record-midi' ? (
              midiSupported ? (
                <WiredMidiPanel
                  key={`midi-rec-${recKey}`}
                  initialNoteEvents={recSeed}
                  tempo={tempo}
                  timeSignature={timeSignature}
                  patchName={patchName}
                  gridBeat={gridBeat}
                  onGridBeatChange={setGridBeat}
                  onTransportStateChange={setMidiRecTransport}
                  onRegisterTransportHandlers={(handlers) => {
                    midiRecHandlersRef.current = handlers
                  }}
                  onDraftChange={(data) => {
                    queuePersist(() =>
                      persistMidiSource('midi-recording', data.noteEvents, data.bpm),
                    )
                  }}
                />
              ) : (
                <WiredMidiNoDevicePanel
                  mobile={mobile}
                  onUseKeys={() => setTab('step-input')}
                  onImportMidi={() => setTab('import')}
                  onRescan={() => {
                    if ('requestMIDIAccess' in navigator) {
                      void navigator.requestMIDIAccess()
                    }
                  }}
                />
              )
            ) : null}

            {tab === 'step-input' ? (
              <WiredStepInputPanel
                key={`step-${stepKey}`}
                initialNoteEvents={stepSeed}
                tempo={tempo}
                timeSignature={timeSignature}
                patchName={patchName}
                gridBeat={gridBeat}
                onGridBeatChange={setGridBeat}
                onTransportStateChange={setNotesTransport}
                onRegisterTransportHandlers={(handlers) => {
                  notesHandlersRef.current = handlers
                }}
                onDraftChange={(data) => {
                  queuePersist(() =>
                    persistMidiSource('step-input', data.noteEvents, data.bpm),
                  )
                }}
                onCopyToMidiRecord={(data) => {
                  queuePersist(async () => {
                    await persistMidiSource(
                      'midi-recording',
                      data.noteEvents,
                      data.bpm,
                    )
                    setRecSeed(data.noteEvents)
                    setRecKey((value) => value + 1)
                    setTab('record-midi')
                  })
                }}
              />
            ) : null}

            {tab === 'import' ? (
              <WiredImportPanel
                mobile={mobile}
                onImportAudio={(file) => {
                  if (!isAcceptedAudioFile(file)) {
                    return
                  }
                  queuePersist(async () => {
                    await persistAudioSource('audio-import', file, file.name)
                    setTab('imported-audio')
                  })
                }}
                onImportMidi={(file) => {
                  queuePersist(async () => {
                    const noteEvents = await midiBlobToNoteEvents(file)
                    await persistMidiSource(
                      'midi-import',
                      noteEvents,
                      tempo,
                      file.name,
                    )
                    setImportSeed(noteEvents)
                    setImportKey((value) => value + 1)
                    setTab('imported-midi')
                  })
                }}
              />
            ) : null}

            {tab === 'extracted-midi' ? (
              <WiredMidiPanel
                key={`midi-extract-${extractKey}`}
                preloaded="extracted"
                initialNoteEvents={extractSeed}
                tempo={tempo}
                timeSignature={timeSignature}
                patchName={patchName}
                gridBeat={gridBeat}
                onGridBeatChange={setGridBeat}
                onTransportStateChange={setMidiExtractTransport}
                onRegisterTransportHandlers={(handlers) => {
                  midiExtractHandlersRef.current = handlers
                }}
                onDraftChange={(data) => {
                  queuePersist(() =>
                    persistMidiSource('midi-extraction', data.noteEvents, data.bpm),
                  )
                }}
              />
            ) : null}

            {tab === 'imported-midi' ? (
              <WiredMidiPanel
                key={`midi-import-${importKey}`}
                preloaded="imported"
                initialNoteEvents={importSeed}
                tempo={tempo}
                timeSignature={timeSignature}
                patchName={patchName}
                gridBeat={gridBeat}
                onGridBeatChange={setGridBeat}
                onTransportStateChange={setMidiImportTransport}
                onRegisterTransportHandlers={(handlers) => {
                  midiImportHandlersRef.current = handlers
                }}
                onDraftChange={(data) => {
                  queuePersist(() =>
                    persistMidiSource('midi-import', data.noteEvents, data.bpm),
                  )
                }}
              />
            ) : null}

            {tab === 'imported-audio' && audioImport ? (
              <WiredAudioPanel
                mode="import"
                mobile={mobile}
                blob={audioImport.blob}
                playing={importedPlaying}
                playbackProgress={importedPlaying ? audioUi.progress : 0}
                currentTime={importedPlaying ? audioUi.current : 0}
                duration={audioImport.duration ?? audioUi.duration}
                onPlayToggle={() => {
                  void toggleSource('audio-import')
                }}
                onExtractConfirm={async (extracted) => {
                  setExtractSeed(extracted)
                  setExtractKey((value) => value + 1)
                  setTab('extracted-midi')
                  await persistMidiSource('midi-extraction', extracted, tempo)
                }}
              />
            ) : null}
          </CaptureStudioStack>

          <div className="py-3">
            <WiredCaptureMetadata
              mobile={mobile}
              location={location}
              idea={storedIdea ?? null}
              notes={notes}
              lyrics={lyrics}
              role={role}
              sectionIntent={sectionIntent}
              instrumentId={instrumentId}
              keyValue={key}
              tempo={tempo}
              timeSignature={timeSignature}
              onNotesChange={setNotes}
              onLyricsChange={setLyrics}
              onNotesBlur={() => {
                void flushTextFields()
              }}
              onLyricsBlur={() => {
                void flushTextFields()
              }}
              onRoleChange={(next) => {
                setRole(next)
                draftRef.current = { ...draftRef.current, role: next }
                queuePersist(async () => {
                  await ensureIdea()
                  await persistIdeaFields()
                })
              }}
              onSectionIntentChange={(next) => {
                setSectionIntent(next)
                draftRef.current = { ...draftRef.current, sectionIntent: next }
                queuePersist(async () => {
                  if (ideaIdRef.current) {
                    await persistIdeaFields()
                  }
                })
              }}
              onInstrumentChange={(nextId, nextName, patch) => {
                setInstrumentId(nextId)
                setInstrumentName(nextName)
                draftRef.current = {
                  ...draftRef.current,
                  instrumentId: nextId,
                  instrumentName: nextName,
                  patchName:
                    patch && patch !== 'muted' ? patch : draftRef.current.patchName,
                }
                if (patch && patch !== 'muted') {
                  setPatchName(patch)
                  void synth.setPatch(patch)
                }
                queuePersist(async () => {
                  if (ideaIdRef.current || nextId) {
                    await ensureIdea()
                    await persistIdeaFields()
                  }
                })
              }}
              onKeyChange={applyKey}
              onTempoChange={applyTempo}
              onTimeSignatureChange={applyTimeSig}
              attachments={attachments}
              onAddAttachment={(file) => {
                queuePersist(async () => {
                  const id = await ensureIdea()
                  const isImage = file.type.startsWith('image/')
                  await addMediaToIdea({
                    ideaId: id,
                    type: isImage ? 'image' : 'file',
                    source: null,
                    filename: file.name,
                    mimeType: file.type || 'application/octet-stream',
                    blob: file,
                    duration: null,
                    noteData: null,
                  })
                })
              }}
              onOpenImage={(blob, filename) => {
                const url = URL.createObjectURL(blob)
                const opened = window.open(url, '_blank')
                if (!opened) {
                  const anchor = document.createElement('a')
                  anchor.href = url
                  anchor.download = filename
                  anchor.click()
                }
              }}
              onDownloadFile={(blob, filename) => {
                const url = URL.createObjectURL(blob)
                const anchor = document.createElement('a')
                anchor.href = url
                anchor.download = filename
                anchor.click()
                window.setTimeout(() => URL.revokeObjectURL(url), 1000)
              }}
              onDelete={() => setDeleteOpen(true)}
              onActionComplete={() => {
                handleOpenChange(false)
              }}
            />
          </div>
        </div>
      </SheetContent>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this idea?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the idea and its media from this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const id = ideaIdRef.current
                if (!id) {
                  return
                }
                void deleteIdea(id).then(() => {
                  setDeleteOpen(false)
                  handleOpenChange(false)
                })
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}
