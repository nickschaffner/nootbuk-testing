import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/shared/AppShell'
import { AlbumPage } from '@/app/pages/AlbumPage'
import { AlbumsPage } from '@/app/pages/AlbumsPage'
import { HomePage } from '@/app/pages/HomePage'
import { SongPage } from '@/app/pages/SongPage'
import { SongsPage } from '@/app/pages/SongsPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="songs" element={<SongsPage />} />
          <Route path="song/:id" element={<SongPage />} />
          <Route path="albums" element={<AlbumsPage />} />
          <Route path="album/:id" element={<AlbumPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
