# Liner Notes — Technical Architecture

Draft v0.1 — August 2026

---

## Tech Stack

This is the confirmed stack for MVP. These choices are validated against current (mid-2026) library status and browser support. This document also serves as the constraint set for design work — Claude Design and Cursor should build within these boundaries.

### Frontend

| Layer | Choice | Version | Why |
| :---- | :---- | :---- | :---- |
| Framework | **React \+ Vite** | React 19.x, Vite 6.x | SPA, not a content site — SSR adds nothing. Vite is fast, simple, well-supported by Cursor. |
| Language | **TypeScript** | 5.x | Non-negotiable for a project this size. |
| Styling | **Tailwind CSS \+ shadcn/ui** | Tailwind 4.x, shadcn latest | Utility-first, themeable, good component primitives. shadcn gives headless accessible components without vendor lock-in (it's copy-paste, not a dependency). |
| Synth Engine | **Tone.js** | 15.1.22 (May 2026\) | Actively maintained. Built-in synth types (Synth, AMSynth, FMSynth, MembraneSynth, PluckSynth) plus transport, scheduling, effects. Handles the "pick a sound, play notes" workflow. |
| Instrument Samples | **soundfont-player** \+ gleitz/midi-js-soundfonts | 0.12.x | Pre-rendered General MIDI soundfonts (piano, bass, brass, strings, etc.) loaded on demand via Web Audio API. More realistic than pure synthesis for instrument preview. Falls back to Tone.js synths if soundfonts haven't loaded yet. |
| MIDI Input | **Web MIDI API** (native) | W3C spec | No wrapper library needed — the API is simple. Chrome, Edge, Firefox 108+, Opera. Not Safari/iOS. |
| Audio-to-MIDI | **@spotify/basic-pitch** | basic-pitch-ts (npm) | Runs entirely client-side via TensorFlow.js. No backend needed. Polyphonic, instrument-agnostic, outputs note events with pitch bends. Apache 2.0 licensed. |
| Audio Recording | **MediaRecorder API** (native) | W3C spec | Browser-native audio capture from device mic. Outputs webm/opus or wav depending on browser. Simple, no library needed. |
| Drag & Drop | **@dnd-kit** or **pragmatic-drag-and-drop** | Latest | For reordering ideas within sections, moving ideas between sections, and rearranging sections within a song. Evaluate both — dnd-kit is more established, pragmatic-drag-and-drop (Atlassian) is newer but simpler. |
| Rich Text | **Tiptap** or **BlockNote** | Latest | For production journal / liner notes editor. Needs image embeds, basic formatting, heading structure. Both are built on ProseMirror. Tiptap is more mature; BlockNote is more opinionated and Notion-like. Either works. |
| MIDI File I/O | **@tonejs/midi** | Latest | Read and write Standard MIDI Files. Works with Tone.js. Handles import and export of .mid files. |

### Data Layer

| Layer | Choice | Why |
| :---- | :---- | :---- |
| Local Database | **Dexie.js** (IndexedDB wrapper) | Offline-capable, structured, queryable, no backend required for MVP. Dexie provides a clean Promise-based API over IndexedDB with indexing, compound queries, and schema versioning. Handles the entire data model (ideas, songs, albums, metadata). |
| Media Storage | **IndexedDB blobs** via Dexie | Audio recordings, MIDI files, and images stored as blobs in IndexedDB alongside their metadata. For MVP this is simpler than filesystem APIs. Total storage is bounded by browser quota (typically several GB — more than enough for an active songwriter's working set). |
| Cloud Sync | **Not in MVP** | All data lives locally in the browser. Cloud sync (account, backup, multi-device) is a post-MVP feature. When added, the approach is: API server (Node or Python) \+ Postgres for structured data \+ S3-compatible object storage for media. Dexie has a sync protocol (Dexie Cloud) that could be evaluated, or a custom sync layer on top of the existing schema. |
| Export | **File System Access API** \+ **JSZip** | File System Access API lets the web app write to a user-chosen directory (Chrome/Edge). JSZip for bundling exports as .zip on browsers without filesystem access. Exported folder structure is defined in the PRD. |

### Backend (MVP)

**None.** The MVP is a fully client-side web application. No server, no auth, no cloud. Data lives in the browser's IndexedDB. This is the fastest path to a working product.

When cloud features are needed (auth, sync, backup, sharing), add:

| Layer | Likely Choice | Notes |
| :---- | :---- | :---- |
| API | Node.js (Express or Hono) or Python (FastAPI) | API-first. REST or tRPC. |
| Database | Postgres | Mirrors the Dexie schema. |
| Media Storage | S3-compatible (AWS S3, Cloudflare R2, etc.) | Audio, MIDI, images. |
| Auth | Clerk, Auth.js, or Supabase Auth | Don't roll your own. |
| Hosting | Vercel, Railway, or Fly.io | For the API. Static frontend on Vercel/Netlify/Cloudflare Pages. |

---

## Architecture Principles

**1\. Client-side first.** Audio recording, MIDI recording, synth playback, audio-to-MIDI conversion, and all data management happen in the browser. The MVP has zero network dependencies. This means it works offline, avoids server costs, and simplifies the initial build.

**2\. API-ready data model.** Even though MVP has no backend, the Dexie schema is designed so that every table maps cleanly to a Postgres table later. IDs are UUIDs. Relationships are explicit foreign keys. Timestamps are ISO strings. When a backend arrives, the migration path is: stand up Postgres with the same schema, add a sync layer that pushes/pulls changes between Dexie and Postgres.

**3\. Capture interfaces are abstracted.** MIDI input, audio recording, and audio-to-MIDI each have a clean interface boundary. The React components that use them don't know whether MIDI comes from Web MIDI API or (eventually) a native CoreMIDI bridge. This is what makes mobile possible later without rewriting the app.

**4\. Media is always exportable.** Audio and MIDI are stored in standard formats (wav/webm, .mid). Nothing proprietary. The user can always get their files out — either through the export feature or by extracting from IndexedDB directly.

---

## Data Schema (Dexie / IndexedDB)

// All IDs are UUIDs (crypto.randomUUID())

// All timestamps are ISO 8601 strings

interface Idea {

  id: string;

  songId: string | null;        // null \= in the pool

  sectionId: string | null;     // null \= floating within a song or in pool

  sortOrder: number;            // position within section or pool

  // Classification

  role: 'melody' | 'bassline' | 'chords' | 'drums' | 'riff' | 'synth' |

        'vocal' | 'texture' | 'sample' | 'other';

  sectionIntent: 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'intro' |

                  'outro' | 'breakdown' | 'solo' | 'unassigned' | null;

  // Musical context

  key: string | null;           // e.g. "Cm", "F\#", "Bb"

  tempo: number | null;         // BPM

  timeSignature: string | null; // e.g. "4/4", "3/4"

  // Instrument & patch

  instrumentName: string | null;

  patchName: string | null;

  patchSettings: Record\<string, string\> | null;  // key-value pairs

  // Text content

  lyrics: string | null;

  notes: string | null;         // freeform text notes

  // Status

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

  blob: Blob;                   // actual file data

  duration: number | null;      // seconds, for audio/midi

  noteData: NoteEvent\[\] | null; // parsed MIDI note events, for midi type

  sortOrder: number;

  createdAt: string;

}

interface NoteEvent {

  pitch: number;      // MIDI note number 0-127

  startTime: number;  // seconds

  duration: number;   // seconds

  velocity: number;   // 0-127

}

// Manually entered note sequences (from the note picker)

interface IdeaNoteSequence {

  id: string;

  ideaId: string;

  notes: Array\<{

    pitch: number;        // MIDI note number

    octave: number;

    name: string;         // display name e.g. "C\#4"

    duration: string;     // relative: 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'

    isChord: boolean;

    chordName: string | null;  // e.g. "Cmaj7"

  }\>;

  label: string | null;       // e.g. "Main riff", "Verse pattern"

  createdAt: string;

}

interface Song {

  id: string;

  albumId: string | null;

  title: string;

  key: string | null;

  tempo: number | null;

  timeSignature: string | null;

  status: 'sketch' | 'writing' | 'arranging' | 'production' |

          'mixing' | 'mastering' | 'released';

  genre: string | null;

  // Lyrics (song-level, separate from per-idea lyrics)

  lyrics: string | null;

  // Business metadata

  songwriter: string | null;

  publisher: string | null;

  ipiNumber: string | null;

  masterEngineer: string | null;

  copyright: string | null;

  sampleCredits: string | null;

  sortOrder: number;          // within album

  createdAt: string;

  updatedAt: string;

}

interface SongSection {

  id: string;

  songId: string;

  name: string;               // e.g. "Verse 1", "Chorus", "Bridge"

  sortOrder: number;

  lyrics: string | null;      // section-level lyrics

  createdAt: string;

}

interface SongJournalEntry {

  id: string;

  songId: string;

  topic: string | null;       // e.g. "Bass", "Brass", "Drums", "Mix Notes"

  content: string;            // rich text (HTML from Tiptap/BlockNote)

  sortOrder: number;

  createdAt: string;

  updatedAt: string;

}

interface SongReference {

  id: string;

  songId: string;

  type: 'text' | 'link' | 'audio';

  content: string;            // text note, URL, or description

  audioBlob: Blob | null;     // for imported reference audio

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

interface Album {

  id: string;

  title: string;

  subtitle: string | null;

  status: 'draft' | 'in-progress' | 'released';

  artworkBlob: Blob | null;

  releaseDate: string | null;

  credits: string | null;

  globalNotes: string | null;       // rich text (HTML)

  referenceMaterial: string | null;  // rich text (HTML)

  createdAt: string;

  updatedAt: string;

}

// Dexie schema definition

const db \= new Dexie('LinerNotesDB');

db.version(1).stores({

  ideas: 'id, songId, sectionId, role, sectionIntent, status, createdAt',

  ideaMedia: 'id, ideaId, type',

  ideaNoteSequences: 'id, ideaId',

  songs: 'id, albumId, status, createdAt',

  songSections: 'id, songId, sortOrder',

  songJournalEntries: 'id, songId, topic',

  songReferences: 'id, songId',

  songAssets: 'id, songId',

  albums: 'id, createdAt',

});

---

## Key Technical Flows

### MIDI Recording

User clicks "Record MIDI" →

  Check navigator.requestMIDIAccess() →

    List available MIDI inputs →

      User selects input \+ synth patch →

        Start metronome (if enabled) →

          Listen for MIDI 'midimessage' events →

            For each note-on/note-off: store NoteEvent, play through Tone.js synth →

              User clicks Stop →

                Serialize NoteEvents to Standard MIDI File via @tonejs/midi →

                  Store as IdeaMedia (type: 'midi', blob: .mid file, noteData: NoteEvent\[\])

### Audio-to-MIDI

User has an audio IdeaMedia →

  User clicks "Extract MIDI" →

    Load @spotify/basic-pitch model (cached after first load) →

      Decode audio to AudioBuffer →

        Run BasicPitch.evaluateModel(audioBuffer) →

          Get frames, onsets, contours →

            Convert to NoteEvents via outputToNotesPoly \+ noteFramesToTime →

              Show extracted notes to user for review →

                User confirms →

                  Create new IdeaMedia (type: 'midi') linked to same Idea

### Export Song

User clicks "Export" on a Song →

  Query all Ideas where songId \= song.id →

    For each Idea, query IdeaMedia →

      Build folder structure in memory:

        /SongTitle/audio/\[sectionIntent\]-\[role\]-\[\#\#\#\].\[ext\]

        /SongTitle/midi/\[sectionIntent\]-\[role\]-\[\#\#\#\].mid

        /SongTitle/images/\[filename\]

        /SongTitle/notes/production-journal.md

        /SongTitle/notes/lyrics.txt

      →

        If File System Access API available:

          Let user pick directory, write files directly

        Else:

          Bundle as .zip via JSZip, trigger download

---

## File & Directory Structure (for Cursor)

/liner-notes/

  /public/

    /soundfonts/          \# Pre-loaded GM soundfont files (piano, bass, brass, etc.)

  /src/

    /app/                 \# Top-level app shell, routing

    /components/

      /ui/                \# shadcn/ui components

      /capture/           \# Audio recorder, MIDI recorder, note picker

      /song/              \# Song workspace, section list, idea cards

      /album/             \# Album view

      /pool/              \# Idea pool browser

      /player/            \# Playback controls, synth patch selector

      /editor/            \# Rich text editor (Tiptap/BlockNote wrapper)

      /export/            \# Export dialog and logic

    /hooks/

      useMidi.ts          \# Web MIDI API connection and recording

      useAudioRecorder.ts \# MediaRecorder wrapper

      useSynth.ts         \# Tone.js \+ soundfont-player initialization and playback

      useAudioToMidi.ts   \# Basic Pitch wrapper

      useExport.ts        \# Export logic

    /lib/

      db.ts               \# Dexie database definition and schema

      midi.ts             \# MIDI file read/write utilities (@tonejs/midi)

      notes.ts            \# Note name/number conversion utilities

      export.ts           \# Folder structure builder, zip creation

    /stores/              \# Zustand or Jotai for UI state (not data — data lives in Dexie)

    /types/               \# TypeScript interfaces (the schema types above)

  /tests/

  package.json

  vite.config.ts

  tailwind.config.ts

  tsconfig.json

---

## Decisions Left for Implementation (Cursor should evaluate)

These are choices where two good options exist and the right answer depends on hands-on testing:

1. **Drag-and-drop library**: @dnd-kit vs pragmatic-drag-and-drop. Both work. Try the one that feels simpler for the "move idea between sections" interaction.  
     
2. **Rich text editor**: Tiptap vs BlockNote. Both are ProseMirror-based. Tiptap is more flexible; BlockNote is more Notion-like out of the box. The production journal needs headings, bold/italic, image embeds, and that's about it.  
     
3. **State management**: Zustand vs Jotai vs just React Context. For UI state only (data lives in Dexie). Pick whatever keeps it simple. Don't use Redux.  
     
4. **Soundfont loading strategy**: Load all \~10 patches eagerly on app start, or lazy-load on first use? Depends on total soundfont size. FluidR3\_GM soundfonts are \~1-2MB per instrument. Lazy-load with a loading indicator is probably fine.  
     
5. **Audio recording format**: MediaRecorder outputs webm/opus in Chrome and wav in some other contexts. May want to normalize to wav for DAW compatibility on export. Can use an AudioBuffer conversion step.  
     
6. **Note picker UX**: Chromatic keyboard layout? Circle of fifths? Simple grid? Needs prototyping. The input should be: (1) select a note, (2) select an octave, (3) add to sequence. Chords could be presets or build-your-own. Start simple.

---

## What This Stack Does NOT Include (and why)

- **No Next.js / SSR.** This is a SPA. No SEO needed. No server rendering. Vite \+ React is faster and simpler.  
- **No backend at MVP.** Everything runs client-side. This cuts months of backend work and keeps focus on the core product.  
- **No CRDT / sync engine.** CRDTs are for real-time collaboration. MVP is single-user. When multi-device sync is added, evaluate Dexie Cloud or a simple last-write-wins sync over a REST API before reaching for CRDTs.  
- **No Electron / Tauri.** The web app runs in a browser tab. Desktop app wrapper adds complexity without value at MVP. File System Access API handles the export-to-filesystem use case.  
- **No native mobile.** Desktop browser only. Architecture is mobile-ready (abstracted capture interfaces, responsive component structure, API-ready data model) but no native code ships at MVP.

