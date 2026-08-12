import { AudioPlayer } from '@/components/player/AudioPlayer'
import { ExtractMidiFromAudio } from '@/components/player/ExtractMidiFromAudio'
import { addMediaToIdea } from '@/hooks/useMedia'
import { getMidiDuration, noteEventsToMidiBlob } from '@/lib/midi'
import type { IdeaMedia } from '@/types/idea'

interface AudioMediaPanelProps {
  ideaId: string
  media: IdeaMedia
}

export function AudioMediaPanel({ ideaId, media }: AudioMediaPanelProps) {
  if (media.type !== 'audio') {
    return null
  }

  return (
    <div className="space-y-3">
      <AudioPlayer
        blob={media.blob}
        mimeType={media.mimeType}
        filename={media.filename}
      />

      <ExtractMidiFromAudio
        audioBlob={media.blob}
        onConfirm={async (notes) => {
          const blob = noteEventsToMidiBlob(notes)
          const baseName = media.filename.replace(/\.[^.]+$/, '')
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

          await addMediaToIdea({
            ideaId,
            type: 'midi',
            filename: `${baseName}-extracted-${timestamp}.mid`,
            mimeType: 'audio/midi',
            blob,
            duration: getMidiDuration(notes),
            noteData: notes,
          })
        }}
      />
    </div>
  )
}
