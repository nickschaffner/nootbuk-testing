# Nootbuk — Build Plan

This is the phased implementation plan. Each phase should be completed and working before moving to the next. The app is called **Nootbuk** — a musician's idea capture and song documentation tool.

**Phases 0–11:** Desktop MVP build (scaffold → data → capture → workspace → export). ✅ Complete.
**Phase 12:** Integration testing. Deferred — see TODO.md.
**Phase 13:** Responsive + PWA + deploy. ✅ Partially complete (Netlify live, minimal responsive).
**Iterations I1–I8:** Feature refinement based on real usage feedback. This is the current work.

**Read the `.cursor/rules/` files for stack, conventions, and constraints.**

---

## Phase 0: Project Scaffold

**Goal:** Empty app that runs, with routing, layout shell, and dark theme.

1. Scaffold with `npm create vite@latest nootbuk -- --template react-ts`
2. Install and configure Tailwind v4:
   - `npm install tailwindcss @tailwindcss/vite`
   - Add `@tailwindcss/vite` plugin to vite.config.ts
   - In CSS: `@import "tailwindcss";` (NOT @tailwind directives)
   - Add @theme block for any custom tokens
3. Initialize shadcn/ui: `npx shadcn@latest init` (style: new-york, OKLCH colors)
4. Install React Router (or TanStack Router): set up routes for /, /song/:id, /album/:id
5. Create the app shell layout:
   - Sidebar nav with: Home (Pool), Songs, Albums
   - Main content area
   - Floating "Capture" button (bottom-right, always visible)
6. Set dark mode as default (dark class on `<html>`)
7. Verify it runs: `npm run dev` → see the empty shell with navigation working.

**Acceptance:** App loads, routes work, dark theme active, Capture button visible. No data, no functionality yet.

---

## Phase 1: Data Layer

**Goal:** Dexie database with full schema, TypeScript types, and CRUD hooks. No UI for this yet — just the foundation.

1. Install Dexie: `npm install dexie`
2. Create TypeScript interfaces in `/src/types/`:
   - `idea.ts` — Idea, IdeaMedia, IdeaNoteSequence, NoteEvent
   - `song.ts` — Song, SongSection, SongJournalEntry, SongReference, SongAsset
   - `album.ts` — Album
3. Create Dexie database definition in `/src/lib/db.ts`:
   - Define all tables with indexed fields per the schema in the Tech Architecture doc
   - Use the exact interfaces from /types/
4. Create CRUD hooks in `/src/hooks/`:
   - `useIdeas.ts` — createIdea, updateIdea, deleteIdea, getIdeasInPool, getIdeasForSong, getIdeasForSection, moveIdeaToSection, reorderIdeas
   - `useSongs.ts` — createSong, updateSong, deleteSong, getAllSongs, getSongWithSections
   - `useSections.ts` — createSection, updateSection, deleteSection, reorderSections
   - `useJournal.ts` — createEntry, updateEntry, deleteEntry, getEntriesForSong
   - `useAlbums.ts` — createAlbum, updateAlbum, deleteAlbum, getAllAlbums
   - `useMedia.ts` — addMediaToIdea, removeMedia, getMediaForIdea
5. Use Dexie's `liveQuery()` for all read operations so UI auto-updates.
6. Create `/src/lib/notes.ts` — MIDI number ↔ note name conversion utilities.

**Acceptance:** Can import and call CRUD functions from the browser console. liveQuery subscriptions work. Types are strict — no `any`.

---

## Phase 2: Idea Pool & Basic CRUD UI

**Goal:** Home screen shows ideas from the pool. Can create ideas manually (text-only for now), view them, delete them.

1. Build the Idea Pool view on the Home route (/):
   - List/grid of idea cards from Dexie where songId === null
   - Each card shows: role badge, title or auto-generated label, timestamp
   - Empty state: "No ideas yet. Capture your first idea."
