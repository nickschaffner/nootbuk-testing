import type { MouseEvent, ReactNode } from 'react'
import { Badge, Length } from './Chip'
import { Menu, type MenuOption } from './Menu'
import { TableActions, TableCell, TableRow } from './Table'

// ─────────────────────────────────────────────────────────────────────────
// SongRow — one songs-list line. Play + length · title (+ todo chip) ·
// status · key · tempo · time · albums · updated, then ⋯ / delete.
// ─────────────────────────────────────────────────────────────────────────

export interface SongRowProps {
  title: string
  status: string
  todoCount?: number
  length?: string | null
  songKey?: string | null
  tempo?: number | null
  time?: string | null
  albums?: number | null
  lastWorked?: string
  plays?: ReactNode
  menuItems?: MenuOption[]
  onOpen?: () => void
  className?: string
}

export function SongRow({
  title,
  status,
  todoCount = 0,
  length,
  songKey,
  tempo,
  time,
  albums,
  lastWorked,
  plays,
  menuItems,
  onOpen,
  className,
}: SongRowProps) {
  const hasPlayCluster = Boolean(plays) || Boolean(length?.trim())

  return (
    <TableRow className={className} onClick={() => onOpen?.()}>
      <TableCell className="w-0 whitespace-nowrap">
        {hasPlayCluster ? (
          <div onClick={(event: MouseEvent) => event.stopPropagation()}>
            <TableActions>
              {plays}
              {length?.trim() ? <Length>{length}</Length> : null}
            </TableActions>
          </div>
        ) : null}
      </TableCell>
      <TableCell className="w-full min-w-0 font-medium">
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 truncate">{title}</span>
          {todoCount > 0 ? (
            <Badge tone="outline" className="shrink-0">
              {todoCount} to-do
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="w-0 whitespace-nowrap">
        <Badge tone="neutral">{status}</Badge>
      </TableCell>
      <TableCell className="w-0 whitespace-nowrap label-mono text-muted-foreground">
        {songKey?.trim() ? songKey : '—'}
      </TableCell>
      <TableCell className="w-0 whitespace-nowrap label-mono text-muted-foreground">
        {tempo != null ? String(tempo) : '—'}
      </TableCell>
      <TableCell className="w-0 whitespace-nowrap label-mono text-muted-foreground">
        {time?.trim() ? time : '—'}
      </TableCell>
      <TableCell className="w-0 whitespace-nowrap label-mono text-muted-foreground">
        {albums != null ? String(albums) : '—'}
      </TableCell>
      <TableCell className="w-0 whitespace-nowrap label-mono text-muted-foreground">
        {lastWorked?.trim() ? lastWorked : '—'}
      </TableCell>
      <TableCell className="w-0 whitespace-nowrap">
        {menuItems && menuItems.length > 0 ? (
          <TableActions>
            <div onClick={(event: MouseEvent) => event.stopPropagation()}>
              <Menu label="Song" align="end" items={menuItems} />
            </div>
          </TableActions>
        ) : null}
      </TableCell>
    </TableRow>
  )
}
