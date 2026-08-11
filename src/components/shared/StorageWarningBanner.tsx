import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useStorageWarning } from '@/hooks/useStorageWarning'

export function StorageWarningBanner() {
  const warning = useStorageWarning()
  const [dismissed, setDismissed] = useState(false)

  if (!warning || dismissed) {
    return null
  }

  return (
    <div className="flex items-start gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
      <p className="flex-1">{warning}</p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-amber-100 hover:bg-amber-500/20 hover:text-amber-50"
        onClick={() => setDismissed(true)}
      >
        <X className="size-4" />
        <span className="sr-only">Dismiss storage warning</span>
      </Button>
    </div>
  )
}
