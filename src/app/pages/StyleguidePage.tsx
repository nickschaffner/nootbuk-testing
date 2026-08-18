import { useEffect, useState } from 'react'

import { isDevMode } from '@/components/calibration/isDevMode'
import { Button } from '@/components/kit'
import KitPage from '@/components/kit/KitPage'

export default function StyleguidePage() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    return () => {
      document.documentElement.classList.add('dark')
    }
  }, [])

  if (!isDevMode()) {
    return null
  }

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <>
      <div className="sticky top-0 z-20 mb-2 flex items-center justify-end border-b border-hairline bg-panel px-4 py-2">
        <Button type="button" variant="secondary" size="sm" onClick={toggleTheme}>
          {dark ? 'Paper Light' : 'Studio Dark'}
        </Button>
      </div>
      <KitPage />
    </>
  )
}
