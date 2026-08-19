import { useState } from 'react'

import { isDevMode } from '@/components/calibration/isDevMode'
import { Button, PageHeader } from '@/components/kit'
import KitPage from '@/components/kit/KitPage'

export default function StyleguidePage() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

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
      <PageHeader
        className="border-b border-hairline bg-panel px-6"
        title="Style Guide"
        action={
          <Button type="button" variant="secondary" size="sm" onClick={toggleTheme}>
            {dark ? 'Paper Light' : 'Studio Dark'}
          </Button>
        }
      />
      <KitPage />
    </>
  )
}
