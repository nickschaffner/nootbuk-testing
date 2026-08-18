import type { MouseEvent, ReactNode } from 'react'
import { Badge } from './Chip'
import { Menu, type MenuOption } from './Menu'
import { TableActions, TableCell, TableRow } from './Table'

// ─────────────────────────────────────────────────────────────────────────
// IdeaRow — one pool/list line. Role · title · key · bpm · last updated,
// then play controls and ⋯ with no header.
// ─────────────────────────────────────────────────────────────────────────

export interface IdeaRowProps {
  role: string
  title: string
  ideaKey?: string | null
  tempo?: number | null
  lastWorked?: string
  /** Quick-play controls (audio / MIDI / note picker). */
  plays?: ReactNode
  menuItems?: MenuOption[]
  onOpen?: () => void
  className?: string
}

export function IdeaRow({
  role,
  title,
  ideaKey,
  tempo,
  lastWorked,
  plays,
  menuItems,
  onOpen,
  className,
}: IdeaRowProps) {
  return (
    <TableRow className={className} onClick={() => onOpen?.()}>
      <TableCell className="w-0 whitespace-nowrap">
        <Badge tone="neutral">{role}</Badge>
      </TableCell>
      <TableCell className="w-full min-w-0 font-medium">
        <span className="block truncate">{title}</span>
      </TableCell>
      <TableCell className="w-0 whitespace-nowrap label-mono text-muted-foreground">
        {ideaKey?.trim() ? ideaKey : '—'}
      </TableCell>
      <TableCell className="w-0 whitespace-nowrap label-mono text-muted-foreground">
        {tempo != null ? String(tempo) : '—'}
      </TableCell>
      <TableCell className="w-0 whitespace-nowrap label-mono text-muted-foreground">
        {lastWorked?.trim() ? lastWorked : '—'}
      </TableCell>
      <TableCell className="w-0 whitespace-nowrap">
        <TableActions>
          {plays ? (
            <div onClick={(event: MouseEvent) => event.stopPropagation()}>{plays}</div>
          ) : null}
          {menuItems && menuItems.length > 0 ? (
            <div onClick={(event: MouseEvent) => event.stopPropagation()}>
              <Menu label="Idea" align="end" items={menuItems} />
            </div>
          ) : null}
        </TableActions>
      </TableCell>
    </TableRow>
  )
}
