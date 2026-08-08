import Dexie, { type EntityTable } from 'dexie'

import type { Album } from '@/types/album'
import type { Idea, IdeaMedia, IdeaNoteSequence } from '@/types/idea'
import type {
  Song,
  SongAsset,
  SongJournalEntry,
  SongReference,
  SongSection,
} from '@/types/song'

export class NootbukDatabase extends Dexie {
  ideas!: EntityTable<Idea, 'id'>
  ideaMedia!: EntityTable<IdeaMedia, 'id'>
  ideaNoteSequences!: EntityTable<IdeaNoteSequence, 'id'>
  songs!: EntityTable<Song, 'id'>
  songSections!: EntityTable<SongSection, 'id'>
  songJournalEntries!: EntityTable<SongJournalEntry, 'id'>
  songReferences!: EntityTable<SongReference, 'id'>
  songAssets!: EntityTable<SongAsset, 'id'>
  albums!: EntityTable<Album, 'id'>

  constructor() {
    super('NootbukDB')

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
  }
}

export const db = new NootbukDatabase()
