import { isDevMode } from '@/components/calibration/isDevMode'
import KitPage from '@/components/kit/KitPage'

import { LinerNotesScope } from '@/app/pages/LinerNotesScope'

export default function StyleguidePage() {
  if (!isDevMode()) {
    return null
  }

  return (
    <LinerNotesScope>
      <KitPage />
    </LinerNotesScope>
  )
}
