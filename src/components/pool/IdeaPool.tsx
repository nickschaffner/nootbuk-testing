import { useMemo, useState } from 'react'

import { IdeaCard } from '@/components/pool/IdeaCard'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useIdeasInPool } from '@/hooks/useIdeas'
import { formatRoleLabel, ideaMatchesSearch, IDEA_ROLES } from '@/lib/idea-label'
import type { IdeaRole } from '@/types/idea'

interface IdeaPoolProps {
  onSelectIdea: (id: string) => void
}

export function IdeaPool({ onSelectIdea }: IdeaPoolProps) {
  const ideas = useIdeasInPool()
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

      {filteredIdeas.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm font-medium">
            {ideas.length === 0
              ? 'No ideas yet. Capture your first idea.'
              : 'No ideas match your filters.'}
          </p>
          {ideas.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Use the form above to add a text idea, or hit Capture when
              recording is ready.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onClick={() => onSelectIdea(idea.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
