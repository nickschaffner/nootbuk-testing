import { cn } from './cn'
import type { Option } from './options'

// ─────────────────────────────────────────────────────────────────────────
// StatusStepper — the lifecycle indicator. A row of stages; everything up to
// and including the active stage fills vermillion. Drives song status (7
// stages) and album status (3). Pass `stages`, `value`, optional `onChange`.
// ─────────────────────────────────────────────────────────────────────────

export interface StatusStepperProps {
  stages: Option[]
  value: string
  onChange?: (value: string) => void
  className?: string
}

export function StatusStepper({ stages, value, onChange, className }: StatusStepperProps) {
  const activeIndex = stages.findIndex((s) => s.value === value)
  return (
    <div className={cn('flex w-full items-stretch gap-1', className)}>
      {stages.map((s, i) => {
        const done = i <= activeIndex
        const isCurrent = i === activeIndex
        const interactive = Boolean(onChange)
        const Tag = interactive ? 'button' : 'div'
        return (
          <Tag
            key={s.value}
            {...(interactive ? { type: 'button' as const, onClick: () => onChange?.(s.value) } : {})}
            aria-current={isCurrent ? 'step' : undefined}
            className={cn(
              'group flex flex-1 flex-col gap-1.5',
              interactive && 'focusable cursor-pointer',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-full rounded-[1px] transition-colors',
                done ? 'noise bg-primary' : 'bg-muted',
              )}
            />
            <span
              className={cn(
                'label-mono truncate text-left transition-colors',
                isCurrent ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {s.label}
            </span>
          </Tag>
        )
      })}
    </div>
  )
}
