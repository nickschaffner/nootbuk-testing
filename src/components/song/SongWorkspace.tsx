import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'

import { IdeaDetailSheet } from '@/components/pool/IdeaDetailSheet'
import { AddIdeaSheet } from '@/components/song/AddIdeaSheet'
import { AddSectionForm } from '@/components/song/AddSectionForm'
import { ImportFromPoolSheet } from '@/components/song/ImportFromPoolSheet'
import { SectionContainer } from '@/components/song/SectionContainer'
import { SortableIdeaCard } from '@/components/song/SortableIdeaCard'
import { SortableSection } from '@/components/song/SortableSection'
import { SongHeader } from '@/components/song/SongHeader'
import { Button } from '@/components/ui/button'
import {
  moveIdeaToSection,
  reorderIdeas,
  useIdeasForSong,
} from '@/hooks/useIdeas'
import { reorderSections, updateSection } from '@/hooks/useSections'
import { useSongWithSections } from '@/hooks/useSongs'
import {
  getDragType,
  parseIdeaSortableId,
  parseSectionContainerId,
  parseSortableSectionId,
  resolveIdeaContainerId,
  sectionContainerId,
  sortableSectionId,
  UNASSIGNED_CONTAINER_ID,
} from '@/lib/dnd-ids'
import type { Idea } from '@/types/idea'

interface SongWorkspaceProps {
  songId: string
}

interface AddIdeaTarget {
  sectionId: string | null
  label: string
}

