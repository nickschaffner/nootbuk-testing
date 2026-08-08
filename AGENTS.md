# Nootbuk — Build Plan

This is the phased implementation plan. Each phase should be completed and working before moving to the next. The app is called **Nootbuk** — a musician's idea capture and song documentation tool.

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

**Goal:** Everything works together. Fix rough edges.

1. Test the full capture-to-export flow:
   - Capture MIDI idea → save to pool → move to song → export → open in DAW
   - Record audio → extract MIDI → save both → export
   - Manual note entry → playback → export as .mid
2. Test drag-and-drop across all contexts (ideas in sections, sections in songs, songs in albums).
3. Test with real MIDI controllers (USB and Bluetooth).
4. Test audio recording quality (should be clean WAV, not compressed).
5. Handle edge cases:
   - What happens when IndexedDB is full? Show a warning.
   - What happens when the user has no MIDI device? Graceful fallback.
   - What happens in Firefox/Safari? All Chrome-only features degrade gracefully.
6. Keyboard shortcuts: at minimum, a global shortcut to open Quick Capture.
7. Performance: large pools (100+ ideas) should not lag. Use virtual scrolling if needed.

---

## What NOT to Build (MVP scope)

Do not build any of these:
- Collaboration / multi-user
- DAW plugin integration
- Notation export (MusicXML, sheet music)
- Piano roll editor or MIDI sequencer
- Advanced audio editing (EQ, effects, mixing)
- Tab view for bass/guitar (P1, not P0)
- Performance chart generation (P1)
- AI-assisted anything
- User accounts or auth
- Cloud sync or backup
- Mobile-specific UI
