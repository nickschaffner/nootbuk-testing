import { cn } from '@/lib/utils'

const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const BLACK_NOTES = [
  { name: 'C#', afterWhiteIndex: 0 },
  { name: 'D#', afterWhiteIndex: 1 },
  { name: 'F#', afterWhiteIndex: 3 },
  { name: 'G#', afterWhiteIndex: 4 },
  { name: 'A#', afterWhiteIndex: 5 },
] as const

type KeyLit = 'primary' | 'secondary' | null

interface PianoKeyboardProps {
  octaves: number[]
  /** Pressed / root keys — full primary orange. */
  primaryKeys?: ReadonlySet<string>
  /** Auto chord tones — softer orange. */
  secondaryKeys?: ReadonlySet<string>
  isEditing?: boolean
  editingLabel?: string | null
  disabled?: boolean
  onNoteEnter?: (noteName: string, octave: number) => void
  onNoteLeave?: () => void
  onNoteClick: (noteName: string, octave: number) => void
  className?: string
}

function keyLit(
  keyId: string,
  primaryKeys?: ReadonlySet<string>,
  secondaryKeys?: ReadonlySet<string>,
): KeyLit {
  if (primaryKeys?.has(keyId)) {
    return 'primary'
  }
  if (secondaryKeys?.has(keyId)) {
    return 'secondary'
  }
  return null
}

function OctaveKeyboard({
  octave,
  primaryKeys,
  secondaryKeys,
  disabled = false,
  onNoteEnter,
  onNoteLeave,
  onNoteClick,
}: {
  octave: number
  primaryKeys?: ReadonlySet<string>
  secondaryKeys?: ReadonlySet<string>
  disabled?: boolean
  onNoteEnter?: (noteName: string, octave: number) => void
  onNoteLeave?: () => void
  onNoteClick: (noteName: string, octave: number) => void
}) {
  return (
    <div className="relative flex h-36 min-w-0 flex-1 gap-0.5">
      {WHITE_NOTES.map((name) => {
        const keyId = `${name}${octave}`
        const lit = keyLit(keyId, primaryKeys, secondaryKeys)
        return (
          <button
            key={keyId}
            type="button"
            disabled={disabled}
            className={cn(
              'relative flex flex-1 flex-col justify-end rounded-b-md border border-border bg-background pb-2 text-xs font-medium transition-colors',
              lit === 'primary' && 'bg-primary text-primary-foreground',
              lit === 'secondary' && 'bg-primary/30 text-foreground',
              disabled
                ? 'cursor-not-allowed opacity-50'
                : !lit && 'hover:bg-muted/80',
            )}
            onPointerDown={(event) => {
              if (disabled || event.button !== 0) {
                return
              }
              onNoteEnter?.(name, octave)
            }}
            onMouseEnter={() => {
              if (!disabled) {
                onNoteEnter?.(name, octave)
              }
            }}
            onMouseLeave={() => {
              if (!disabled) {
                onNoteLeave?.()
              }
            }}
            onClick={() => {
              if (!disabled) {
                onNoteClick(name, octave)
              }
            }}
          >
            <span className={cn(!lit && 'text-muted-foreground')}>{name}</span>
          </button>
        )
      })}

      {BLACK_NOTES.map(({ name, afterWhiteIndex }) => {
        const keyId = `${name}${octave}`
        const lit = keyLit(keyId, primaryKeys, secondaryKeys)
        const leftPercent =
          ((afterWhiteIndex + 1) / WHITE_NOTES.length) * 100 -
          100 / WHITE_NOTES.length / 2
        return (
          <button
            key={keyId}
            type="button"
            disabled={disabled}
            className={cn(
              'absolute top-0 z-10 flex h-[58%] w-[9%] -translate-x-1/2 flex-col justify-end rounded-b-md border border-border bg-foreground pb-1.5 text-[10px] font-medium text-background transition-colors',
              lit === 'primary' && 'bg-primary text-primary-foreground',
              lit === 'secondary' && 'bg-primary/45 text-primary-foreground',
              disabled
                ? 'cursor-not-allowed opacity-50'
                : !lit && 'hover:bg-foreground/90',
            )}
            style={{ left: `${leftPercent}%` }}
            onPointerDown={(event) => {
              if (disabled || event.button !== 0) {
                return
              }
              onNoteEnter?.(name, octave)
            }}
            onMouseEnter={() => {
              if (!disabled) {
                onNoteEnter?.(name, octave)
              }
            }}
            onMouseLeave={() => {
              if (!disabled) {
                onNoteLeave?.()
              }
            }}
            onClick={() => {
              if (!disabled) {
                onNoteClick(name, octave)
              }
            }}
          >
            <span>{name}</span>
          </button>
        )
      })}
    </div>
  )
}

export function PianoKeyboard({
  octaves,
  primaryKeys,
  secondaryKeys,
  isEditing = false,
  editingLabel,
  disabled = false,
  onNoteEnter,
  onNoteLeave,
  onNoteClick,
  className,
}: PianoKeyboardProps) {
  return (
    <div
      className={cn(
        'relative w-full select-none rounded-md',
        isEditing && 'border-2 border-primary p-2',
        className,
      )}
    >
      {isEditing && editingLabel ? (
        <p className="mb-2 text-xs font-medium text-primary">
          Editing {editingLabel}
        </p>
      ) : null}
      <div className="flex w-full gap-0.5">
        {octaves.map((octave) => (
          <OctaveKeyboard
            key={octave}
            octave={octave}
            primaryKeys={primaryKeys}
            secondaryKeys={secondaryKeys}
            disabled={disabled}
            onNoteEnter={onNoteEnter}
            onNoteLeave={onNoteLeave}
            onNoteClick={onNoteClick}
          />
        ))}
      </div>
    </div>
  )
}
