import { cn } from './cn'

// ─────────────────────────────────────────────────────────────────────────
// OnScreenKeyboard — a chromatic keyboard for manual note entry. White keys
// flex evenly; black keys float above the seams. Highlight active notes by
// name+octave (e.g. "C#4"). Presentational: pass `octave`, `octaves`,
// `highlighted`, and `onNote`.
// ─────────────────────────────────────────────────────────────────────────

const WHITE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
// black key -> index of the white key it sits after (0-based within an octave)
const BLACK: { note: string; after: number }[] = [
  { note: 'C#', after: 0 },
  { note: 'D#', after: 1 },
  { note: 'F#', after: 3 },
  { note: 'G#', after: 4 },
  { note: 'A#', after: 5 },
]

export interface OnScreenKeyboardProps {
  octave?: number
  octaves?: number
  highlighted?: string[]
  onNote?: (note: string) => void
  showLabels?: boolean
  className?: string
}

export function OnScreenKeyboard({
  octave = 4,
  octaves = 1,
  highlighted = [],
  onNote,
  showLabels = true,
  className,
}: OnScreenKeyboardProps) {
  const set = new Set(highlighted)
  const whitePerOctave = WHITE.length
  const totalWhite = whitePerOctave * octaves

  return (
    <div className={cn('relative flex h-36 w-full select-none', className)} role="group" aria-label="Keyboard">
      {Array.from({ length: octaves }).flatMap((_, o) =>
        WHITE.map((n) => {
          const name = `${n}${octave + o}`
          const active = set.has(name)
          return (
            <button
              key={name}
              type="button"
              onClick={() => onNote?.(name)}
              className={cn(
                'focusable relative flex flex-1 items-end justify-center rounded-b-sm border border-hairline pb-2 transition-colors',
                active ? 'bg-primary/25' : 'bg-keys-white hover:bg-primary/10',
              )}
            >
              {showLabels ? (
                <span className="label-mono text-[0.5rem] text-muted-foreground">{name}</span>
              ) : null}
            </button>
          )
        }),
      )}
      {/* black keys layer */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: octaves }).flatMap((_, o) =>
          BLACK.map((b) => {
            const name = `${b.note}${octave + o}`
            const active = set.has(name)
            const whiteIndex = o * whitePerOctave + b.after
            // center the black key on the seam after its white key
            const left = ((whiteIndex + 1) / totalWhite) * 100
            return (
              <button
                key={name}
                type="button"
                onClick={() => onNote?.(name)}
                style={{ left: `${left}%`, width: `${(1 / totalWhite) * 62}%` }}
                className={cn(
                  'focusable pointer-events-auto absolute top-0 h-[58%] -translate-x-1/2 rounded-b-sm border border-keys-black transition-colors',
                  active ? 'bg-primary' : 'bg-keys-black hover:bg-primary/70',
                )}
                aria-label={name}
              />
            )
          }),
        )}
      </div>
    </div>
  )
}
