import type { IdeaMediaSource, IdeaMediaType } from '@/types/idea'

export const IDEA_MEDIA_SOURCES = [
  'audio-recording',
  'audio-import',
  'midi-recording',
  'step-input',
  'midi-extraction',
  'midi-import',
] as const satisfies readonly IdeaMediaSource[]

const SOURCE_SET = new Set<string>(IDEA_MEDIA_SOURCES)

export function isIdeaMediaSource(value: unknown): value is IdeaMediaSource {
  return typeof value === 'string' && SOURCE_SET.has(value)
}

/** Map stored / legacy source (+ filename hints) onto the six slots. */
export function inferIdeaMediaSource(item: {
  type?: IdeaMediaType | string
  source?: string | null
  filename?: string
}): IdeaMediaSource | null {
  if (item.type === 'image' || item.type === 'file') {
    return null
  }

  if (isIdeaMediaSource(item.source)) {
    return item.source
  }

  if (item.source === 'notepicker') {
    return 'step-input'
  }
  if (item.source === 'extraction') {
    return 'midi-extraction'
  }
  if (item.source === 'recording') {
    return item.type === 'audio' ? 'audio-recording' : 'midi-recording'
  }

  const name = (item.filename ?? '').toLowerCase()

  if (item.type === 'audio') {
    if (name.startsWith('recording-') || name.includes('-recording-')) {
      return 'audio-recording'
    }
    return name ? 'audio-import' : 'audio-recording'
  }

  if (item.type === 'midi') {
    if (name.startsWith('recording-') || name.includes('-recording-')) {
      return 'midi-recording'
    }
    if (name.startsWith('extraction-') || name.includes('-extraction-')) {
      return 'midi-extraction'
    }
    return 'step-input'
  }

  return null
}
