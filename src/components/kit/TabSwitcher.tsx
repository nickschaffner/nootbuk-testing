import { cn } from './cn'
import type { Option } from './options'

// ─────────────────────────────────────────────────────────────────────────
// TabSwitcher — view / section tabs. Not SegmentedControl: no frame, no
// fill. Active tab sits on a 2px vermillion rule. Controlled.
// ─────────────────────────────────────────────────────────────────────────

export interface TabSwitcherProps<T extends string = string> {
  options: Option<T>[]
  value: T
  onChange?: (value: T) => void
  className?: string
}

export function TabSwitcher<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: TabSwitcherProps<T>) {
  return (
    <div
      role="tablist"
      className={cn('flex items-end gap-5 border-b border-hairline', className)}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(opt.value)}
            className={cn(
              'focusable label-mono -mb-px border-b-2 pb-2 transition-colors',
              active
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
