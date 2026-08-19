import Dexie, { type EntityTable } from 'dexie'
import dexieCloud from 'dexie-cloud-addon'

import { getMidiDuration, noteEventsToMidiBlob } from '@/lib/midi'
import { inferIdeaMediaSource } from '@/lib/idea-media-source'
import { sequenceNotesToNoteEvents } from '@/lib/sequence-playback'
import type { Album, AlbumReference, AlbumSong } from '@/types/album'
import type { Idea, IdeaMedia, SequenceNote } from '@/types/idea'
import type { Instrument } from '@/types/instrument'
import type {
  Song,
  SongAsset,
  SongJournalEntry,
  SongReference,
  SongSection,
  SongTodo,
  SongVersion,
} from '@/types/song'

export class NootbukDatabase extends Dexie {
  ideas!: EntityTable<Idea, 'id'>
  ideaMedia!: EntityTable<IdeaMedia, 'id'>
  songs!: EntityTable<Song, 'id'>
  songSections!: EntityTable<SongSection, 'id'>
  songJournalEntries!: EntityTable<SongJournalEntry, 'id'>
  songReferences!: EntityTable<SongReference, 'id'>
  songAssets!: EntityTable<SongAsset, 'id'>
  songTodos!: EntityTable<SongTodo, 'id'>
  songVersions!: EntityTable<SongVersion, 'id'>
  albums!: EntityTable<Album, 'id'>
  albumSongs!: EntityTable<AlbumSong, 'id'>
  albumReferences!: EntityTable<AlbumReference, 'id'>
  instruments!: EntityTable<Instrument, 'id'>

