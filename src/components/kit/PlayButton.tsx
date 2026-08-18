import { Pause, Play } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from './cn'
import type { IconButtonSize } from './IconButton'

// ─────────────────────────────────────────────────────────────────────────
// PlayButton — round vermillion play/pause. Hollow triangle (stroke, no
// fill) in primary-foreground, same as other vermillion buttons.
// ─────────────────────────────────────────────────────────────────────────

const SIZE: Record<IconButtonSize, string> = {
  sm: 'size-8',
  md: 'size-9',
  lg: 'size-10',
  xl: 'size-14',
}

export interface PlayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  playing?: boolean
  size?: IconButtonSize
  /** Accessible label — required since the button has no visible text. */
  'aria-label': string
}

export const PlayButton = forwardRef<HTMLButtonElement, PlayButtonProps>(function PlayButton(
  {
    playing = false,
    size = 'sm',
    className,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'focusable inline-flex items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground noise hover:brightness-110 disabled:pointer-events-none disabled:opacity-40',
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {playing ? (
        <Pause size={14} strokeWidth={2} className="fill-none" />
      ) : (
        <Play size={14} strokeWidth={2} className="fill-none" />
      )}
    </button>
  )
})
