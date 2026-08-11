import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createInstrument, useAllInstruments } from '@/hooks/useInstruments'
import { useSynth } from '@/hooks/useSynth'
import {
  defaultSynthPatchForType,
  formatInstrumentType,
  INSTRUMENT_TYPES,
  type PlaybackPatchId,
} from '@/lib/instrument-utils'
import type { InstrumentType } from '@/types/instrument'

export type InstrumentSelection = {
  instrumentId: string | null
  instrumentName: string | null
}

interface InstrumentSelectorProps {
  id?: string
  value: InstrumentSelection
  onChange: (value: InstrumentSelection) => void
  /** Fired when instrument selection implies a default synth patch. */
  onAutoPatch?: (patch: PlaybackPatchId) => void
}

export function InstrumentSelector({
  id,
  value,
  onChange,
  onAutoPatch,
}: InstrumentSelectorProps) {
  const instruments = useAllInstruments()
  const { setPatch } = useSynth()

  const [showAddNew, setShowAddNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<InstrumentType>('keys')
  const [isCreating, setIsCreating] = useState(false)

  const legacyOnly =
    !value.instrumentId && Boolean(value.instrumentName?.trim())

  function applyInstrument(
    instrumentId: string | null,
    instrumentName: string | null,
    type: InstrumentType | null,
  ) {
    if (!instrumentId || !type) {
      onChange({ instrumentId: null, instrumentName: null })
      const patch: PlaybackPatchId = 'piano'
      void setPatch(patch)
      onAutoPatch?.(patch)
      return
    }

    const patch = defaultSynthPatchForType(type)
    void setPatch(patch)
    onAutoPatch?.(patch)
    onChange({ instrumentId, instrumentName })
  }

  async function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) {
      return
    }

    setIsCreating(true)
    try {
      const enginePatch = defaultSynthPatchForType(newType)
      const instrument = await createInstrument({
        name: trimmed,
        type: newType,
        defaultPatch: enginePatch === 'muted' ? null : enginePatch,
      })
      applyInstrument(instrument.id, instrument.name, instrument.type)
      setNewName('')
      setNewType('keys')
      setShowAddNew(false)
    } catch {
      // createInstrument already logs
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={id}>Instrument</Label>
        <Select
          value={
            showAddNew
              ? '__add_new__'
              : value.instrumentId
                ? value.instrumentId
                : legacyOnly
                  ? '__legacy__'
                  : '__none__'
          }
          onValueChange={(next) => {
            if (next === '__add_new__') {
              setShowAddNew(true)
              return
            }
            setShowAddNew(false)
            if (next === '__none__') {
              applyInstrument(null, null, null)
              return
            }
            if (next === '__legacy__') {
              return
            }
            const instrument = (instruments ?? []).find((item) => item.id === next)
            if (instrument) {
              applyInstrument(instrument.id, instrument.name, instrument.type)
            }
          }}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Select instrument" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {legacyOnly ? (
              <SelectItem value="__legacy__">
                {value.instrumentName} (unlinked)
              </SelectItem>
            ) : null}
            {(instruments ?? []).map((instrument) => (
              <SelectItem key={instrument.id} value={instrument.id}>
                {instrument.name}
              </SelectItem>
            ))}
            <SelectItem value="__add_new__">Add New…</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showAddNew ? (
        <div className="space-y-3 rounded-md border p-3">
          <p className="text-xs font-medium text-muted-foreground">
            New instrument
          </p>
          <div className="space-y-2">
            <Label htmlFor={`${id ?? 'instrument'}-new-name`}>Name</Label>
            <Input
              id={`${id ?? 'instrument'}-new-name`}
              value={newName}
              placeholder="Danelectro Longhorn"
              onChange={(event) => setNewName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={newType}
              onValueChange={(next) => setNewType(next as InstrumentType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INSTRUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {formatInstrumentType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!newName.trim() || isCreating}
              onClick={() => void handleCreate()}
            >
              {isCreating ? 'Creating...' : 'Create & select'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowAddNew(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
