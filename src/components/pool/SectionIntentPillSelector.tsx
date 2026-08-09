import { cn } from '@/lib/utils'
import type { SectionIntent } from '@/types/idea'

const SECTION_INTENTS: SectionIntent[] = [
  'verse',
  'chorus',
  'bridge',
  'pre-chorus',
  'intro',
  'outro',
  'breakdown',
  'solo',
  'unassigned',
]

function formatIntentLabel(intent: SectionIntent): string {
  return intent
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

interface SectionIntentPillSelectorProps {
  value: SectionIntent | null
  onChange: (intent: SectionIntent | null) => void
  className?: string
}

export function SectionIntentPillSelector({
  value,
  onChange,
  className,
}: SectionIntentPillSelectorProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
          value === null
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        None
      </button>
      {SECTION_INTENTS.map((intent) => (
        <button
          key={intent}
          type="button"
          onClick={() => onChange(intent)}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            value === intent
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {formatIntentLabel(intent)}
        </button>
      ))}
    </div>
  )
}
