import { Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'

import { MidiPlayer } from '@/components/player/MidiPlayer'
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
import { useMidi } from '@/hooks/useMidi'
import { useSynth } from '@/hooks/useSynth'
import { addMediaToIdea } from '@/hooks/useMedia'
import { getMidiDuration, noteEventsToMidiBlob } from '@/lib/midi'
import { cn } from '@/lib/utils'
import type { NoteEvent } from '@/types/idea'

interface MidiRecorderProps {
  ideaId?: string
  draft?: boolean
  onDraftChange?: (data: { noteEvents: NoteEvent[]; bpm: number } | null) => void
  onSaved?: () => void
  embedded?: boolean
  className?: string
}

export function MidiRecorder({
  ideaId,
  draft = false,
  onDraftChange,
  onSaved,
  embedded = false,
  className,
}: MidiRecorderProps) {
  const synth = useSynth()
  const midi = useMidi({
    onNoteOn: (pitch, velocity) => {
      void synth.playNote(pitch, velocity)
    },
    onNoteOff: (pitch) => {
      void synth.stopNote(pitch)
    },
  })

  const [metronomeEnabled, setMetronomeEnabled] = useState(false)
  const [bpm, setBpm] = useState('120')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const clickSynthRef = useRef<Tone.MembraneSynth | null>(null)
  const metronomeIdRef = useRef<number | null>(null)
  const onDraftChangeRef = useRef(onDraftChange)

  useEffect(() => {
    onDraftChangeRef.current = onDraftChange
  }, [onDraftChange])

  useEffect(() => {
    if (!draft) {
      return
    }

    if (midi.noteEvents.length === 0) {
      onDraftChangeRef.current?.(null)
      return
    }

    const parsedBpm = Number.parseInt(bpm, 10)
    onDraftChangeRef.current?.({
      noteEvents: midi.noteEvents,
      bpm: Number.isFinite(parsedBpm) ? parsedBpm : 120,
    })
  }, [bpm, draft, midi.noteEvents])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      if (!metronomeEnabled) {
        if (metronomeIdRef.current !== null) {
          Tone.Transport.clear(metronomeIdRef.current)
          metronomeIdRef.current = null
        }
        Tone.Transport.stop()
        return
      }

      await synth.ensureStarted()

      if (cancelled) {
        return
      }

      if (!clickSynthRef.current) {
        clickSynthRef.current = new Tone.MembraneSynth({
          pitchDecay: 0.008,
          octaves: 2,
          envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
        }).toDestination()
      }

      const parsedBpm = Number.parseInt(bpm, 10)
      Tone.Transport.bpm.value = Number.isFinite(parsedBpm) ? parsedBpm : 120

      if (metronomeIdRef.current !== null) {
        Tone.Transport.clear(metronomeIdRef.current)
      }

      metronomeIdRef.current = Tone.Transport.scheduleRepeat((time) => {
        clickSynthRef.current?.triggerAttackRelease('C5', '32n', time, 0.9)
      }, '4n')

      Tone.Transport.start()
    })()

    return () => {
      cancelled = true
    }
  }, [bpm, metronomeEnabled, synth.ensureStarted])

  useEffect(() => {
    return () => {
      if (metronomeIdRef.current !== null) {
        Tone.Transport.clear(metronomeIdRef.current)
      }
      Tone.Transport.stop()
      clickSynthRef.current?.dispose()
      clickSynthRef.current = null
      void synth.stopAll()
    }
  }, [synth.stopAll])

  async function handleStartRecording() {
    await synth.ensureStarted()
    await synth.setPatch(
      synth.isMuted ? 'muted' : synth.currentPatch,
    )
    midi.startRecording()
  }

  async function handleSave() {
    if (midi.noteEvents.length === 0 || !ideaId) {
      return
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      const blob = noteEventsToMidiBlob(midi.noteEvents, Number.parseInt(bpm, 10) || 120)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

      await addMediaToIdea({
        ideaId,
        type: 'midi',
        filename: `recording-${timestamp}.mid`,
        mimeType: 'audio/midi',
        blob,
        duration: getMidiDuration(midi.noteEvents),
        noteData: midi.noteEvents,
      })

      midi.resetRecording()
      onSaved?.()
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Failed to save MIDI recording.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const combinedError = midi.error ?? midi.deviceWarning ?? synth.error

  return (
    <div
      className={cn(
        embedded ? 'space-y-4' : 'space-y-4 rounded-lg border p-4',
        className,
      )}
    >
      {!embedded ? (
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Record MIDI</h3>
          {combinedError || saveError ? (
            <p className="text-xs text-destructive">{combinedError ?? saveError}</p>
          ) : null}
        </div>
      ) : combinedError || saveError ? (
        <p className="text-xs text-destructive">{combinedError ?? saveError}</p>
      ) : null}

      {!midi.isSupported ? (
        <p className="text-sm text-muted-foreground">
          MIDI is not supported in this browser. Try Chrome or Edge on desktop.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            <Label>MIDI device</Label>
            {midi.midiDevices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No MIDI device detected.
              </p>
            ) : (
              <Select
                value={midi.selectedDeviceId ?? undefined}
                onValueChange={midi.setSelectedDeviceId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  {midi.midiDevices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={metronomeEnabled}
                onChange={(event) => setMetronomeEnabled(event.target.checked)}
              />
              Metronome
            </label>
            <div className="w-24 space-y-1">
              <Label htmlFor="midi-bpm">BPM</Label>
              <Input
                id="midi-bpm"
                type="number"
                min={40}
                max={240}
                value={bpm}
                onChange={(event) => setBpm(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!midi.isRecording && midi.noteEvents.length === 0 ? (
              <Button
                type="button"
                size="lg"
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={midi.midiDevices.length === 0}
                onClick={() => void handleStartRecording()}
              >
                Record
              </Button>
            ) : null}

            {midi.isRecording ? (
              <Button
                type="button"
                size="lg"
                variant="destructive"
                onClick={midi.stopRecording}
              >
                <Square className="size-4 fill-current" />
                Stop
              </Button>
            ) : null}

            {midi.noteEvents.length > 0 && !midi.isRecording && !draft ? (
              <>
                <Button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save MIDI'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={midi.resetRecording}
                  disabled={isSaving}
                >
                  Discard
                </Button>
              </>
            ) : null}
          </div>

          {midi.noteEvents.length > 0 ? (
            <MidiPlayer notes={midi.noteEvents} patchId={synth.currentPatch} />
          ) : null}
        </>
      )}
    </div>
  )
}
