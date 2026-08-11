import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useQuickCapture } from '@/stores/quickCapture'

export function CaptureButton() {
  const { open } = useQuickCapture()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="lg"
          className="fixed right-6 bottom-6 z-50 hidden size-14 rounded-full shadow-lg md:inline-flex"
          onClick={() => open()}
        >
          <Plus className="size-6" />
          <span className="sr-only">Capture</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        Capture (Ctrl+Shift+C)
      </TooltipContent>
    </Tooltip>
  )
}
