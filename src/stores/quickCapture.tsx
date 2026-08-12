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

export type IdeaEditorMode = 'new' | 'edit'

type QuickCaptureContextValue = {
  isOpen: boolean
  mode: IdeaEditorMode
  target: QuickCaptureTarget | null
  ideaId: string | null
  /** Open IdeaEditor in new/create mode (optional song/section target). */
  open: (target?: QuickCaptureTarget) => void
  /** Open IdeaEditor in edit mode for an existing idea. */
  openIdea: (ideaId: string) => void
  close: () => void
}

const QuickCaptureContext = createContext<QuickCaptureContextValue | null>(null)

export function QuickCaptureProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<IdeaEditorMode>('new')
  const [target, setTarget] = useState<QuickCaptureTarget | null>(null)
  const [ideaId, setIdeaId] = useState<string | null>(null)

  const open = useCallback((nextTarget?: QuickCaptureTarget) => {
    setMode('new')
    setIdeaId(null)
    setTarget(nextTarget ?? null)
    setIsOpen(true)
  }, [])

  const openIdea = useCallback((nextIdeaId: string) => {
    setMode('edit')
    setIdeaId(nextIdeaId)
    setTarget(null)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setMode('new')
    setTarget(null)
    setIdeaId(null)
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
    () => ({ isOpen, mode, target, ideaId, open, openIdea, close }),
    [close, ideaId, isOpen, mode, open, openIdea, target],
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

/** Alias — same store as Quick Capture / IdeaEditor. */
export const useIdeaEditor = useQuickCapture
