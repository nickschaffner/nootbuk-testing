import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/lib/db'
import {
  defaultSynthPatchForType,
  parsePlaybackPatch,
  type PlaybackPatchId,
} from '@/lib/instrument-utils'
import type { Idea } from '@/types/idea'

export function useIdeaPlaybackPatch(
  idea: Pick<Idea, 'instrumentId' | 'patchName'> | null | undefined,
): PlaybackPatchId {
  const fromIdea = parsePlaybackPatch(idea?.patchName)
  const patch = useLiveQuery(
    async () => {
      if (fromIdea) {
        return fromIdea
      }
      if (!idea?.instrumentId) {
        return 'piano' as PlaybackPatchId
      }
      const instrument = await db.instruments.get(idea.instrumentId)
      if (!instrument) {
        return 'piano' as PlaybackPatchId
      }
      return defaultSynthPatchForType(instrument.type)
    },
    [idea?.instrumentId, fromIdea],
  )

  return fromIdea ?? patch ?? 'piano'
}

export async function getIdeaPlaybackPatch(
  idea: Pick<Idea, 'instrumentId' | 'patchName'>,
): Promise<PlaybackPatchId> {
  const fromIdea = parsePlaybackPatch(idea.patchName)
  if (fromIdea) {
    return fromIdea
  }
  if (!idea.instrumentId) {
    return 'piano'
  }
  const instrument = await db.instruments.get(idea.instrumentId)
  if (!instrument) {
    return 'piano'
  }
  return defaultSynthPatchForType(instrument.type)
}
