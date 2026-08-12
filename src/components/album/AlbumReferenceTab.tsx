import { Link2, Music, Trash2, Type } from 'lucide-react'
import { useRef, useState } from 'react'

import { AudioPlayer } from '@/components/player/AudioPlayer'
import { AutoSaveTextarea } from '@/components/shared/AutoSaveTextarea'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  addAlbumAudioReference,
  addAlbumLinkReference,
  addAlbumTextReference,
  deleteAlbumReference,
  updateAlbumReference,
  useReferencesForAlbum,
} from '@/hooks/useAlbumReferences'

interface AlbumReferenceTabProps {
  albumId: string
}

export function AlbumReferenceTab({ albumId }: AlbumReferenceTabProps) {
  const references = useReferencesForAlbum(albumId)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const [textDraft, setTextDraft] = useState('')
  const [linkDraft, setLinkDraft] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  async function handleAddText() {
    const content = textDraft.trim()
    if (!content) {
      return
    }

    setIsAdding(true)
    try {
      await addAlbumTextReference(albumId, content)
      setTextDraft('')
    } catch {
      // addAlbumTextReference already logs the error
    } finally {
      setIsAdding(false)
    }
  }

  async function handleAddLink() {
    const url = linkDraft.trim()
    if (!url) {
      return
    }

    setIsAdding(true)
    try {
      await addAlbumLinkReference(albumId, url)
      setLinkDraft('')
    } catch {
      // addAlbumLinkReference already logs the error
    } finally {
      setIsAdding(false)
    }
  }

  async function handleAudioImport(files: FileList | null) {
    const file = files?.[0]
    if (!file) {
      return
    }

    setIsAdding(true)
    try {
      await addAlbumAudioReference(albumId, file)
    } catch {
      // addAlbumAudioReference already logs the error
    } finally {
      setIsAdding(false)
    }
  }

  async function handleTextSave(referenceId: string, text: string) {
    try {
      await updateAlbumReference({ id: referenceId, text })
    } catch {
      // updateAlbumReference already logs the error
    }
  }

  async function handleDelete(referenceId: string) {
    try {
      await deleteAlbumReference(referenceId)
    } catch {
      // deleteAlbumReference already logs the error
    }
  }

  function getReferenceLabel(ref: {
    text: string | null
    url: string | null
    audioBlob: Blob | null
  }) {
    if (ref.audioBlob) return 'audio'
    if (ref.url) return 'link'
    return 'text'
  }

  if (references === undefined) {
    return <p className="text-sm text-muted-foreground">Loading references...</p>
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border p-3">
        <p className="text-xs font-medium text-muted-foreground">Add reference</p>
        <Textarea
          value={textDraft}
          onChange={(event) => setTextDraft(event.target.value)}
          placeholder="Text note..."
          rows={2}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!textDraft.trim() || isAdding}
          onClick={() => void handleAddText()}
        >
          <Type className="size-4" />
          Add Text
        </Button>

        <div className="flex gap-2">
          <Input
            value={linkDraft}
            onChange={(event) => setLinkDraft(event.target.value)}
            placeholder="https://..."
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!linkDraft.trim() || isAdding}
            onClick={() => void handleAddLink()}
          >
            <Link2 className="size-4" />
            Add URL
          </Button>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isAdding}
          onClick={() => audioInputRef.current?.click()}
        >
          <Music className="size-4" />
          Import Audio
        </Button>
        <input
          ref={audioInputRef}
          type="file"
          accept=".wav,.mp3,.aiff,.aif,audio/*"
          className="hidden"
          onChange={(event) => {
            void handleAudioImport(event.target.files)
            event.target.value = ''
          }}
        />
      </div>

      {references.length === 0 ? (
        <p className="text-sm text-muted-foreground">No references yet.</p>
      ) : null}

      {references.map((reference) => (
        <div key={reference.id} className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase text-muted-foreground">
              {getReferenceLabel(reference)}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => void handleDelete(reference.id)}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Remove reference</span>
            </Button>
          </div>

          {reference.text !== null && !reference.audioBlob ? (
            <AutoSaveTextarea
              initialValue={reference.text}
              onSave={(text) => void handleTextSave(reference.id, text)}
              rows={3}
            />
          ) : null}

          {reference.url ? (
            <a
              href={reference.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              {reference.url}
            </a>
          ) : null}

          {reference.audioBlob ? (
            <div className="space-y-1">
              {reference.text ? (
                <p className="text-sm font-medium">{reference.text}</p>
              ) : null}
              <AudioPlayer
                blob={reference.audioBlob}
                filename={reference.text ?? 'audio'}
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
