import { Trash2 } from 'lucide-react'
import { useMemo } from 'react'

import { AudioImport } from '@/components/capture/AudioImport'
import { AudioRecorder } from '@/components/capture/AudioRecorder'
import { MidiImport } from '@/components/capture/MidiImport'
import { MidiRecorder } from '@/components/capture/MidiRecorder'
import { NotePicker } from '@/components/capture/NotePicker'
import { AudioMediaPanel } from '@/components/player/AudioMediaPanel'
import { MidiPlayer } from '@/components/player/MidiPlayer'
import { Button } from '@/components/ui/button'
import { removeMedia, useMediaForIdea } from '@/hooks/useMedia'
import { useSynth } from '@/hooks/useSynth'
import { getSynthPatchLabel } from '@/lib/synth-patches'

interface IdeaMediaSectionProps {
  ideaId: string
}

export function IdeaMediaSection({ ideaId }: IdeaMediaSectionProps) {
  const mediaItems = useMediaForIdea(ideaId)
  const { currentPatch, isMuted } = useSynth()
  const playbackPatch = isMuted ? 'muted' : currentPatch

  const audioItem = useMemo(
    () => (mediaItems ?? []).find((item) => item.type === 'audio') ?? null,
    [mediaItems],
  )

  const midiItem = useMemo(
    () => (mediaItems ?? []).find((item) => item.type === 'midi') ?? null,
    [mediaItems],
  )

  async function handleRemove(mediaId: string) {
    try {
      await removeMedia(mediaId)
    } catch {
      // removeMedia already logs the error
    }
  }

  const midiPatchLabel =
    playbackPatch === 'muted' ? 'Muted' : getSynthPatchLabel(playbackPatch)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">Audio</h3>
          <p className="text-xs text-muted-foreground">
            One audio source per idea. Recording or importing replaces the
            existing one.
          </p>
        </div>

        {audioItem ? (
          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium">{audioItem.filename}</p>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => void handleRemove(audioItem.id)}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Remove audio</span>
              </Button>
            </div>
            <AudioMediaPanel ideaId={ideaId} media={audioItem} />
          </div>
        ) : null}

        <AudioRecorder ideaId={ideaId} />
        <AudioImport ideaId={ideaId} />
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">MIDI</h3>
          <p className="text-xs text-muted-foreground">
            One MIDI source per idea. Recording, importing, or note entry
            replaces the existing one.
          </p>
        </div>

        {midiItem ? (
          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{midiItem.filename}</p>
                {midiItem.noteData ? (
                  <p className="text-xs text-muted-foreground">
                    {midiItem.noteData.length} notes
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => void handleRemove(midiItem.id)}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Remove MIDI</span>
              </Button>
            </div>
            {midiItem.noteData ? (
              <MidiPlayer notes={midiItem.noteData} patchId={playbackPatch} />
            ) : (
              <p className="text-sm text-muted-foreground">
                {midiPatchLabel} playback unavailable without note data.
              </p>
            )}
          </div>
        ) : null}

        <MidiRecorder ideaId={ideaId} />
        <MidiImport ideaId={ideaId} />
        <NotePicker ideaId={ideaId} />
      </div>
    </div>
  )
}
