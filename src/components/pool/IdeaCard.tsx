import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRelativeTime } from '@/lib/format'
import { formatRoleLabel, getIdeaDisplayLabel } from '@/lib/idea-label'
import type { Idea } from '@/types/idea'

interface IdeaCardProps {
  idea: Idea
  onClick: () => void
}

export function IdeaCard({ idea, onClick }: IdeaCardProps) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/40"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="secondary">{formatRoleLabel(idea.role)}</Badge>
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
}
