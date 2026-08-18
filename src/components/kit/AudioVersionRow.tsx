import { Pause, Play, Star, Trash2 } from 'lucide-react'
import { cn } from './cn'
import { Input } from './Field'
import { Badge } from './Chip'
import { IconButton } from './IconButton'

// ─────────────────────────────────────────────────────────────────────────
// AudioVersionRow — one saved take/version of a song. Quick-play · editable
// label · filename + duration meta · "main" star · delete. Presentational.
// ─────────────────────────────────────────────────────────────────────────

export interface AudioVersionRowProps {
  label: string
  filename?: string
  duration?: string
  isMain?: boolean
  playing?: boolean
  onLabelChange?: (v: string) => void
  onPlayToggle?: () => void
  onToggleMain?: () => void
  onDelete?: () => void
  className?: string
}

export function AudioVersionRow({
  label,
  filename,
  duration,
  isMain = false,
  playing = false,
  onLabelChange,
  onPlayToggle,
  onToggleMain,
  onDelete,
  className,
}: AudioVersionRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xs border border-hairline bg-card px-2 py-1.5 transition-colors hover:border-foreground/60',
        isMain && 'border-primary/50',
        className,
      )}
    >
      <IconButton
        aria-label={playing ? 'Pause' : 'Play version'}
        variant="ghost"
        size="sm"
        onClick={onPlayToggle}
      >
        {playing ? <Pause size={15} /> : <Play size={15} />}
      </IconButton>
      <div className="min-w-0 flex-1">
        <Input
          value={label}
          onChange={(e) => onLabelChange?.(e.target.value)}
          className="h-7 border-transparent bg-transparent px-1 hover:border-hairline"
          aria-label="Version label"
        />
        <div className="flex items-center gap-2 px-1">
          {filename ? (
            <span className="label-mono truncate text-muted-foreground">{filename}</span>
          ) : null}
          {duration ? <span className="label-mono text-muted-foreground">{duration}</span> : null}
        </div>
      </div>
      {isMain ? <Badge tone="accent">Main</Badge> : null}
      <IconButton
        aria-label={isMain ? 'Unset main' : 'Set as main'}
        variant="ghost"
        size="sm"
        onClick={onToggleMain}
        className={isMain ? 'text-primary' : undefined}
      >
        <Star size={15} fill={isMain ? 'currentColor' : 'none'} />
      </IconButton>
      <IconButton aria-label="Delete version" variant="ghost" size="sm" onClick={onDelete}>
        <Trash2 size={14} />
      </IconButton>
    </div>
  )
}
