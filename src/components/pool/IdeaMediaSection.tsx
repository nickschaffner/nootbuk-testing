import { Trash2 } from 'lucide-react'
import { useMemo } from 'react'

import { AudioImport } from '@/components/capture/AudioImport'
import { AudioRecorder } from '@/components/capture/AudioRecorder'
import { MidiImport } from '@/components/capture/MidiImport'
import { MidiRecorder } from '@/components/capture/MidiRecorder'
import { IdeaNoteSequencesSection } from '@/components/pool/IdeaNoteSequencesSection'
import { AudioMediaPanel } from '@/components/player/AudioMediaPanel'
import { MidiPlayer } from '@/components/player/MidiPlayer'
import { Button } from '@/components/ui/button'
import { removeMedia, useMediaForIdea } from '@/hooks/useMedia'
import { getSynthPatchLabel } from '@/lib/synth-patches'

interface IdeaMediaSectionProps {
  ideaId: string
}

export function IdeaMediaSection({ ideaId }: IdeaMediaSectionProps) {
  const mediaItems = useMediaForIdea(ideaId)

  const audioItems = useMemo(
    () => (mediaItems ?? []).filter((item) => item.type === 'audio'),
    [mediaItems],
  )

  const midiItems = useMemo(
    () => (mediaItems ?? []).filter((item) => item.type === 'midi'),
    [mediaItems],
  )

  async function handleRemove(mediaId: string) {
    try {
      await removeMedia(mediaId)
    } catch {
      // removeMedia already logs the error
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">Audio</h3>
          <p className="text-xs text-muted-foreground">
            Record or import audio attachments for this idea.
          </p>
        </div>

        {audioItems.map((item) => (
          <div key={item.id} className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium">{item.filename}</p>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => void handleRemove(item.id)}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Remove audio</span>
              </Button>
            </div>
            {item.type === 'audio' ? (
              <AudioMediaPanel ideaId={ideaId} media={item} />
            ) : null}
          </div>
        ))}

        <AudioRecorder ideaId={ideaId} />
        <AudioImport ideaId={ideaId} />
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">MIDI</h3>
          <p className="text-xs text-muted-foreground">
            Record from a controller or import a MIDI file.
          </p>
        </div>

        {midiItems.map((item) => (
          <div key={item.id} className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.filename}</p>
                {item.noteData ? (
                  <p className="text-xs text-muted-foreground">
                    {item.noteData.length} notes
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => void handleRemove(item.id)}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Remove MIDI</span>
              </Button>
            </div>
            {item.noteData ? (
              <MidiPlayer notes={item.noteData} patchId="piano" />
            ) : (
              <p className="text-sm text-muted-foreground">
                {getSynthPatchLabel('piano')} playback unavailable without note data.
              </p>
            )}
          </div>
        ))}

        <MidiRecorder ideaId={ideaId} />
        <MidiImport ideaId={ideaId} />
      </div>

      <IdeaNoteSequencesSection ideaId={ideaId} />
    </div>
  )
}
