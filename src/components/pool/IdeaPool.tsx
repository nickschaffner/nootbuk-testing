import { useMemo, useState } from 'react'

import { IdeaCard } from '@/components/pool/IdeaCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useIdeasInPool } from '@/hooks/useIdeas'
import {
  mediaFlagsFor,
  useIdeaMediaFlagsMap,
} from '@/hooks/useIdeaMediaIndex'
import { formatRoleLabel, ideaMatchesSearch, IDEA_ROLES } from '@/lib/idea-label'
import { useQuickCapture } from '@/stores/quickCapture'
import type { IdeaRole } from '@/types/idea'

interface IdeaPoolProps {
  onSelectIdea: (id: string) => void
}

export function IdeaPool({ onSelectIdea }: IdeaPoolProps) {
  const { open: openCapture } = useQuickCapture()
  const ideas = useIdeasInPool()
  const mediaMap = useIdeaMediaFlagsMap()
  const [roleFilter, setRoleFilter] = useState<IdeaRole | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredIdeas = useMemo(() => {
    if (!ideas) {
      return []
    }

    return ideas.filter((idea) => {
      if (roleFilter !== 'all' && idea.role !== roleFilter) {
        return false
      }

      return ideaMatchesSearch(idea, searchQuery)
    })
  }, [ideas, roleFilter, searchQuery])

  if (ideas === undefined) {
    return (
      <div className="text-sm text-muted-foreground">Loading ideas...</div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search ideas..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="sm:flex-1"
        />
        <Select
          value={roleFilter}
          onValueChange={(value) => setRoleFilter(value as IdeaRole | 'all')}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {IDEA_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {formatRoleLabel(role)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {ideas.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm font-medium">
            No ideas yet. Capture your first idea.
          </p>
          <Button className="mt-4" onClick={() => openCapture()}>
            Open Quick Capture
          </Button>
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm font-medium">No ideas match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              songTitle={null}
              mediaFlags={mediaFlagsFor(mediaMap, idea.id)}
              onClick={() => onSelectIdea(idea.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
