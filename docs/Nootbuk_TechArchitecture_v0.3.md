\# Nootbuk — Technical Architecture

Draft v0.3 — August 2026

Changes from v0.2: Removed Tiptap 3 from stack (plain textarea everywhere). Added Instrument, InstrumentPatch, SongTodo, SongVersion, AlbumSong tables to schema. Album-Song is now many-to-many via junction table. Song loses albumId. Idea gains instrumentId. SongReference supports any combination of text/url/audio/attachment. Album loses subtitle. All text content stored as plain strings, not HTML.

\---

\#\# Tech Stack

\#\#\# Frontend

| Layer | Choice | Version | Why |  
| :---- | :---- | :---- | :---- |  
| Framework | React \+ Vite | React 19.x (19.2.x), Vite 8.x | SPA, not a content site. Vite 8 integrates Rolldown bundler. |  
| Language | TypeScript | 5.x | Non-negotiable. |  
| Styling | Tailwind CSS v4 \+ shadcn/ui | Tailwind 4.x, shadcn latest (new-york style) | CSS-first config via @theme (no tailwind.config.ts). OKLCH colors. |  
| Synth Engine | Tone.js | 15.1.22 | Built-in synth types plus transport, scheduling, effects. |  
| Instrument Samples | smplr | Latest | Modern replacement for soundfont-player (archived). FluidR3\_GM and MusyngKite soundfonts. |  
| MIDI Input | Web MIDI API (native) | W3C spec | Chrome, Edge, Opera. Firefox 108+ with Add-On. Not Safari/iOS. |  
| Audio-to-MIDI | @spotify/basic-pitch | v1.0.1 | Client-side via TensorFlow.js. Stable but unmaintained. Pin dependencies. |  
| Audio Recording | Web Audio API AudioWorklet | W3C spec | PCM capture \+ manual WAV encoding. Not MediaRecorder. |  
| Drag & Drop | @dnd-kit | Core 6.3.x | \~2.8M weekly downloads, 6KB core, excellent accessibility. |  
| State Management | Zustand | Latest | UI-only state. Data in Dexie. |  
| MIDI File I/O | @tonejs/midi | 2.0.28 | Read/write Standard MIDI Files. Stable. |

\*\*Explicitly NOT in the stack:\*\*  
\- NO rich text editors (Tiptap, BlockNote, ProseMirror). Plain textarea for all text content.  
\- NO react-beautiful-dnd (deprecated).  
\- NO Redux.

\#\#\# Data Layer

| Layer | Choice | Why |  
| :---- | :---- | :---- |  
| Local Database | Dexie.js 4.4.x | Offline-capable, structured, queryable IndexedDB wrapper. |  
| Media Storage | IndexedDB blobs via Dexie | Audio, MIDI, images stored as blobs alongside metadata. |  
| Cloud Sync | Not in MVP | Future: Dexie Cloud (dexie-cloud-addon) for sync. |  
| Export | File System Access API \+ JSZip \+ browser-fs-access | Chrome/Edge disk pickers \+ ZIP fallback. |

\#\#\# Backend (MVP)

None. Fully client-side.

\---

\#\# Data Schema (Dexie / IndexedDB)

All IDs are UUIDs (crypto.randomUUID()). All timestamps are ISO 8601 strings.

\#\#\# Instruments

interface Instrument {  
  id: string;  
  name: string;              // "Danelectro Longhorn", "Casio CT-X700", "Massive (VST)"  
  type: 'bass' | 'guitar' | 'keys' | 'synth-hardware' | 'synth-vst' | 'drums' | 'wind' | 'vocal' | 'other';  
  defaultPatch: string | null;  // auto-matched synth patch name based on type  
  createdAt: string;  
  updatedAt: string;  
}

interface InstrumentPatch {  
  id: string;  
  instrumentId: string;  
  name: string;              // "37 voice", "Totoroids preset"  
  sortOrder: number;  
}

\#\#\# Ideas

interface Idea {  
  id: string;  
  songId: string | null;        // null \= in the pool  
  sectionId: string | null;  
  sortOrder: number;

  role: 'melody' | 'bassline' | 'chords' | 'drums' | 'riff' | 'synth' |  
        'vocal' | 'texture' | 'sample' | 'other';  
  sectionIntent: 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'intro' |  
                  'outro' | 'breakdown' | 'solo' | 'unassigned' | null;

