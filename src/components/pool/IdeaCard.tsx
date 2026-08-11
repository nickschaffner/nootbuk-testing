import { memo } from 'react'

import { NoteSequencePlayer } from '@/components/player/NoteSequencePlayer'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNoteSequencesForIdea } from '@/hooks/useNoteSequences'
import { formatRelativeTime } from '@/lib/format'
import { formatRoleLabel, getIdeaDisplayLabel } from '@/lib/idea-label'
import type { Idea } from '@/types/idea'

interface IdeaCardProps {
  idea: Idea
  onClick: () => void
  showPlayback?: boolean
}

export const IdeaCard = memo(function IdeaCard({
  idea,
  onClick,
  showPlayback = false,
}: IdeaCardProps) {
  const sequences = useNoteSequencesForIdea(showPlayback ? idea.id : undefined)
  const firstSequence = sequences?.[0]

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/40 [content-visibility:auto] [contain-intrinsic-size:auto_8rem]"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{formatRoleLabel(idea.role)}</Badge>
            {showPlayback && firstSequence ? (
              <div onClick={(event) => event.stopPropagation()}>
                <NoteSequencePlayer sequence={firstSequence} compact />
              </div>
            ) : null}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(idea.updatedAt)}
          </span>
        </div>
        <CardTitle className="line-clamp-2 text-base">
          {getIdeaDisplayLabel(idea)}
        </CardTitle>
      </CardHeader>
      {idea.instrumentName ? (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">{idea.instrumentName}</p>
        </CardContent>
      ) : null}
    </Card>
  )
})
