\# Nootbuk — Technical Architecture

Draft v0.2 — August 2026

Changes from v0.1: Product renamed from "Liner Notes" to "Nootbuk". Vite 6.x → 8.x. Tailwind v4 CSS-first config (no tailwind.config.ts). soundfont-player → smplr. MediaRecorder → AudioWorklet \+ WAV encoding. Resolved open decisions: @dnd-kit, Tiptap 3, Zustand. Added browser-fs-access for export fallback. Updated browser support notes.

\---

\#\# Tech Stack

This is the confirmed stack for MVP. These choices are validated against current (August 2026\) library status and browser support. This document also serves as the constraint set for design work — Claude Design and Cursor should build within these boundaries.

\#\#\# Frontend

| Layer | Choice | Version | Why |  
| :---- | :---- | :---- | :---- |  
| Framework | \*\*React \+ Vite\*\* | React 19.x (19.2.x), Vite 8.x | SPA, not a content site — SSR adds nothing. Vite 8 integrates the Rolldown bundler. |  
| Language | \*\*TypeScript\*\* | 5.x | Non-negotiable for a project this size. |  
| Styling | \*\*Tailwind CSS v4 \+ shadcn/ui\*\* | Tailwind 4.x, shadcn latest (new-york style) | Tailwind v4 is a Rust rewrite with CSS-first config via @theme (no tailwind.config.ts). shadcn gives headless accessible components without vendor lock-in (copy-paste, not a dependency). Colors are OKLCH. |  
| Synth Engine | \*\*Tone.js\*\* | 15.1.22 (May 2026\) | Actively maintained. Built-in synth types (Synth, AMSynth, FMSynth, MembraneSynth, PluckSynth) plus transport, scheduling, effects. Handles the "pick a sound, play notes" workflow. |  
| Instrument Samples | \*\*smplr\*\* | Latest | Modern replacement for soundfont-player (same author, danigb — soundfont-player is archived). Supports FluidR3\_GM and MusyngKite General MIDI soundfonts loaded on demand via Web Audio API. More realistic than pure synthesis for instrument preview. Falls back to Tone.js synths if soundfonts haven't loaded yet. |  
| MIDI Input | \*\*Web MIDI API\*\* (native) | W3C spec | No wrapper library needed — the API is simple. Chrome, Edge, Opera. Firefox 108+ with Site Permission Add-On. Not Safari/iOS. Not Firefox for Android. HTTPS required. \~78% global browser support. |  
| Audio-to-MIDI | \*\*@spotify/basic-pitch\*\* | basic-pitch-ts v1.0.1 (npm) | Runs entirely client-side via TensorFlow.js. No backend needed. Polyphonic, instrument-agnostic, outputs note events with pitch bends. Apache 2.0 licensed. Note: last published \~4 years ago but functionally stable. Pin @tensorflow/tfjs version. Vendor model files. |  
| Audio Recording | \*\*Web Audio API AudioWorklet\*\* | W3C spec | Captures raw PCM Float32 samples from device mic via AudioWorklet processor. PCM data is manually encoded to WAV format (RIFF header \+ PCM data). This approach is used instead of MediaRecorder because no browser outputs WAV natively — Chrome outputs webm/opus, Firefox outputs ogg/webm, Safari outputs mp4/aac. Music production requires lossless WAV. |  
| Drag & Drop | \*\*@dnd-kit\*\* | Core 6.3.x, @dnd-kit/react 0.5.x | \~2.8M weekly npm downloads, 6KB core, excellent accessibility. Used for reordering ideas within sections, moving ideas between sections, and rearranging sections within a song. Do NOT use react-beautiful-dnd (deprecated by Atlassian). |  
| Rich Text | \*\*Tiptap 3\*\* | @tiptap/react \~3.29.x | For production journal / liner notes editor. Needs image embeds, basic formatting, heading structure. Tiptap 3 is stable with SSR support, JSX, MarkView, and consolidated @tiptap/extensions package. Core editor is MIT licensed. |  
| State Management | \*\*Zustand\*\* | Latest | For UI-only state (selected tab, modal open/close, current view). Data lives in Dexie, not state management. Minimal API, no providers needed. Do NOT use Redux. |  
| MIDI File I/O | \*\*@tonejs/midi\*\* | 2.0.28 | Read and write Standard MIDI Files. Works with Tone.js. Handles import and export of .mid files. Note: last published \~4 years ago but stable and widely used (\~14k downloads/month). Pin version. |

\#\#\# Data Layer

