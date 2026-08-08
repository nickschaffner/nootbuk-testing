import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createSection } from '@/hooks/useSections'

const SECTION_SUGGESTIONS = ['Intro', 'Verse', 'Chorus', 'Bridge', 'Outro']

interface AddSectionFormProps {
  songId: string
}

export function AddSectionForm({ songId }: AddSectionFormProps) {
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleAdd(sectionName: string) {
    const trimmed = sectionName.trim()
    if (!trimmed) {
      return
    }

    setIsSaving(true)
    try {
      await createSection({ songId, name: trimmed, lyrics: null })
      setName('')
    } catch {
      // createSection already logs the error
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-4">
      <div className="flex flex-wrap gap-2">
        {SECTION_SUGGESTIONS.map((suggestion) => (
          <Button
            key={suggestion}
            type="button"
            size="sm"
            variant="outline"
            disabled={isSaving}
            onClick={() => void handleAdd(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Section name..."
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void handleAdd(name)
            }
          }}
        />
        <Button
          type="button"
          disabled={isSaving || !name.trim()}
          onClick={() => void handleAdd(name)}
        >
          Add Section
        </Button>
      </div>
    </div>
  )
}
