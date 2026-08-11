import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { IdeaDestinationSheet } from '@/components/pool/IdeaDestinationSheet'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  copyIdeaIntoNewSong,
  copyIdeaToPool,
  copyIdeaToSong,
  moveIdeaToPool,
  moveIdeaToSection,
  turnIdeaIntoSong,
} from '@/hooks/useIdeas'
import type { Idea } from '@/types/idea'

interface IdeaActionsMenuProps {
  idea: Idea
  onActionComplete?: () => void
  variant?: 'icon' | 'button'
}

export function IdeaActionsMenu({
  idea,
  onActionComplete,
  variant = 'icon',
}: IdeaActionsMenuProps) {
  const navigate = useNavigate()
  const [destinationMode, setDestinationMode] = useState<'move' | 'copy' | null>(
    null,
  )
  const [isBusy, setIsBusy] = useState(false)

  const inPool = idea.songId === null

  async function runAction(action: () => Promise<unknown>) {
    setIsBusy(true)
    try {
      await action()
      onActionComplete?.()
    } catch {
      // hooks log errors
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === 'icon' ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7 shrink-0"
              disabled={isBusy}
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Idea actions</span>
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" disabled={isBusy}>
              Actions
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
          {inPool ? (
            <>
              <DropdownMenuItem
                onClick={() =>
                  void runAction(async () => {
                    const { song } = await turnIdeaIntoSong(idea.id)
                    navigate(`/song/${song.id}`)
                  })
                }
              >
                Turn into Song
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDestinationMode('move')}>
                Move to Song
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDestinationMode('copy')}>
                Copy to Song
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  void runAction(() => copyIdeaIntoNewSong(idea.id))
                }
              >
                Copy into New Song
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => setDestinationMode('move')}>
                Move to Song
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDestinationMode('copy')}>
                Copy to Song
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  void runAction(() => moveIdeaToPool(idea.id))
                }
              >
                Move to Pool
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  void runAction(() => copyIdeaToPool(idea.id))
                }
              >
                Copy to Pool
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  void runAction(async () => {
                    const { song } = await copyIdeaIntoNewSong(idea.id)
                    navigate(`/song/${song.id}`)
                  })
                }
              >
                Copy into New Song
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
          onActionComplete?.()
        }}
      />
    </>
  )
}
