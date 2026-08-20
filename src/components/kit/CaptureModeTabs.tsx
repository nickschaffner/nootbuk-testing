import { type ReactNode } from 'react'
import { cn } from './cn'
import type { Option } from './options'

// ─────────────────────────────────────────────────────────────────────────
// CaptureModeTabs — hanging tabs that sit *outside* CaptureStudioStack's
// vermillion box. Live tab fills primary. Not SegmentedControl.
// ─────────────────────────────────────────────────────────────────────────

export interface CaptureModeTabsProps<T extends string = string> {
  options: Array<Omit<Option<T>, 'label'> & { label: ReactNode }>
  value: T
  onChange?: (value: T) => void
  className?: string
}

export function CaptureModeTabs<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: CaptureModeTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn('relative z-10 flex w-full', className)}
    >
      {options.map((opt, index) => {
        const active = opt.value === value
        const first = index === 0
        const last = index === options.length - 1
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(opt.value)}
            className={cn(
              'focusable h-7 min-w-0 flex-1 px-2.5 text-[0.6875rem] font-bold uppercase tracking-wider whitespace-nowrap transition-colors',
              first && 'rounded-tl-md',
              last && 'rounded-tr-md',
              active
                ? '-mb-[2px] bg-primary text-primary-foreground'
                : index % 2 === 0
                  ? 'bg-panel text-muted-foreground hover:text-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
