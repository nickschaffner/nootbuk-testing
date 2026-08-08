import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function CaptureButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="lg"
          className="fixed right-6 bottom-6 z-50 size-14 rounded-full shadow-lg"
          onClick={() => {
            // Quick Capture modal — Phase 7
            console.warn('Quick Capture not implemented yet')
          }}
        >
          <Plus className="size-6" />
          <span className="sr-only">Capture</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">Capture</TooltipContent>
    </Tooltip>
  )
}
