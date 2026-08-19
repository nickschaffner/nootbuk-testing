import { Chip, IDEA_ROLES, SearchBar } from '@/components/kit'
import type { IdeaRole } from '@/types/idea'

export function IdeaSearchRoleFilters({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
}: {
  searchQuery: string
  onSearchChange: (value: string) => void
  roleFilter: IdeaRole[]
  onRoleFilterChange: (value: IdeaRole[]) => void
}) {
  return (
    <div className="grid grid-cols-2 items-start gap-8">
      <SearchBar
        placeholder="Search"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <div className="flex flex-wrap items-start gap-1.5">
        <Chip
          selected={roleFilter.length === 0}
          onClick={() => onRoleFilterChange([])}
        >
          All
        </Chip>
        {IDEA_ROLES.map((role) => {
          const value = role.value as IdeaRole
          const selected = roleFilter.includes(value)
          return (
            <Chip
              key={role.value}
              selected={selected}
              onClick={() => {
                onRoleFilterChange(
                  selected
                    ? roleFilter.filter((item) => item !== value)
                    : [...roleFilter, value],
                )
              }}
            >
              {role.label}
            </Chip>
          )
        })}
      </div>
    </div>
  )
}
