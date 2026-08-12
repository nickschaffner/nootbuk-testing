import { AlbumCreditsTab } from '@/components/album/AlbumCreditsTab'
import { AlbumProductionNotesTab } from '@/components/album/AlbumProductionNotesTab'
import { AlbumReferenceTab } from '@/components/album/AlbumReferenceTab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Album } from '@/types/album'

interface AlbumSidebarProps {
  album: Album
}

export function AlbumSidebar({ album }: AlbumSidebarProps) {
  return (
    <aside className="sticky top-4 h-[calc(100vh-6rem)] w-96 shrink-0 overflow-hidden rounded-lg border bg-card">
      <Tabs defaultValue="notes" className="flex h-full flex-col">
        <div className="border-b p-3">
          <TabsList className="w-full">
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="reference">Reference</TabsTrigger>
            <TabsTrigger value="credits">Credits</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <TabsContent value="notes" className="mt-0">
            <AlbumProductionNotesTab album={album} />
          </TabsContent>

          <TabsContent value="reference" className="mt-0">
            <AlbumReferenceTab albumId={album.id} />
          </TabsContent>

          <TabsContent value="credits" className="mt-0">
            <AlbumCreditsTab album={album} />
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  )
}
