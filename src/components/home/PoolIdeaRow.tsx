import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { IdeaDestinationSheet } from '@/components/pool/IdeaDestinationSheet'
import { IdeaMediaQuickPlay } from '@/components/song/IdeaMediaQuickPlay'
import { IdeaRow } from '@/components/kit'
import {
  copyIdeaIntoNewSong,
  copyIdeaToSong,
  moveIdeaToSection,
  turnIdeaIntoSong,
} from '@/hooks/useIdeas'
import { formatRelativeTime } from '@/lib/format'
import { formatRoleLabel, getIdeaDisplayLabel } from '@/lib/idea-label'
import type { Idea } from '@/types/idea'

interface PoolIdeaRowProps {
  idea: Idea
  onOpen: () => void
}

export function PoolIdeaRow({ idea, onOpen }: PoolIdeaRowProps) {
  const navigate = useNavigate()
  const [destinationMode, setDestinationMode] = useState<'move' | 'copy' | null>(
    null,
  )
  const [isBusy, setIsBusy] = useState(false)

  async function runAction(action: () => Promise<unknown>) {
    setIsBusy(true)
    try {
      await action()
    } catch {
      // hooks log errors
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <>
      <IdeaRow
        role={formatRoleLabel(idea.role)}
        title={getIdeaDisplayLabel(idea)}
        ideaKey={idea.key}
        tempo={idea.tempo}
        lastWorked={formatRelativeTime(idea.updatedAt)}
        plays={<IdeaMediaQuickPlay ideaId={idea.id} idea={idea} />}
        menuItems={[
          {
            label: 'Turn into Song',
            disabled: isBusy,
            onSelect: () =>
              void runAction(async () => {
                const { song } = await turnIdeaIntoSong(idea.id)
                navigate(`/song/${song.id}`)
              }),
          },
          {
            label: 'Move to Song',
            disabled: isBusy,
            onSelect: () => setDestinationMode('move'),
          },
          {
            label: 'Copy to Song',
            disabled: isBusy,
            onSelect: () => setDestinationMode('copy'),
          },
          {
            label: 'Copy into New Song',
            disabled: isBusy,
            onSelect: () => void runAction(() => copyIdeaIntoNewSong(idea.id)),
          },
        ]}
        onOpen={onOpen}
      />
      <IdeaDestinationSheet
        open={destinationMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDestinationMode(null)
          }
        }}
        mode={destinationMode ?? 'move'}
        excludeSongId={idea.songId}
        onConfirm={async (songId, sectionId) => {
          if (destinationMode === 'move') {
            await moveIdeaToSection(idea.id, songId, sectionId)
          } else {
            await copyIdeaToSong(idea.id, songId, sectionId)
          }
        }}
      />
    </>
  )
}
