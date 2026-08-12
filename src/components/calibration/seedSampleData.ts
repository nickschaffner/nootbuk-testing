import { db } from '@/lib/db'
import type { Album } from '@/types/album'
import type { Idea, IdeaRole } from '@/types/idea'
import type { Instrument } from '@/types/instrument'
import type {
  Song,
  SongJournalEntry,
  SongSection,
  SongTodo,
} from '@/types/song'

function nowIso(): string {
  return new Date().toISOString()
}

function daysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

/** Generate sample metadata so the UI has something to display. No audio/MIDI blobs. */
export async function seedSampleData(): Promise<void> {
  const now = nowIso()

  const bass: Instrument = {
    id: crypto.randomUUID(),
    name: 'Fender Jazz Bass',
    type: 'bass',
    defaultPatch: 'Bass',
    createdAt: now,
    updatedAt: now,
  }
  const keys: Instrument = {
    id: crypto.randomUUID(),
    name: 'Rhodes Mark I',
    type: 'keys',
    defaultPatch: 'E. Piano',
    createdAt: now,
    updatedAt: now,
  }
  const synth: Instrument = {
    id: crypto.randomUUID(),
    name: 'Serum Pad Rack',
    type: 'synth-vst',
    defaultPatch: 'Synth Pad',
    createdAt: now,
    updatedAt: now,
  }

  await db.instruments.bulkAdd([bass, keys, synth])

  const poolRoles: IdeaRole[] = [
    'melody',
    'bassline',
    'chords',
    'drums',
    'riff',
    'synth',
    'vocal',
    'texture',
  ]

  const poolIdeas: Idea[] = poolRoles.map((role, index) => {
    const created = daysAgo(index + 1)
    const withWords = index % 2 === 0
    return {
      id: crypto.randomUUID(),
      songId: null,
      sectionId: null,
      sortOrder: index,
      role,
      sectionIntent: index % 3 === 0 ? 'chorus' : index % 3 === 1 ? 'verse' : null,
      key: index % 2 === 0 ? 'Am' : 'C',
      tempo: 90 + index * 5,
      timeSignature: '4/4',
      instrumentId:
        role === 'bassline'
          ? bass.id
          : role === 'chords' || role === 'melody'
            ? keys.id
            : role === 'synth' || role === 'texture'
              ? synth.id
              : null,
      instrumentName:
        role === 'bassline'
          ? bass.name
          : role === 'chords' || role === 'melody'
            ? keys.name
            : role === 'synth' || role === 'texture'
              ? synth.name
              : null,
      patchName:
        role === 'bassline'
          ? bass.defaultPatch
          : role === 'chords' || role === 'melody'
            ? keys.defaultPatch
            : role === 'synth' || role === 'texture'
              ? synth.defaultPatch
              : null,
      patchSettings: null,
      lyrics: withWords
        ? `Sample lyrics for ${role} idea ${index + 1}`
        : null,
      notes: withWords
        ? `Production note: try this ${role} idea mid-tempo.`
        : null,
      status: index < 2 ? 'developed' : 'raw',
      createdAt: created,
      updatedAt: created,
    }
  })

  await db.ideas.bulkAdd(poolIdeas)

  const song1: Song = {
    id: crypto.randomUUID(),
    title: 'Midnight Signal',
    key: 'Am',
    tempo: 118,
    timeSignature: '4/4',
    status: 'writing',
    genre: 'Indie',
    lyrics: 'Walking through the static night\nLooking for a signal light',
    songwriter: null,
    publisher: null,
    ipiNumber: null,
    masterEngineer: null,
    copyright: null,
    sampleCredits: null,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(1),
  }

  const song2: Song = {
    id: crypto.randomUUID(),
    title: 'Glass Highway',
    key: 'D',
    tempo: 96,
    timeSignature: '4/4',
    status: 'arranging',
    genre: 'Electronic',
    lyrics: 'Glass highway under violet sky',
    songwriter: null,
    publisher: null,
    ipiNumber: null,
    masterEngineer: null,
    copyright: null,
    sampleCredits: null,
    createdAt: daysAgo(8),
    updatedAt: daysAgo(2),
  }

  await db.songs.bulkAdd([song1, song2])

  const song1Sections: SongSection[] = [
    {
      id: crypto.randomUUID(),
      songId: song1.id,
      name: 'Intro',
      sortOrder: 0,
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      songId: song1.id,
      name: 'Verse',
      sortOrder: 1,
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      songId: song1.id,
      name: 'Chorus',
      sortOrder: 2,
      createdAt: now,
    },
  ]

  const song2Sections: SongSection[] = [
    {
      id: crypto.randomUUID(),
      songId: song2.id,
      name: 'Verse',
      sortOrder: 0,
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      songId: song2.id,
      name: 'Bridge',
      sortOrder: 1,
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      songId: song2.id,
      name: 'Outro',
      sortOrder: 2,
      createdAt: now,
    },
  ]

  await db.songSections.bulkAdd([...song1Sections, ...song2Sections])

  const songIdeas: Idea[] = [
    {
      id: crypto.randomUUID(),
      songId: song1.id,
      sectionId: song1Sections[0].id,
      sortOrder: 0,
      role: 'texture',
      sectionIntent: 'intro',
      key: 'Am',
      tempo: 118,
      timeSignature: '4/4',
      instrumentId: synth.id,
      instrumentName: synth.name,
      patchName: synth.defaultPatch,
      patchSettings: null,
      lyrics: null,
      notes: 'Pad swell into verse',
      status: 'used',
      createdAt: daysAgo(9),
      updatedAt: daysAgo(3),
    },
    {
      id: crypto.randomUUID(),
      songId: song1.id,
      sectionId: song1Sections[1].id,
      sortOrder: 0,
      role: 'bassline',
      sectionIntent: 'verse',
      key: 'Am',
      tempo: 118,
      timeSignature: '4/4',
      instrumentId: bass.id,
      instrumentName: bass.name,
      patchName: bass.defaultPatch,
      patchSettings: null,
      lyrics: null,
      notes: 'Walking eighths',
      status: 'used',
      createdAt: daysAgo(9),
      updatedAt: daysAgo(3),
    },
    {
      id: crypto.randomUUID(),
      songId: song1.id,
      sectionId: song1Sections[2].id,
      sortOrder: 0,
      role: 'melody',
      sectionIntent: 'chorus',
      key: 'Am',
      tempo: 118,
      timeSignature: '4/4',
      instrumentId: keys.id,
      instrumentName: keys.name,
      patchName: keys.defaultPatch,
      patchSettings: null,
      lyrics: 'Looking for a signal light',
      notes: null,
      status: 'developed',
      createdAt: daysAgo(7),
      updatedAt: daysAgo(2),
    },
    {
      id: crypto.randomUUID(),
      songId: song2.id,
      sectionId: song2Sections[0].id,
      sortOrder: 0,
      role: 'chords',
      sectionIntent: 'verse',
      key: 'D',
      tempo: 96,
      timeSignature: '4/4',
      instrumentId: keys.id,
      instrumentName: keys.name,
      patchName: keys.defaultPatch,
      patchSettings: null,
      lyrics: null,
      notes: 'D – Bm – G – A',
      status: 'used',
      createdAt: daysAgo(6),
      updatedAt: daysAgo(2),
    },
    {
      id: crypto.randomUUID(),
      songId: song2.id,
      sectionId: song2Sections[1].id,
      sortOrder: 0,
      role: 'synth',
      sectionIntent: 'bridge',
      key: 'D',
      tempo: 96,
      timeSignature: '4/4',
      instrumentId: synth.id,
      instrumentName: synth.name,
      patchName: synth.defaultPatch,
      patchSettings: null,
      lyrics: null,
      notes: 'Arp enters half-time',
      status: 'raw',
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1),
    },
  ]

  await db.ideas.bulkAdd(songIdeas)

  const journals: SongJournalEntry[] = [
    {
      id: crypto.randomUUID(),
      songId: song1.id,
      topic: 'Arrangement',
      content: 'Keep intro sparse; drop drums until chorus.',
      sortOrder: 0,
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4),
    },
    {
      id: crypto.randomUUID(),
      songId: song1.id,
      topic: 'Mix Notes',
      content: 'Bass needs more mid presence around 800Hz.',
      sortOrder: 1,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
    {
      id: crypto.randomUUID(),
      songId: song2.id,
      topic: 'Production',
      content: 'Try sidechain pad to kick in the bridge.',
      sortOrder: 0,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
  ]

  await db.songJournalEntries.bulkAdd(journals)

  const todos: SongTodo[] = [
    {
      id: crypto.randomUUID(),
      songId: song1.id,
      text: 'Record final vocal pass',
      timestamp: null,
      completed: false,
      sortOrder: 0,
      createdAt: daysAgo(3),
    },
    {
      id: crypto.randomUUID(),
      songId: song1.id,
      text: 'Lock chorus melody',
      timestamp: 45,
      completed: true,
      sortOrder: 1,
      createdAt: daysAgo(5),
    },
    {
      id: crypto.randomUUID(),
      songId: song2.id,
      text: 'Write bridge lyrics',
      timestamp: null,
      completed: false,
      sortOrder: 0,
      createdAt: daysAgo(2),
    },
  ]

  await db.songTodos.bulkAdd(todos)

  const album: Album = {
    id: crypto.randomUUID(),
    title: 'Night Circuits EP',
    status: 'in-progress',
    format: 'ep',
    artworkBlob: null,
    releaseDate: '2026-11-01',
    credits: 'Seeded sample album for calibration',
    label: null,
    globalNotes: 'Demo album holding both seed songs.',
    referenceMaterial: null,
    notes: null,
    createdAt: daysAgo(12),
    updatedAt: daysAgo(1),
  }

  await db.albums.add(album)
  await db.albumSongs.bulkAdd([
    {
      id: crypto.randomUUID(),
      albumId: album.id,
      songId: song1.id,
      trackNumber: 0,
    },
    {
      id: crypto.randomUUID(),
      albumId: album.id,
      songId: song2.id,
      trackNumber: 1,
    },
  ])
}
