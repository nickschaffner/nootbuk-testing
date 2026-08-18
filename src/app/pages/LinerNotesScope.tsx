import { useState, type ReactNode } from 'react'

import './styleguide-scope.css'

export function LinerNotesScope({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(true)

  return (
    <div className={dark ? 'ln-styleguide dark' : 'ln-styleguide'}>
      <div className="sticky top-0 z-20 flex items-center justify-end border-b border-hairline bg-panel px-4 py-2">
        <button
          type="button"
          className="focusable border border-hairline px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-foreground hover:border-foreground"
          onClick={() => setDark((value) => !value)}
        >
          {dark ? 'Paper Light' : 'Studio Dark'}
        </button>
      </div>
      {children}
    </div>
  )
}
