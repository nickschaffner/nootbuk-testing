import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from './cn'

// ─────────────────────────────────────────────────────────────────────────
// Button — the primary text-action control.
//   variant: primary (vermillion fill) · secondary (outline) · ghost (bare)
//            danger (destructive outline) · link (underline text)
//   size:    sm · md · lg
// Square corners, hairline geometry, mono-ish weight. Presentational only.
// ─────────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground border border-primary hover:opacity-90 active:opacity-80',
  secondary:
    'bg-transparent text-foreground border border-foreground hover:bg-foreground hover:text-background',
  ghost:
    'bg-transparent text-foreground border border-transparent hover:bg-muted',
  danger:
    'bg-transparent text-primary border border-primary hover:bg-primary hover:text-primary-foreground',
  link: 'bg-transparent text-primary border border-transparent underline underline-offset-4 hover:opacity-80 px-0',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-6 text-sm',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Optional leading icon element (e.g. a lucide icon). */
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'focusable inline-flex items-center justify-center gap-2 rounded-xs font-bold uppercase tracking-wider transition-colors disabled:pointer-events-none disabled:opacity-40',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
})