  constructor() {
    super('NootbukDB', { addons: [dexieCloud] })

    this.version(1).stores({
      ideas: 'id, songId, sectionId, role, sectionIntent, status, createdAt',
      ideaMedia: 'id, ideaId, type',
      ideaNoteSequences: 'id, ideaId',
      songs: 'id, albumId, status, createdAt, updatedAt',
      songSections: 'id, songId, sortOrder',
      songJournalEntries: 'id, songId, topic',
      songReferences: 'id, songId',
      songAssets: 'id, songId',
      albums: 'id, createdAt, updatedAt',
    })

    this.version(2).stores({
      ideas: 'id, songId, sectionId, role, sectionIntent, status, createdAt',
      ideaMedia: 'id, ideaId, type',
      ideaNoteSequences: 'id, ideaId',
      songs: 'id, albumId, status, createdAt, updatedAt',
      songSections: 'id, songId, sortOrder',
      songJournalEntries: 'id, songId, topic',
      songReferences: 'id, songId',
      songAssets: 'id, songId',
      albums: 'id, createdAt, updatedAt',
      albumReferenceFiles: 'id, albumId',
    })

    this.version(3)
      .stores({
        ideas: 'id, songId, sectionId, role, sectionIntent, status, instrumentId, createdAt',
        ideaMedia: 'id, ideaId, type',
        ideaNoteSequences: 'id, ideaId',
        songs: 'id, status, createdAt, updatedAt',
        songSections: 'id, songId, sortOrder',
        songJournalEntries: 'id, songId, topic',
        songReferences: 'id, songId',
        songAssets: 'id, songId',
        songTodos: 'id, songId, completed',
        songVersions: 'id, songId, isMain',
        albums: 'id, createdAt, updatedAt',
        albumSongs: 'id, albumId, songId',
        albumReferenceFiles: 'id, albumId',
        instruments: 'id, type, createdAt',
        instrumentPatches: 'id, instrumentId',
      })
      .upgrade(async (tx) => {
        await tx.table('ideas').toCollection().modify((idea) => {
          if (idea.instrumentId === undefined) {
            idea.instrumentId = null
          }
        })

        await tx.table('songReferences').toCollection().modify((ref) => {
          if (ref.text === undefined) {
            const oldType = ref.type as string | undefined
            const oldContent = ref.content as string | undefined

            if (oldType === 'text') {
              ref.text = oldContent ?? null
              ref.url = null
            } else if (oldType === 'link') {
              ref.text = null
              ref.url = oldContent ?? null
            } else if (oldType === 'audio') {
              ref.text = oldContent ?? null
              ref.url = null
            } else {
              ref.text = oldContent ?? null
              ref.url = null
            }

            ref.attachmentBlob = null
            ref.attachmentFilename = null
            ref.attachmentMimeType = null

            delete ref.type
            delete ref.content
          }
        })

        await tx.table('albums').toCollection().modify((album) => {
          if (album.notes === undefined) {
            album.notes = null
          }
        })

        const songs = await tx.table('songs').toArray()
        const albumSongsTable = tx.table('albumSongs')
        for (const song of songs) {
          const albumId = song.albumId as string | null | undefined
          if (albumId) {
            await albumSongsTable.add({
              id: crypto.randomUUID(),
              albumId,
              songId: song.id as string,
              trackNumber: (song.sortOrder as number) ?? 0,
            })
          }
        }
      })

    // Drop InstrumentPatch — preset names are freeform idea.patchName
    this.version(4).stores({
      ideas: 'id, songId, sectionId, role, sectionIntent, status, instrumentId, createdAt',
      ideaMedia: 'id, ideaId, type',
      ideaNoteSequences: 'id, ideaId',
      songs: 'id, status, createdAt, updatedAt',
      songSections: 'id, songId, sortOrder',
      songJournalEntries: 'id, songId, topic',
      songReferences: 'id, songId',
      songAssets: 'id, songId',
      songTodos: 'id, songId, completed',
      songVersions: 'id, songId, isMain',
      albums: 'id, createdAt, updatedAt',
      albumSongs: 'id, albumId, songId',
      albumReferenceFiles: 'id, albumId',
      instruments: 'id, type, createdAt',
      instrumentPatches: null,
    })

    // Merge IdeaNoteSequence into IdeaMedia; enforce one audio + one MIDI per idea
    this.version(5)
      .stores({
        ideas: 'id, songId, sectionId, role, sectionIntent, status, instrumentId, createdAt',
        ideaMedia: 'id, ideaId, type',
        ideaNoteSequences: null,
        songs: 'id, status, createdAt, updatedAt',
        songSections: 'id, songId, sortOrder',
        songJournalEntries: 'id, songId, topic',
        songReferences: 'id, songId',
        songAssets: 'id, songId',
        songTodos: 'id, songId, completed',
        songVersions: 'id, songId, isMain',
        albums: 'id, createdAt, updatedAt',
        albumSongs: 'id, albumId, songId',
        albumReferenceFiles: 'id, albumId',
        instruments: 'id, type, createdAt',
      })
      .upgrade(async (tx) => {
        const mediaTable = tx.table('ideaMedia')
        const sequencesTable = tx.table('ideaNoteSequences')

        type LegacySequence = {
          id: string
          ideaId: string
          notes: SequenceNote[]
          label: string | null
          createdAt: string
        }

        const sequences = (await sequencesTable.toArray()) as LegacySequence[]
        const sequencesByIdea = new Map<string, LegacySequence[]>()
        for (const sequence of sequences) {
          const list = sequencesByIdea.get(sequence.ideaId) ?? []
          list.push(sequence)
          sequencesByIdea.set(sequence.ideaId, list)
        }

        for (const [ideaId, ideaSequences] of sequencesByIdea) {
          const existingMidi = await mediaTable
            .where('ideaId')
            .equals(ideaId)
            .filter((item) => item.type === 'midi')
            .toArray()

          if (existingMidi.length > 0) {
            continue
          }

          const sorted = [...ideaSequences].sort((a, b) =>
            a.createdAt.localeCompare(b.createdAt),
          )
          const source = sorted[0]
          if (!source || source.notes.length === 0) {
            continue
          }

          const noteData = sequenceNotesToNoteEvents(source.notes, 120)
          const blob = noteEventsToMidiBlob(noteData, 120)
          const safeLabel = source.label?.trim().replace(/[^\w\-]+/g, '-')
          const filename = safeLabel
            ? `${safeLabel}.mid`
            : `notes-${source.createdAt.replace(/[:.]/g, '-')}.mid`

          await mediaTable.add({
            id: crypto.randomUUID(),
            ideaId,
            type: 'midi',
            filename,
            mimeType: 'audio/midi',
            blob,
            duration: getMidiDuration(noteData),
            noteData,
            sortOrder: 0,
            createdAt: source.createdAt,
          })
        }

        const allMedia = (await mediaTable.toArray()).sort(
          (a, b) =>
            ((a.sortOrder as number) ?? 0) - ((b.sortOrder as number) ?? 0),
        )
        const deleteIds: string[] = []
        const firstExclusive = new Map<string, string>()

        for (const item of allMedia) {
          if (item.type !== 'audio' && item.type !== 'midi') {
            continue
          }

          const key = `${item.ideaId}:${item.type}`
          if (firstExclusive.has(key)) {
            deleteIds.push(item.id as string)
          } else {
            firstExclusive.set(key, item.id as string)
          }
        }

        if (deleteIds.length > 0) {
          await mediaTable.bulkDelete(deleteIds)
        }
      })

    // Album format + song version duration
    this.version(6)
      .stores({
        ideas: 'id, songId, sectionId, role, sectionIntent, status, instrumentId, createdAt',
        ideaMedia: 'id, ideaId, type',
        songs: 'id, status, createdAt, updatedAt',
        songSections: 'id, songId, sortOrder',
        songJournalEntries: 'id, songId, topic',
        songReferences: 'id, songId',
        songAssets: 'id, songId',
        songTodos: 'id, songId, completed',
        songVersions: 'id, songId, isMain',
        albums: 'id, format, createdAt, updatedAt',
        albumSongs: 'id, albumId, songId',
        albumReferenceFiles: 'id, albumId',
        instruments: 'id, type, createdAt',
      })
      .upgrade(async (tx) => {
        await tx.table('albums').toCollection().modify((album) => {
          if (album.format === undefined) {
            album.format = 'ep'
          }
        })

        await tx.table('songVersions').toCollection().modify((version) => {
          if (version.duration === undefined) {
            version.duration = null
          }
        })
      })

    // Album references: text / link / audio (mirror song references)
    this.version(7)
      .stores({
        ideas: 'id, songId, sectionId, role, sectionIntent, status, instrumentId, createdAt',
        ideaMedia: 'id, ideaId, type',
        songs: 'id, status, createdAt, updatedAt',
        songSections: 'id, songId, sortOrder',
        songJournalEntries: 'id, songId, topic',
        songReferences: 'id, songId',
        songAssets: 'id, songId',
        songTodos: 'id, songId, completed',
        songVersions: 'id, songId, isMain',
        albums: 'id, format, createdAt, updatedAt',
        albumSongs: 'id, albumId, songId',
        albumReferences: 'id, albumId',
        albumReferenceFiles: null,
        instruments: 'id, type, createdAt',
      })
      .upgrade(async (tx) => {
        const albumReferences = tx.table('albumReferences')
        const albums = await tx.table('albums').toArray()
        const legacyFiles = await tx.table('albumReferenceFiles').toArray()

        const filesByAlbum = new Map<
          string,
          Array<{
            id: string
            albumId: string
            filename: string
            mimeType: string
            blob: Blob
            createdAt: string
          }>
        >()

        for (const file of legacyFiles) {
          const albumId = file.albumId as string
          const list = filesByAlbum.get(albumId) ?? []
          list.push(file as {
            id: string
            albumId: string
            filename: string
            mimeType: string
            blob: Blob
            createdAt: string
          })
          filesByAlbum.set(albumId, list)
        }

        function isAudioFile(filename: string, mimeType: string): boolean {
          if (mimeType.startsWith('audio/')) {
            return true
          }
          const lower = filename.toLowerCase()
          return (
            lower.endsWith('.wav') ||
            lower.endsWith('.mp3') ||
            lower.endsWith('.aiff') ||
            lower.endsWith('.aif')
          )
        }

        for (const album of albums) {
          const albumId = album.id as string
          let sortOrder = 0

          const material = album.referenceMaterial as string | null | undefined
          if (material && material.trim()) {
            await albumReferences.add({
              id: crypto.randomUUID(),
              albumId,
              text: material,
              url: null,
              audioBlob: null,
              attachmentBlob: null,
              attachmentFilename: null,
              attachmentMimeType: null,
              sortOrder: sortOrder++,
              createdAt: (album.createdAt as string) ?? new Date().toISOString(),
            })
          }

          const files = (filesByAlbum.get(albumId) ?? []).sort((a, b) =>
            a.createdAt.localeCompare(b.createdAt),
          )

          for (const file of files) {
            if (isAudioFile(file.filename, file.mimeType)) {
              await albumReferences.add({
                id: crypto.randomUUID(),
                albumId,
                text: file.filename,
                url: null,
                audioBlob: file.blob,
                attachmentBlob: null,
                attachmentFilename: null,
                attachmentMimeType: null,
                sortOrder: sortOrder++,
                createdAt: file.createdAt,
              })
            } else {
              await albumReferences.add({
                id: crypto.randomUUID(),
                albumId,
                text: file.filename,
                url: null,
                audioBlob: null,
                attachmentBlob: file.blob,
                attachmentFilename: file.filename,
                attachmentMimeType: file.mimeType,
                sortOrder: sortOrder++,
                createdAt: file.createdAt,
              })
            }
          }
        }
      })

    // IdeaMedia.source for MIDI slots (notepicker | recording | extraction)
    this.version(8)
      .stores({
        ideas: 'id, songId, sectionId, role, sectionIntent, status, instrumentId, createdAt',
        ideaMedia: 'id, ideaId, type, source',
        songs: 'id, status, createdAt, updatedAt',
        songSections: 'id, songId, sortOrder',
        songJournalEntries: 'id, songId, topic',
        songReferences: 'id, songId',
        songAssets: 'id, songId',
        songTodos: 'id, songId, completed',
        songVersions: 'id, songId, isMain',
        albums: 'id, format, createdAt, updatedAt',
        albumSongs: 'id, albumId, songId',
        albumReferences: 'id, albumId',
        instruments: 'id, type, createdAt',
      })
      .upgrade(async (tx) => {
        await tx.table('ideaMedia').toCollection().modify((item) => {
          if (item.type !== 'midi') {
            item.source = null
            return
          }

          if (
            item.source === 'notepicker' ||
            item.source === 'recording' ||
            item.source === 'extraction'
          ) {
            return
          }

          const name = String(item.filename ?? '').toLowerCase()
          if (name.startsWith('recording-') || name.includes('-recording-')) {
            item.source = 'recording'
          } else if (
            name.startsWith('extraction-') ||
            name.includes('-extraction-')
          ) {
            item.source = 'extraction'
          } else {
            item.source = 'notepicker'
          }
        })
      })

    this.version(9).stores({
      ideas: '@id, songId, sectionId, role, sectionIntent, status, instrumentId, createdAt',
      ideaMedia: '@id, ideaId, type, source',
      songs: '@id, status, createdAt, updatedAt',
      songSections: '@id, songId, sortOrder',
      songJournalEntries: '@id, songId, topic',
      songReferences: '@id, songId',
      songAssets: '@id, songId',
      songTodos: '@id, songId, completed',
      songVersions: '@id, songId, isMain',
      albums: '@id, format, createdAt, updatedAt',
      albumSongs: '@id, albumId, songId',
      albumReferences: '@id, albumId',
      instruments: '@id, type, createdAt',
    })

    // Song.artworkBlob (cover art, parallel to Album.artworkBlob)
    this.version(10)
      .stores({
        ideas: '@id, songId, sectionId, role, sectionIntent, status, instrumentId, createdAt',
        ideaMedia: '@id, ideaId, type, source',
        songs: '@id, status, createdAt, updatedAt',
        songSections: '@id, songId, sortOrder',
        songJournalEntries: '@id, songId, topic',
        songReferences: '@id, songId',
        songAssets: '@id, songId',
        songTodos: '@id, songId, completed',
        songVersions: '@id, songId, isMain',
        albums: '@id, format, createdAt, updatedAt',
        albumSongs: '@id, albumId, songId',
        albumReferences: '@id, albumId',
        instruments: '@id, type, createdAt',
      })
      .upgrade(async (tx) => {
        const assets = await tx.table('songAssets').toArray()
        const artworkBySong = new Map<string, { blob: Blob; createdAt: string }>()

        for (const asset of assets) {
          if (asset.type !== 'artwork') {
            continue
          }
          const songId = asset.songId as string
          const createdAt = String(asset.createdAt ?? '')
          const prev = artworkBySong.get(songId)
          if (!prev || createdAt > prev.createdAt) {
            artworkBySong.set(songId, {
              blob: asset.blob as Blob,
              createdAt,
            })
          }
        }

        await tx.table('songs').toCollection().modify((song) => {
          if (song.artworkBlob !== undefined && song.artworkBlob !== null) {
            return
          }
          const fromAsset = artworkBySong.get(song.id as string)
          song.artworkBlob = fromAsset?.blob ?? null
        })
      })

    this.version(11)
      .stores({
        ideas: '@id, songId, sectionId, role, sectionIntent, instrumentId, createdAt',
      })
      .upgrade(async (tx) => {
        await tx.table('ideas').toCollection().modify((idea) => {
          delete idea.status
        })
      })

    this.version(12).upgrade(async (tx) => {
      await tx.table('ideaMedia').toCollection().modify((item) => {
        item.source = inferIdeaMediaSource(item)
      })
    })
  }
}

export const db = new NootbukDatabase()

db.cloud.configure({
  databaseUrl: import.meta.env.VITE_DEXIE_CLOUD_URL,
  requireAuth: true,
  // PWA sw.js is a cache worker, not Dexie Cloud's sync worker. If this is true,
  // Dexie posts sync to that SW and never starts LocalSyncWorker — push/pull hang.
  tryUseServiceWorker: false,
})
