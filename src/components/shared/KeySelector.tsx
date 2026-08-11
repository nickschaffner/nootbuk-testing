import { KEY_ROOT_OPTIONS, buildKeyValue, parseKeyValue, type KeyMode } from '@/lib/keys'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface KeySelectorProps {
  id?: string
  value: string | null
  onChange: (value: string | null) => void
  className?: string
  /** Compact layout for headers */
  compact?: boolean
}

export function KeySelector({
  id,
  value,
  onChange,
  className,
  compact = false,
}: KeySelectorProps) {
  const parsed = parseKeyValue(value)
  const rootId = parsed?.rootId ?? 'none'
  const mode: KeyMode = parsed?.mode ?? 'major'

  function handleRootChange(next: string) {
    if (next === 'none') {
      onChange(null)
      return
    }
    onChange(buildKeyValue(next, mode))
  }

  function handleModeChange(next: KeyMode) {
    if (rootId === 'none') {
      return
    }
    onChange(buildKeyValue(rootId, next))
  }

  return (
    <div className={cn('flex gap-2', compact ? 'items-end' : 'items-end', className)}>
      <div className={cn('min-w-0 flex-1 space-y-1', compact && 'space-y-1')}>
        {!compact ? (
          <Label htmlFor={id}>Key</Label>
        ) : (
          <label className="text-xs text-muted-foreground">Key</label>
        )}
        <Select value={rootId} onValueChange={handleRootChange}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Unset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Unset</SelectItem>
            {KEY_ROOT_OPTIONS.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-[7.5rem] shrink-0 space-y-1">
        {!compact ? (
          <Label>Mode</Label>
        ) : (
          <label className="text-xs text-muted-foreground">Mode</label>
        )}
        <Select
          value={mode}
          onValueChange={(next) => handleModeChange(next as KeyMode)}
          disabled={rootId === 'none'}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
