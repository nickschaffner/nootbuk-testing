import { useCallback, useState } from 'react'

import {
  applyExportOptions,
  buildSongExport,
  downloadExportAsZip,
  gatherSongExportData,
  saveExportToFolder,
  type ExportOptions,
  type SongExportData,
} from '@/lib/export'

export function useExport(songId: string | undefined) {
  const [exportData, setExportData] = useState<SongExportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadExportData = useCallback(async () => {
    if (!songId) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await gatherSongExportData(songId)
      setExportData(data)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Failed to prepare export.'
      console.warn('useExport loadExportData failed:', caughtError)
      setError(message)
      setExportData(null)
    } finally {
      setIsLoading(false)
    }
  }, [songId])

  const exportWithOptions = useCallback(
    async (options: ExportOptions) => {
      if (!songId) {
        return null
      }

      setIsExporting(true)
      setError(null)

      try {
        return await buildSongExport(songId, options)
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : 'Failed to build export.'
        console.warn('useExport exportWithOptions failed:', caughtError)
        setError(message)
        return null
      } finally {
        setIsExporting(false)
      }
    },
    [songId],
  )

  const saveToFolder = useCallback(
    async (options: ExportOptions) => {
      const data = exportData
        ? applyExportOptions(exportData, options)
        : await exportWithOptions(options)

      if (!data || data.files.length === 0) {
        return
      }

      setIsExporting(true)
      setError(null)

      try {
        await saveExportToFolder(data)
      } catch (caughtError) {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === 'AbortError'
        ) {
          return
        }

        const message =
          caughtError instanceof Error
            ? caughtError.message
            : 'Failed to save export folder.'
        console.warn('useExport saveToFolder failed:', caughtError)
        setError(message)
      } finally {
        setIsExporting(false)
      }
    },
    [exportData, exportWithOptions],
  )

  const downloadZip = useCallback(
    async (options: ExportOptions) => {
      const data = exportData
        ? applyExportOptions(exportData, options)
        : await exportWithOptions(options)

      if (!data || data.files.length === 0) {
        return
      }

      setIsExporting(true)
      setError(null)

      try {
        await downloadExportAsZip(data)
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : 'Failed to download zip.'
        console.warn('useExport downloadZip failed:', caughtError)
        setError(message)
      } finally {
        setIsExporting(false)
      }
    },
    [exportData, exportWithOptions],
  )

  return {
    exportData,
    isLoading,
    isExporting,
    error,
    loadExportData,
    saveToFolder,
    downloadZip,
  }
}
