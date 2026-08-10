import { useEffect, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateAlbum } from '@/hooks/useAlbums'
import type { Album } from '@/types/album'

interface AlbumCreditsTabProps {
  album: Album
}

type CreditField = 'credits' | 'releaseDate' | 'label' | 'catalogNumber'

export function AlbumCreditsTab({ album }: AlbumCreditsTabProps) {
  const [values, setValues] = useState<Record<CreditField, string>>({
    credits: album.credits ?? '',
    releaseDate: album.releaseDate ?? '',
    label: album.label ?? '',
    catalogNumber: album.catalogNumber ?? '',
  })

  useEffect(() => {
    setValues({
      credits: album.credits ?? '',
      releaseDate: album.releaseDate ?? '',
      label: album.label ?? '',
      catalogNumber: album.catalogNumber ?? '',
    })
  }, [album])

  async function handleBlur(field: CreditField) {
    const trimmed = values[field].trim()
    const nextValue = trimmed || null
    const currentValue = album[field]

    if (nextValue === currentValue) {
      return
    }

    try {
      await updateAlbum({ id: album.id, [field]: nextValue })
    } catch {
      // updateAlbum already logs the error
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="album-credits">Credits</Label>
        <Textarea
          id="album-credits"
          value={values.credits}
          onChange={(event) =>
            setValues((current) => ({ ...current, credits: event.target.value }))
          }
          onBlur={() => void handleBlur('credits')}
          rows={4}
          placeholder="Album-level credits..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="album-release-date">Release Date</Label>
        <Input
          id="album-release-date"
          value={values.releaseDate}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              releaseDate: event.target.value,
            }))
          }
          onBlur={() => void handleBlur('releaseDate')}
          placeholder="2026-08-10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="album-label">Label</Label>
        <Input
          id="album-label"
          value={values.label}
          onChange={(event) =>
            setValues((current) => ({ ...current, label: event.target.value }))
          }
          onBlur={() => void handleBlur('label')}
          placeholder="Record label"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="album-catalog">Catalog Number</Label>
        <Input
          id="album-catalog"
          value={values.catalogNumber}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              catalogNumber: event.target.value,
            }))
          }
          onBlur={() => void handleBlur('catalogNumber')}
          placeholder="CAT-001"
        />
      </div>
    </div>
  )
}
