import { useState } from 'react'

import { DatabaseStatsTool } from '@/components/calibration/DatabaseStatsTool'
import { DexieCloudDebugTool } from '@/components/calibration/DexieCloudDebugTool'
import { ExportImportDatabaseTool } from '@/components/calibration/ExportImportDatabaseTool'
import { isDevMode } from '@/components/calibration/isDevMode'
import { SeedSampleDataTool } from '@/components/calibration/SeedSampleDataTool'
import { WipeDataTool } from '@/components/calibration/WipeDataTool'

export function CalibrationPage() {
  const [statsRefreshToken, setStatsRefreshToken] = useState(0)

  if (!isDevMode()) {
    return null
  }

  function refreshStats() {
    setStatsRefreshToken((token) => token + 1)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
          Dev tools
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Calibration</h1>
        <p className="text-sm text-muted-foreground">
          Local-only utilities for wiping, inspecting, backing up, and seeding
          the client database. Not a user-facing feature.
        </p>
      </div>

      <DexieCloudDebugTool />
      <WipeDataTool onComplete={refreshStats} />
      <DatabaseStatsTool refreshToken={statsRefreshToken} />
      <ExportImportDatabaseTool onComplete={refreshStats} />
      <SeedSampleDataTool onComplete={refreshStats} />
    </div>
  )
}
