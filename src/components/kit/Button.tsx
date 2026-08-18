import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from './cn'

// ─────────────────────────────────────────────────────────────────────────
// Button — the primary text-action control.
//   variant: primary (vermillion fill) · secondary (outline, ink border)
//            outline (hairline) · ghost (bare) · danger · link
//   size:    sm · md · lg
//   block:   full-width
// Square corners, hairline geometry, mono-ish weight. Presentational only.
// ─────────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'noise bg-primary text-primary-foreground border border-primary hover:brightness-110 active:brightness-95',
  secondary:
    'bg-transparent text-foreground border border-foreground hover:bg-foreground hover:text-background',
  outline:
    'bg-transparent text-foreground border border-hairline hover:border-foreground hover:bg-muted',
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
  /** Stretch to the width of the parent. */
  block?: boolean
  /** Optional leading icon element (e.g. a lucide icon). */
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', block = false, icon, className, children, type = 'button', ...rest },
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
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
})
