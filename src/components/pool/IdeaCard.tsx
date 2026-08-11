import { ImageIcon, Mic, Piano } from 'lucide-react'
import { memo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { IdeaActionsMenu } from '@/components/pool/IdeaActionsMenu'
import { IdeaMediaQuickPlay } from '@/components/song/IdeaMediaQuickPlay'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db'
import { formatRelativeTime } from '@/lib/format'
import { formatRoleLabel, getIdeaDisplayLabel } from '@/lib/idea-label'
import type { Idea } from '@/types/idea'

interface IdeaCardProps {
  idea: Idea
  onClick: () => void
  /** When provided, skip per-card song lookup */
  songTitle?: string | null
  /** When provided, skip per-card media lookup */
  mediaFlags?: {
    hasAudio: boolean
    hasMidi: boolean
    hasImage: boolean
  }
  showLocation?: boolean
  onActionComplete?: () => void
}

export const IdeaCard = memo(function IdeaCard({
  idea,
  onClick,
  songTitle,
  mediaFlags,
  showLocation = true,
  onActionComplete,
}: IdeaCardProps) {
  const resolvedSongTitle = useLiveQuery(
    async () => {
      if (songTitle !== undefined) {
        return songTitle
      }
      if (!idea.songId) {
        return null
      }
      const song = await db.songs.get(idea.songId)
      return song?.title ?? 'Unknown song'
    },
    [idea.songId, songTitle],
  )

  const resolvedMedia = useLiveQuery(
    async () => {
      if (mediaFlags) {
        return mediaFlags
      }
      const media = await db.ideaMedia.where('ideaId').equals(idea.id).toArray()
      return {
        hasAudio: media.some((item) => item.type === 'audio'),
        hasMidi: media.some((item) => item.type === 'midi'),
        hasImage: media.some((item) => item.type === 'image'),
      }
    },
    [idea.id, mediaFlags],
  )

  const resolvedInstrumentName = useLiveQuery(
    async () => {
      if (idea.instrumentId) {
        const instrument = await db.instruments.get(idea.instrumentId)
        if (instrument?.name) {
          return instrument.name
        }
      }
      return idea.instrumentName
    },
    [idea.instrumentId, idea.instrumentName],
  )

  const locationLabel = idea.songId
    ? (resolvedSongTitle ?? '…')
    : 'Pool'

  const flags = resolvedMedia ?? mediaFlags ?? {
    hasAudio: false,
    hasMidi: false,
    hasImage: false,
  }

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/40 [content-visibility:auto] [contain-intrinsic-size:auto_8rem]"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{formatRoleLabel(idea.role)}</Badge>
          </div>
          <div
            className="flex shrink-0 items-center gap-0.5"
            onClick={(event) => event.stopPropagation()}
          >
            <IdeaMediaQuickPlay ideaId={idea.id} idea={idea} />
            <IdeaActionsMenu idea={idea} onActionComplete={onActionComplete} />
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRelativeTime(idea.updatedAt)}
            </span>
          </div>
        </div>
        <CardTitle className="line-clamp-2 text-base">
          {getIdeaDisplayLabel(idea)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {resolvedInstrumentName ? (
          <p className="text-sm text-muted-foreground">{resolvedInstrumentName}</p>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          {showLocation ? (
            <Badge variant="outline" className="max-w-[70%] truncate font-normal">
              {locationLabel}
            </Badge>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-1.5 text-muted-foreground">
            {flags.hasAudio ? (
              <Mic className="size-3.5" aria-label="Has audio" />
            ) : null}
            {flags.hasMidi ? (
              <Piano className="size-3.5" aria-label="Has MIDI" />
            ) : null}
            {flags.hasImage ? (
              <ImageIcon className="size-3.5" aria-label="Has image" />
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
