import { supported as fsAccessSupported } from 'browser-fs-access'
import JSZip from 'jszip'

import { getEntriesForSong } from '@/hooks/useJournal'
import { getIdeasForSong } from '@/hooks/useIdeas'
import { getMediaForIdea } from '@/hooks/useMedia'
import { getSongWithSections } from '@/hooks/useSongs'
import { getFileExtension } from '@/lib/audio'
import { inferIdeaMediaSource } from '@/lib/idea-media-source'
import { noteEventsToMidiBlob } from '@/lib/midi'
import type { Idea, IdeaMedia } from '@/types/idea'
import type { SongJournalEntry } from '@/types/song'

export interface ExportOptions {
  includeAudio: boolean
  includeMidi: boolean
  includeImages: boolean
  includeLyrics: boolean
  includeJournal: boolean
}

export type ExportFileCategory =
  | 'audio'
  | 'midi'
  | 'images'
  | 'lyrics'
  | 'journal'

export interface ExportFileEntry {
  path: string
  content: Blob | string
  category: ExportFileCategory
}

export interface SongExportData {
  folderName: string
  inventory: {
    audio: number
    midi: number
    images: number
    hasLyrics: boolean
    hasJournal: boolean
  }
  preview: string[]
  files: ExportFileEntry[]
}

const AUDIO_MIME_EXTENSION: Record<string, string> = {
  'audio/wav': '.wav',
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/aiff': '.aiff',
  'audio/x-aiff': '.aiff',
}

export function canSaveToFolder(): boolean {
  return (
    fsAccessSupported &&
    typeof window.showDirectoryPicker === 'function'
  )
}

export function sanitizePathSegment(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '').trim() || 'untitled'
}

function lowercaseFilename(filename: string): string {
  return filename.toLowerCase()
}

function getAudioExtension(media: IdeaMedia): string {
  const fromName = getFileExtension(media.filename)
  if (fromName) {
    return fromName
  }

  return AUDIO_MIME_EXTENSION[media.mimeType] ?? '.wav'
}

function getIdeaPrefix(idea: Idea): string {
  const intent = idea.sectionIntent ?? 'unassigned'
  return `${intent}-${idea.role}`
}

function createFilenameAllocator() {
  const counters = new Map<string, number>()
  const usedImageNames = new Set<string>()

  return {
    nextMediaFilename(prefix: string, extension: string): string {
      const key = `${prefix}${extension}`
      const next = (counters.get(key) ?? 0) + 1
      counters.set(key, next)
      return lowercaseFilename(
        `${prefix}-${String(next).padStart(3, '0')}${extension}`,
      )
    },
    nextImageFilename(originalFilename: string): string {
      const baseName = lowercaseFilename(sanitizePathSegment(originalFilename))
      if (!usedImageNames.has(baseName)) {
        usedImageNames.add(baseName)
        return baseName
      }

      const extension = getFileExtension(baseName)
      const stem = extension
        ? baseName.slice(0, -extension.length)
        : baseName
      let counter = 2

      while (usedImageNames.has(`${stem}-${counter}${extension}`)) {
        counter += 1
      }

      const uniqueName = `${stem}-${counter}${extension}`
      usedImageNames.add(uniqueName)
      return uniqueName
    },
  }
}

function htmlToMarkdown(html: string): string {
  if (!html.trim()) {
    return ''
  }

  let markdown = html
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gi, '![$1]($2)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return markdown
}

function buildLyricsText(
  songTitle: string,
  songLyrics: string | null,
): string {
  if (!songLyrics?.trim()) {
    return ''
  }

  return [songTitle, '', songLyrics.trim()].join('\n').trim()
}

function buildJournalMarkdown(entries: SongJournalEntry[]): string {
  if (entries.length === 0) {
    return ''
  }

  const lines: string[] = ['# Production Journal', '']

  for (const entry of entries) {
    const topic = entry.topic?.trim() || 'Untitled'
    const body = htmlToMarkdown(entry.content)
    lines.push(`## ${topic}`, '', body, '')
  }

  return lines.join('\n').trim()
}

function buildFolderPreview(folderName: string, files: ExportFileEntry[]): string[] {
  const tree = new Set<string>([`${folderName}/`])

  for (const file of files) {
    tree.add(`${folderName}/${file.path}`)
    const parts = file.path.split('/')
    if (parts.length > 1) {
      tree.add(`${folderName}/${parts[0]}/`)
    }
  }

  return Array.from(tree).sort()
}

function filterExportFiles(
  files: ExportFileEntry[],
  options: ExportOptions,
): ExportFileEntry[] {
  return files.filter((file) => {
    switch (file.category) {
      case 'audio':
        return options.includeAudio
      case 'midi':
        return options.includeMidi
      case 'images':
        return options.includeImages
      case 'lyrics':
        return options.includeLyrics
      case 'journal':
        return options.includeJournal
      default:
        return false
    }
  })
}

