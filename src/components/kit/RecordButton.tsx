import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Circle, Square } from 'lucide-react'
import { cn } from './cn'

// ─────────────────────────────────────────────────────────────────────────
// RecordButton — the unmistakable capture control. Idle shows a red dot;
// recording shows a stop square and pulses. Round or square framing.
// Purely presentational: pass `recording` and an `onClick`.
// ─────────────────────────────────────────────────────────────────────────

export type RecordButtonSize = 'md' | 'lg'

const SIZE: Record<RecordButtonSize, { box: string; glyph: number }> = {
  md: { box: 'size-12', glyph: 18 },
  lg: { box: 'size-16', glyph: 24 },
}

export interface RecordButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  recording?: boolean
  size?: RecordButtonSize
  shape?: 'round' | 'square'
}

export const RecordButton = forwardRef<HTMLButtonElement, RecordButtonProps>(function RecordButton(
  { recording = false, size = 'md', shape = 'round', className, type = 'button', ...rest },
  ref,
) {
  const s = SIZE[size]
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={recording}
      aria-label={recording ? 'Stop recording' : 'Start recording'}
      className={cn(
        'focusable inline-flex items-center justify-center border-2 border-primary text-primary transition-colors',
        shape === 'round' ? 'rounded-full' : 'rounded-xs',
        recording ? 'noise bg-primary text-primary-foreground rec-pulse' : 'bg-transparent hover:bg-primary/10',
        s.box,
        className,
      )}
      {...rest}
    >
      {recording ? (
        <Square size={s.glyph} fill="currentColor" strokeWidth={0} />
      ) : (
        <Circle size={s.glyph} fill="currentColor" strokeWidth={0} />
      )}
    </button>
  )
})