  key: string | null;  
  tempo: number | null;  
  timeSignature: string | null;

  instrumentId: string | null;   // FK to instruments table  
  instrumentName: string | null; // backward compat for freeform entry  
  patchName: string | null;  
  patchSettings: Record\<string, string\> | null;

  lyrics: string | null;  
  notes: string | null;

  status: 'raw' | 'developed' | 'used' | 'archived';  
  createdAt: string;  
  updatedAt: string;  
}

interface IdeaMedia {  
  id: string;  
  ideaId: string;  
  type: 'audio' | 'midi' | 'image' | 'file';  
  filename: string;  
  mimeType: string;  
  blob: Blob;  
  duration: number | null;  
  noteData: NoteEvent\[\] | null;  
  sortOrder: number;  
  createdAt: string;  
}

interface NoteEvent {  
  pitch: number;      // MIDI note number 0-127  
  startTime: number;  // seconds  
  duration: number;   // seconds  
  velocity: number;   // 0-127  
}

interface IdeaNoteSequence {  
  id: string;  
  ideaId: string;  
  notes: Array\<{  
    pitch: number;  
    octave: number;  
    name: string;  
    duration: string;  
    isChord: boolean;  
    chordName: string | null;  
  }\>;  
  label: string | null;  
  createdAt: string;  
}

\#\#\# Songs

interface Song {  
  id: string;  
  // NO albumId — songs connect to albums via AlbumSong junction table  
  title: string;  
  key: string | null;  
  tempo: number | null;  
  timeSignature: string | null;  
  status: 'sketch' | 'writing' | 'arranging' | 'production' |  
          'mixing' | 'mastering' | 'released';  
  genre: string | null;  
  lyrics: string | null;

  songwriter: string | null;  
  publisher: string | null;  
  ipiNumber: string | null;  
  masterEngineer: string | null;  
  copyright: string | null;  
  sampleCredits: string | null;

  createdAt: string;  
  updatedAt: string;  
}

interface SongSection {  
  id: string;  
  songId: string;  
  name: string;  
  sortOrder: number;  
  lyrics: string | null;  
  createdAt: string;  
}

interface SongJournalEntry {  
  id: string;  
  songId: string;  
  topic: string | null;  
  content: string;        // PLAIN TEXT, not HTML  
  sortOrder: number;  
  createdAt: string;  
  updatedAt: string;  
}

interface SongReference {  
  id: string;  
  songId: string;  
  text: string | null;              // text note  
  url: string | null;               // link  
  audioBlob: Blob | null;           // reference audio  
  attachmentBlob: Blob | null;      // image, document, or other file  
  attachmentFilename: string | null;  
  attachmentMimeType: string | null;  
  sortOrder: number;  
  createdAt: string;  
}

interface SongAsset {  
  id: string;  
  songId: string;  
  type: 'artwork' | 'file';  
  filename: string;  
  mimeType: string;  
  blob: Blob;  
  createdAt: string;  
}

interface SongTodo {  
  id: string;  
  songId: string;  
  text: string;  
  timestamp: number | null;   // seconds (e.g., 142 \= 2:22)  
  completed: boolean;  
  sortOrder: number;  
  createdAt: string;  
}

interface SongVersion {  
  id: string;  
  songId: string;  
  label: string | null;       // "Rough mix v1", "Final master"  
  filename: string;  
  mimeType: string;  
  blob: Blob;  
  isMain: boolean;            // only one per song  
  createdAt: string;  
}

\#\#\# Albums

interface Album {  
  id: string;  
  title: string;  
  // NO subtitle  
  status: 'draft' | 'in-progress' | 'released';  
  artworkBlob: Blob | null;  
  releaseDate: string | null;  
  credits: string | null;  
  globalNotes: string | null;       // PLAIN TEXT, not HTML  
  referenceMaterial: string | null;  // PLAIN TEXT, not HTML  
  notes: string | null;             // general album notes, PLAIN TEXT  
  createdAt: string;  
  updatedAt: string;  
}

interface AlbumSong {  
  id: string;  
  albumId: string;  
  songId: string;  
  trackNumber: number;  
}

\#\#\# Dexie Schema

const db \= new Dexie('NootbukDB');

