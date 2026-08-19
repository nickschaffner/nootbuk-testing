import { PoolIdeaRow } from '@/components/home/PoolIdeaRow'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  type TableSort,
} from '@/components/kit'
import { getIdeaDisplayLabel } from '@/lib/idea-label'
import type { Idea } from '@/types/idea'

export function sortIdeas(ideas: Idea[], sort: TableSort | null): Idea[] {
  if (!sort) {
    return ideas
  }

  const direction = sort.direction === 'asc' ? 1 : -1

  return [...ideas].sort((a, b) => {
    if (sort.column === 'role') {
      return a.role.localeCompare(b.role) * direction
    }
    if (sort.column === 'title') {
      return (
        getIdeaDisplayLabel(a).localeCompare(getIdeaDisplayLabel(b), undefined, {
          sensitivity: 'base',
        }) * direction
      )
    }
    if (sort.column === 'key') {
      const left = a.key?.trim() ?? ''
      const right = b.key?.trim() ?? ''
      if (!left && !right) return 0
      if (!left) return 1
      if (!right) return -1
      return left.localeCompare(right, undefined, { sensitivity: 'base' }) * direction
    }
    if (sort.column === 'tempo') {
      if (a.tempo == null && b.tempo == null) return 0
      if (a.tempo == null) return 1
      if (b.tempo == null) return -1
      return (a.tempo - b.tempo) * direction
    }
    if (sort.column === 'tracks') {
      const left = a.songId ? 1 : null
      const right = b.songId ? 1 : null
      if (left == null && right == null) return 0
      if (left == null) return 1
      if (right == null) return -1
      return (left - right) * direction
    }
    if (sort.column === 'updated') {
      return (
        (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * direction
      )
    }
    return 0
  })
}

export function IdeaTable({
  ideas,
  sort,
  onSort,
  onOpen,
}: {
  ideas: Idea[]
  sort: TableSort | null
  onSort: (sort: TableSort | null) => void
  onOpen: (idea: Idea) => void
}) {
  return (
    <Table sort={sort} onSort={onSort}>
      <TableHeader>
                <TableRow>
                  <TableHead />
                  <TableHead column="role">Role</TableHead>
                  <TableHead column="title">Title</TableHead>
                  <TableHead column="key">Key</TableHead>
                  <TableHead column="tempo">BPM</TableHead>
                  <TableHead column="tracks">Tracks</TableHead>
                  <TableHead column="updated">Updated</TableHead>
                  <TableHead />
                </TableRow>
      </TableHeader>
      <TableBody>
        {ideas.map((idea) => (
          <PoolIdeaRow
            key={idea.id}
            idea={idea}
            onOpen={() => onOpen(idea)}
          />
        ))}
      </TableBody>
    </Table>
  )
}
