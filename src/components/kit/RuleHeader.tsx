import { type ReactNode } from 'react'
import { cn } from './cn'
import { MonoLabel } from './Field'

// ─────────────────────────────────────────────────────────────────────────
// RuleHeader — vermillion mono title, hairline rule, optional muted subtitle.
// Title-only ("Recent", "K.01") or title + subtitle ("Archivo · Space Mono").
// Tokens: text-primary / bg-primary / muted-foreground — light and dark
// come from the theme. Presentational only.
// ─────────────────────────────────────────────────────────────────────────

export interface RuleHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  className?: string
}

export function RuleHeader({ title, subtitle, className }: RuleHeaderProps) {
  return (
    <div className={cn('flex h-4 items-center gap-3', className)}>
      <span className="label-mono shrink-0 leading-none text-primary">{title}</span>
      <span className="h-px min-w-4 flex-1 bg-primary" aria-hidden />
      {subtitle ? <MonoLabel className="shrink-0 text-right">{subtitle}</MonoLabel> : null}
    </div>
  )
}
