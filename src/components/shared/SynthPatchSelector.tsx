import { useEffect } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSynth } from '@/hooks/useSynth'
import {
  parsePlaybackPatch,
  type PlaybackPatchId,
} from '@/lib/instrument-utils'
import { SYNTH_PATCHES } from '@/lib/synth-patches'

interface SynthPatchSelectorProps {
  id?: string
  value: string | null
  onChange: (value: string | null) => void
}

export function SynthPatchSelector({
  id,
  value,
  onChange,
}: SynthPatchSelectorProps) {
  const { setPatch, isLoadingPatch } = useSynth()
  const resolved: PlaybackPatchId = parsePlaybackPatch(value) ?? 'piano'

  useEffect(() => {
    void setPatch(resolved)
  }, [resolved, setPatch])

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Patch</Label>
      <Select
        value={resolved}
        onValueChange={(next) => {
          const patch = next as PlaybackPatchId
          onChange(patch)
          void setPatch(patch)
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SYNTH_PATCHES.map((patch) => (
            <SelectItem key={patch.id} value={patch.id}>
              {patch.label}
            </SelectItem>
          ))}
          <SelectItem value="muted">Muted</SelectItem>
        </SelectContent>
      </Select>
      {isLoadingPatch ? (
        <p className="text-xs text-muted-foreground">Loading soundfont...</p>
      ) : null}
    </div>
  )
}
