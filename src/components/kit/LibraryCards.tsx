import { Music2 } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Badge } from './Chip'
import { Button } from './Button'
import { cn } from './cn'
import { Menu, type MenuOption } from './Menu'
import { Noise } from './Noise'

// ─────────────────────────────────────────────────────────────────────────
// Library cards — Album + empty slots. AlbumCard matches SongCard (Figma
// variant 3): inset square cover, raised shell. Track count stands in for
// to-do. Play and length omitted for now.
// ─────────────────────────────────────────────────────────────────────────

const EMPTY_SHELL =
  'flex min-h-[6.75rem] flex-col items-center justify-center rounded-xs border border-dashed border-hairline bg-card p-3'

function Cover({ src, size }: { src?: string | null; size: string }) {
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
    </div>
  )
}

export interface AlbumCardProps {
  title: string
  status: string
  trackCount: number
  timestamp?: string
  /** Reserved — length overlay omitted for now. */
  duration?: string
  artworkUrl?: string | null
  menuItems?: MenuOption[]
  onOpen?: () => void
  className?: string
}

export function AlbumCard({
  title,
  status,
  trackCount,
  timestamp,
  menuItems,
  artworkUrl,
  onOpen,
  className,
}: AlbumCardProps) {
  const menu =
    menuItems && menuItems.length > 0 ? (
      <Menu label="Album" align="end" items={menuItems} />
    ) : null

  return (
    <article
      className={cn(
        'noise relative flex min-w-0 items-stretch gap-3 rounded-xs border border-foreground bg-card p-3 shadow-hard',
        onOpen && 'cursor-pointer',
        className,
      )}
      onClick={() => onOpen?.()}
    >
      <Cover src={artworkUrl} size="aspect-square h-auto min-h-24 min-w-24 self-stretch" />
      <div className="flex min-h-24 min-w-0 flex-1 flex-col justify-between self-stretch">
        <p className="min-w-0 truncate pr-8 font-display text-base font-extrabold uppercase tracking-wide">
          {title}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="neutral">{status}</Badge>
          {trackCount > 0 ? (
            <Badge tone="outline">
              {trackCount} track{trackCount === 1 ? '' : 's'}
            </Badge>
          ) : null}
        </div>
        {timestamp ? (
          <span className="label-mono text-muted-foreground">{timestamp}</span>
        ) : (
          <span />
        )}
      </div>
      {menu ? (
        <div
          className="absolute top-3 right-3"
          onClick={(event: MouseEvent) => event.stopPropagation()}
        >
          {menu}
        </div>
      ) : null}
    </article>
  )
}

export interface EmptyLibraryCardProps {
  /** CTA label, e.g. "+ New Song". Omit for a blank placeholder slot. */
  label?: string
  onCreate?: () => void
  disabled?: boolean
  className?: string
}

export function EmptyLibraryCard({
  label,
  onCreate,
  disabled,
  className,
}: EmptyLibraryCardProps) {
  return (
    <article className={cn(EMPTY_SHELL, 'h-full min-w-0 w-full', className)}>
      {label && onCreate ? (
        <Button
          size="sm"
          variant="secondary"
          disabled={disabled}
          onClick={onCreate}
        >
          {label}
        </Button>
      ) : null}
    </article>
  )
}
