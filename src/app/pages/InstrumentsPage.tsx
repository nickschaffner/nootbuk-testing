import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button, PageHeader } from '@/components/kit'
import {
  createInstrument,
  useAllInstruments,
  useIdeaCountsByInstrument,
} from '@/hooks/useInstruments'
import {
  defaultSynthPatchForType,
  formatInstrumentType,
} from '@/lib/instrument-utils'

export function InstrumentsPage() {
  const navigate = useNavigate()
  const instruments = useAllInstruments()
  const ideaCounts = useIdeaCountsByInstrument()
  const [isCreating, setIsCreating] = useState(false)

  async function handleNewInstrument() {
    setIsCreating(true)
    try {
      const enginePatch = defaultSynthPatchForType('other')
      const instrument = await createInstrument({
        name: 'Untitled Instrument',
        type: 'other',
        defaultPatch: enginePatch === 'muted' ? null : enginePatch,
      })
      navigate(`/instruments/${instrument.id}`)
    } catch {
      // createInstrument already logs
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instruments"
        action={
          <Button
            variant="secondary"
            size="sm"
            disabled={isCreating}
            onClick={() => void handleNewInstrument()}
          >
            {isCreating ? 'Creating...' : '+ New Instrument'}
          </Button>
        }
      />

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
