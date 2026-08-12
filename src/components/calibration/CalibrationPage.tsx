import { DatabaseStatsTool } from '@/components/calibration/DatabaseStatsTool'
import { ExportImportDatabaseTool } from '@/components/calibration/ExportImportDatabaseTool'
import { isDevMode } from '@/components/calibration/isDevMode'
import { SeedSampleDataTool } from '@/components/calibration/SeedSampleDataTool'
import { WipeAllDataTool } from '@/components/calibration/WipeAllDataTool'

export function CalibrationPage() {
  if (!isDevMode()) {
    return null
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

      <WipeAllDataTool />
      <DatabaseStatsTool />
      <ExportImportDatabaseTool />
      <SeedSampleDataTool />
    </div>
  )
}
