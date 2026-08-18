import { MoreHorizontal, Music2 } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Badge, Length } from './Chip'
import { cn } from './cn'
import { IconButton } from './IconButton'
import { Menu, type MenuOption } from './Menu'
import { Noise } from './Noise'
import { PlayButton } from './PlayButton'

// ─────────────────────────────────────────────────────────────────────────
// SongCard — Figma variant 3 (Raised) only.
// p-3 inset · gap-3 between cover and copy · cover is aspect-square
// self-stretch (height = content, not a fixed thumb). To-do omitted at 0.
// ─────────────────────────────────────────────────────────────────────────

export interface SongCardProps {
  title: string
  status: string
  /** Number of open to-dos. Hidden when 0. */
  todoCount?: number
  /** Human length, e.g. "3:41". */
  length?: string
  /** Relative label, e.g. "2d ago". */
  lastWorked?: string
  /** Optional artwork URL; falls back to a grained placeholder. */
  artwork?: string | null
  playing?: boolean
  onPlay?: () => void
  onMenu?: () => void
  menuItems?: MenuOption[]
  onOpen?: () => void
  className?: string
}

function Cover({
  src,
  size,
  length,
}: {
  src?: string | null
  size: string
  length?: string
}) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-xs border border-hairline',
        size,
      )}
    >
      <div
        className={cn(
          'flex size-full items-center justify-center bg-gradient-to-br from-primary to-foreground text-primary-foreground',
          src && 'invisible',
        )}
        aria-hidden={Boolean(src)}
      >
        <Music2 className="opacity-70" size={20} />
      </div>
      {src ? (
        <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <Noise variant="flat" over opacity={0.5} />
      )}
      {length ? (
        <Length className="absolute bottom-1 left-1 z-[2] bg-card">{length}</Length>
      ) : null}
    </div>
  )
}

export function SongCard({
  title,
  status,
  todoCount = 0,
  length,
  lastWorked,
  artwork,
  playing = false,
  onPlay,
  onMenu,
  menuItems,
  onOpen,
  className,
}: SongCardProps) {
  const menu =
    menuItems && menuItems.length > 0 ? (
      <Menu label="Song" align="end" items={menuItems} />
    ) : (
      <IconButton aria-label="Song actions" variant="ghost" size="sm" onClick={onMenu}>
        <MoreHorizontal size={16} />
      </IconButton>
    )

  return (
    <article
      className={cn(
        'noise relative flex min-w-0 items-stretch gap-3 rounded-xs border border-foreground bg-card p-3 shadow-hard',
        onOpen && 'cursor-pointer',
        className,
      )}
      onClick={() => onOpen?.()}
    >
      <Cover src={artwork} size="aspect-square h-auto min-h-24 min-w-24 self-stretch" length={length} />
      <div
        className={cn(
          'flex min-h-24 min-w-0 flex-1 flex-col justify-between self-stretch',
          onPlay && 'pr-10',
        )}
      >
        <p className="min-w-0 truncate pr-8 font-display text-base font-extrabold uppercase tracking-wide">
          {title}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="neutral">{status}</Badge>
          {todoCount > 0 ? (
            <Badge tone="outline">{todoCount} to-do</Badge>
          ) : null}
        </div>
        {lastWorked ? (
          <span className="label-mono text-muted-foreground">{lastWorked}</span>
        ) : (
          <span />
        )}
      </div>
      <div
        className="absolute top-3 right-3"
        onClick={(event: MouseEvent) => event.stopPropagation()}
      >
        {menu}
      </div>
      {onPlay ? (
        <div
          className="absolute right-3 bottom-3"
          onClick={(event: MouseEvent) => event.stopPropagation()}
        >
          <PlayButton
            aria-label={playing ? 'Pause song' : 'Play song'}
            playing={playing}
            onClick={onPlay}
          />
        </div>
      ) : null}
    </article>
  )
}
