import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { CalibrationPage } from '@/components/calibration/CalibrationPage'
import { AppShell } from '@/components/shared/AppShell'
import { AlbumPage } from '@/app/pages/AlbumPage'
import { AlbumsPage } from '@/app/pages/AlbumsPage'
import { HomePage } from '@/app/pages/HomePage'
import { IdeasPage } from '@/app/pages/IdeasPage'
import { InstrumentEditPage } from '@/app/pages/InstrumentEditPage'
import { InstrumentsPage } from '@/app/pages/InstrumentsPage'
import { SongPage } from '@/app/pages/SongPage'
import { SongsPage } from '@/app/pages/SongsPage'
import StyleguidePage from '@/app/pages/StyleguidePage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="ideas" element={<IdeasPage />} />
          <Route path="songs" element={<SongsPage />} />
          <Route path="song/:id" element={<SongPage />} />
          <Route path="albums" element={<AlbumsPage />} />
          <Route path="album/:id" element={<AlbumPage />} />
          <Route path="instruments" element={<InstrumentsPage />} />
          <Route path="instruments/:id" element={<InstrumentEditPage />} />
          <Route path="calibration" element={<CalibrationPage />} />
          <Route path="styleguide" element={<StyleguidePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