| Layer | Choice | Why |  
| :---- | :---- | :---- |  
| Local Database | \*\*Dexie.js 4.4.x\*\* | Offline-capable, structured, queryable, no backend required for MVP. Dexie provides a clean Promise-based API over IndexedDB with indexing, compound queries, and schema versioning. Handles the entire data model (ideas, songs, albums, metadata). Note: dexie-observable and dexie-syncable are now legacy/unmaintained — do NOT use for future sync. |  
| Media Storage | \*\*IndexedDB blobs\*\* via Dexie | Audio recordings, MIDI files, and images stored as blobs in IndexedDB alongside their metadata. For MVP this is simpler than filesystem APIs. Total storage is bounded by browser quota (typically several GB — more than enough for an active songwriter's working set). |  
| Cloud Sync | \*\*Not in MVP\*\* | All data lives locally in the browser. Cloud sync (account, backup, multi-device) is a post-MVP feature. When added, the approach is: API server (Node or Python) \+ Postgres for structured data \+ S3-compatible object storage for media. Dexie Cloud (via dexie-cloud-addon) is a viable path — Dexie Cloud Server 3.0 (March 2026\) added transparent blob offloading and Y.js collaboration support. |  
| Export | \*\*File System Access API\*\* \+ \*\*JSZip\*\* \+ \*\*browser-fs-access\*\* | File System Access API lets the web app write to a user-chosen directory (Chrome/Edge only — not Firefox, not Safari). JSZip for bundling exports as .zip on browsers without filesystem access. browser-fs-access library provides graceful fallback (download/upload) on unsupported browsers. Exported folder structure is defined in the PRD. |

\#\#\# Backend (MVP)

\*\*None.\*\* The MVP is a fully client-side web application. No server, no auth, no cloud. Data lives in the browser's IndexedDB. This is the fastest path to a working product.

When cloud features are needed (auth, sync, backup, sharing), add:

| Layer | Likely Choice | Notes |  
| :---- | :---- | :---- |  
| API | Node.js (Express or Hono) or Python (FastAPI) | API-first. REST or tRPC. |  
| Database | Postgres | Mirrors the Dexie schema. |  
| Media Storage | S3-compatible (AWS S3, Cloudflare R2, etc.) | Audio, MIDI, images. |  
| Auth | Clerk, Auth.js, or Supabase Auth | Don't roll your own. |  
| Hosting | Vercel, Railway, or Fly.io | For the API. Static frontend on Vercel/Netlify/Cloudflare Pages. |

\---

\#\# Architecture Principles

\*\*1. Client-side first.\*\* Audio recording, MIDI recording, synth playback, audio-to-MIDI conversion, and all data management happen in the browser. The MVP has zero network dependencies. This means it works offline, avoids server costs, and simplifies the initial build.

\*\*2. API-ready data model.\*\* Even though MVP has no backend, the Dexie schema is designed so that every table maps cleanly to a Postgres table later. IDs are UUIDs. Relationships are explicit foreign keys. Timestamps are ISO strings. When a backend arrives, the migration path is: stand up Postgres with the same schema, add a sync layer that pushes/pulls changes between Dexie and Postgres.

\*\*3. Capture interfaces are abstracted.\*\* MIDI input, audio recording, and audio-to-MIDI each have a clean interface boundary. The React components that use them don't know whether MIDI comes from Web MIDI API or (eventually) a native CoreMIDI bridge. This is what makes mobile possible later without rewriting the app.

\*\*4. Media is always exportable.\*\* Audio and MIDI are stored in standard formats (wav, .mid). Nothing proprietary. The user can always get their files out — either through the export feature or by extracting from IndexedDB directly.

\---

\#\# Data Schema (Dexie / IndexedDB)

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
  content: string;            // rich text (HTML from Tiptap)  
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
const db \= new Dexie('NootbukDB');

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

\---

\#\# Key Technical Flows

\#\#\# Audio Recording

User clicks "Record Audio" →  
  navigator.mediaDevices.getUserMedia({ audio: true }) →  
    Create AudioContext →  
      Connect mic stream to AudioWorkletNode (PCM capture processor) →  
        AudioWorklet collects Float32 PCM samples →  
          User clicks Stop →  
            Concatenate PCM buffers →  
              Encode to WAV (write RIFF/WAV header \+ PCM data) →  
                Store as IdeaMedia (type: 'audio', blob: WAV file, mimeType: 'audio/wav')

\#\#\# MIDI Recording

User clicks "Record MIDI" →  
  Check navigator.requestMIDIAccess() →  
    List available MIDI inputs →  
      User selects input \+ synth patch →  
        Start metronome (if enabled) →  
          Listen for MIDI 'midimessage' events →  
            For each note-on/note-off: store NoteEvent, play through Tone.js/smplr synth →  
              User clicks Stop →  
                Serialize NoteEvents to Standard MIDI File via @tonejs/midi →  
                  Store as IdeaMedia (type: 'midi', blob: .mid file, noteData: NoteEvent\[\])

\#\#\# Audio-to-MIDI

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

\#\#\# Export Song

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
        If File System Access API available (Chrome/Edge):  
          Let user pick directory via showDirectoryPicker(), write files directly  
        Else (Firefox, Safari, others):  
          Bundle as .zip via JSZip, trigger download via browser-fs-access fallback

\---

\#\# File & Directory Structure (for Cursor)

/nootbuk/  
  /public/  
    /soundfonts/          \# Pre-loaded GM soundfont files (loaded by smplr)  
  /src/  
    /app/                 \# Top-level app shell, routing  
    /components/  
      /ui/                \# shadcn/ui components  
      /capture/           \# Audio recorder, MIDI recorder, note picker  
      /song/              \# Song workspace, section list, idea cards  
      /album/             \# Album view  
      /pool/              \# Idea pool browser  
      /player/            \# Playback controls, synth patch selector  
      /editor/            \# Tiptap 3 rich text editor wrapper  
      /export/            \# Export dialog and logic  
    /hooks/  
      useMidi.ts          \# Web MIDI API connection and recording  
      useAudioRecorder.ts \# AudioWorklet-based PCM capture \+ WAV encoding  
      useSynth.ts         \# Tone.js \+ smplr initialization and playback  
      useAudioToMidi.ts   \# Basic Pitch wrapper  
      useExport.ts        \# Export logic  
      useDb.ts            \# Dexie CRUD operations  
    /lib/  
      db.ts               \# Dexie database definition and schema  
      midi.ts             \# MIDI file read/write utilities (@tonejs/midi)  
      notes.ts            \# Note name/number conversion utilities  
      export.ts           \# Folder structure builder, zip creation  
      audio.ts            \# WAV encoding, audio utilities  
    /stores/              \# Zustand stores for UI-only state (not data — data lives in Dexie)  
    /types/               \# TypeScript interfaces (the schema types above)  
  /tests/  
  package.json  
  vite.config.ts  
  tsconfig.json

Note: No tailwind.config.ts — Tailwind v4 uses CSS-first configuration via @theme blocks in the CSS entry point.

\---

\#\# Decisions Left for Implementation (Cursor should evaluate)

1\. \*\*Soundfont loading strategy\*\*: Load all \~10 patches eagerly on app start, or lazy-load on first use? smplr supports lazy loading natively. Lazy-load with a loading indicator is the recommended approach.

2\. \*\*Note picker UX\*\*: Chromatic keyboard layout? Circle of fifths? Simple grid? Needs prototyping. The input should be: (1) select a note, (2) select an octave, (3) add to sequence. Chords could be presets or build-your-own. Start with a chromatic grid (simpler), iterate after testing.

\---

\#\# Decisions Resolved (from v0.1)

\- \*\*Drag-and-drop library\*\* → @dnd-kit. \~2.8M weekly downloads, 6KB core, excellent accessibility. Clear winner for React DnD in 2026\.  
\- \*\*Rich text editor\*\* → Tiptap 3\. Stable, full control over image embeds and toolbar, MIT core.  
\- \*\*State management\*\* → Zustand. Minimal API, no providers, works with React 19\. Data stays in Dexie.  
\- \*\*Audio recording format\*\* → AudioWorklet \+ manual WAV encoding. MediaRecorder doesn't output WAV in any browser.

\---

\#\# What This Stack Does NOT Include (and why)

\- \*\*No Next.js / SSR.\*\* This is a SPA. No SEO needed. No server rendering. Vite \+ React is faster and simpler.  
\- \*\*No backend at MVP.\*\* Everything runs client-side. This cuts months of backend work and keeps focus on the core product.  
\- \*\*No CRDT / sync engine.\*\* CRDTs are for real-time collaboration. MVP is single-user. When multi-device sync is added, evaluate Dexie Cloud (which now supports Y.js) or a simple last-write-wins sync over a REST API before reaching for CRDTs.  
\- \*\*No Electron / Tauri.\*\* The web app runs in a browser tab. Desktop app wrapper adds complexity without value at MVP. File System Access API handles the export-to-filesystem use case.  
\- \*\*No native mobile.\*\* Desktop browser only. Architecture is mobile-ready (abstracted capture interfaces, responsive component structure, API-ready data model) but no native code ships at MVP.

\#\# Browser Support Notes

The MVP targets \*\*Chrome and Edge\*\* as primary browsers. Key constraints:

\- \*\*Web MIDI API\*\*: Chrome, Edge, Opera. Firefox 108+ desktop with Site Permission Add-On (not enabled by default). Not supported in Safari (macOS or iOS) or any iOS browser (all use WebKit). Not Firefox for Android.  
\- \*\*File System Access API (disk pickers)\*\*: Chrome 86+, Edge 86+. Firefox and Safari only support OPFS (sandboxed, not user-visible). No mobile browser supports disk pickers.  
\- \*\*AudioWorklet\*\*: Supported in all modern browsers (Chrome 64+, Firefox 76+, Safari 14.1+).  
\- \*\*IndexedDB\*\*: Universal support.

Firefox and Safari users can still use: audio recording, note picker, text/image capture, and ZIP export. They cannot use: hardware MIDI input or save-to-folder export.