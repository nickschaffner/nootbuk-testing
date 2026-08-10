import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createEntry,
  deleteEntry,
  updateEntry,
  useEntriesForSong,
} from '@/hooks/useJournal'

interface SongJournalTabProps {
  songId: string
}

export function SongJournalTab({ songId }: SongJournalTabProps) {
  const entries = useEntriesForSong(songId)
  const [newTopic, setNewTopic] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  async function handleAddEntry() {
    const topic = newTopic.trim()
    if (!topic) {
      return
    }

    setIsAdding(true)
    try {
      await createEntry({
        songId,
        topic,
        content: '<p></p>',
      })
      setNewTopic('')
    } catch {
      // createEntry already logs the error
    } finally {
      setIsAdding(false)
    }
  }

  async function handleTopicBlur(entryId: string, topic: string) {
    const trimmed = topic.trim() || null
    try {
      await updateEntry({ id: entryId, topic: trimmed })
    } catch {
      // updateEntry already logs the error
    }
  }

  async function handleContentChange(entryId: string, content: string) {
    try {
      await updateEntry({ id: entryId, content })
    } catch {
      // updateEntry already logs the error
    }
  }

  async function handleDelete(entryId: string) {
    try {
      await deleteEntry(entryId)
    } catch {
      // deleteEntry already logs the error
    }
  }

  if (entries === undefined) {
    return <p className="text-sm text-muted-foreground">Loading journal...</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newTopic}
          onChange={(event) => setNewTopic(event.target.value)}
          placeholder="Topic (e.g. Bass, Mix Notes)"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void handleAddEntry()
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          disabled={!newTopic.trim() || isAdding}
          onClick={() => void handleAddEntry()}
        >
          <Plus className="size-4" />
          Add Entry
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No journal entries yet. Add a topic to start documenting production notes.
        </p>
      ) : null}

      {entries.map((entry) => (
        <div key={entry.id} className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Label className="sr-only" htmlFor={`journal-topic-${entry.id}`}>
              Topic
            </Label>
            <Input
              id={`journal-topic-${entry.id}`}
              defaultValue={entry.topic ?? ''}
              placeholder="Topic"
              className="h-8 font-medium"
              onBlur={(event) =>
                void handleTopicBlur(entry.id, event.target.value)
              }
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => void handleDelete(entry.id)}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Delete entry</span>
            </Button>
          </div>

          <RichTextEditor
            content={entry.content}
            onChange={(content) => void handleContentChange(entry.id, content)}
            placeholder="Production notes, gear settings, mix decisions..."
          />
        </div>
      ))}
    </div>
  )
}
