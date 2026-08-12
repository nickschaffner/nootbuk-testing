import { db } from '@/lib/db'

/** Clear every Dexie table — full clean slate. */
export async function wipeAllData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()))
  })
}

/** Delete pool ideas only (songId === null) and their media. */
export async function wipePoolIdeas(): Promise<void> {
  await db.transaction('rw', db.ideas, db.ideaMedia, async () => {
    const poolIdeas = await db.ideas
      .filter((idea) => idea.songId === null)
      .toArray()
    const ideaIds = poolIdeas.map((idea) => idea.id)
    if (ideaIds.length === 0) {
      return
    }
    await db.ideaMedia.where('ideaId').anyOf(ideaIds).delete()
    await db.ideas.bulkDelete(ideaIds)
  })
}

/** Delete every song, song-scoped data, and ideas that belong to songs. */
export async function wipeAllSongs(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.songs,
      db.songSections,
      db.songJournalEntries,
      db.songReferences,
      db.songAssets,
      db.songTodos,
      db.songVersions,
      db.albumSongs,
      db.ideas,
      db.ideaMedia,
    ],
    async () => {
      const songIdeas = await db.ideas
        .filter((idea) => idea.songId !== null)
        .toArray()
      const ideaIds = songIdeas.map((idea) => idea.id)
      if (ideaIds.length > 0) {
        await db.ideaMedia.where('ideaId').anyOf(ideaIds).delete()
        await db.ideas.bulkDelete(ideaIds)
      }

      await db.songSections.clear()
      await db.songJournalEntries.clear()
      await db.songReferences.clear()
      await db.songAssets.clear()
      await db.songTodos.clear()
      await db.songVersions.clear()
      await db.albumSongs.clear()
      await db.songs.clear()
    },
  )
}

/** Delete every album and album-linked rows (tracks + references). */
export async function wipeAllAlbums(): Promise<void> {
  await db.transaction(
    'rw',
    [db.albums, db.albumSongs, db.albumReferences],
    async () => {
      await db.albumReferences.clear()
      await db.albumSongs.clear()
      await db.albums.clear()
    },
  )
}

/** Delete every instrument. */
export async function wipeAllInstruments(): Promise<void> {
  await db.instruments.clear()
}
