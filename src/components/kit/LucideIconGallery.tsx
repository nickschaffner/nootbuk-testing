import { memo, useCallback, useMemo, useState } from 'react'
import { icons } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SearchBar } from './SearchBar'
import { MonoLabel } from './Field'
import { cn } from './cn'

type IconEntry = { name: string; Icon: LucideIcon }

function isLucideIcon(value: unknown): value is LucideIcon {
  if (typeof value === 'function') {
    return true
  }
  return typeof value === 'object' && value !== null && '$$typeof' in value
}

function catalogEntries(source: object): IconEntry[] {
  return Object.entries(source)
    .filter(([name, value]) => /^[A-Z]/.test(name) && isLucideIcon(value))
    .map(([name, Icon]) => ({ name, Icon }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

const ALL_ICONS: IconEntry[] = catalogEntries(
  icons && typeof icons === 'object' ? icons : {},
)

const IconCell = memo(function IconCell({
  name,
  Icon,
  match,
  highlighted,
  onCopy,
}: {
  name: string
  Icon: LucideIcon
  match: boolean
  highlighted: boolean
  onCopy: (name: string) => void
}) {
  return (
    <button
      type="button"
      title={name}
      onClick={() => onCopy(name)}
      style={{ order: match ? 0 : 1 }}
      className={cn(
        'focusable flex flex-col items-center gap-2 px-2 py-3 hover:text-primary',
        highlighted
          ? 'bg-muted text-primary hover:bg-muted'
          : 'bg-card text-foreground hover:bg-muted',
      )}
    >
      <Icon size={20} strokeWidth={2} aria-hidden />
      <span className="w-full truncate text-center font-mono text-[10px] leading-tight">
        {name}
      </span>
    </button>
  )
})

export default function LucideIconGallery() {
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const needle = query.trim().toLowerCase()
  const matchCount = useMemo(() => {
    if (!needle) {
      return ALL_ICONS.length
    }
    return ALL_ICONS.reduce(
      (count, entry) =>
        entry.name.toLowerCase().includes(needle) ? count + 1 : count,
      0,
    )
  }, [needle])

  const copyName = useCallback((name: string) => {
    void navigator.clipboard.writeText(name).then(() => {
      setCopied(name)
    })
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SearchBar
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search lucide names…"
          aria-label="Search Lucide icons"
        />
        <MonoLabel>
          {needle ? `${matchCount} match` : ALL_ICONS.length}
          {needle && matchCount !== 1 ? 'es' : ''}
          {copied ? ` · copied ${copied}` : null}
        </MonoLabel>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(7.25rem,1fr))] gap-px bg-hairline">
        {ALL_ICONS.map(({ name, Icon }) => (
          <IconCell
            key={name}
            name={name}
            Icon={Icon}
            match={!needle || name.toLowerCase().includes(needle)}
            highlighted={Boolean(needle) && name.toLowerCase().includes(needle)}
            onCopy={copyName}
          />
        ))}
      </div>
    </div>
  )
}
