import { useState } from 'react'

import { IdeaCard } from '@/components/pool/IdeaCard'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  copyIdeaToSong,
  moveIdeaToSection,
  useIdeasInPool,
} from '@/hooks/useIdeas'

interface ImportFromPoolSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  songId: string
}

export function ImportFromPoolSheet({
  open,
  onOpenChange,
  songId,
}: ImportFromPoolSheetProps) {
  const poolIdeas = useIdeasInPool()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeMode, setActiveMode] = useState<'move' | 'copy' | null>(null)

  async function handleImport(ideaId: string, mode: 'move' | 'copy') {
    setActiveId(ideaId)
    setActiveMode(mode)
    try {
      if (mode === 'move') {
        await moveIdeaToSection(ideaId, songId, null)
      } else {
        await copyIdeaToSong(ideaId, songId, null)
      }
    } catch {
      // hooks already log the error
    } finally {
      setActiveId(null)
      setActiveMode(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Import from Pool</SheetTitle>
        </SheetHeader>

        <div className="space-y-3 px-1 py-4">
          {poolIdeas === undefined ? (
            <p className="text-sm text-muted-foreground">Loading pool...</p>
          ) : poolIdeas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No ideas in the pool to import.
            </p>
          ) : (
            poolIdeas.map((idea) => (
              <div key={idea.id} className="space-y-2">
                <IdeaCard idea={idea} onClick={() => {}} showLocation={false} />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    disabled={activeId === idea.id}
                    onClick={() => void handleImport(idea.id, 'move')}
                  >
                    {activeId === idea.id && activeMode === 'move'
                      ? 'Moving...'
                      : 'Move to Unassigned'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={activeId === idea.id}
                    onClick={() => void handleImport(idea.id, 'copy')}
                  >
                    {activeId === idea.id && activeMode === 'copy'
                      ? 'Copying...'
                      : 'Copy to Unassigned'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
