import { Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

import { IdeaDestinationSheet } from '@/components/pool/IdeaDestinationSheet'
import { IdeaMediaQuickPlay } from '@/components/song/IdeaMediaQuickPlay'
import { Button, IdeaRow, Window } from '@/components/kit'
import {
  copyIdeaIntoNewSong,
  copyIdeaToSong,
  deleteIdea,
  moveIdeaToSection,
  turnIdeaIntoSong,
} from '@/hooks/useIdeas'
import { formatRelativeTime } from '@/lib/format'
import { formatRoleLabel, getIdeaDisplayLabel } from '@/lib/idea-label'
import type { Idea } from '@/types/idea'

function Overlay({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <Window title={title} raised>
          {children}
        </Window>
      </div>
    </div>,
    document.body,
  )
}

interface PoolIdeaRowProps {
  idea: Idea
  onOpen: () => void
}

export function PoolIdeaRow({ idea, onOpen }: PoolIdeaRowProps) {
  const navigate = useNavigate()
  const [destinationMode, setDestinationMode] = useState<'move' | 'copy' | null>(
    null,
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
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

  async function handleDelete() {
    setIsBusy(true)
    try {
      await deleteIdea(idea.id)
      setConfirmDelete(false)
    } catch {
      // deleteIdea already logs
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
        tracks={idea.songId ? 1 : null}
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
          {
            label: 'Delete',
            icon: <Trash2 size={15} />,
            destructive: true,
            disabled: isBusy,
            onSelect: () => setConfirmDelete(true),
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
      {confirmDelete ? (
        <Overlay
          title={`Delete “${getIdeaDisplayLabel(idea)}”?`}
          onClose={() => setConfirmDelete(false)}
        >
          <p className="mb-3 text-xs text-muted-foreground">
            This permanently removes the idea and any attached media. This
            cannot be undone.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="danger"
              size="sm"
              disabled={isBusy}
              onClick={() => void handleDelete()}
            >
              {isBusy ? 'Deleting...' : 'Delete'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isBusy}
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
          </div>
        </Overlay>
      ) : null}
    </>
  )
}
