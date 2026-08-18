import { GripVertical, Trash2 } from 'lucide-react'
import { cn } from './cn'
import { Checkbox } from './Field'
import { Badge } from './Chip'
import { IconButton } from './IconButton'

// ─────────────────────────────────────────────────────────────────────────
// TodoRow — a song production to-do. Drag handle · checkbox · text · optional
// timestamp badge (mm:ss) · delete. Presentational: pass state + handlers.
// ─────────────────────────────────────────────────────────────────────────

export interface TodoRowProps {
  text: string
  completed?: boolean
  /** Playhead timestamp label, e.g. "1:24". */
  timestamp?: string
  onToggle?: (completed: boolean) => void
  onDelete?: () => void
  className?: string
}

export function TodoRow({ text, completed = false, timestamp, onToggle, onDelete, className }: TodoRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xs border border-hairline bg-card px-2 py-1.5 transition-colors hover:border-foreground/60',
        className,
      )}
    >
      <span className="cursor-grab text-muted-foreground" aria-hidden>
        <GripVertical size={15} />
      </span>
      <Checkbox checked={completed} onChange={(e) => onToggle?.(e.target.checked)} aria-label="Done" />
      <span
        className={cn('flex-1 truncate text-sm', completed && 'text-muted-foreground line-through')}
      >
        {text}
      </span>
      {timestamp ? <Badge tone="outline">{timestamp}</Badge> : null}
      <IconButton aria-label="Delete todo" variant="ghost" size="sm" onClick={onDelete}>
        <Trash2 size={14} />
      </IconButton>
    </div>
  )
}
