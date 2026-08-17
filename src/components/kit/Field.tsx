import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from './cn'

// ─────────────────────────────────────────────────────────────────────────
// Form primitives — a mono micro-label paired with square-cornered fields.
//   MonoLabel  · the uppercase tracked eyebrow
//   Input      · text/number field
//   Textarea   · multiline (lyrics, notes)
//   Field      · label + control wrapper with optional hint
//   Checkbox   · square check
//   Radio      · square radio (Swiss, not round)
// ─────────────────────────────────────────────────────────────────────────

export function MonoLabel({
  children,
  className,
  htmlFor,
}: {
  children: ReactNode
  className?: string
  htmlFor?: string
}) {
  return (
    <label htmlFor={htmlFor} className={cn('label-mono text-muted-foreground', className)}>
      {children}
    </label>
  )
}

const FIELD_BASE =
  'focusable w-full rounded-xs border border-hairline bg-card text-sm text-foreground transition-colors placeholder:text-muted-foreground hover:border-foreground/60 disabled:opacity-40'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(FIELD_BASE, 'h-9 px-3', className)} {...rest} />
  },
)

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 3, ...rest }, ref) {
  return (
    <textarea ref={ref} rows={rows} className={cn(FIELD_BASE, 'resize-y px-3 py-2', className)} {...rest} />
  )
})

export interface FieldProps {
  label: ReactNode
  htmlFor?: string
  hint?: ReactNode
  children: ReactNode
  className?: string
}

export function Field({ label, htmlFor, hint, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <MonoLabel htmlFor={htmlFor}>{label}</MonoLabel>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  )
}

export const Checkbox = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }
>(function Checkbox({ className, label, id, ...rest }, ref) {
  const box = (
    <input
      ref={ref}
      id={id}
      type="checkbox"
      className={cn(
        'focusable size-4 shrink-0 appearance-none rounded-[1px] border border-hairline bg-card transition-colors checked:border-primary checked:bg-primary',
        "checked:bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%2314120d' stroke-width='2.5'%3E%3Cpath d='M3 8l3.5 3.5L13 5'/%3E%3C/svg%3E\")] checked:bg-center checked:bg-no-repeat",
        className,
      )}
      {...rest}
    />
  )
  if (!label) return box
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      {box}
      {label}
    </label>
  )
})

export const Radio = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }
>(function Radio({ className, label, id, ...rest }, ref) {
  const dot = (
    <input
      ref={ref}
      id={id}
      type="radio"
      className={cn(
        'focusable size-4 shrink-0 appearance-none rounded-full border border-hairline bg-card transition-colors checked:border-[5px] checked:border-primary',
        className,
      )}
      {...rest}
    />
  )
  if (!label) return dot
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      {dot}
      {label}
    </label>
  )
})
