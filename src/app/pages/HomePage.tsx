import { useState } from 'react'

import { IdeaDetailSheet } from '@/components/pool/IdeaDetailSheet'
import { IdeaPool } from '@/components/pool/IdeaPool'
import { NewIdeaForm } from '@/components/pool/NewIdeaForm'
import { RecentSongsList } from '@/components/pool/RecentSongsList'

export function HomePage() {
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Idea Pool</h1>
            <p className="text-sm text-muted-foreground">
              Unattached ideas waiting to land in a song.
            </p>
          </div>

          <NewIdeaForm />
          <IdeaPool onSelectIdea={setSelectedIdeaId} />
        </div>

        <aside>
          <RecentSongsList />
        </aside>
      </div>

      <IdeaDetailSheet
        ideaId={selectedIdeaId}
        onClose={() => setSelectedIdeaId(null)}
      />
    </>
  )
}
