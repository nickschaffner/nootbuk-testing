export const UNASSIGNED_CONTAINER_ID = 'container:unassigned'

export function sectionContainerId(sectionId: string): string {
  return `container:${sectionId}`
}

export function sortableSectionId(sectionId: string): string {
  return `sortable-section:${sectionId}`
}

export function ideaSortableId(ideaId: string): string {
  return `idea:${ideaId}`
}

export function parseSectionContainerId(
  id: string,
): string | null | undefined {
  if (id === UNASSIGNED_CONTAINER_ID) {
    return null
  }

  if (id.startsWith('container:')) {
    return id.slice('container:'.length)
  }

  return undefined
}

export function parseSortableSectionId(id: string): string | undefined {
  if (id.startsWith('sortable-section:')) {
    return id.slice('sortable-section:'.length)
  }

  return undefined
}

export function parseIdeaSortableId(id: string): string | undefined {
  if (id.startsWith('idea:')) {
    return id.slice('idea:'.length)
  }

  return undefined
}

export type DragItemType = 'section' | 'idea'

export function getDragType(id: string): DragItemType | undefined {
  if (id.startsWith('sortable-section:')) {
    return 'section'
  }

  if (id.startsWith('idea:')) {
    return 'idea'
  }

  return undefined
}

export function resolveIdeaContainerId(
  overId: string,
  ideasByContainer: Record<string, string[]>,
): string | undefined {
  if (overId.startsWith('container:')) {
    return overId
  }

  if (overId.startsWith('idea:')) {
    const ideaId = parseIdeaSortableId(overId)
    if (!ideaId) {
      return undefined
    }

    for (const [containerId, ideaIds] of Object.entries(ideasByContainer)) {
      if (ideaIds.includes(ideaId)) {
        return containerId
      }
    }
  }

  return undefined
}