export async function gatherSongExportData(songId: string): Promise<SongExportData> {
  const songData = await getSongWithSections(songId)
  if (!songData) {
    throw new Error(`Song not found: ${songId}`)
  }

  const { song } = songData
  const ideas = await getIdeasForSong(songId)
  const journalEntries = await getEntriesForSong(songId)
  const allocator = createFilenameAllocator()
  const files: ExportFileEntry[] = []

  let audioCount = 0
  let midiCount = 0
  let imageCount = 0

  for (const idea of ideas) {
    const mediaItems = await getMediaForIdea(idea.id)
    const prefix = getIdeaPrefix(idea)

    for (const media of mediaItems) {
      if (media.type === 'audio') {
        audioCount += 1
        const audioSource = inferIdeaMediaSource(media) ?? 'audio-recording'
        files.push({
          path: `audio/${allocator.nextMediaFilename(`${prefix}-${audioSource}`, getAudioExtension(media))}`,
          content: media.blob,
          category: 'audio',
        })
      }

      if (media.type === 'midi') {
        midiCount += 1
        const blob =
          media.blob.size > 0
            ? media.blob
            : media.noteData
              ? noteEventsToMidiBlob(
                  media.noteData,
                  idea.tempo ?? 120,
                )
              : null

        if (blob) {
          const midiSource = inferIdeaMediaSource(media) ?? 'step-input'
          files.push({
            path: `midi/${allocator.nextMediaFilename(`${prefix}-${midiSource}`, '.mid')}`,
            content: blob,
            category: 'midi',
          })
        }
      }

      if (media.type === 'image') {
        imageCount += 1
        files.push({
          path: `images/${allocator.nextImageFilename(media.filename)}`,
          content: media.blob,
          category: 'images',
        })
      }
    }
  }

  const lyricsText = buildLyricsText(song.title, song.lyrics)
  const journalMarkdown = buildJournalMarkdown(journalEntries)
  const hasLyrics = lyricsText.length > 0
  const hasJournal = journalMarkdown.length > 0

  if (hasLyrics) {
    files.push({
      path: 'notes/lyrics.txt',
      content: lyricsText,
      category: 'lyrics',
    })
  }

  if (hasJournal) {
    files.push({
      path: 'notes/production-journal.md',
      content: journalMarkdown,
      category: 'journal',
    })
  }

  const folderName = sanitizePathSegment(song.title)

  return {
    folderName,
    inventory: {
      audio: audioCount,
      midi: midiCount,
      images: imageCount,
      hasLyrics,
      hasJournal,
    },
    preview: buildFolderPreview(folderName, files),
    files,
  }
}

export function applyExportOptions(
  exportData: SongExportData,
  options: ExportOptions,
): SongExportData {
  const filteredFiles = filterExportFiles(exportData.files, options)

  return {
    ...exportData,
    preview: buildFolderPreview(exportData.folderName, filteredFiles),
    files: filteredFiles,
  }
}

export async function buildSongExport(
  songId: string,
  options: ExportOptions,
): Promise<SongExportData> {
  const exportData = await gatherSongExportData(songId)
  return applyExportOptions(exportData, options)
}

async function writeFileToDirectory(
  root: FileSystemDirectoryHandle,
  relativePath: string,
  content: Blob | string,
): Promise<void> {
  const parts = relativePath.split('/')
  const fileName = parts.pop()
  if (!fileName) {
    return
  }

  let currentDir = root
  for (const part of parts) {
    currentDir = await currentDir.getDirectoryHandle(part, { create: true })
  }

  const fileHandle = await currentDir.getFileHandle(fileName, { create: true })
  const writable = await fileHandle.createWritable()
  const data =
    typeof content === 'string' ? new Blob([content], { type: 'text/plain' }) : content
  await writable.write(data)
  await writable.close()
}

export async function saveExportToFolder(exportData: SongExportData): Promise<void> {
  if (!canSaveToFolder() || !window.showDirectoryPicker) {
    throw new Error('File System Access API is not supported in this browser.')
  }

  const directoryHandle = await window.showDirectoryPicker()
  const songDirectory = await directoryHandle.getDirectoryHandle(
    exportData.folderName,
    { create: true },
  )

  for (const file of exportData.files) {
    await writeFileToDirectory(songDirectory, file.path, file.content)
  }
}

export async function downloadExportAsZip(exportData: SongExportData): Promise<void> {
  const zip = new JSZip()
  const root = zip.folder(exportData.folderName)

  if (!root) {
    throw new Error('Failed to create zip folder.')
  }

  for (const file of exportData.files) {
    if (typeof file.content === 'string') {
      root.file(file.path, file.content)
    } else {
      root.file(file.path, file.content)
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${exportData.folderName}.zip`
  anchor.click()
  URL.revokeObjectURL(url)
}
