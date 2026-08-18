import { useState, type MouseEvent } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Disc3,
  Guitar,
  Home,
  Lightbulb,
  Music2,
  PanelLeft,
  PanelLeftClose,
  Plus,
  SwatchBook,
  Wrench,
  X,
} from 'lucide-react'

import { Button, IconButton } from '@/components/kit'
import { isDevMode } from '@/components/calibration/isDevMode'
import { createAlbum } from '@/hooks/useAlbums'
import { createInstrument } from '@/hooks/useInstruments'
import { createSong } from '@/hooks/useSongs'
import { useSynth } from '@/hooks/useSynth'
import { defaultSynthPatchForType } from '@/lib/instrument-utils'
import { cn } from '@/lib/utils'
import { useQuickCapture } from '@/stores/quickCapture'

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/ideas', label: 'Ideas', icon: Lightbulb, create: 'idea' },
  { to: '/songs', label: 'Songs', icon: Music2, create: 'song' },
  { to: '/albums', label: 'Albums', icon: Disc3, create: 'album' },
  { to: '/instruments', label: 'Instruments', icon: Guitar, create: 'instrument' },
] as const

type CreateKind = 'idea' | 'song' | 'album' | 'instrument'

const SONG_DEFAULTS = {
  title: 'Untitled Song',
  key: null,
  tempo: null,
  timeSignature: null,
  status: 'sketch' as const,
  genre: null,
  lyrics: null,
  songwriter: null,
  publisher: null,
  ipiNumber: null,
  masterEngineer: null,
  copyright: null,
  sampleCredits: null,
}

export function ThemeModeButton({
  dark,
  collapsed,
  onChange,
}: {
  dark: boolean
  collapsed?: boolean
  onChange: (dark: boolean) => void
}) {
  const label = dark ? 'Studio Dark' : 'Paper Light'

  return (
    <button
      type="button"
      aria-label={`Theme: ${label}`}
      title={label}
      onClick={() => onChange(!dark)}
      className={cn(
        'focusable flex items-center rounded-xs border border-foreground bg-background text-foreground',
        collapsed ? 'size-8 justify-center' : 'h-9 w-full gap-2.5 px-3',
      )}
    >
      <span
        className={cn(
          'size-2.5 shrink-0 rounded-full',
          dark ? 'bg-primary' : 'bg-foreground',
        )}
        aria-hidden
      />
      {collapsed ? null : (
        <span className="text-xs font-bold uppercase tracking-wider">
          {label}
        </span>
      )}
    </button>
  )
}

function NavCreateButton({
  kind,
  onCreated,
}: {
  kind: CreateKind
  onCreated?: () => void
}) {
  const navigate = useNavigate()
  const { open } = useQuickCapture()
  const [busy, setBusy] = useState(false)

  async function handleCreate(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (busy) return

    if (kind === 'idea') {
      open()
      onCreated?.()
      return
    }

    setBusy(true)
    try {
      if (kind === 'song') {
        const song = await createSong(SONG_DEFAULTS)
        navigate(`/song/${song.id}`)
      } else if (kind === 'album') {
        const album = await createAlbum({
          title: 'Untitled Album',
          status: 'draft',
          artworkBlob: null,
          releaseDate: null,
          credits: null,
          label: null,
          globalNotes: null,
          referenceMaterial: null,
          notes: null,
        })
        navigate(`/album/${album.id}`)
      } else {
        const patch = defaultSynthPatchForType('other')
        const instrument = await createInstrument({
          name: 'Untitled Instrument',
          type: 'other',
          defaultPatch: patch === 'muted' ? null : patch,
        })
        navigate(`/instruments/${instrument.id}`)
      }
      onCreated?.()
    } catch {
      // hooks log
    } finally {
      setBusy(false)
    }
  }

  return (
    <IconButton
      aria-label={`New ${kind}`}
      variant="ghost"
      size="sm"
      disabled={busy}
      onClick={(event) => void handleCreate(event)}
      className="shrink-0"
    >
      <Plus size={15} />
    </IconButton>
  )
}

export function AppNav({
  collapsed = false,
  dark,
  onDarkChange,
  onToggleCollapsed,
  onNavigate,
}: {
  collapsed?: boolean
  dark: boolean
  onDarkChange: (dark: boolean) => void
  onToggleCollapsed?: () => void
  onNavigate?: () => void
}) {
  const { open } = useQuickCapture()
  const showDev = isDevMode()
  const { patchReady, loadingPatchName } = useSynth()
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex min-w-0 items-center gap-2 rounded-xs px-2 py-1.5 text-sm font-medium transition-colors',
      collapsed && 'w-full justify-center px-0',
      isActive
        ? 'bg-muted text-foreground'
        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
    )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'noise flex h-16 shrink-0 items-center border-b border-hairline bg-panel',
          collapsed ? 'justify-center px-1' : 'justify-between gap-2 px-3',
        )}
      >
        {collapsed ? null : (
          <span className="font-display text-sm font-black uppercase tracking-tight">
            Nootbuk
          </span>
        )}
        {onToggleCollapsed ? (
          <IconButton
            aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
            variant="ghost"
            size="sm"
            onClick={onToggleCollapsed}
          >
            {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </IconButton>
        ) : (
          <IconButton aria-label="Close menu" variant="ghost" size="sm" onClick={onNavigate}>
            <X size={16} />
          </IconButton>
        )}
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {NAV.map((item) => {
          const create = 'create' in item ? item.create : undefined
          return (
            <div key={item.to} className="flex items-center gap-0.5">
              <NavLink
                to={item.to}
                end={'end' in item ? item.end : false}
                title={item.label}
                onClick={onNavigate}
                className={({ isActive }) => cn(linkClass({ isActive }), !collapsed && 'flex-1')}
              >
                <item.icon className="size-4 shrink-0" />
                {collapsed ? null : item.label}
              </NavLink>
              {create && !collapsed ? (
                <NavCreateButton kind={create} onCreated={onNavigate} />
              ) : null}
            </div>
          )
        })}

        {showDev ? (
          <>
            <div className="my-2 h-px bg-hairline" />
            <NavLink
              to="/styleguide"
              onClick={onNavigate}
              title="Style Guide"
              className={linkClass}
            >
              <SwatchBook className="size-4 shrink-0" />
              {collapsed ? null : 'Style Guide'}
            </NavLink>
            <NavLink
              to="/calibration"
              onClick={onNavigate}
              title="Calibration"
              className={linkClass}
            >
              <Wrench className="size-4 shrink-0" />
              {collapsed ? null : 'Calibration'}
            </NavLink>
          </>
        ) : null}
      </nav>

      {!patchReady && loadingPatchName ? (
        <div className="px-3 py-2" aria-live="polite" aria-busy="true">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground"
              aria-hidden
            />
            {collapsed ? null : <span>Loading {loadingPatchName}…</span>}
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          'mt-auto flex shrink-0 flex-col gap-2 border-t border-hairline',
          collapsed ? 'items-center p-2' : 'p-3',
        )}
      >
        <ThemeModeButton dark={dark} collapsed={collapsed} onChange={onDarkChange} />
        {collapsed ? (
          <IconButton
            aria-label="Quick Capture"
            variant="solid"
            size="sm"
            onClick={() => {
              open()
              onNavigate?.()
            }}
          >
            <Plus size={16} />
          </IconButton>
        ) : (
          <Button
            variant="primary"
            block
            onClick={() => {
              open()
              onNavigate?.()
            }}
          >
            + Quick Capture
          </Button>
        )}
      </div>
    </div>
  )
}
