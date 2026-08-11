import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'

import { db } from '@/lib/db'

export type IdeaMediaFlags = {
  hasAudio: boolean
  hasMidi: boolean
  hasImage: boolean
}

export function useIdeaMediaFlagsMap() {
  return useLiveQuery(async () => {
    const media = await db.ideaMedia.toArray()
    const map = new Map<string, IdeaMediaFlags>()

    for (const item of media) {
      const current = map.get(item.ideaId) ?? {
        hasAudio: false,
        hasMidi: false,
        hasImage: false,
      }

      if (item.type === 'audio') current.hasAudio = true
      if (item.type === 'midi') current.hasMidi = true
      if (item.type === 'image') current.hasImage = true

      map.set(item.ideaId, current)
    }

    return map
  }, [])
}

export function useSongTitleMap() {
  return useLiveQuery(async () => {
    const songs = await db.songs.toArray()
    return new Map(songs.map((song) => [song.id, song.title]))
  }, [])
}

export function emptyMediaFlags(): IdeaMediaFlags {
  return { hasAudio: false, hasMidi: false, hasImage: false }
}

export function mediaFlagsFor(
  map: Map<string, IdeaMediaFlags> | undefined,
  ideaId: string,
): IdeaMediaFlags {
  return map?.get(ideaId) ?? emptyMediaFlags()
}

export function useUniqueInstrumentNames(ideas: { instrumentName: string | null }[] | undefined) {
  return useMemo(() => {
    if (!ideas) {
      return []
    }

    const names = new Set<string>()
    for (const idea of ideas) {
      if (idea.instrumentName?.trim()) {
        names.add(idea.instrumentName.trim())
      }
    }

    return Array.from(names).sort((a, b) => a.localeCompare(b))
  }, [ideas])
}
