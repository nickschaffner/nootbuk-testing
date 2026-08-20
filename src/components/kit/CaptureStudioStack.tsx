import type { ReactNode } from 'react'
import { cn } from './cn'

// ─────────────────────────────────────────────────────────────────────────
// CaptureStudioStack — capture chrome as one card: studio + tool body +
// playbar inside a 2px vermillion outline. Tabs are passed in but rendered
// *outside* that outline so a live tab can sit on the box, not in it.
// ─────────────────────────────────────────────────────────────────────────

export interface CaptureStudioStackProps {
  tabs: ReactNode
  studio: ReactNode
  children?: ReactNode
  footer?: ReactNode
  className?: string
}

export function CaptureStudioStack({
  tabs,
  studio,
  children,
  footer,
  className,
}: CaptureStudioStackProps) {
  return (
    <div className={cn('shrink-0', className)}>
      {tabs}
      <div className="overflow-hidden rounded-b-md border-2 border-primary bg-card">
        {studio}
        {children ? <div className="border-t border-hairline">{children}</div> : null}
        {footer ? <div className="border-t border-hairline">{footer}</div> : null}
      </div>
    </div>
  )
}
