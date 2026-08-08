import type { Idea, IdeaRole } from '@/types/idea'

export const IDEA_ROLES: IdeaRole[] = [
  'melody',
  'bassline',
  'chords',
  'drums',
  'riff',
  'synth',
  'vocal',
  'texture',
  'sample',
  'other',
]

export function formatRoleLabel(role: IdeaRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export function getIdeaDisplayLabel(idea: Idea): string {
  const textLine =
    idea.lyrics?.split('\n')[0]?.trim() ||
    idea.notes?.split('\n')[0]?.trim()

  if (textLine) {
    return textLine
  }

  const parts = [formatRoleLabel(idea.role)]

  if (idea.key) {
    parts.push(idea.key)
  }

  if (idea.tempo) {
    parts.push(`${idea.tempo}bpm`)
  }

  return parts.join(' — ')
}

export function ideaMatchesSearch(idea: Idea, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  const haystack = [
    getIdeaDisplayLabel(idea),
    idea.lyrics,
    idea.notes,
    idea.instrumentName,
    idea.key,
    idea.role,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalized)
}
