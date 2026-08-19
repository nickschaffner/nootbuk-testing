import { Chip, Pick, SearchBar, SONG_STATUSES } from '@/components/kit'
import type { Song, SongStatus } from '@/types/song'

export function tempoRangeForBpm(bpm: number): { min: number; max: number } {
  const min = Math.max(0, Math.ceil((bpm - 10) / 20) * 20 - 10)
  return { min, max: min + 20 }
}

export function tempoRangeKey(min: number, max: number): string {
  return `${min}-${max}`
}

export function songMatchesSearch(song: Song, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  const haystack = [
    song.title,
    song.key,
    song.status,
    song.lyrics,
    song.genre,
    song.timeSignature,
    song.tempo != null ? String(song.tempo) : null,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalized)
}

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  const set = new Set<string>()
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) {
      set.add(trimmed)
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

export function SongFilters({
  songs,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  keyFilter,
  onKeyFilterChange,
  tempoFilter,
  onTempoFilterChange,
  timeFilter,
  onTimeFilterChange,
}: {
  songs: Song[]
  searchQuery: string
  onSearchChange: (value: string) => void
  statusFilter: SongStatus[]
  onStatusFilterChange: (value: SongStatus[]) => void
  keyFilter: string
  onKeyFilterChange: (value: string) => void
  tempoFilter: string
  onTempoFilterChange: (value: string) => void
  timeFilter: string
  onTimeFilterChange: (value: string) => void
}) {
  const keyOptions = uniqueSorted(songs.map((song) => song.key)).map((key) => ({
    value: key,
    label: key,
  }))

  const timeOptions = uniqueSorted(songs.map((song) => song.timeSignature)).map(
    (time) => ({
      value: time,
      label: time,
    }),
  )

  const tempoOptions = (() => {
    const ranges = new Map<string, { min: number; max: number }>()
    for (const song of songs) {
      if (song.tempo == null || !Number.isFinite(song.tempo)) {
        continue
      }
      const range = tempoRangeForBpm(song.tempo)
      ranges.set(tempoRangeKey(range.min, range.max), range)
    }
    return [...ranges.values()]
      .sort((a, b) => a.min - b.min)
      .map((range) => ({
        value: tempoRangeKey(range.min, range.max),
        label: `${range.min}–${range.max} BPM`,
      }))
  })()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 items-start gap-8">
        <SearchBar
          placeholder="Search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <div className="flex flex-wrap items-start gap-1.5">
          <Chip
            selected={statusFilter.length === 0}
            onClick={() => onStatusFilterChange([])}
          >
            All
          </Chip>
          {SONG_STATUSES.map((status) => {
            const value = status.value as SongStatus
            const selected = statusFilter.includes(value)
            return (
              <Chip
                key={status.value}
                selected={selected}
                onClick={() => {
                  onStatusFilterChange(
                    selected
                      ? statusFilter.filter((item) => item !== value)
                      : [...statusFilter, value],
                  )
                }}
              >
                {status.label}
              </Chip>
            )
          })}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Pick
          label="Key"
          value={keyFilter}
          onChange={(event) => onKeyFilterChange(event.target.value)}
          options={[{ value: '', label: 'All' }, ...keyOptions]}
        />
        <Pick
          label="Tempo"
          value={tempoFilter}
          onChange={(event) => onTempoFilterChange(event.target.value)}
          options={[{ value: '', label: 'All' }, ...tempoOptions]}
        />
        <Pick
          label="Time"
          value={timeFilter}
          onChange={(event) => onTimeFilterChange(event.target.value)}
          options={[{ value: '', label: 'All' }, ...timeOptions]}
        />
      </div>
    </div>
  )
}
