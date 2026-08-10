import { SongAssetsTab } from '@/components/song/SongAssetsTab'
import { SongDetailsTab } from '@/components/song/SongDetailsTab'
import { SongJournalTab } from '@/components/song/SongJournalTab'
import { SongLyricsTab } from '@/components/song/SongLyricsTab'
import { SongReferencesTab } from '@/components/song/SongReferencesTab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Song } from '@/types/song'

interface SongSidebarProps {
  song: Song
}

export function SongSidebar({ song }: SongSidebarProps) {
  return (
    <aside className="sticky top-4 h-[calc(100vh-6rem)] overflow-hidden rounded-lg border bg-card">
      <Tabs defaultValue="lyrics" className="flex h-full flex-col">
        <div className="border-b p-3">
          <TabsList className="w-full">
            <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
            <TabsTrigger value="journal">Journal</TabsTrigger>
            <TabsTrigger value="references">References</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <TabsContent value="lyrics" className="mt-0">
            <SongLyricsTab song={song} />
          </TabsContent>

          <TabsContent value="journal" className="mt-0">
            <SongJournalTab songId={song.id} />
          </TabsContent>

          <TabsContent value="references" className="mt-0">
            <SongReferencesTab songId={song.id} />
          </TabsContent>

          <TabsContent value="assets" className="mt-0">
            <SongAssetsTab songId={song.id} />
          </TabsContent>

          <TabsContent value="details" className="mt-0">
            <SongDetailsTab song={song} />
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  )
}
