import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { shouldIgnoreGlobalShortcut } from '@/lib/browser-capabilities'

export type QuickCaptureTarget = {
  songId: string
  sectionId: string | null
  sectionLabel?: string
}

type QuickCaptureContextValue = {
  isOpen: boolean
  target: QuickCaptureTarget | null
  open: (target?: QuickCaptureTarget) => void
  close: () => void
}

const QuickCaptureContext = createContext<QuickCaptureContextValue | null>(null)

export function QuickCaptureProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [target, setTarget] = useState<QuickCaptureTarget | null>(null)

  const open = useCallback((nextTarget?: QuickCaptureTarget) => {
    setTarget(nextTarget ?? null)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setTarget(null)
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (shouldIgnoreGlobalShortcut(event)) {
        return
      }

      const isModifier = event.ctrlKey || event.metaKey
      if (isModifier && event.shiftKey && event.key.toLowerCase() === 'c') {
        event.preventDefault()
        if (isOpen) {
          close()
        } else {
          open()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [close, isOpen, open])

  const value = useMemo(
    () => ({ isOpen, target, open, close }),
    [close, isOpen, open, target],
  )

  return (
    <QuickCaptureContext.Provider value={value}>
      {children}
    </QuickCaptureContext.Provider>
  )
}

export function useQuickCapture() {
  const context = useContext(QuickCaptureContext)
  if (!context) {
    throw new Error('useQuickCapture must be used within QuickCaptureProvider')
  }
  return context
}
