import { Midi } from '@tonejs/midi'

import type { NoteEvent } from '@/types/idea'

export function noteEventsToMidiBlob(
  notes: NoteEvent[],
  tempo = 120,
): Blob {
  const midi = new Midi()
  midi.header.setTempo(tempo)
  const track = midi.addTrack()
  track.name = 'Nootbuk Recording'

  for (const note of notes) {
    track.addNote({
      midi: note.pitch,
      time: note.startTime,
      duration: Math.max(note.duration, 0.01),
      velocity: note.velocity / 127,
    })
  }

  const bytes = midi.toArray()
  return new Blob([Uint8Array.from(bytes)], { type: 'audio/midi' })
}

export async function midiBlobToNoteEvents(blob: Blob): Promise<NoteEvent[]> {
  const midi = new Midi(await blob.arrayBuffer())
  const events: NoteEvent[] = []

  for (const track of midi.tracks) {
    for (const note of track.notes) {
      events.push({
        pitch: note.midi,
        startTime: note.time,
        duration: Math.max(note.duration, 0.01),
        velocity: Math.max(1, Math.round(note.velocity * 127)),
      })
    }
  }

  return events.sort((a, b) => a.startTime - b.startTime)
}

export function getMidiDuration(notes: NoteEvent[]): number {
  if (notes.length === 0) {
    return 0
  }

  return Math.max(...notes.map((note) => note.startTime + note.duration))
}

export function isMidiFile(file: File): boolean {
  return getFileExtension(file.name) === '.mid'
}

function getFileExtension(filename: string): string {
  const index = filename.lastIndexOf('.')
  if (index === -1) {
    return ''
  }

  return filename.slice(index).toLowerCase()
}
