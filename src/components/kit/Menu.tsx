import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { cn } from './cn'
import { IconButton } from './IconButton'

// ─────────────────────────────────────────────────────────────────────────
// Menu — the "⋯" context pop-up. Flexible: takes 1..n options.
//
// It is a true OVERLAY, never an inline element: the pop-up is rendered in a
// portal on <body> with fixed positioning, so it never pushes siblings around
// and is never clipped by an `overflow-hidden` ancestor.
//
//   • Desktop (≥ sm): inverse Panel (`raised="noise"`) — paper on dark, studio
//     on light — lifted on a grain drop instead of the vermillion hard shadow.
//   • Mobile (< sm): a full-width bottom action sheet with a dimmed backdrop
//     and larger tap targets.
//
// If only one item is enabled (disabled options don't count), the ⋯ is
// replaced by that action's icon. Global — any Menu, not just songs.
// ─────────────────────────────────────────────────────────────────────────

export interface MenuOption {
  label: string
  /** Optional leading glyph (e.g. a lucide icon). */
  icon?: ReactNode
  onSelect?: () => void
  /** Vermillion treatment for destructive actions (delete, remove…). */
  destructive?: boolean
  disabled?: boolean
}

export type MenuItem = MenuOption

export interface MenuProps {
  items: MenuOption[]
  /** Which edge of the trigger the desktop popover aligns to. */
  align?: 'start' | 'end'
  /** Heading shown on the mobile sheet; also the trigger's aria-label. */
  label?: string
  /** Custom trigger; receives no props. Defaults to the ⋯ IconButton. */
  trigger?: ReactNode
  className?: string
}

const SM = 640 // Tailwind `sm` breakpoint
const GAP = 4 // px below the trigger

export function Menu({ items, align = 'end', label = 'Actions', trigger, className }: MenuProps) {
  const [open, setOpen] = useState(false)
  const [desktop, setDesktop] = useState(false)
  const [pos, setPos] = useState<{ top: number; left?: number; right?: number }>({ top: 0 })
  const anchor = useRef<HTMLSpanElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  // measure the trigger and place the desktop popover against its rect
  useLayoutEffect(() => {
    if (!open) return
    const isDesktop = window.innerWidth >= SM
    setDesktop(isDesktop)
    if (!isDesktop) return
    const r = anchor.current?.getBoundingClientRect()
    if (!r) return
    setPos(
      align === 'end'
        ? { top: r.bottom + GAP, right: window.innerWidth - r.right }
        : { top: r.bottom + GAP, left: r.left },
    )
  }, [open, align])

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!anchor.current?.contains(t) && !panel.current?.contains(t)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const actionable = items.filter((item) => !item.disabled)
  const solo = !trigger && actionable.length === 1 ? actionable[0] : null

  if (actionable.length === 0) {
    return null
  }

  if (solo) {
    return (
      <span
        className={cn('inline-flex', className)}
        onClick={(event) => event.stopPropagation()}
      >
        <IconButton
          aria-label={solo.label}
          variant="ghost"
          size="sm"
          className={
            solo.destructive
              ? 'text-primary hover:bg-primary hover:text-primary-foreground'
              : undefined
          }
          onClick={() => solo.onSelect?.()}
        >
          {solo.icon ?? (solo.destructive ? <Trash2 size={16} /> : <MoreHorizontal size={16} />)}
        </IconButton>
      </span>
    )
  }

  const list = (
    <div
      ref={panel}
      role="menu"
      aria-label={label}
      style={desktop ? { position: 'fixed', ...pos } : undefined}
      className={cn(
        'z-50',
        desktop ? 'w-56' : 'fixed inset-x-0 bottom-0',
      )}
    >
      <div
        className={cn(
          desktop && 'shadow-noise rounded-xs',
          !desktop && 'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <div
          className={cn(
            'scheme-inverse noise max-h-[60vh] overflow-auto bg-card text-foreground',
            desktop ? 'rounded-xs' : 'rounded-none',
          )}
        >
          {!desktop && label && (
            <div className="label-mono border-b border-hairline px-3 py-2 text-muted-foreground">{label}</div>
          )}
          {items.map((item, i) => (
            <button
              key={`${item.label}-${i}`}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                item.onSelect?.()
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-3 text-left text-sm transition-colors sm:py-2',
                'disabled:pointer-events-none disabled:opacity-40',
                item.destructive
                  ? 'text-primary hover:bg-primary hover:text-primary-foreground'
                  : 'hover:bg-muted',
              )}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <span className={cn('contents', className)}>
      {/* inline-flex (not `contents`) so the trigger has a real box to measure */}
      <span
        ref={anchor}
        onClick={(event) => {
          event.stopPropagation()
          setOpen((v) => !v)
        }}
        className="inline-flex"
      >
        {trigger ?? (
          <IconButton aria-label={label} aria-haspopup="menu" aria-expanded={open} variant="ghost" size="sm">
            <MoreHorizontal size={16} />
          </IconButton>
        )}
      </span>

      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40 bg-foreground/25 sm:bg-transparent"
              onClick={() => setOpen(false)}
            />
            {list}
          </>,
          document.body,
        )}
    </span>
  )
}
