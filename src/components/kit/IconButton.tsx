import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from './cn'

// ─────────────────────────────────────────────────────────────────────────
// IconButton — a single-glyph action. Pass one icon as children.
//   shape:   square (default, Swiss) · round
//   variant: solid (vermillion) · outline · ghost
//   size:    sm (h-8) · md (h-9) · lg (h-10) · xl (h-14)
// ─────────────────────────────────────────────────────────────────────────

export type IconButtonShape = 'square' | 'round'
export type IconButtonVariant = 'solid' | 'outline' | 'ghost'
export type IconButtonSize = 'sm' | 'md' | 'lg' | 'xl'

const VARIANT: Record<IconButtonVariant, string> = {
  solid: 'noise bg-primary text-primary-foreground border border-primary hover:brightness-110',
  outline:
    'bg-transparent text-foreground border border-foreground hover:bg-foreground hover:text-background',
  ghost: 'bg-transparent text-foreground border border-transparent hover:bg-muted',
}

const SIZE: Record<IconButtonSize, string> = {
  sm: 'size-8',
  md: 'size-9',
  lg: 'size-10',
  xl: 'size-14',
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  shape?: IconButtonShape
  variant?: IconButtonVariant
  size?: IconButtonSize
  /** Accessible label — required since the button has no visible text. */
  'aria-label': string
  children: ReactNode
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { shape = 'square', variant = 'ghost', size = 'md', className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'focusable inline-flex items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-40',
        shape === 'round' ? 'rounded-full' : 'rounded-xs',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})
