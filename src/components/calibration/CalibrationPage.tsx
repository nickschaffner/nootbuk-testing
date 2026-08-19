import { useState } from 'react'

import { DatabaseStatsTool } from '@/components/calibration/DatabaseStatsTool'
import { DexieCloudDebugTool } from '@/components/calibration/DexieCloudDebugTool'
import { ExportImportDatabaseTool } from '@/components/calibration/ExportImportDatabaseTool'
import { isDevMode } from '@/components/calibration/isDevMode'
import { SeedSampleDataTool } from '@/components/calibration/SeedSampleDataTool'
import { WipeDataTool } from '@/components/calibration/WipeDataTool'
import { PageHeader } from '@/components/kit'

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
      <PageHeader title="Calibration" />

      <DexieCloudDebugTool />
      <WipeDataTool onComplete={refreshStats} />
      <DatabaseStatsTool refreshToken={statsRefreshToken} />
      <ExportImportDatabaseTool onComplete={refreshStats} />
      <SeedSampleDataTool onComplete={refreshStats} />
    </div>
  )
}
