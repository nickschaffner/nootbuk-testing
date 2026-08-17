import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Disc3, Guitar, Home, Lightbulb, Music2, Wrench } from 'lucide-react'

import { IdeaEditor } from '@/components/capture/IdeaEditor'
import { isDevMode } from '@/components/calibration/isDevMode'
import { BrowserSupportNotice } from '@/components/shared/BrowserSupportNotice'
import { CaptureButton } from '@/components/shared/CaptureButton'
import { MobileTabBar } from '@/components/shared/MobileTabBar'
import { StorageWarningBanner } from '@/components/shared/StorageWarningBanner'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider } from '@/components/ui/tooltip'
import { preloadPianoPatch, useSynth } from '@/hooks/useSynth'
import { QuickCaptureProvider } from '@/stores/quickCapture'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/ideas', label: 'Ideas', icon: Lightbulb },
  { to: '/songs', label: 'Songs', icon: Music2 },
  { to: '/albums', label: 'Albums', icon: Disc3 },
  { to: '/instruments', label: 'Instruments', icon: Guitar },
] as const

export function AppShell() {
  const showCalibration = isDevMode()
  const { patchReady, loadingPatchName, ensureStarted } = useSynth()

  useEffect(() => {
    preloadPianoPatch()
  }, [])

  useEffect(() => {
    function unlockAudio() {
      void ensureStarted().catch((caught) => {
        console.warn('Audio unlock failed:', caught)
      })
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }

    window.addEventListener('pointerdown', unlockAudio)
    window.addEventListener('keydown', unlockAudio)

    return () => {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  }, [ensureStarted])

  return (
    <QuickCaptureProvider>
      <TooltipProvider>
        <div className="flex min-h-svh bg-background">
          <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground md:flex">
            <div className="flex h-14 items-center px-4">
              <span className="text-lg font-semibold tracking-tight">
                Nootbuk
              </span>
            </div>
            <Separator />
            <nav className="flex flex-1 flex-col gap-1 p-2">
              {navItems.map(({ to, label, icon: Icon, ...item }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={'end' in item ? item.end : false}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                    )
                  }
                >
                  <Icon className="size-4" />
                  {label}
                </NavLink>
              ))}

              {!patchReady && loadingPatchName ? (
                <div
                  className="mt-auto space-y-2 px-3 py-2"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground"
                      aria-hidden
                    />
                    <span>Loading {loadingPatchName}…</span>
                  </div>
                  <div
                    className="h-1 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-label={`Loading ${loadingPatchName}`}
                  >
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-primary/80" />
                  </div>
                </div>
              ) : null}

              {showCalibration ? (
                <>
                  <Separator className={cn(!patchReady && loadingPatchName ? 'my-2' : 'mt-auto my-2')} />
                  <NavLink
                    to="/calibration"
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          : 'text-amber-700/80 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400/80 dark:hover:text-amber-300',
                      )
                    }
                  >
                    <Wrench className="size-4" />
                    Calibration
                  </NavLink>
                </>
              ) : null}
            </nav>
          </aside>

          <div className="relative flex min-w-0 flex-1 flex-col">
            <StorageWarningBanner />
            <BrowserSupportNotice />
            <main className="flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-6">
              <Outlet />
            </main>
            <CaptureButton />
            <MobileTabBar />
            <IdeaEditor />
          </div>
        </div>
      </TooltipProvider>
    </QuickCaptureProvider>
  )
}
