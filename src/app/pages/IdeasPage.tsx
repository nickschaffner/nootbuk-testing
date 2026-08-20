import { Lightbulb } from 'lucide-react'
import { useMemo, useState } from 'react'

import { IdeaSearchRoleFilters } from '@/components/home/IdeaSearchRoleFilters'
import { IdeaTable, sortIdeas } from '@/components/home/IdeaTable'
import { Button, EmptyState, PageHeader, type TableSort } from '@/components/kit'
import { useAllIdeas } from '@/hooks/useIdeas'
import { ideaMatchesSearch } from '@/lib/idea-label'
import { useQuickCapture } from '@/stores/quickCapture'
import type { IdeaRole } from '@/types/idea'

export function IdeasPage() {
  const { open, openIdea } = useQuickCapture()
  const ideas = useAllIdeas()

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<IdeaRole[]>([])
  const [sort, setSort] = useState<TableSort | null>({
    column: 'updated',
    direction: 'desc',
  })

  const filteredIdeas = useMemo(() => {
    if (!ideas) {
      return []
    }

    return ideas.filter((idea) => {
      if (roleFilter.length > 0 && !roleFilter.includes(idea.role)) {
        return false
      }
      return ideaMatchesSearch(idea, searchQuery)
    })
  }, [ideas, roleFilter, searchQuery])

  const displayedIdeas = useMemo(
    () => sortIdeas(filteredIdeas, sort),
    [filteredIdeas, sort],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ideas"
        action={
          <Button variant="secondary" size="sm" onClick={() => open()}>
            + New Idea
          </Button>
        }
      />

      <IdeaSearchRoleFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
      />

      {ideas === undefined ? (
        <p className="text-sm text-muted-foreground">Loading ideas...</p>
      ) : ideas.length === 0 ? (
        <EmptyState
          icon={<Lightbulb size={28} />}
          title="No ideas yet"
          hint="Capture your first idea."
          action={
            <Button onClick={() => open()}>Open Quick Capture</Button>
          }
        />
      ) : filteredIdeas.length === 0 ? (
        <EmptyState title="No ideas match your filters." />
      ) : (
        <IdeaTable
          ideas={displayedIdeas}
          sort={sort}
          onSort={setSort}
          onOpen={(idea) => openIdea(idea.id)}
        />
      )}
    </div>
  )
}