2. Build a basic "New Idea" form (temporary — this will become Quick Capture later):
   - Text fields for: lyrics, notes, instrumentName
   - Role selector (pills/chips for melody, bassline, chords, drums, etc.)
   - Key and Tempo inputs
   - Save button → creates Idea in Dexie with songId=null
3. Build Idea Detail panel (Sheet or Dialog):
   - Click an idea card → opens panel showing all metadata
   - All fields editable
   - Delete button with confirmation
4. Add simple filtering to the pool: filter by role, search by text content.
5. Add Recent Songs list (right side or top section of Home):
   - List songs sorted by updatedAt
   - Each row: title, status badge, last modified
   - "New Song" button

**Acceptance:** Can create ideas, see them in the pool, filter them, edit them, delete them. Can see a list of songs (empty for now).

---

## Phase 3: Song Workspace (Structure)

**Goal:** Create songs, define sections, place ideas into sections. Drag and drop.

1. Install @dnd-kit: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
2. Build the Song Workspace page (/song/:id):
   - Header: editable title, key, tempo, time signature, status dropdown
   - Main area: vertical list of sections
3. Section management:
   - "Add Section" button → text input for name
   - Each section is a collapsible container with drag handle for reordering
   - Default suggestions when adding: Intro, Verse, Chorus, Bridge, Outro (but user can type anything)
4. Ideas within sections:
   - Compact idea cards inside each section
   - "Add Idea" button per section → opens Quick Capture (or temp form) with sectionId pre-set
   - Drag ideas to reorder within a section
   - Drag ideas between sections (drop zones light up)
5. "Unassigned" section at the bottom for floating ideas
6. Moving ideas from pool to song:
   - Either a "Move to Song" action on the Idea Detail panel
   - Or the ability to browse the pool from within the Song Workspace

**Acceptance:** Can create songs, add sections, create ideas within sections, drag-reorder ideas and sections, move ideas between sections.

---

## Phase 4: Audio Recording

**Goal:** Record audio from the microphone, store as WAV, play back with waveform.

1. Build the AudioWorklet processor for PCM capture:
   - Create an AudioWorkletProcessor that collects Float32 samples
   - On stop, concatenate buffers and encode to WAV (write RIFF header + PCM data)
2. Build `useAudioRecorder` hook:
   - getUserMedia({ audio: true }) for mic access
   - Connect to AudioWorklet for recording
   - Return: startRecording(), stopRecording(), isRecording, audioBlob, error
   - Handle permission denial gracefully
3. Build audio recording UI component:
   - Large Record button (red, obvious)
   - Waveform visualization during recording (AnalyserNode)
   - After recording: waveform display, play/pause, scrubber
   - Save → creates IdeaMedia with type 'audio', blob = WAV
4. Build a simple audio player component (reusable):
   - Waveform display
   - Play/pause, time display
   - Used in Idea Detail, Song Workspace idea cards, etc.
5. Add audio import: drag-and-drop or file picker for .wav, .mp3, .aiff files.

**Acceptance:** Can record audio from mic, see waveform, play it back, save as WAV blob in Dexie. Can import audio files.

---

## Phase 5: MIDI Recording & Synth Playback

**Goal:** Record MIDI from a connected controller, play through synth, store as .mid file.

1. Install Tone.js and smplr: `npm install tone smplr`
2. Install @tonejs/midi: `npm install @tonejs/midi`
3. Build `useSynth` hook:
   - Initialize Tone.js AudioContext (start on user gesture)
   - Load smplr soundfonts on demand (lazy loading with loading indicator)
   - Provide ~10 patches: Piano, E. Piano, Bass, Synth Bass, Brass, Strings, Synth Lead, Synth Pad, Organ, Mallet
   - Interface: playNote(pitch, duration, velocity), stopAll(), currentPatch, setPatch()
   - Fallback to Tone.js built-in synths if soundfont hasn't loaded
4. Build `useMidi` hook:
   - requestMIDIAccess() with feature detection
   - List MIDI inputs, let user select
   - On midimessage: parse note-on/off, play through synth, collect NoteEvents
   - Return: startRecording(), stopRecording(), isRecording, noteEvents, midiDevices, selectedDevice
