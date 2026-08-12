import { Star, Trash2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { AudioPlayButton } from '@/components/player/AudioPlayButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  addVersion,
  removeVersion,
  setMainVersion,
  updateVersion,
  useVersionsForSong,
} from '@/hooks/useSongVersions'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { SongVersion } from '@/types/song'

interface SongVersionsTabProps {
  songId: string
}

export function SongVersionsTab({ songId }: SongVersionsTabProps) {
  const versions = useVersionsForSong(songId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setIsUploading(true)
    try {
      const isFirst = (versions?.length ?? 0) === 0
      await addVersion(songId, file, file.name.replace(/\.[^.]+$/, ''), isFirst)
    } catch {
      // addVersion already logs the error
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (versions === undefined) {
    return <p className="text-sm text-muted-foreground">Loading versions...</p>
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="version-upload">Upload audio version</Label>
        <input
          ref={fileInputRef}
          id="version-upload"
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(event) => void handleUpload(event)}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="size-4" />
          {isUploading ? 'Uploading...' : 'Upload Audio'}
        </Button>
      </div>

      {versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No versions yet. Upload an audio file to get started.
        </p>
      ) : (
        <ul className="space-y-2">
          {versions.map((version) => (
            <VersionRow key={version.id} version={version} songId={songId} />
          ))}
        </ul>
      )}
    </div>
  )
}

function VersionRow({
  version,
  songId,
}: {
  version: SongVersion
  songId: string
}) {
  const [label, setLabel] = useState(version.label ?? '')
  const [isRemoving, setIsRemoving] = useState(false)
  const [isSettingMain, setIsSettingMain] = useState(false)

  useEffect(() => {
    setLabel(version.label ?? '')
  }, [version.label])

  async function handleLabelBlur() {
    const trimmed = label.trim()
    const nextLabel = trimmed || null
    if (nextLabel === version.label) {
      return
    }

    try {
      await updateVersion({ id: version.id, label: nextLabel })
    } catch {
      // updateVersion already logs the error
    }
  }

  async function handleSetMain() {
    if (version.isMain) {
      return
    }

    setIsSettingMain(true)
    try {
      await setMainVersion(version.id, songId)
    } catch {
      // setMainVersion already logs the error
    } finally {
      setIsSettingMain(false)
    }
  }

  async function handleRemove() {
    setIsRemoving(true)
    try {
      await removeVersion(version.id)
    } catch {
      // removeVersion already logs the error
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <li className="space-y-2 rounded-md border bg-card p-3">
      <div className="flex items-start gap-2">
        <AudioPlayButton blob={version.blob} className="shrink-0" />

        <div className="min-w-0 flex-1 space-y-2">
          <Input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            onBlur={() => void handleLabelBlur()}
            placeholder={version.filename}
            className="h-8"
          />
          <p className="text-xs text-muted-foreground">
            Uploaded {formatRelativeTime(version.createdAt)}
          </p>
        </div>

        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className={cn(
            'shrink-0',
            version.isMain
              ? 'text-amber-500 hover:text-amber-500'
              : 'text-muted-foreground',
          )}
          disabled={isSettingMain || version.isMain}
          onClick={() => void handleSetMain()}
          aria-label={version.isMain ? 'Main version' : 'Set as main version'}
        >
          <Star className={cn('size-4', version.isMain && 'fill-current')} />
        </Button>

        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          disabled={isRemoving}
          onClick={() => void handleRemove()}
          aria-label="Delete version"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </li>
  )
}
