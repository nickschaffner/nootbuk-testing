import { type ReactNode } from 'react'

// ── Structural label / eyebrow ────────────────────────────────────────────
export function MonoLabel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <span className={`label-mono text-muted-foreground ${className}`}>{children}</span>
}

// ── A specimen frame: mono index + title, with the demo body below ─────────
export function Specimen({
  index,
  name,
  note,
  children,
}: {
  index: string
  name: string
  note?: string
  children: ReactNode
}) {
  return (
    <div className="border-t border-hairline pt-3">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="label-mono text-primary">{index}</span>
          <h3 className="font-display text-sm font-extrabold uppercase tracking-wide">{name}</h3>
        </div>
        {note ? <MonoLabel className="text-right">{note}</MonoLabel> : null}
      </div>
      {children}
    </div>
  )
}

// ── Section masthead: number + heading + red rule ──────────────────────────
export function SectionHead({
  no,
  title,
  kicker,
}: {
  no: string
  title: string
  kicker?: string
}) {
  return (
    <header className="mb-10">
      <div className="mb-3 flex items-center gap-3">
        <span className="label-mono text-primary">{no}</span>
        <span className="h-px flex-1 bg-primary" />
        {kicker ? <MonoLabel>{kicker}</MonoLabel> : null}
      </div>
      <h2 className="font-display text-3xl font-black uppercase tracking-tight md:text-4xl">
        {title}
      </h2>
    </header>
  )
}

// ── Hairline-framed panel ──────────────────────────────────────────────────
export function Panel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`border border-hairline bg-card ${className}`}>{children}</div>
  )
}
