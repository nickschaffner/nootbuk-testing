import { useState } from 'react'

import { IdeaCard } from '@/components/pool/IdeaCard'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { moveIdeaToSection, useIdeasInPool } from '@/hooks/useIdeas'

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
  const [movingId, setMovingId] = useState<string | null>(null)

  async function handleImport(ideaId: string) {
    setMovingId(ideaId)
    try {
      await moveIdeaToSection(ideaId, songId, null)
    } catch {
      // moveIdeaToSection already logs the error
    } finally {
      setMovingId(null)
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
                <IdeaCard idea={idea} onClick={() => {}} />
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  disabled={movingId === idea.id}
                  onClick={() => void handleImport(idea.id)}
                >
                  {movingId === idea.id ? 'Adding...' : 'Add to Unassigned'}
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
