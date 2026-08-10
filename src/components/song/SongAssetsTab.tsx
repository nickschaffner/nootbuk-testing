import { FileIcon, Plus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { addAssetToSong, removeAsset, useAssetsForSong } from '@/hooks/useAssets'

interface SongAssetsTabProps {
  songId: string
}

export function SongAssetsTab({ songId }: SongAssetsTabProps) {
  const assets = useAssetsForSong(songId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  async function handleUpload(files: FileList | null) {
    const fileList = files ? Array.from(files) : []
    if (fileList.length === 0) {
      return
    }

    setIsUploading(true)
    try {
      for (const file of fileList) {
        await addAssetToSong(songId, file)
      }
    } catch {
      // addAssetToSong already logs the error
    } finally {
      setIsUploading(false)
    }
  }

  async function handleRemove(assetId: string) {
    try {
      await removeAsset(assetId)
    } catch {
      // removeAsset already logs the error
    }
  }

  if (assets === undefined) {
    return <p className="text-sm text-muted-foreground">Loading assets...</p>
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        <Plus className="size-4" />
        {isUploading ? 'Uploading...' : 'Upload Files'}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          void handleUpload(event.target.files)
          event.target.value = ''
        }}
      />

      {assets.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No assets yet. Upload artwork, photos, or documents.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {assets.map((asset) => {
            const objectUrl = URL.createObjectURL(asset.blob)

            return (
              <div
                key={asset.id}
                className="group relative overflow-hidden rounded-lg border bg-muted/20"
              >
                {asset.type === 'artwork' ? (
                  <img
                    src={objectUrl}
                    alt={asset.filename}
                    className="aspect-square w-full object-cover"
                    onLoad={() => URL.revokeObjectURL(objectUrl)}
                  />
                ) : (
                  <div className="flex aspect-square flex-col items-center justify-center gap-2 p-3 text-center">
                    <FileIcon className="size-8 text-muted-foreground" />
                    <p className="line-clamp-2 text-xs">{asset.filename}</p>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 border-t px-2 py-1.5">
                  <p className="truncate text-xs">{asset.filename}</p>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0"
                    onClick={() => void handleRemove(asset.id)}
                  >
                    <Trash2 className="size-3.5" />
                    <span className="sr-only">Remove asset</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
