import { useMemo, useState } from 'react'

import { IdeaCard } from '@/components/pool/IdeaCard'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAllIdeas } from '@/hooks/useIdeas'
import {
  mediaFlagsFor,
  useIdeaMediaFlagsMap,
  useSongTitleMap,
  useUniqueInstrumentNames,
} from '@/hooks/useIdeaMediaIndex'
import { formatRoleLabel, ideaMatchesSearch, IDEA_ROLES } from '@/lib/idea-label'
import { useQuickCapture } from '@/stores/quickCapture'
import type { IdeaRole, IdeaStatus } from '@/types/idea'

const IDEA_STATUSES: IdeaStatus[] = ['raw', 'developed', 'used', 'archived']

type MediaPresenceFilter = 'any' | 'audio' | 'midi' | 'image'

export function IdeasPage() {
  const { openIdea } = useQuickCapture()
  const ideas = useAllIdeas()
  const mediaMap = useIdeaMediaFlagsMap()
  const songTitles = useSongTitleMap()
  const instruments = useUniqueInstrumentNames(ideas)

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<IdeaRole | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | 'all'>('all')
  const [instrumentFilter, setInstrumentFilter] = useState<string>('all')
  const [mediaFilter, setMediaFilter] = useState<MediaPresenceFilter>('any')

  const filteredIdeas = useMemo(() => {
    if (!ideas) {
      return []
    }

    return ideas.filter((idea) => {
      if (roleFilter !== 'all' && idea.role !== roleFilter) {
        return false
      }

      if (statusFilter !== 'all' && idea.status !== statusFilter) {
        return false
      }

      if (instrumentFilter !== 'all') {
        if ((idea.instrumentName ?? '').trim() !== instrumentFilter) {
          return false
        }
      }

      if (mediaFilter !== 'any') {
        const flags = mediaFlagsFor(mediaMap, idea.id)
        if (mediaFilter === 'audio' && !flags.hasAudio) return false
        if (mediaFilter === 'midi' && !flags.hasMidi) return false
        if (mediaFilter === 'image' && !flags.hasImage) return false
      }

      return ideaMatchesSearch(idea, searchQuery)
    })
  }, [
    ideas,
    roleFilter,
    statusFilter,
    instrumentFilter,
    mediaFilter,
    mediaMap,
    searchQuery,
  ])

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ideas</h1>
          <p className="text-sm text-muted-foreground">
            All ideas — pool and assigned to songs.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="space-y-1 sm:col-span-2 xl:col-span-1">
            <Label htmlFor="ideas-search">Search</Label>
            <Input
              id="ideas-search"
              placeholder="Lyrics, notes, instrument..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Role</Label>
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as IdeaRole | 'all')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {IDEA_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {formatRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as IdeaStatus | 'all')
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {IDEA_STATUSES.map((status) => (
                  <SelectItem key={status} value={status} className="capitalize">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Instrument</Label>
            <Select
              value={instrumentFilter}
              onValueChange={setInstrumentFilter}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All instruments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All instruments</SelectItem>
                {instruments.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Media</Label>
            <Select
              value={mediaFilter}
              onValueChange={(value) =>
                setMediaFilter(value as MediaPresenceFilter)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Any media" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any media</SelectItem>
                <SelectItem value="audio">Has audio</SelectItem>
                <SelectItem value="midi">Has MIDI</SelectItem>
                <SelectItem value="image">Has image</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {ideas === undefined ? (
          <p className="text-sm text-muted-foreground">Loading ideas...</p>
        ) : filteredIdeas.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-sm font-medium">
              {ideas.length === 0
                ? 'No ideas yet. Capture your first idea.'
                : 'No ideas match your filters.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                songTitle={
                  idea.songId
                    ? (songTitles?.get(idea.songId) ?? 'Unknown song')
                    : null
                }
                mediaFlags={mediaFlagsFor(mediaMap, idea.id)}
                onClick={() => openIdea(idea.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
