import { type ReactNode } from 'react'
import { cn } from './cn'
import { MonoLabel } from './Field'

// ─────────────────────────────────────────────────────────────────────────
// Surfaces — the containers the whole system is built on.
//   Panel   · hairline-framed card on the card fill (the default surface)
//            raised          → vermillion hard drop
//            raised="noise"  → inverse fill + grain drop
//   Recess  · inset well, darker than its parent (piano rolls, readouts)
//   Window  · titled panel with a mono header bar (chord picker, dialogs)
//   RedBar  · the vermillion divider rule, with optional grain
//   EmptyState · centered placeholder for empty pools/sections
// ─────────────────────────────────────────────────────────────────────────

export type PanelRaised = boolean | 'noise'

export function Panel({
  children,
  className,
  as: Tag = 'div',
  raised = false,
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
  /** `true` = vermillion hard shadow. `'noise'` = inverse fill + grain drop. */
  raised?: PanelRaised
}) {
  if (raised === 'noise') {
    return (
      <Tag className="shadow-noise inline-block max-w-full rounded-xs align-top">
        <div
          className={cn(
            'scheme-inverse noise rounded-xs bg-card text-foreground',
            className,
          )}
        >
          {children}
        </div>
      </Tag>
    )
  }

  return (
    <Tag
      className={cn(
        'noise rounded-xs border bg-card',
        raised ? 'border-foreground shadow-hard' : 'border-hairline',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

export function Recess({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xs border border-hairline bg-background shadow-[inset_0_1px_3px_rgba(0,0,0,0.18)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Window({
  title,
  right,
  children,
  className,
  raised = false,
}: {
  title: ReactNode
  right?: ReactNode
  children: ReactNode
  className?: string
  /** Lift on the signature hard vermillion drop shadow (dialog framing). */
  raised?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xs border bg-card',
        raised ? 'border-foreground shadow-hard' : 'border-hairline',
        className,
      )}
    >
      <div className="noise flex items-center justify-between gap-3 border-b border-hairline bg-panel px-3 py-2">
        <MonoLabel className="text-foreground">{title}</MonoLabel>
        {right}
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}

export function RedBar({
  className,
  grain = true,
  height = 'h-3',
}: {
  className?: string
  grain?: boolean
  height?: string
}) {
  return <div className={cn(grain && 'noise', height, 'w-full bg-primary', className)} aria-hidden />
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
  className,
}: {
  icon?: ReactNode
  title: ReactNode
  hint?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xs border border-dashed border-hairline bg-card px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      <p className="font-display text-sm font-extrabold uppercase tracking-wide">{title}</p>
      {hint ? <p className="max-w-xs text-xs text-muted-foreground">{hint}</p> : null}
      {action}
    </div>
  )
}
