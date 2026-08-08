import { cn } from '@/lib/utils'
import { formatRoleLabel, IDEA_ROLES } from '@/lib/idea-label'
import type { IdeaRole } from '@/types/idea'

interface RolePillSelectorProps {
  value: IdeaRole
  onChange: (role: IdeaRole) => void
  className?: string
}

export function RolePillSelector({
  value,
  onChange,
  className,
}: RolePillSelectorProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {IDEA_ROLES.map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => onChange(role)}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            value === role
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {formatRoleLabel(role)}
        </button>
      ))}
    </div>
  )
}
