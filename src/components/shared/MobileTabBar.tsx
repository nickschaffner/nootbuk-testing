import { NavLink } from 'react-router-dom'
import { Disc3, Guitar, Home, Lightbulb, Music2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useQuickCapture } from '@/stores/quickCapture'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/ideas', label: 'Ideas', icon: Lightbulb },
  { to: '/songs', label: 'Songs', icon: Music2 },
  { to: '/albums', label: 'Albums', icon: Disc3 },
  { to: '/instruments', label: 'Gear', icon: Guitar },
] as const

export function MobileTabBar() {
  const { open } = useQuickCapture()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex items-stretch border-t border-border bg-background md:hidden">
      {navItems.map(({ to, label, icon: Icon, ...item }) => (
        <NavLink
          key={to}
          to={to}
          end={'end' in item ? item.end : false}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground',
            )
          }
        >
          <Icon className="size-5" />
          {label}
        </NavLink>
      ))}
      <Button
        type="button"
        variant="ghost"
        className="flex h-auto flex-1 flex-col items-center justify-center gap-1 rounded-none px-2 py-2 text-xs font-medium text-muted-foreground"
        onClick={() => open()}
      >
        <Plus className="size-5" />
        Capture
      </Button>
    </nav>
  )
}
