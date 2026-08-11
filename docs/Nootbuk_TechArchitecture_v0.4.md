\# Nootbuk — Technical Architecture

Draft v0.4 — August 2026

Changes from v0.3: Removed IdeaNoteSequence table (note sequences stored as IdeaMedia type midi). Zero-or-one model: each idea has at most one audio and one MIDI source, images/files unlimited. Removed InstrumentPatch table (patch names are a text field on the Idea). Removed instrumentName from Idea (instrument name comes from instruments table only). Removed section-level lyrics from SongSection. No backward compatibility concerns.

\---

\#\# Idea Media Model: Zero or One

An idea has at most ONE audio source and at most ONE MIDI source. Images and file attachments are unlimited.

\- If the user records audio or imports audio and one already exists, it replaces the previous one.  
\- If the user records MIDI, enters a note sequence, or extracts MIDI from audio and a MIDI source already exists, it replaces the previous one.  
\- Note sequences from the note picker are stored as IdeaMedia with type 'midi' and notes in noteData. There is NO separate IdeaNoteSequence table.  
\- The audio-to-MIDI flow produces both: one audio source, one MIDI derivative.  
\- If you want two different takes, make two ideas.

This maps cleanly to two play buttons on idea cards: audio (if exists) and MIDI (if exists).

\---

\#\# Data Schema

All IDs are UUIDs. All timestamps are ISO 8601 strings.

interface Instrument {  
  id: string;  
  name: string;  
  type: 'bass' | 'guitar' | 'keys' | 'synth-hardware' | 'synth-vst' | 'drums' | 'wind' | 'vocal' | 'other';  
  defaultPatch: string | null;  
  createdAt: string;  
  updatedAt: string;  
}

// NO InstrumentPatch table. Patch names are a text field (patchName) on Idea.

interface Idea {  
  id: string;  
  songId: string | null;  
  sectionId: string | null;  
  sortOrder: number;  
  role: 'melody' | 'bassline' | 'chords' | 'drums' | 'riff' | 'synth' | 'vocal' | 'texture' | 'sample' | 'other';  
  sectionIntent: 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'intro' | 'outro' | 'breakdown' | 'solo' | 'unassigned' | null;  
  key: string | null;  
  tempo: number | null;  
  timeSignature: string | null;  
  instrumentId: string | null;    // FK to instruments table. No instrumentName field.  
  patchName: string | null;       // freeform text for the specific preset  
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
  noteData: NoteEvent\[\] | null;   // for midi type, including note picker sequences  
  sortOrder: number;  
  createdAt: string;  
}

// ZERO OR ONE audio IdeaMedia per idea.  
// ZERO OR ONE midi IdeaMedia per idea.  
// Unlimited image and file IdeaMedia per idea.  
// NO IdeaNoteSequence table.

interface NoteEvent {  
  pitch: number;  
  startTime: number;  
  duration: number;  
  velocity: number;  
}

interface Song {  
  id: string;  
  title: string;  
  key: string | null;  
  tempo: number | null;  
  timeSignature: string | null;  
  status: 'sketch' | 'writing' | 'arranging' | 'production' | 'mixing' | 'mastering' | 'released';  
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

// NO albumId on Song. Album membership via AlbumSong junction.

interface SongSection {  
  id: string;  
  songId: string;  
  name: string;  
  sortOrder: number;  
  createdAt: string;  
}

// NO lyrics on SongSection. Ideas in a section display their own lyrics inline.

interface SongJournalEntry {  
  id: string;  
  songId: string;  
  topic: string | null;  
  content: string;          // PLAIN TEXT  
  sortOrder: number;  
  createdAt: string;  
  updatedAt: string;  
}

interface SongReference {  
  id: string;  
  songId: string;  
  text: string | null;  
  url: string | null;  
  audioBlob: Blob | null;  
  attachmentBlob: Blob | null;  
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
  timestamp: number | null;  
  completed: boolean;  
  sortOrder: number;  
  createdAt: string;  
}

interface SongVersion {  
  id: string;  
  songId: string;  
  label: string | null;  
  filename: string;  
  mimeType: string;  
  blob: Blob;  
  isMain: boolean;  
  createdAt: string;  
}

interface Album {  
  id: string;  
  title: string;  
  status: 'draft' | 'in-progress' | 'released';  
  artworkBlob: Blob | null;  
  releaseDate: string | null;  
  credits: string | null;  
  globalNotes: string | null;        // PLAIN TEXT  
  referenceMaterial: string | null;   // PLAIN TEXT  
  notes: string | null;              // PLAIN TEXT  
  createdAt: string;  
  updatedAt: string;  
}

interface AlbumSong {  
  id: string;  
  albumId: string;  
  songId: string;  
  trackNumber: number;  
}

Dexie Schema:

db.version(3).stores({  
  instruments: 'id, type, createdAt',  
  ideas: 'id, songId, sectionId, role, sectionIntent, status, instrumentId, createdAt',  
  ideaMedia: 'id, ideaId, type',  
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

\#\# Tech Stack

Frontend: React 19 \+ Vite 8, TypeScript 5.x, Tailwind CSS v4 \+ shadcn/ui (new-york, OKLCH), Tone.js \+ smplr, @spotify/basic-pitch, AudioWorklet, @dnd-kit, Zustand, @tonejs/midi, File System Access API \+ JSZip \+ browser-fs-access.

Explicitly NOT: Tiptap, BlockNote, any rich text editor. InstrumentPatch table. IdeaNoteSequence table. react-beautiful-dnd. Redux. Next.js. Any backend.

Data: Dexie.js 4.4.x. All data local in IndexedDB. Future sync via Dexie Cloud.

\---

\#\# Browser Support

Primary: Chrome, Edge (desktop \+ Android via PWA).  
Partial: Firefox (Web MIDI requires Add-On, no disk pickers).  
Minimal: Safari (no Web MIDI, no disk pickers).  
iOS: Post-MVP (requires native app for MIDI).