db.version(2).stores({  
  instruments: 'id, type, createdAt',  
  instrumentPatches: 'id, instrumentId',  
  ideas: 'id, songId, sectionId, role, sectionIntent, status, instrumentId, createdAt',  
  ideaMedia: 'id, ideaId, type',  
  ideaNoteSequences: 'id, ideaId',  
  songs: 'id, status, createdAt, updatedAt',  
  songSections: 'id, songId, sortOrder',  
  songJournalEntries: 'id, songId, topic',  
  songReferences: 'id, songId',  
  songAssets: 'id, songId',  
  songTodos: 'id, songId, completed',  
  songVersions: 'id, songId, isMain',  
  albums: 'id, createdAt, updatedAt',  
  albumSongs: 'id, albumId, songId',  
});

\---

\#\# Key Technical Flows

\#\#\# Audio Recording  
getUserMedia → AudioWorkletNode (PCM capture) → Stop → Encode WAV (RIFF header \+ PCM) → IdeaMedia (type: audio, mimeType: audio/wav)

\#\#\# MIDI Recording  
requestMIDIAccess → Select input \+ patch → Record (note-on/off events \+ synth playback) → Stop → Serialize NoteEvents to .mid via @tonejs/midi → IdeaMedia (type: midi, blob: .mid, noteData: NoteEvent\[\])

\#\#\# Audio-to-MIDI  
Audio blob → decodeAudioData → Resample to 22050 Hz via OfflineAudioContext → BasicPitch.evaluateModel → NoteEvents → Preview → Confirm → New IdeaMedia (type: midi) on same Idea

\#\#\# Idea Copy  
Source Idea → Duplicate record with new UUID → Duplicate all IdeaMedia records with new UUIDs → Duplicate all IdeaNoteSequence records with new UUIDs → Set songId/sectionId per destination → Copies are fully independent

\#\#\# Export Song  
Query Ideas where songId \= song.id → Query IdeaMedia per idea → Build folder structure → Write files (File System Access or JSZip) → Include lyrics.txt \+ production-journal.md

\---

\#\# File & Directory Structure

/nootbuk/  
  /public/  
    /soundfonts/  
  /src/  
    /app/  
    /components/  
      /ui/                \# shadcn/ui  
      /capture/           \# Audio recorder, MIDI recorder, note picker, capture modal  
      /song/              \# Song workspace, sections, idea cards, todos, versions  
      /album/             \# Album view  
      /pool/              \# Idea pool browser  
      /ideas/             \# All ideas page  
      /instruments/       \# Instrument management  
      /player/            \# Playback controls, synth patch selector  
      /export/            \# Export dialog  
      /shared/            \# Layout, nav  
    /hooks/  
      useMidi.ts  
      useAudioRecorder.ts  
      useSynth.ts  
      useAudioToMidi.ts  
      useExport.ts  
      useIdeas.ts  
      useSongs.ts  
      useSections.ts  
      useJournal.ts  
      useAlbums.ts  
      useMedia.ts  
      useInstruments.ts  
      useSongTodos.ts  
      useSongVersions.ts  
      useAlbumSongs.ts  
    /lib/  
      db.ts  
      midi.ts  
      notes.ts  
      export.ts  
      audio.ts  
    /stores/  
    /types/  
      idea.ts  
      song.ts  
      album.ts  
      instrument.ts  
  /tests/

Note: No /components/editor/ directory. No rich text editors in the project.

\---

\#\# Browser Support

Primary: Chrome, Edge (desktop \+ Android).  
Partial: Firefox (Web MIDI requires Add-On, no disk pickers).  
Minimal: Safari (no Web MIDI, no disk pickers).  
Android: Full support via Chrome PWA.  
iOS: Post-MVP (requires native app for MIDI).

\---

\#\# Decisions Resolved

\- Drag-and-drop → @dnd-kit  
\- Rich text editor → REMOVED. Plain textarea everywhere.  
\- State management → Zustand  
\- Audio recording → AudioWorklet \+ WAV encoding  
\- Album-Song relationship → many-to-many via AlbumSong junction table

\#\# What This Stack Does NOT Include

\- No Next.js / SSR  
\- No backend at MVP  
\- No CRDT / sync engine  
\- No Electron / Tauri  
\- No native mobile  
\- No rich text editors