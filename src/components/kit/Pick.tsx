import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from './cn'
import type { Option } from './options'

// ─────────────────────────────────────────────────────────────────────────
// Pick — a compact native <select> in the ledger idiom, with a mono label
// above the field. Used for patch, grid/quantize, time signature, key.
// Native select keeps it accessible and dependency-free.
// ─────────────────────────────────────────────────────────────────────────

export interface PickProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: Option[]
  label?: string
  placeholder?: string
}

export const Pick = forwardRef<HTMLSelectElement, PickProps>(function Pick(
  { options, label, placeholder, className, id, ...rest },
  ref,
) {
  const select = (
    <div className="relative">
      <select
        ref={ref}
        id={id}
        className={cn(
          'focusable h-8 w-full appearance-none rounded-xs border border-hairline bg-card pl-2.5 pr-7 text-xs font-medium text-foreground transition-colors hover:border-foreground',
          className,
        )}
        {...rest}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )

  if (!label) return select
  return (
    <label className="block">
      <span className="label-mono mb-1 block text-muted-foreground">{label}</span>
      {select}
    </label>
  )
})
