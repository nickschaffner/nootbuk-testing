import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
  deleteInstrument,
  updateInstrument,
  useIdeaCountForInstrument,
  useInstrument,
} from '@/hooks/useInstruments'
import {
  defaultSynthPatchForType,
  formatInstrumentType,
  INSTRUMENT_TYPES,
} from '@/lib/instrument-utils'
import type { InstrumentType } from '@/types/instrument'

export function InstrumentEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const instrument = useInstrument(id)
  const ideaCount = useIdeaCountForInstrument(id)

  const [name, setName] = useState('')
  const [type, setType] = useState<InstrumentType>('keys')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!instrument) {
      return
    }
    setName(instrument.name)
    setType(instrument.type)
  }, [instrument])

  if (instrument === undefined) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  if (!instrument) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Instrument not found.</p>
        <Button asChild variant="outline">
          <Link to="/instruments">Back to Instruments</Link>
        </Button>
      </div>
    )
  }

  async function persistName() {
    const trimmed = name.trim()
    if (!trimmed || !instrument || trimmed === instrument.name) {
      return
    }
    try {
      await updateInstrument({ id: instrument.id, name: trimmed })
    } catch {
      // logged
    }
  }

  async function persistType(next: InstrumentType) {
    if (!instrument) {
      return
    }
    setType(next)
    const enginePatch = defaultSynthPatchForType(next)
    try {
      await updateInstrument({
        id: instrument.id,
        type: next,
        defaultPatch: enginePatch === 'muted' ? null : enginePatch,
      })
    } catch {
      // logged
    }
  }

  async function handleDelete() {
    if (!instrument) {
      return
    }
    setIsDeleting(true)
    try {
      await deleteInstrument(instrument.id)
      navigate('/instruments')
    } catch {
      // logged
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon-sm">
          <Link to="/instruments" aria-label="Back to instruments">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {instrument.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Used by {ideaCount ?? 0} {(ideaCount ?? 0) === 1 ? 'idea' : 'ideas'}
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              disabled={isDeleting}
              aria-label="Delete instrument"
            >
              <Trash2 />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete “{instrument.name}”?</AlertDialogTitle>
              <AlertDialogDescription>
                {(ideaCount ?? 0) > 0
                  ? `This unlinks ${ideaCount} ${(ideaCount ?? 0) === 1 ? 'idea' : 'ideas'} from this instrument (their freeform names stay). `
                  : ''}
                This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isDeleting}
                onClick={(event) => {
                  event.preventDefault()
                  void handleDelete()
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <div className="space-y-2">
          <Label htmlFor="instrument-name">Name</Label>
          <Input
            id="instrument-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => void persistName()}
          />
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={type}
            onValueChange={(next) => void persistType(next as InstrumentType)}
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
    </div>
  )
}
