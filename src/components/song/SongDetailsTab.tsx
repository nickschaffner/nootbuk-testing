import { useEffect, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateSong } from '@/hooks/useSongs'
import type { Song } from '@/types/song'

interface SongDetailsTabProps {
  song: Song
}

type DetailField =
  | 'songwriter'
  | 'publisher'
  | 'ipiNumber'
  | 'masterEngineer'
  | 'copyright'
  | 'sampleCredits'

const DETAIL_FIELDS: Array<{
  key: DetailField
  label: string
  multiline?: boolean
}> = [
  { key: 'songwriter', label: 'Songwriter' },
  { key: 'publisher', label: 'Publisher' },
  { key: 'ipiNumber', label: 'IPI Number' },
  { key: 'masterEngineer', label: 'Master Engineer' },
  { key: 'copyright', label: 'Copyright' },
  { key: 'sampleCredits', label: 'Sample Credits', multiline: true },
]

export function SongDetailsTab({ song }: SongDetailsTabProps) {
  const [values, setValues] = useState<Record<DetailField, string>>({
    songwriter: song.songwriter ?? '',
    publisher: song.publisher ?? '',
    ipiNumber: song.ipiNumber ?? '',
    masterEngineer: song.masterEngineer ?? '',
    copyright: song.copyright ?? '',
    sampleCredits: song.sampleCredits ?? '',
  })

  useEffect(() => {
    setValues({
      songwriter: song.songwriter ?? '',
      publisher: song.publisher ?? '',
      ipiNumber: song.ipiNumber ?? '',
      masterEngineer: song.masterEngineer ?? '',
      copyright: song.copyright ?? '',
      sampleCredits: song.sampleCredits ?? '',
    })
  }, [song])

  async function handleBlur(field: DetailField) {
    const trimmed = values[field].trim()
    const nextValue = trimmed || null
    const currentValue = song[field]

    if (nextValue === currentValue) {
      return
    }

    try {
      await updateSong({ id: song.id, [field]: nextValue })
    } catch {
      // updateSong already logs the error
    }
  }

  return (
    <div className="space-y-4">
      {DETAIL_FIELDS.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={`detail-${field.key}`}>{field.label}</Label>
          {field.multiline ? (
            <Textarea
              id={`detail-${field.key}`}
              value={values[field.key]}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [field.key]: event.target.value,
                }))
              }
              onBlur={() => void handleBlur(field.key)}
              rows={3}
            />
          ) : (
            <Input
              id={`detail-${field.key}`}
              value={values[field.key]}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [field.key]: event.target.value,
                }))
              }
              onBlur={() => void handleBlur(field.key)}
            />
          )}
        </div>
      ))}
    </div>
  )
}