5. Build MIDI recording UI:
   - Device selector dropdown (or "No MIDI device detected" message)
   - Patch selector (the ~10 patches)
   - Metronome toggle with BPM input
   - Record/Stop button
   - After recording: display note list, playback controls
6. Build `src/lib/midi.ts`:
   - NoteEvent[] → Standard MIDI File (via @tonejs/midi) → Blob
   - .mid file Blob → parse → NoteEvent[]
7. After recording, store as IdeaMedia (type: 'midi', blob: .mid, noteData: NoteEvent[])
8. Add MIDI file import: drag-and-drop or file picker for .mid files.

**Acceptance:** Can connect a MIDI controller, select a patch, record, hear playback through the synth, see recorded notes, save to Dexie. Can import .mid files.

---

## Phase 6: Note Picker (Manual Entry)

**Goal:** Enter notes and chords manually without a MIDI controller.

1. Build the Note Picker UI:
   - Visual keyboard or grid showing note names (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
   - Octave selector (0-8, default to octave 4)
   - Click a note → adds to the sequence
   - Chord presets: common chord buttons (Cmaj, Cm, C7, Cmaj7, Cm7, Csus4, etc.) that adjust based on selected root
   - Duration selector (whole, half, quarter, eighth, sixteenth)
2. Display the sequence as a horizontal list of note badges:
   - Each badge shows note name + octave (e.g., "C#4")
   - Remove button on each badge
   - Drag to reorder
3. Playback: play the sequence through the synth (useSynth) with the selected patch.
4. Save as IdeaNoteSequence linked to the current Idea.
5. Note sequences should also be playable from Idea Detail and Song Workspace cards.

**Acceptance:** Can tap notes to build a sequence, hear it played back, save to an idea. Can edit and reorder the sequence.

---

## Phase 7: Quick Capture Modal

**Goal:** The critical UX. A single modal that lets users combine any content type into one idea.

1. Build the Quick Capture modal (Dialog or Sheet):
   - Opens from: floating Capture button, keyboard shortcut, "Add Idea" in a section
   - NOT a full page — feels like jotting something down quickly
2. Multi-content architecture:
   - Toolbar at top with action buttons: Record Audio, Record MIDI, Note Picker, Text/Lyrics, Photo/Image, File
   - Clicking an action button ADDS a content block to a vertical stack
   - Multiple blocks of the same type are fine (two audio recordings, lyrics + notes)
   - Each block has an X button to remove it
   - This is the critical design decision: ideas are bundles, not single-type captures
3. Content blocks use the components from Phases 4-6:
   - Audio block → audio recorder component
   - MIDI block → MIDI recorder component
   - Note Picker block → note picker component
   - Text block → textarea
   - Image block → file picker (accept image/*)
   - File block → file picker (accept *)
4. Below content blocks, always-visible metadata:
   - Role selector (pills: melody, bassline, chords, drums, etc.)
   - Section intent (optional pills: verse, chorus, bridge, etc.)
   - Instrument name (text input)
   - Key and Tempo (small inline inputs)
   - Notes field (textarea)
5. Save actions:
   - "Save to Pool" (default) — songId=null
   - "Save to Song >" — dropdown of existing songs + their sections
   - If opened from a section's "Add Idea" button, pre-select that song+section
6. After save, modal closes and idea appears in pool or section.

**Acceptance:** Can open Quick Capture from anywhere, add multiple content blocks in any combination, fill metadata, save to pool or directly to a song section. Under 15 seconds from open to saved for a simple MIDI capture.

---

## Phase 8: Audio-to-MIDI Conversion

**Goal:** Convert audio recordings to MIDI using @spotify/basic-pitch.

1. Install: `npm install @spotify/basic-pitch`
2. Build `useAudioToMidi` hook:
   - Load the BasicPitch model (first load takes a few seconds — show loading indicator, cache after)
   - Accept an AudioBuffer as input (decode the audio blob via AudioContext.decodeAudioData)
   - Run evaluateModel → get frames, onsets, contours → convert to NoteEvent[] via noteFramesToTime
   - Return: convert(audioBlob), isLoading, isConverting, result, error
3. Add "Extract MIDI" button on audio IdeaMedia:
   - Appears after an audio recording exists on an idea
   - Click → loading indicator → extracted notes displayed alongside audio waveform
   - User previews the MIDI playback → confirms or discards
   - On confirm: create new IdeaMedia (type: 'midi') on the same idea
4. The extracted MIDI is unquantized and may be imperfect. That's expected and documented.

**Acceptance:** Can record audio or import a voice memo, click Extract MIDI, see and hear the extracted notes, confirm to save as MIDI alongside the audio.

---

## Phase 9: Song Workspace (Full Features)

**Goal:** Complete the song workspace with lyrics, production journal, references, assets, business metadata.

1. Right sidebar or tab panel with:
   - **Lyrics tab**: full text editor (textarea or Tiptap). Song-level lyrics.
   - **Journal tab**: Tiptap 3 rich text editor. Install: `npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-placeholder`
     - Support per-topic entries (e.g., "Bass", "Brass", "Mix Notes")
     - Each entry: topic label + rich text content with image embeds
     - "Add Entry" button, topic text input
   - **References tab**: list of reference items. Each is text, a URL, or imported audio with playback.
   - **Assets tab**: file grid for artwork, photos, documents. Upload via file picker.
   - **Details tab**: business metadata fields (songwriter, publisher, IPI, credits, copyright, sample credits).
2. Section-level lyrics: each SongSection can have its own lyrics (textarea within the section).
3. Inline playback on idea cards in the workspace: quick-play button that plays audio or MIDI without opening the detail panel.

**Acceptance:** Full song workspace with all tabs functional. Can write lyrics, create journal entries with images, add references, upload assets, fill business metadata.

---

## Phase 10: Album View

**Goal:** Group songs into albums with album-level metadata and notes.

1. Build the Album View page (/album/:id):
   - Header: editable title, subtitle, status, artwork (upload/replace)
   - Track listing: ordered list of songs, drag to reorder
   - Each row: track number, song title, status badge, key, tempo
   - Click row → navigate to Song Workspace
   - "Add Song" button — create new or select existing
2. Album-level content:
   - Global Production Notes (Tiptap rich text editor)
   - Reference Material (Tiptap rich text + file attachments)
   - Credits (text fields: credits, release date, label, catalog number)
3. Albums list page: accessible from sidebar nav. Grid/list of albums. "New Album" button.

**Acceptance:** Can create albums, add songs, reorder track listing, write global notes, manage album metadata.

---

## Phase 11: Export

**Goal:** Get files out of the app and into the filesystem.

1. Install: `npm install jszip browser-fs-access`
2. Build export logic in `/src/lib/export.ts`:
   - Query all ideas + media for a song
   - Build the folder structure in memory (see 400-export.mdc for naming conventions)
   - Generate lyrics.txt from song + section lyrics
   - Generate production-journal.md from journal entries (convert HTML → markdown, or export as .html)
3. Build Export Dialog:
   - Summary of what will be exported (X audio, Y MIDI, Z images)
   - Preview folder structure
   - Checkboxes for content types
   - "Save to Folder" button (File System Access — only shown if supported)
   - "Download as ZIP" button (always available)
4. Feature-detect showDirectoryPicker. If available, write files directly. Otherwise, zip and download.

**Acceptance:** Can export a song's files as a structured folder or .zip. MIDI files open in Ableton. WAV files play correctly. Folder structure matches the spec.

---

## Phase 12: Polish & Integration Testing

**Status: Deferred.** See TODO.md for the integration test checklist. These tests should be re-run after each iteration below.

---

## Phase 13: Responsive Layout + PWA + Deploy

**Status: Partially complete.** Minimal responsive breakpoints applied. PWA and deploy done (Netlify).

---

# Post-MVP Iterations (Feedback-Driven)

Phases 0–13 built the initial scaffold. The iterations below refactor and improve based on real usage. Each iteration is one or two Cursor Agent sessions. Commit between each.

**Key changes from initial build:**
- Tiptap rich text editor is removed everywhere. Plain textarea replaces it.
- Instruments are a first-class entity with their own table, page, and management.
- Ideas are elevated to main navigation alongside Songs and Albums.
- Songs can belong to multiple albums (many-to-many via junction table).
- Song workspace gains todo lists and audio versions.
- Idea movement gets copy semantics (not just move).
- Lyrics is always a visible field, not a content block.
- All playback loops by default.

---

## Iteration 1: Cuts & Simplification

**Goal:** Remove complexity. Fewer features, simpler stack.

1. **Remove Tiptap entirely:**
   - Uninstall @tiptap/react, @tiptap/starter-kit, @tiptap/extension-image, @tiptap/extension-placeholder
   - Delete /src/components/editor/ directory
   - Replace all Tiptap editors with plain textarea:
     - SongJournalEntry.content → plain text (textarea)
     - Album.globalNotes → plain text (textarea)
     - Album.referenceMaterial → plain text (textarea)
   - Image attachments for journal entries become separate IdeaMedia-style attachments, not inline embeds

2. **Remove New Idea button/form from the Home page.** Quick Capture is the only way to create ideas.

3. **Remove "Import Audio" from Quick Capture.** Audio import stays available from the Ideas page and Idea Detail, but Quick Capture is for capturing new content only.

4. **Remove album subtitle field.** Drop from Album type, Album View UI, and Dexie schema.

5. **Move Lyrics from a content block in Quick Capture to an always-visible field.** It sits alongside role, instrument, key, tempo, and notes — not as an addable block. Label it "Lyrics" not "Text/Lyrics" since freeform text is already covered by the Notes field.

**Acceptance:** Tiptap is fully gone from package.json. Quick Capture has no Import Audio or Text/Lyrics block. Lyrics is an always-visible textarea. No New Idea on Home. Albums have no subtitle field.

---

## Iteration 2: Data Model Additions

**Goal:** Add new tables and relationships for instruments, song todos, song versions, and album-song many-to-many. No UI yet — just schema, types, and hooks.

1. **Increment Dexie version number** for all schema changes below.

2. **Add Instrument and InstrumentPatch tables:**
   ```
   interface Instrument {
     id: string;
     name: string;             // "Danelectro Longhorn", "Casio CT-X700", "Massive (VST)"
     type: 'bass' | 'guitar' | 'keys' | 'synth-hardware' | 'synth-vst' | 'drums' | 'wind' | 'vocal' | 'other';
     defaultPatch: string | null;  // auto-matched synth patch name based on type
     createdAt: string;
     updatedAt: string;
   }

   interface InstrumentPatch {
     id: string;
     instrumentId: string;
     name: string;             // "37 voice", "Totoroids preset", "Summer Madness"
     sortOrder: number;
   }
   ```
   - Dexie indexes: instruments: 'id, type, createdAt', instrumentPatches: 'id, instrumentId'

3. **Add SongTodo table:**
   ```
   interface SongTodo {
     id: string;
     songId: string;
     text: string;
     timestamp: number | null;  // optional, in seconds (e.g. 142 = 2:22)
     completed: boolean;
     sortOrder: number;
     createdAt: string;
   }
   ```
   - Dexie indexes: songTodos: 'id, songId, completed'

4. **Add SongVersion table:**
   ```
   interface SongVersion {
     id: string;
     songId: string;
     label: string | null;      // "Rough mix v1", "Final master", "Demo"
     filename: string;
     mimeType: string;
     blob: Blob;
     isMain: boolean;           // only one per song can be true
     createdAt: string;
   }
   ```
   - Dexie indexes: songVersions: 'id, songId, isMain'

5. **Add AlbumSong junction table** (replaces albumId on Song):
   ```
   interface AlbumSong {
     id: string;
     albumId: string;
     songId: string;
     trackNumber: number;
   }
   ```
   - Dexie indexes: albumSongs: 'id, albumId, songId'

6. **Update Song interface:**
   - Remove `albumId` field
   - Remove `sortOrder` field (track ordering now lives on AlbumSong.trackNumber)
   - Add `instrumentId: string | null` (optional link to Instrument for the primary/lead instrument)

7. **Update Idea interface:**
   - Add `instrumentId: string | null` (optional FK to instruments table)
   - Keep `instrumentName` for backward compatibility — if instrumentId is set, display the instrument's name from the instruments table; if null, display instrumentName as freeform text

8. **Update SongReference interface:**
   - Change to support any combination of text + URL + audio + attachment:
   ```
   interface SongReference {
     id: string;
     songId: string;
     text: string | null;           // text note
     url: string | null;            // link
     audioBlob: Blob | null;        // reference audio
     attachmentBlob: Blob | null;   // image, document, or other file
     attachmentFilename: string | null;
     attachmentMimeType: string | null;
     sortOrder: number;
     createdAt: string;
   }
   ```
   - Remove the `type` and `content` fields, replace with the above

9. **Update Album interface:**
   - Remove `subtitle` field
   - Change `globalNotes` from string (HTML) to string (plain text)
   - Change `referenceMaterial` from string (HTML) to string (plain text)
   - Add `notes: string | null` for general album notes

10. **Create CRUD hooks:**
    - `useInstruments.ts` — createInstrument, updateInstrument, deleteInstrument, getAllInstruments, getInstrumentPatches, addPatch, removePatch
    - `useSongTodos.ts` — createTodo, updateTodo, toggleComplete, deleteTodo, reorderTodos, getTodosForSong
    - `useSongVersions.ts` — addVersion, removeVersion, setMainVersion, getVersionsForSong
    - `useAlbumSongs.ts` — addSongToAlbum, removeSongFromAlbum, reorderTracks, getAlbumsForSong, getSongsForAlbum
    - Update `useIdeas.ts` — add copyIdea, copyIdeaToSong, moveIdeaToPool, copyIdeaToPool
    - Update `useSongs.ts` — remove albumId-related logic

**Acceptance:** All new tables exist. All CRUD hooks work. Existing data still loads (backward compatible — instrumentName still displayed for old ideas).

---

## Iteration 3: Navigation & Home Restructure

**Goal:** Ideas become a first-class nav item. Home page shows the right content with proper empty states.

1. **Add Ideas to main navigation** (sidebar on desktop, bottom bar on mobile) alongside Home, Songs, Albums.

2. **Build the Ideas page** (/ideas route):
   - Full list of ALL ideas (both pool and assigned to songs)
   - Filterable by: role, status, instrument, whether it has audio/MIDI/images
   - Searchable by text content (lyrics, notes, instrumentName)
   - Each card shows: role badge, title/label, instrument name, media indicators, which song it belongs to (or "Pool")
   - Click opens Idea Detail

3. **Restructure the Home page:**
   - Top section: **Recent** — last 3 songs worked on + last album worked on (by updatedAt). Each clickable to open.
   - Below that: **Idea Pool** — ideas where songId is null. Same card format as the Ideas page. Filterable by role, searchable.
   - If no ideas in pool: empty state with CTA → opens Quick Capture
   - If no songs exist: empty state with CTA → creates new song
   - If no albums exist: empty state with CTA → creates new album

4. **Key selection** → change from freeform text input to a dropdown. Options: C, C#/Db, D, D#/Eb, E, F, F#/Gb, G, G#/Ab, A, A#/Bb, B — plus major/minor qualifier. Display as e.g. "Cm", "F#", "Bb major". Keep null option for unset.

**Acceptance:** Ideas page exists and is navigable. Home shows recent songs, last album, and idea pool with empty states. Key is a dropdown everywhere.

---

## Iteration 4: Instrument Management

**Goal:** Instruments are a saved, reusable entity. Users manage a personal instrument list.

1. **Build the Instruments page** (/instruments route):
   - List all saved instruments
   - Each row: name, type badge, number of patches (for synths), number of ideas using it
   - "Add Instrument" button → form with Name and Type fields
   - Click an instrument → edit page showing name, type, and patch list (if synth type)
   - Delete with confirmation (only if no ideas reference it, or confirm to unlink)

2. **Add Instruments to main navigation** alongside Home, Ideas, Songs, Albums.

3. **Update Quick Capture and Idea Detail** — replace the freeform instrument name text input with:
   - Dropdown of saved instruments + "Add New" option at the bottom
   - Selecting "Add New" opens a quick inline form (name + type), creates the instrument, and selects it
   - When an instrument is selected and its type maps to a synth patch, auto-set the synth preview patch:
     - bass → Bass patch
     - guitar → clean guitar or Piano (closest available)
     - keys → Piano patch
     - synth-hardware, synth-vst → Synth Lead or Synth Pad (user picks)
     - drums → Drums (if available) or muted
     - other types → Piano as default
   - If the instrument is a synth type (synth-hardware or synth-vst), show an additional "Patch" text input for the specific preset name (stored in InstrumentPatch)

4. **Migration for existing ideas:** Ideas with instrumentName but no instrumentId should still display the instrumentName. The user can optionally link them to a saved instrument later.

**Acceptance:** Can create, edit, delete instruments. Quick Capture shows instrument dropdown. Selecting an instrument auto-sets the synth patch. Synth instruments show a Patch field.

---

## Iteration 5: Idea Movement & Playback

**Goal:** Full copy/move semantics for ideas. Inline playback everywhere. Loop by default.

1. **Idea actions in Idea Detail and idea card context menus:**
   - "Turn into Song" — creates a new Song, moves the idea into it as the first idea
   - "Move to Song" — picks a song + section, removes from current location
   - "Copy to Song" — picks a song + section, idea STAYS in current location, a duplicate goes to the song
   - "Copy into New Song" — creates a new Song, copies the idea into it, original stays where it is

2. **Ideas that are in a Song can be:**
   - "Move to Pool" — removes from song, puts back in pool (songId = null, sectionId = null)
   - "Copy to Pool" — idea stays in the song, a duplicate goes to the pool

3. **When importing from Idea Pool into a Song:** offer both "Move" (removes from pool) and "Copy" (stays in pool).

4. **Copy implementation:** duplicate the Idea record with a new UUID. Also duplicate all IdeaMedia and IdeaNoteSequence records linked to it. The copies are independent — editing one does not affect the other.

5. **Inline play buttons on idea cards everywhere** (Pool, Ideas page, Song Workspace sections):
   - If idea has audio → show audio play button
   - If idea has MIDI → show MIDI play button
   - If idea has both → show both buttons (audio icon + MIDI icon)
   - Play does not open Idea Detail — it plays inline on the card

6. **All playback loops by default.** Audio and MIDI playback loops continuously until the user clicks stop. No one-shot playback. This applies to: idea card inline play, Idea Detail playback, note sequence playback, reference audio playback, song version playback.

**Acceptance:** Can copy and move ideas in all directions (pool ↔ song). Inline play works on cards. Everything loops.

---

## Iteration 6: Song Enhancements

**Goal:** Todo lists, audio versions, and multi-album membership.

1. **Song todo list** (new tab or section in Song Workspace):
   - Add todo item: text field + optional timestamp field (formatted as mm:ss, stored as seconds)
   - List of todos, sortable via drag (@dnd-kit)
   - Click checkbox → item gets crossed out (strikethrough) but stays visible
   - Delete button per item to remove permanently
   - Timestamp displays as clickable mm:ss badge (for future: could seek to that point in the song version player)
   - Surface incomplete todos on the Home page somehow (could be a "Tasks" summary or just count badges on recent songs)

2. **Song audio versions** (new tab or section in Song Workspace):
   - Upload audio files (wav, mp3, etc.) as song versions
   - Each version: label (freeform, e.g. "Rough mix v1"), upload date, play button
   - Unlimited versions per song
   - One version can be marked as "Main" (star or toggle). Main version plays when you hit play from anywhere outside the Song Workspace (e.g., from the Songs list page).
   - If no version is marked main, the most recent is used as default

3. **Songs show which albums they belong to:**
   - In the Song Workspace header or Details tab, show a list of albums this song is in
   - A song can be in multiple albums (many-to-many via AlbumSong table)
   - "Add to Album" action — dropdown of existing albums

4. **Update Album View** for many-to-many:
   - "Add Song" now searches existing songs and adds via AlbumSong junction
   - Removing a song from an album does NOT delete the song — just removes the AlbumSong link
   - Track ordering uses AlbumSong.trackNumber

**Acceptance:** Can add/complete/reorder/delete todos on a song. Can upload multiple song versions and set one as main. Songs show their album memberships. Album track listing uses the junction table.

---

## Iteration 7: Playback & Performance

**Goal:** Fix broken things. Speed up patch loading.

1. **Patch loading speed:**
   - Investigate current soundfont loading. If using FluidR3_GM (140MB+), switch to MusyngKite (smaller, faster).
   - Preload the most common patches (Piano, Bass) on app start instead of lazy-loading everything.
   - Other patches stay lazy but show instant fallback to a Tone.js synth while the soundfont loads.
   - Target: switching patches feels instant (Tone.js synth plays immediately, soundfont swaps in seamlessly).

2. **Metronome fix:** The metronome plays once when enabled but stops when recording starts and does not restart when toggled. Fix the Tone.js transport/scheduling conflict so the metronome runs throughout recording and can be toggled on/off at any time.

3. **Song and Album status → visual slider** (deferred to UI design pass, but add the data support now):
   - Song status stages are sequential: sketch → writing → arranging → production → mixing → mastering → released
   - Album status stages: draft → in-progress → released
   - These should render as a step indicator or slider in the final UI. For now, ensure the component can be swapped from dropdown to slider without data changes.

**Acceptance:** Patches load noticeably faster. Metronome works during recording. Status data supports sequential progression.

---

## Iteration 8: Note Picker Redesign

**Goal:** Make note entry fast enough to be useful. This needs exploration, not just a prompt.

**Current problem:** Picking octave, then duration, then root, then note or chord is too many steps. Editing existing notes is not possible. Duration is not displayed. It's too slow for rapid idea capture but not powerful enough to be a real MIDI editor.

**Possible approaches to explore:**
- **Guitar/bass fretboard view** — tap frets, notes are placed. Natural for string players.
- **Chromatic keyboard (one row per octave)** — visual piano, tap keys. Natural for keyboard players.
- **Text input parsing** — type "C4 E4 G4" and the app parses it into notes. Fastest for experienced users.
- **Hybrid** — text input with a visual keyboard as a helper. Type when you know the notes, tap when you're exploring.

**Requirements for any approach:**
- Adding a note should be one tap or a few keystrokes, not three separate selections
- Duration should be visible on each note in the sequence
- Notes in the sequence should be editable (change pitch, change duration, delete, reorder)
- The sequence should be playable at any point during editing
- Chords (multiple simultaneous notes) should be supported

**This iteration requires a design conversation before prompting the Agent.** Do not just ask Cursor to "redesign the note picker." Decide on the approach first, then prompt with specific UX requirements.

**Acceptance:** Note entry is meaningfully faster than the current flow. Each note shows its duration. Notes can be edited in place.

---

## What NOT to Build

Do not build any of these:
- Collaboration / multi-user
- DAW plugin integration
- Notation export (MusicXML, sheet music)
- Piano roll editor or MIDI sequencer
- Advanced audio editing (EQ, effects, mixing)
- AI-assisted anything
- User accounts or auth
- Cloud sync or backup
- Native iOS app (iOS does not support Web MIDI — native app required for iOS MIDI capture, post-MVP)
- Native Android app (not needed — responsive web app + PWA covers Android)
- Rich text editing (explicitly removed — plain text everywhere)
