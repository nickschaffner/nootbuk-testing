import { useState } from 'react'

import { seedSampleData } from '@/components/calibration/seedSampleData'
import { Button } from '@/components/ui/button'

interface SeedSampleDataToolProps {
  onComplete?: () => void
}

export function SeedSampleDataTool({ onComplete }: SeedSampleDataToolProps) {
  const [isSeeding, setIsSeeding] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSeed() {
    setIsSeeding(true)
    setMessage(null)
    try {
      await seedSampleData()
      setMessage(
        'Seeded 3 instruments, 8 pool ideas, 2 songs (with sections/ideas/journal/todos), and 1 album.',
      )
      onComplete?.()
    } catch (error) {
      console.warn('seedSampleData failed:', error)
      setMessage(
        error instanceof Error ? error.message : 'Failed to seed sample data.',
      )
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
      <div>
        <h2 className="text-base font-semibold">Seed Sample Data</h2>
        <p className="text-sm text-muted-foreground">
          Inserts metadata-only test records (no audio/MIDI blobs) so the UI has
          content to display.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={isSeeding}
        onClick={() => void handleSeed()}
      >
        {isSeeding ? 'Seeding...' : 'Seed Sample Data'}
      </Button>

      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </section>
  )
}
