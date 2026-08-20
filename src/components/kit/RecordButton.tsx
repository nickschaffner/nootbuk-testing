import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Circle } from 'lucide-react'
import { cn } from './cn'

// ─────────────────────────────────────────────────────────────────────────
// RecordButton — the unmistakable capture control. Outer ring stays put;
// inner dot morphs to a same-size stop square while recording (pulses).
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
        'focusable inline-flex items-center justify-center border-2 border-recorder-red bg-transparent text-recorder-red transition-colors hover:bg-recorder-red/10',
        shape === 'round' ? 'rounded-full' : 'rounded-xs',
        s.box,
        className,
      )}
      {...rest}
    >
      {recording ? (
        <span
          className="rec-pulse shrink-0 rounded-[1px] bg-recorder-red"
          style={{ width: s.glyph, height: s.glyph }}
          aria-hidden
        />
      ) : (
        <Circle size={s.glyph} fill="currentColor" strokeWidth={0} aria-hidden />
      )}
    </button>
  )
})
