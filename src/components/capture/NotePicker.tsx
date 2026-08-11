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
import { addMidiFromSequenceNotes } from '@/hooks/useMedia'
import { useSynth } from '@/hooks/useSynth'
import {
  buildChordName,
  CHORD_PRESETS,
  getChordIntervals,
  getChordLabel,
  type ChordType,
} from '@/lib/chords'
import { getNoteNames, noteNameToMidi } from '@/lib/notes'
import { sequenceNotesToNoteEvents } from '@/lib/sequence-playback'
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

    void synth.playNote(pitch, 100, 0.25)

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
    const pitches = getChordIntervals(type)
      .map((interval) => rootPitch + interval)
      .filter((pitch) => pitch >= 0 && pitch <= 127)

    void synth.playChord(pitches, 100, 0.35)

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

    setIsPlaying(true)
    void synth.playNoteSequence(events).finally(() => {
      setIsPlaying(false)
    })
  }

  async function handleSave() {
    if (notes.length === 0 || !ideaId) {
      return
    }

    setIsSaving(true)
    try {
      await addMidiFromSequenceNotes({
        ideaId,
        notes,
        label: label.trim() || null,
      })
      setNotes([])
      setLabel('')
      onSaved?.()
    } catch {
      // addMidiFromSequenceNotes already logs the error
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

      <div className="grid gap-4 sm:grid-cols-2">
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
