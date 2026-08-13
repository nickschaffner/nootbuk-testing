import { cn } from '@/lib/utils'

const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const BLACK_NOTES = [
  { name: 'C#', afterWhiteIndex: 0 },
  { name: 'D#', afterWhiteIndex: 1 },
  { name: 'F#', afterWhiteIndex: 3 },
  { name: 'G#', afterWhiteIndex: 4 },
  { name: 'A#', afterWhiteIndex: 5 },
] as const

interface PianoKeyboardProps {
  octaves: number[]
  highlightedKeys?: ReadonlySet<string>
  isEditing?: boolean
  editingLabel?: string | null
  onNoteEnter?: (noteName: string, octave: number) => void
  onNoteLeave?: () => void
  onNoteClick: (noteName: string, octave: number) => void
  className?: string
}

function OctaveKeyboard({
  octave,
  highlightedKeys,
  onNoteEnter,
  onNoteLeave,
  onNoteClick,
}: {
  octave: number
  highlightedKeys?: ReadonlySet<string>
  onNoteEnter?: (noteName: string, octave: number) => void
  onNoteLeave?: () => void
  onNoteClick: (noteName: string, octave: number) => void
}) {
  return (
    <div className="relative flex h-36 min-w-0 flex-1 gap-0.5">
      {WHITE_NOTES.map((name) => {
        const keyId = `${name}${octave}`
        const lit = highlightedKeys?.has(keyId)
        return (
          <button
            key={keyId}
            type="button"
            className={cn(
              'relative flex flex-1 flex-col justify-end rounded-b-md border border-border bg-background pb-2 text-xs font-medium transition-colors',
              lit && 'bg-primary/25',
              'hover:bg-muted/80',
            )}
            onMouseEnter={() => onNoteEnter?.(name, octave)}
            onMouseLeave={() => onNoteLeave?.()}
            onClick={() => onNoteClick(name, octave)}
          >
            <span className="text-muted-foreground">{name}</span>
          </button>
        )
      })}

      {BLACK_NOTES.map(({ name, afterWhiteIndex }) => {
        const keyId = `${name}${octave}`
        const lit = highlightedKeys?.has(keyId)
        const leftPercent =
          ((afterWhiteIndex + 1) / WHITE_NOTES.length) * 100 -
          100 / WHITE_NOTES.length / 2
        return (
          <button
            key={keyId}
            type="button"
            className={cn(
              'absolute top-0 z-10 flex h-[58%] w-[9%] -translate-x-1/2 flex-col justify-end rounded-b-md border border-border bg-foreground pb-1.5 text-[10px] font-medium text-background transition-colors',
              lit && 'bg-primary text-primary-foreground',
              'hover:bg-foreground/90',
            )}
            style={{ left: `${leftPercent}%` }}
            onMouseEnter={() => onNoteEnter?.(name, octave)}
            onMouseLeave={() => onNoteLeave?.()}
            onClick={() => onNoteClick(name, octave)}
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
  highlightedKeys,
  isEditing = false,
  editingLabel,
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
            highlightedKeys={highlightedKeys}
            onNoteEnter={onNoteEnter}
            onNoteLeave={onNoteLeave}
            onNoteClick={onNoteClick}
          />
        ))}
      </div>
    </div>
  )
}
