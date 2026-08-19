import { type ReactNode } from 'react'
import { cn } from './cn'

// ─────────────────────────────────────────────────────────────────────────
// PageHeader — list/app page masthead. Same height as the sidebar brand
// bar (h-16). Display L title between 2px vermillion rules. Optional CTA.
// Presentational only — pass the action button in.
// ─────────────────────────────────────────────────────────────────────────

export interface PageHeaderProps {
  title: ReactNode
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, action, className }: PageHeaderProps) {
  return (
    <header className={cn('flex h-16 items-center gap-3', className)}>
      <span className="block h-0.5 w-[1em] shrink-0 self-center bg-primary leading-none" aria-hidden />
      <h1 className="shrink-0 truncate font-display text-3xl font-black uppercase leading-none tracking-tight">
        {title}
      </h1>
      <span className="block h-0.5 min-w-4 flex-1 self-center bg-primary leading-none" aria-hidden />
      {action ? <div className="flex shrink-0 items-center self-center">{action}</div> : null}
    </header>
  )
}
