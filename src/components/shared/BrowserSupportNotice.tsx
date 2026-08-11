import { Info, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { getUnsupportedFeatureMessages } from '@/lib/browser-capabilities'

export function BrowserSupportNotice() {
  const messages = useMemo(() => getUnsupportedFeatureMessages(), [])
  const [dismissed, setDismissed] = useState(false)

  if (messages.length === 0 || dismissed) {
    return null
  }

  return (
    <div className="flex items-start gap-3 border-b border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1 space-y-1">
        {messages.map((message) => (
          <p key={message}>{message}</p>
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        onClick={() => setDismissed(true)}
      >
        <X className="size-4" />
        <span className="sr-only">Dismiss browser notice</span>
      </Button>
    </div>
  )
}
