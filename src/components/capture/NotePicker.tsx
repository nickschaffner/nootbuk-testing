import { useEffect, useRef, useState } from 'react'

import { NoteSequenceList } from '@/components/capture/NoteSequenceList'
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
import { createNoteSequence } from '@/hooks/useNoteSequences'
import { useSynth } from '@/hooks/useSynth'
import {
  buildChordName,
  CHORD_PRESETS,
  getChordLabel,
  type ChordType,
} from '@/lib/chords'
import { getNoteNames, noteNameToMidi } from '@/lib/notes'
import { sequenceNotesToNoteEvents } from '@/lib/sequence-playback'
import { SYNTH_PATCHES, type SynthPatchId } from '@/lib/synth-patches'
import { cn } from '@/lib/utils'
import type { NoteDuration, SequenceNote } from '@/types/idea'

const NOTE_NAMES = getNoteNames()
const OCTAVES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const

const DURATIONS: Array<{ value: NoteDuration; label: string }> = [
  { value: 'whole', label: 'Whole' },
  { value: 'half', label: 'Half' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'eighth', label: 'Eighth' },
  { value: 'sixteenth', label: '16th' },
]

interface NotePickerProps {
  ideaId?: string
  draft?: boolean
  onDraftChange?: (data: { notes: SequenceNote[]; label: string | null }) => void
  onSaved?: () => void
  embedded?: boolean
  className?: string
}

export function NotePicker({
  ideaId,
  draft = false,
  onDraftChange,
  onSaved,
  embedded = false,
  className,
}: NotePickerProps) {
  const synth = useSynth()

  const [octave, setOctave] = useState(4)
  const [duration, setDuration] = useState<NoteDuration>('quarter')
  const [chordRoot, setChordRoot] = useState('C')
  const [patch, setPatch] = useState<SynthPatchId>('piano')
  const [notes, setNotes] = useState<SequenceNote[]>([])
  const [label, setLabel] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const onDraftChangeRef = useRef(onDraftChange)

  useEffect(() => {
    onDraftChangeRef.current = onDraftChange
  }, [onDraftChange])

  useEffect(() => {
    if (draft) {
      onDraftChangeRef.current?.({ notes, label: label.trim() || null })
    }
  }, [draft, label, notes])

  function addSingleNote(noteName: string) {
    const displayName = `${noteName}${octave}`
    const pitch = noteNameToMidi(displayName)

    setNotes((current) => [
      ...current,
      {
        pitch,
        octave,
        name: displayName,
        duration,
        isChord: false,
        chordName: null,
      },
    ])
  }

  function addChord(type: ChordType) {
    const rootPitch = noteNameToMidi(`${chordRoot}${octave}`)
    const chordName = buildChordName(chordRoot, type)

    setNotes((current) => [
      ...current,
      {
        pitch: rootPitch,
        octave,
        name: chordName,
        duration,
        isChord: true,
        chordName,
      },
    ])
  }

  async function handlePlay() {
    if (isPlaying) {
      await synth.stopAll()
      setIsPlaying(false)
      return
    }

    if (notes.length === 0) {
      return
    }

    const events = sequenceNotesToNoteEvents(notes)
    const totalDuration = events.reduce(
      (max, event) => Math.max(max, event.startTime + event.duration),
      0,
    )

    setIsPlaying(true)
    await synth.playNoteSequence(events, patch)
    window.setTimeout(() => setIsPlaying(false), totalDuration * 1000 + 100)
  }

  async function handleSave() {
    if (notes.length === 0 || !ideaId) {
      return
    }

    setIsSaving(true)
    try {
      await createNoteSequence({
        ideaId,
        notes,
        label: label.trim() || null,
      })
      setNotes([])
      setLabel('')
      onSaved?.()
    } catch {
      // createNoteSequence already logs the error
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className={cn(
        embedded ? 'space-y-4' : 'space-y-4 rounded-lg border p-4',
        className,
      )}
    >
      {!embedded ? (
        <div>
          <h3 className="text-sm font-medium">Note Picker</h3>
          <p className="text-xs text-muted-foreground">
            Tap notes or chords to build a sequence manually.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Octave</Label>
          <Select
            value={String(octave)}
            onValueChange={(value) => setOctave(Number.parseInt(value, 10))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OCTAVES.map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Duration</Label>
          <Select
            value={duration}
            onValueChange={(value) => setDuration(value as NoteDuration)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Patch</Label>
          <Select
            value={patch}
            onValueChange={(value) => setPatch(value as SynthPatchId)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SYNTH_PATCHES.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {synth.isLoadingPatch ? (
            <p className="text-xs text-muted-foreground">Loading patch...</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
          {NOTE_NAMES.map((noteName) => (
            <Button
              key={noteName}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addSingleNote(noteName)}
            >
              {noteName}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Chord root</Label>
        <div className="flex flex-wrap gap-2">
          {NOTE_NAMES.map((noteName) => (
            <Button
              key={`root-${noteName}`}
              type="button"
              size="sm"
              variant={chordRoot === noteName ? 'default' : 'outline'}
              onClick={() => setChordRoot(noteName)}
            >
              {noteName}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Chords</Label>
        <div className="flex flex-wrap gap-2">
          {CHORD_PRESETS.map((preset) => (
            <Button
              key={preset.type}
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => addChord(preset.type)}
            >
              {getChordLabel(chordRoot, preset.type)}
            </Button>
          ))}
        </div>
      </div>

      <NoteSequenceList notes={notes} onChange={setNotes} />

      <div className="space-y-2">
        <Label htmlFor="sequence-label">Label (optional)</Label>
        <Input
          id="sequence-label"
          placeholder="Main riff, verse pattern..."
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={notes.length === 0}
          onClick={() => void handlePlay()}
        >
          {isPlaying ? 'Stop' : 'Play Sequence'}
        </Button>
        {!draft ? (
          <Button
            type="button"
            disabled={notes.length === 0 || isSaving}
            onClick={() => void handleSave()}
          >
            {isSaving ? 'Saving...' : 'Save Sequence'}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          disabled={notes.length === 0 || isSaving}
          onClick={() => setNotes([])}
        >
          Clear
        </Button>
      </div>
    </div>
  )
}
