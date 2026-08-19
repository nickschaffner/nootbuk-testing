import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Disc3,
  Guitar,
  Home,
  Lightbulb,
  MoreHorizontal,
  Music2,
  Plus,
  SwatchBook,
  Wrench,
} from 'lucide-react'

import { IconButton, MonoLabel } from '@/components/kit'
import { isDevMode } from '@/components/calibration/isDevMode'
import { ThemeModeButton } from '@/components/shared/AppNav'
import { cn } from '@/lib/utils'
import { useQuickCapture } from '@/stores/quickCapture'

const TABS = [
  { to: '/ideas', label: 'Ideas', icon: Lightbulb, match: (path: string) => path.startsWith('/ideas') },
  { to: '/songs', label: 'Songs', icon: Music2, match: (path: string) => path === '/songs' || path.startsWith('/song/') },
  { to: '/albums', label: 'Albums', icon: Disc3, match: (path: string) => path === '/albums' || path.startsWith('/album/') },
] as const

function tabClass(active: boolean) {
  return cn(
    'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-muted-foreground',
    active && 'text-foreground',
  )
}

function moreLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-2 rounded-xs px-2 py-2.5 text-sm font-medium',
    isActive
      ? 'bg-muted text-foreground'
      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
  )
}

export function MobileTabBar({
  dark,
  onDarkChange,
}: {
  dark: boolean
  onDarkChange: (dark: boolean) => void
}) {
  const { pathname } = useLocation()
  const { open } = useQuickCapture()
  const [moreOpen, setMoreOpen] = useState(false)
  const showDev = isDevMode()

  const moreActive =
    moreOpen ||
    pathname === '/' ||
    pathname.startsWith('/instruments') ||
    pathname === '/styleguide' ||
    pathname === '/calibration'

  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!moreOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [moreOpen])

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={{ boxShadow: '#000000 0 -20px 40px' }}
    >
      {moreOpen ? (
        <div
          className="fixed inset-0 z-40 bg-foreground/25"
          onClick={() => setMoreOpen(false)}
        />
      ) : null}

      <div className="relative z-50 flex flex-col">
        {moreOpen ? (
          <div className="border-t border-hairline bg-panel">
            <div className="label-mono border-b border-hairline px-3 py-2 text-muted-foreground">
              More
            </div>
            <div className="flex flex-col gap-2 p-3">
              <ThemeModeButton dark={dark} onChange={onDarkChange} />
              <NavLink to="/" end onClick={() => setMoreOpen(false)} className={moreLinkClass}>
                <Home className="size-4 shrink-0" />
                Home
              </NavLink>
              <NavLink
                to="/instruments"
                onClick={() => setMoreOpen(false)}
                className={moreLinkClass}
              >
                <Guitar className="size-4 shrink-0" />
                Instruments
              </NavLink>
              {showDev ? (
                <>
                  <div className="h-px bg-hairline" />
                  <NavLink
                    to="/styleguide"
                    onClick={() => setMoreOpen(false)}
                    className={moreLinkClass}
                  >
                    <SwatchBook className="size-4 shrink-0" />
                    Style Guide
                  </NavLink>
                  <NavLink
                    to="/calibration"
                    onClick={() => setMoreOpen(false)}
                    className={moreLinkClass}
                  >
                    <Wrench className="size-4 shrink-0" />
                    Calibration
                  </NavLink>
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <nav className="border-t border-hairline bg-panel pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-end">
            {TABS.slice(0, 2).map(({ to, label, icon: Icon, match }) => (
              <NavLink key={to} to={to} className={tabClass(match(pathname))}>
                <Icon className="size-4" />
                <MonoLabel className={match(pathname) ? 'text-foreground' : undefined}>
                  {label}
                </MonoLabel>
              </NavLink>
            ))}

            <div className="flex min-w-0 flex-1 flex-col items-center justify-end">
              <IconButton
                aria-label="Quick Capture"
                shape="round"
                variant="solid"
                size="xl"
                className="-mt-4 mb-1"
                onClick={() => open()}
              >
                <Plus className="size-4" />
              </IconButton>
            </div>

            {TABS.slice(2).map(({ to, label, icon: Icon, match }) => (
              <NavLink key={to} to={to} className={tabClass(match(pathname))}>
                <Icon className="size-4" />
                <MonoLabel className={match(pathname) ? 'text-foreground' : undefined}>
                  {label}
                </MonoLabel>
              </NavLink>
            ))}

            <button
              type="button"
              aria-label="More"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((value) => !value)}
              className={cn('focusable', tabClass(moreActive))}
            >
              <MoreHorizontal className="size-4" />
              <MonoLabel className={moreActive ? 'text-foreground' : undefined}>More</MonoLabel>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}
