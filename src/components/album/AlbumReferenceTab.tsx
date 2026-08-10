import { FileIcon, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { Button } from '@/components/ui/button'
import {
  addAlbumReferenceFile,
  removeAlbumReferenceFile,
  useAlbumReferenceFiles,
} from '@/hooks/useAlbumReferenceFiles'
import { updateAlbum } from '@/hooks/useAlbums'
import type { Album } from '@/types/album'

interface AlbumReferenceTabProps {
  album: Album
}

export function AlbumReferenceTab({ album }: AlbumReferenceTabProps) {
  const files = useAlbumReferenceFiles(album.id)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [content, setContent] = useState(album.referenceMaterial ?? '')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    setContent(album.referenceMaterial ?? '')
  }, [album.referenceMaterial])

  async function handleContentChange(html: string) {
    setContent(html)
    try {
      await updateAlbum({
        id: album.id,
        referenceMaterial: html === '<p></p>' ? null : html,
      })
    } catch {
      // updateAlbum already logs the error
    }
  }

  async function handleUpload(uploaded: FileList | null) {
    const fileList = uploaded ? Array.from(uploaded) : []
    if (fileList.length === 0) {
      return
    }

    setIsUploading(true)
    try {
      for (const file of fileList) {
        await addAlbumReferenceFile(album.id, file)
      }
    } catch {
      // addAlbumReferenceFile already logs the error
    } finally {
      setIsUploading(false)
    }
  }

  async function handleRemove(fileId: string) {
    try {
      await removeAlbumReferenceFile(fileId)
    } catch {
      // removeAlbumReferenceFile already logs the error
    }
  }

  return (
    <div className="space-y-4">
      <RichTextEditor
        content={content}
        onChange={(html) => void handleContentChange(html)}
        placeholder="Reference notes, links, technique references..."
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Attachments</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="size-4" />
            {isUploading ? 'Uploading...' : 'Add File'}
          </Button>
        </div>
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

        {files === undefined ? (
          <p className="text-sm text-muted-foreground">Loading attachments...</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground">No file attachments yet.</p>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm">{file.filename}</span>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => void handleRemove(file.id)}
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
