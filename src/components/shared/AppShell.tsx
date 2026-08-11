import { NavLink, Outlet } from 'react-router-dom'
import { Disc3, Home, Music2 } from 'lucide-react'

import { QuickCaptureModal } from '@/components/capture/QuickCaptureModal'
import { BrowserSupportNotice } from '@/components/shared/BrowserSupportNotice'
import { CaptureButton } from '@/components/shared/CaptureButton'
import { MobileTabBar } from '@/components/shared/MobileTabBar'
import { StorageWarningBanner } from '@/components/shared/StorageWarningBanner'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QuickCaptureProvider } from '@/stores/quickCapture'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/songs', label: 'Songs', icon: Music2 },
  { to: '/albums', label: 'Albums', icon: Disc3 },
] as const

export function AppShell() {
  return (
    <QuickCaptureProvider>
      <TooltipProvider>
        <div className="flex min-h-svh bg-background">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground md:flex">
          <div className="flex h-14 items-center px-4">
            <span className="text-lg font-semibold tracking-tight">Nootbuk</span>
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
          <QuickCaptureModal />
        </div>
      </div>
      </TooltipProvider>
    </QuickCaptureProvider>
  )
}
