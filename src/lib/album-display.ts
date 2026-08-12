import { formatAudioTime } from '@/lib/audio'
import type { AlbumFormat } from '@/types/album'

export function formatAlbumFormat(format: AlbumFormat | null | undefined): string {
  switch (format ?? 'ep') {
    case 'single':
      return 'Single'
    case 'lp':
      return 'LP'
    case 'ep':
    default:
      return 'EP'
  }
}

export function formatAlbumLength(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) {
    return '0:00'
  }

  return formatAudioTime(seconds)
}
