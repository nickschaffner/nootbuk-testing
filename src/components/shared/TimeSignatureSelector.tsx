import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DEFAULT_TIME_SIGNATURE,
  TIME_SIGNATURE_OPTIONS,
  resolveTimeSignature,
} from '@/lib/time-signature'
import { cn } from '@/lib/utils'

interface TimeSignatureSelectorProps {
  id?: string
  value: string | null | undefined
  onChange: (value: string) => void
  className?: string
  compact?: boolean
  hideLabel?: boolean
}

export function TimeSignatureSelector({
  id,
  value,
  onChange,
  className,
  compact = false,
  hideLabel = false,
}: TimeSignatureSelectorProps) {
  const resolved = resolveTimeSignature(value) || DEFAULT_TIME_SIGNATURE

  return (
    <div
      className={cn(
        hideLabel ? undefined : compact ? 'w-24 space-y-1' : 'space-y-2',
        hideLabel && compact && 'w-24',
        className,
      )}
    >
      {!hideLabel &&
        (compact ? (
          <label htmlFor={id} className="text-xs text-muted-foreground">
            Time
          </label>
        ) : (
          <Label htmlFor={id}>Time</Label>
        ))}
      <Select value={resolved} onValueChange={onChange}>
        <SelectTrigger id={id} className={compact ? 'h-8 w-full' : 'w-full'}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIME_SIGNATURE_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
