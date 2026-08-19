import { AudioLines, ImageIcon, Mic, MoreHorizontal, Music2, Play } from 'lucide-react'
import { cn } from './cn'
import { Badge } from './Chip'
import { IconButton } from './IconButton'

// ─────────────────────────────────────────────────────────────────────────
// IdeaCard — the atom of the pool. Role badge · quick-play · title (first
// lyric/notes line, or "Role — Key — {tempo}bpm") · instrument · location
// badge · media-type icons · relative timestamp. Presentational only.
// ─────────────────────────────────────────────────────────────────────────

export type MediaKind = 'audio' | 'midi' | 'image'

const MEDIA_ICON: Record<MediaKind, typeof Mic> = {
  audio: Mic,
  midi: Music2,
  image: ImageIcon,
}

export interface IdeaCardProps {
  role: string
  title: string
  instrument?: string
  location?: string // song title, or "Pool"
  timestamp?: string // relative, e.g. "2h ago"
  media?: MediaKind[]
  onPlay?: () => void
  onMenu?: () => void
  className?: string
}

export function IdeaCard({
  role,
  title,
  instrument,
  location = 'Pool',
  timestamp,
  media = [],
  onPlay,
  onMenu,
  className,
}: IdeaCardProps) {
  return (
    <article
      className={cn(
        'noise flex flex-col gap-2 rounded-xs border border-hairline bg-card p-3 transition-colors hover:border-foreground hover:shadow-hard-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Badge tone="neutral">{role}</Badge>
        <div className="flex items-center gap-1">
          <IconButton aria-label="Play idea" variant="ghost" size="sm" onClick={onPlay}>
            <Play size={14} />
          </IconButton>
          <IconButton aria-label="Idea actions" variant="ghost" size="sm" onClick={onMenu}>
            <MoreHorizontal size={15} />
          </IconButton>
        </div>
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        {instrument ? (
          <p className="truncate text-xs text-muted-foreground">{instrument}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-hairline pt-2">
        <Badge tone="outline">{location}</Badge>
        <div className="flex items-center gap-2 text-muted-foreground">
          {media.map((m) => {
            const Icon = MEDIA_ICON[m]
            return <Icon key={m} size={14} />
          })}
          {timestamp ? <span className="label-mono">{timestamp}</span> : null}
        </div>
      </div>
    </article>
  )
}

// exported so catalogs / consumers can reference the quick-play glyph set
export const QUICK_PLAY_SOURCES = [
  { source: 'step-input', icon: Music2, label: 'Play Note Picker' },
  { source: 'midi-recording', icon: AudioLines, label: 'Play MIDI Record' },
  { source: 'audio-recording', icon: Mic, label: 'Play Audio' },
] as const
