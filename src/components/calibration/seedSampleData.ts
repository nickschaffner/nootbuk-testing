import { db } from '@/lib/db'
import type { IdeaRole } from '@/types/idea'

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

  const bassFields = {
    name: 'Fender Jazz Bass',
    type: 'bass' as const,
    defaultPatch: 'Bass',
    createdAt: now,
    updatedAt: now,
  }
  const bass = { ...bassFields, id: await db.instruments.add(bassFields) }

  const keysFields = {
    name: 'Rhodes Mark I',
    type: 'keys' as const,
    defaultPatch: 'E. Piano',
    createdAt: now,
    updatedAt: now,
  }
  const keys = { ...keysFields, id: await db.instruments.add(keysFields) }

  const synthFields = {
    name: 'Serum Pad Rack',
    type: 'synth-vst' as const,
    defaultPatch: 'Synth Pad',
    createdAt: now,
    updatedAt: now,
  }
  const synth = { ...synthFields, id: await db.instruments.add(synthFields) }

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

  await db.ideas.bulkAdd(
    poolRoles.map((role, index) => {
      const created = daysAgo(index + 1)
      const withWords = index % 2 === 0
      return {
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
    }),
  )

  const song1Fields = {
    title: 'Midnight Signal',
    key: 'Am',
    tempo: 118,
    timeSignature: '4/4',
    status: 'writing' as const,
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
  const song1 = { ...song1Fields, id: await db.songs.add(song1Fields) }

  const song2Fields = {
    title: 'Glass Highway',
    key: 'D',
    tempo: 96,
    timeSignature: '4/4',
    status: 'arranging' as const,
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
  const song2 = { ...song2Fields, id: await db.songs.add(song2Fields) }

  const song1Intro = {
    songId: song1.id,
    name: 'Intro',
    sortOrder: 0,
    createdAt: now,
  }
  const song1Verse = {
    songId: song1.id,
    name: 'Verse',
    sortOrder: 1,
    createdAt: now,
  }
  const song1Chorus = {
    songId: song1.id,
    name: 'Chorus',
    sortOrder: 2,
    createdAt: now,
  }
  const song1IntroId = await db.songSections.add(song1Intro)
  const song1VerseId = await db.songSections.add(song1Verse)
  const song1ChorusId = await db.songSections.add(song1Chorus)

  const song2Verse = {
    songId: song2.id,
    name: 'Verse',
    sortOrder: 0,
    createdAt: now,
  }
  const song2Bridge = {
    songId: song2.id,
    name: 'Bridge',
    sortOrder: 1,
    createdAt: now,
  }
  const song2Outro = {
    songId: song2.id,
    name: 'Outro',
    sortOrder: 2,
    createdAt: now,
  }
  const song2VerseId = await db.songSections.add(song2Verse)
  const song2BridgeId = await db.songSections.add(song2Bridge)
  await db.songSections.add(song2Outro)

  await db.ideas.bulkAdd([
    {
      songId: song1.id,
      sectionId: song1IntroId,
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
      songId: song1.id,
      sectionId: song1VerseId,
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
      songId: song1.id,
      sectionId: song1ChorusId,
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
      songId: song2.id,
      sectionId: song2VerseId,
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
      songId: song2.id,
      sectionId: song2BridgeId,
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
  ])

  await db.songJournalEntries.bulkAdd([
    {
      songId: song1.id,
      topic: 'Arrangement',
      content: 'Keep intro sparse; drop drums until chorus.',
      sortOrder: 0,
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4),
    },
    {
      songId: song1.id,
      topic: 'Mix Notes',
      content: 'Bass needs more mid presence around 800Hz.',
      sortOrder: 1,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
    {
      songId: song2.id,
      topic: 'Production',
      content: 'Try sidechain pad to kick in the bridge.',
      sortOrder: 0,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
  ])

  await db.songTodos.bulkAdd([
    {
      songId: song1.id,
      text: 'Record final vocal pass',
      timestamp: null,
      completed: false,
      sortOrder: 0,
      createdAt: daysAgo(3),
    },
    {
      songId: song1.id,
      text: 'Lock chorus melody',
      timestamp: 45,
      completed: true,
      sortOrder: 1,
      createdAt: daysAgo(5),
    },
    {
      songId: song2.id,
      text: 'Write bridge lyrics',
      timestamp: null,
      completed: false,
      sortOrder: 0,
      createdAt: daysAgo(2),
    },
  ])

  const albumFields = {
    title: 'Night Circuits EP',
    status: 'in-progress' as const,
    format: 'ep' as const,
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
  const albumId = await db.albums.add(albumFields)

  await db.albumSongs.bulkAdd([
    {
      albumId,
      songId: song1.id,
      trackNumber: 0,
    },
    {
      albumId,
      songId: song2.id,
      trackNumber: 1,
    },
  ])
}
