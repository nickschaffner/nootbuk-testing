import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { IdeaEditor } from '@/components/capture/IdeaEditor'
import { BrowserSupportNotice } from '@/components/shared/BrowserSupportNotice'
import { AppNav } from '@/components/shared/AppNav'
import { MobileTabBar } from '@/components/shared/MobileTabBar'
import { StorageWarningBanner } from '@/components/shared/StorageWarningBanner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { preloadPianoPatch, useSynth } from '@/hooks/useSynth'
import { QuickCaptureProvider } from '@/stores/quickCapture'
import { cn } from '@/lib/utils'

export function AppShell() {
  const { pathname } = useLocation()
  const isStyleguide = pathname === '/styleguide'
  const { ensureStarted } = useSynth()
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )
  const [collapsed, setCollapsed] = useState(false)

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

  function handleDarkChange(next: boolean) {
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <QuickCaptureProvider>
      <TooltipProvider>
        <div className="flex h-svh overflow-hidden bg-background">
          <aside
            className={cn(
              'sticky top-0 hidden h-svh shrink-0 flex-col border-r border-hairline bg-panel md:flex',
              collapsed ? 'w-14' : 'w-56',
            )}
          >
            <AppNav
              collapsed={collapsed}
              dark={dark}
              onDarkChange={handleDarkChange}
              onToggleCollapsed={() => setCollapsed((value) => !value)}
            />
          </aside>

          <div className="relative flex min-w-0 flex-1 flex-col">
            <StorageWarningBanner />
            <BrowserSupportNotice />
            <main
              className={
                isStyleguide
                  ? 'min-h-0 flex-1 overflow-auto p-0'
                  : 'flex-1 overflow-auto px-4 pt-0 pb-28 md:px-6 md:pt-0 md:pb-6'
              }
            >
              <Outlet />
            </main>
            <MobileTabBar dark={dark} onDarkChange={handleDarkChange} />
            <IdeaEditor />
          </div>
        </div>
      </TooltipProvider>
    </QuickCaptureProvider>
  )
}