export function SongWorkspace({ songId }: SongWorkspaceProps) {
  const songData = useSongWithSections(songId)
  const songIdeas = useIdeasForSong(songId)
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)
  const [addIdeaTarget, setAddIdeaTarget] = useState<AddIdeaTarget | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const ideasBySection = useMemo(() => {
    const grouped: Record<string, Idea[]> = { unassigned: [] }

    if (!songIdeas || !songData) {
      return grouped
    }

    for (const section of songData.sections) {
      grouped[section.id] = []
    }

    for (const idea of songIdeas) {
      if (idea.sectionId === null) {
        grouped.unassigned.push(idea)
      } else if (grouped[idea.sectionId]) {
        grouped[idea.sectionId].push(idea)
      } else {
        grouped.unassigned.push(idea)
      }
    }

    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => a.sortOrder - b.sortOrder)
    }

    return grouped
  }, [songIdeas, songData])

  const ideasByContainer = useMemo(() => {
    const map: Record<string, string[]> = {
      [UNASSIGNED_CONTAINER_ID]: ideasBySection.unassigned.map((idea) => idea.id),
    }

    for (const section of songData?.sections ?? []) {
      map[sectionContainerId(section.id)] = (ideasBySection[section.id] ?? []).map(
        (idea) => idea.id,
      )
    }

    return map
  }, [ideasBySection, songData?.sections])

  const activeIdea = useMemo(() => {
    if (!activeDragId?.startsWith('idea:') || !songIdeas) {
      return null
    }

    const ideaId = parseIdeaSortableId(activeDragId)
    return songIdeas.find((idea) => idea.id === ideaId) ?? null
  }, [activeDragId, songIdeas])

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id))
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null)

    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)
    const dragType = getDragType(activeId)

    if (dragType === 'section' && songData) {
      const activeSectionId = parseSortableSectionId(activeId)
      const overSectionId = parseSortableSectionId(overId)

      if (!activeSectionId || !overSectionId) {
        return
      }

      const sectionIds = songData.sections.map((section) => section.id)
      const oldIndex = sectionIds.indexOf(activeSectionId)
      const newIndex = sectionIds.indexOf(overSectionId)

      if (oldIndex === -1 || newIndex === -1) {
        return
      }

      try {
        await reorderSections(arrayMove(sectionIds, oldIndex, newIndex))
      } catch {
        // reorderSections already logs the error
      }

      return
    }

    if (dragType === 'idea') {
      const ideaId = parseIdeaSortableId(activeId)
      if (!ideaId) {
        return
      }

      const targetContainerId = resolveIdeaContainerId(overId, ideasByContainer)
      if (!targetContainerId) {
        return
      }

      const targetSectionId = parseSectionContainerId(targetContainerId)
      if (targetSectionId === undefined) {
        return
      }

      const activeIdeaRecord = songIdeas?.find((idea) => idea.id === ideaId)
      const sourceContainerId = activeIdeaRecord
        ? activeIdeaRecord.sectionId === null
          ? UNASSIGNED_CONTAINER_ID
          : sectionContainerId(activeIdeaRecord.sectionId)
        : null

      let targetIdeaIds = [...(ideasByContainer[targetContainerId] ?? [])].filter(
        (id) => id !== ideaId,
      )

      let insertIndex = targetIdeaIds.length
      if (overId.startsWith('idea:')) {
        const overIdeaId = parseIdeaSortableId(overId)
        if (overIdeaId) {
          const overIndex = targetIdeaIds.indexOf(overIdeaId)
          if (overIndex !== -1) {
            insertIndex = overIndex
          }
        }
      }

      targetIdeaIds.splice(insertIndex, 0, ideaId)

      try {
        if (sourceContainerId === targetContainerId) {
          await reorderIdeas(targetIdeaIds)
        } else {
          await moveIdeaToSection(ideaId, songId, targetSectionId)
          await reorderIdeas(targetIdeaIds)

          if (sourceContainerId) {
            const sourceIds = ideasByContainer[sourceContainerId].filter(
              (id) => id !== ideaId,
            )
            await reorderIdeas(sourceIds)
          }
        }
      } catch {
        // hooks already log errors
      }
    }
  }

  async function handleSectionTitleChange(sectionId: string, name: string) {
    try {
      await updateSection({ id: sectionId, name })
    } catch {
      // updateSection already logs the error
    }
  }

  if (songData === undefined || songIdeas === undefined) {
    return <p className="text-sm text-muted-foreground">Loading song...</p>
  }

  if (!songData) {
    return <p className="text-sm text-muted-foreground">Song not found.</p>
  }

  const sectionSortableIds = songData.sections.map((section) =>
    sortableSectionId(section.id),
  )

  return (
    <>
      <div className="space-y-6">
        <SongHeader song={songData.song} />

        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Sections</h2>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Download className="size-4" />
            Import from Pool
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={(event) => void handleDragEnd(event)}
        >
          <div className="space-y-4">
            <SortableContext
              items={sectionSortableIds}
              strategy={verticalListSortingStrategy}
            >
              {songData.sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  ideas={ideasBySection[section.id] ?? []}
                  onTitleChange={handleSectionTitleChange}
                  onAddIdea={(sectionId, label) =>
                    setAddIdeaTarget({ sectionId, label })
                  }
                  onIdeaClick={setSelectedIdeaId}
                />
              ))}
            </SortableContext>

            <SectionContainer
              containerId={UNASSIGNED_CONTAINER_ID}
              title="Unassigned"
              ideas={ideasBySection.unassigned}
              isUnassigned
              onAddIdea={() =>
                setAddIdeaTarget({ sectionId: null, label: 'Unassigned' })
              }
              onIdeaClick={setSelectedIdeaId}
            />
          </div>

          <DragOverlay>
            {activeIdea ? (
              <div className="w-80 opacity-90">
                <SortableIdeaCard
                  idea={activeIdea}
                  onClick={() => undefined}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <AddSectionForm songId={songId} />
      </div>

      <AddIdeaSheet
        open={addIdeaTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAddIdeaTarget(null)
          }
        }}
        songId={songId}
        sectionId={addIdeaTarget?.sectionId ?? null}
        sectionLabel={addIdeaTarget?.label ?? ''}
      />

      <ImportFromPoolSheet
        open={importOpen}
        onOpenChange={setImportOpen}
        songId={songId}
      />

      <IdeaDetailSheet
        ideaId={selectedIdeaId}
        onClose={() => setSelectedIdeaId(null)}
      />
    </>
  )
}
