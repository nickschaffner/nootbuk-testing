import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
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
import {
  createInstrument,
  useAllInstruments,
  useIdeaCountsByInstrument,
} from '@/hooks/useInstruments'
import {
  defaultSynthPatchForType,
  formatInstrumentType,
  INSTRUMENT_TYPES,
} from '@/lib/instrument-utils'
import type { InstrumentType } from '@/types/instrument'

export function InstrumentsPage() {
  const navigate = useNavigate()
  const instruments = useAllInstruments()
  const ideaCounts = useIdeaCountsByInstrument()

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<InstrumentType>('keys')
  const [isCreating, setIsCreating] = useState(false)

  async function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) {
      return
    }

    setIsCreating(true)
    try {
      const enginePatch = defaultSynthPatchForType(type)
      const instrument = await createInstrument({
        name: trimmed,
        type,
        defaultPatch: enginePatch === 'muted' ? null : enginePatch,
      })
      setName('')
      setType('keys')
      setShowForm(false)
      navigate(`/instruments/${instrument.id}`)
    } catch {
      // createInstrument already logs
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Instruments</h1>
          <p className="text-muted-foreground">
            Your gear list — link ideas to real instruments.
          </p>
        </div>
        <Button
          onClick={() => setShowForm((open) => !open)}
          variant={showForm ? 'outline' : 'default'}
        >
          <Plus className="size-4" />
          {showForm ? 'Cancel' : 'Add Instrument'}
        </Button>
      </div>

      {showForm ? (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-instrument-name">Name</Label>
              <Input
                id="new-instrument-name"
                value={name}
                placeholder="Casio CT-X700"
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void handleCreate()
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(next) => setType(next as InstrumentType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSTRUMENT_TYPES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {formatInstrumentType(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            disabled={!name.trim() || isCreating}
            onClick={() => void handleCreate()}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </div>
      ) : null}

      {instruments === undefined ? (
        <p className="text-sm text-muted-foreground">Loading instruments...</p>
      ) : instruments.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No instruments yet. Add your first bass, keys, or synth.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {instruments.map((instrument) => {
            const ideaCount = ideaCounts?.get(instrument.id) ?? 0

            return (
              <li key={instrument.id}>
                <Link
                  to={`/instruments/${instrument.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">
                    {instrument.name}
                  </p>
                  <Badge variant="outline" className="shrink-0">
                    {formatInstrumentType(instrument.type)}
                  </Badge>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {ideaCount} {ideaCount === 1 ? 'idea' : 'ideas'}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
