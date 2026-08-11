\# Nootbuk — MVP Product Requirements Document

Draft v0.4 — August 2026

Changes from v0.3: Removed Tiptap/rich text editor entirely (plain textarea everywhere). Added Instrument management as first-class feature. Added Song todo lists and song audio versions. Songs can now belong to multiple albums (many-to-many). Ideas elevated to main navigation. Idea copy/move semantics expanded. Lyrics is always-visible field, not a content block. Removed album subtitles. Playback loops by default. Key selection is dropdown. Import audio removed from Quick Capture. Removed New Idea from homepage. References support any combination of text \+ URL \+ audio \+ attachment.

\---

\#\# Problem

Capturing a musical idea has too much friction, and the formats you end up with are lossy and disconnected.

A working musician generates a constant stream of creative artifacts: voice memos, lyric fragments, chord progressions, MIDI performances, note sequences scribbled on paper, photos of gear settings, production decisions, reference tracks. Today these live scattered across phone voice memos, markdown files, DAW project folders, scraps of paper, and text messages. By the time a song reaches production, half the original context is lost. The stuff that survives is either trapped inside a DAW project file (invisible outside that environment) or buried in an unstructured document that's doing six jobs at once.

The gap between "I just played something cool" and "that idea is safely captured in a way I can understand later" is where songs go to die.

Three specific capture failures this product solves:

1\. The Casio problem. You're on a battery-powered keyboard with no MIDI out. Your only options are writing note names on paper or recording audio on your phone. Two weeks later you're listening to that recording trying to guess what chord you played. The paper is gone.

2\. The bass guitar problem. You're writing on bass. No MIDI. You record a voice memo. You can hear it, but you can't see what notes you played. You can't transpose it, can't display it as tab, can't hand it to the tool that will eventually produce the track.

3\. The DAW graveyard problem. You have an idea worth saving, so you open your DAW and create a new project. This takes ages. The idea is now "good bassline.ableton" sitting on your hard drive in a folder you'll never reopen. The idea is technically preserved but practically dead — no context, no metadata, no connection to anything else.

Beyond capture, the ongoing documentation of a song's production — what gear was used, what signal chain shaped each instrument, what patches were saved, what the creative intent was — also has no natural home. This documentation is valuable both during production (as reference) and after (as liner notes, credits, and a record of how the song was made). Today it gets dumped into the same overloaded markdown file or simply never written down.

\#\# Target User

Solo semi-pro studio producer or bedroom producer. Someone who writes, performs, produces, and mixes their own music. Works across physical instruments (bass guitar, keyboards, harmonica) and software instruments (DAWs, synths, drum machines). Primary DAW is Ableton Live, but the product should be DAW-agnostic. Not a formally trained musician — doesn't read or write sheet music, thinks in note names and personal shorthand rather than standard notation.

Later versions may expand to collaborative workflows (bands, producer-artist pairs), but the MVP is built for a solo creator.

\#\# Product Vision

A musician's idea capture and song documentation tool that understands music — not just files.

It knows what MIDI is. It can show you what notes you played. It can play them back. It can hold audio next to lyrics next to a photo of your amp settings next to a note that says "play this with a pick near the bridge, dark and sparse." And all of that lives in a structure that grows with the song from initial noodle to finished production, so when a song is done you have a complete set of liner notes and production documentation as a natural byproduct of the creative process.

It sits alongside the DAW, not replacing it. Think of it as the notebook, the reference library, and the archive — a launchpad into production and a record of everything that happened during it.

Core principles:

\- Capture speed is everything. Creating an idea must take seconds, not minutes. If there's enough friction to break creative flow, the tool has failed.  
\- Music-aware, not music-theory-dependent. The tool should understand notes, chords, keys, and tempo — but it should never require the user to know formal notation.  
\- One home for everything. Audio, MIDI, lyrics, images, notes, gear settings, references, artwork — if it's part of the song, it lives here.  
\- Export is a first-class feature. Ideas need to flow out of this tool and into a DAW easily.  
\- Documentation as byproduct. The act of organizing and annotating your work during creation should produce usable liner notes without a separate documentation pass.  
\- Instruments are remembered, not retyped. Your gear list is saved. Select your bass, and the app knows what synth patch to preview with.

\#\# Data Model

\#\#\# Instrument

A saved instrument from the user's gear collection. First-class entity with its own management page.

\- Name: freeform (e.g., "Danelectro Longhorn", "Casio CT-X700", "Massive (VST)")  
\- Type: bass, guitar, keys, synth-hardware, synth-vst, drums, wind, vocal, other  
\- Default patch: auto-matched synth preview patch based on type (bass type → Bass patch, keys → Piano, etc.)  
\- Patches (synth-type instruments only): named presets (e.g., "37 voice", "Totoroids preset", "Summer Madness"). Stored as a list of InstrumentPatch records.

\#\#\# Idea

The atomic creative unit. A single musical thought, captured as quickly as possible.

An idea is a bundle, not a single file. It can contain any combination of media, text, and metadata.

Media attachments (zero or more per idea, any combination):  
\- Audio recording (captured in-app from mic as lossless WAV via AudioWorklet, or imported file)  
\- MIDI recording (captured in-app from connected controller, or imported .mid file)  
\- Audio-to-MIDI conversion output  
\- Images / photos  
\- Note/chord sequences (entered via the note picker)  
\- File attachments

Note/chord entry (manual): A visual picker for entering notes and chords without a MIDI controller. The note picker UX needs to be fast — adding a note should be one tap or a few keystrokes, not three separate selections. Each note in the sequence should display its duration. Notes should be editable in place (change pitch, duration, delete, reorder). The sequence should be playable at any point during editing.

Classification:  
\- Role: melody, bassline, chord progression, drum pattern, riff, synth line, vocal line, texture/pad, sound effect, sample, other  
\- Section intent (optional): verse, chorus, bridge, pre-chorus, intro, outro, breakdown, solo, unassigned

Musical context:  
\- Key (dropdown selection: C, C\#/Db, D, D\#/Eb, E, F, F\#/Gb, G, G\#/Ab, A, A\#/Bb, B — with major/minor qualifier)  
\- Tempo / BPM (optional)  
\- Time signature (optional)

Instrument:  
\- instrumentId (FK to instruments table, selected from saved instruments via dropdown)  
\- If instrument is a synth type, also has a Patch field for the specific preset name  
\- Selecting an instrument auto-sets the synth preview patch based on instrument type

Lyrics: Always-visible field on ideas (not a content block). Freeform text for lyric fragments, vocal melodies, etc.

Freeform notes: Intent, mood, references, performance instructions. "Play with a pick near the bridge." "Sounds like Les Fleurs."

Status: Raw capture → Developed → Used in song → Archived/Discarded

Idea movement:  
\- Ideas in the Pool can be: Turned into a new song, Moved to a song (removes from pool), Copied to a song (stays in pool, duplicate goes to song), Copied into a new song  
\- Ideas in a Song can be: Moved to pool (removes from song), Copied to pool (stays in song, duplicate goes to pool), Moved between sections, Copied to another song  
\- Copying creates a full duplicate (new UUID, all media and note sequences duplicated). Copies are independent.

\#\#\# Song

Collects ideas into a structured composition.

Song metadata:  
\- Working title  
\- Key (dropdown), tempo, time signature  
\- Status: sketch → writing → arranging → production → mixing → mastering → released (sequential stages, displayed as a step indicator/slider)  
\- Genre / style notes (freeform)  
\- Which albums this song belongs to (many-to-many — a song can be on multiple albums)

Sections: User-defined structural divisions. Ideas placed into sections, movable and reorderable via drag-and-drop.

Song-level lyrics: Unified lyric sheet view (textarea).

Production journal: Running plain-text notes organized by topic/instrument (e.g., "Bass", "Brass", "Mix Notes"). Each entry has a topic label and text content. Image attachments can be added to entries as separate files, not inline embeds. No rich text editor — plain textarea.

Todo list: Checklist items for production tasks. Each item has text content and an optional timestamp (mm:ss format, stored as seconds). Items can be checked off (strikethrough, stays visible), reordered, and deleted. Incomplete todos surface to the homepage.

Song audio versions: Upload audio files of the actual song (rough mixes, demos, masters). Unlimited versions per song. Each has a label and upload date. One version is marked "Main" — this is what plays when the song is played from outside the workspace (e.g., from the Songs list). If no main is set, most recent is default.

References: Each reference can have any combination of: text note, URL/link, audio clip (with playback), file attachment (image, document, etc.). References are not exclusive types — a single reference can be a text note with a link and an attached audio clip.

Artwork & assets: Images and files attached at the song level.

Business metadata: Songwriter name(s), publisher, IPI/ASCAP numbers, master engineer, credits, copyright, sample credits.

\#\#\# Album / Project

Optional grouping of songs. Songs can belong to multiple albums (many-to-many via junction table).

Album metadata:  
\- Title (no subtitle)  
\- Track listing with user-defined ordering (via junction table, drag to reorder)  
\- Status: draft → in-progress → released (displayed as step indicator/slider)  
\- Artwork / cover art  
\- Release metadata (date, label, catalog number)  
\- Credits  
\- Notes (plain text, general album notes)

Global production notes: Album-level documentation (plain text, not rich text). Signal chain standards, gear lists, sonic direction.

Reference material: Plain text notes with file attachments.

\#\#\# Idea Pool

The inbox. Ideas that don't belong to a song yet (songId \= null).

Ideas in the pool can be:  
\- Browsed, searched, and filtered  
\- Turned into a new song (idea becomes the seed)  
\- Moved to an existing song section  
\- Copied to an existing song section (original stays in pool)  
\- Copied into a new song  
\- Archived or discarded

\#\#\# Ideas (All)

A dedicated page showing ALL ideas — both pool ideas and ideas assigned to songs. Filterable by role, status, instrument, media type. Searchable by text content. Each card shows which song it belongs to (or "Pool").

\#\# MVP Features

\#\#\# P0 — The Core

Fast idea capture:  
\- Quick Capture is the primary and only way to create ideas (no separate "New Idea" form)  
\- A single idea can contain multiple types of content in any combination  
\- Capture tools: Record Audio, Record MIDI, Note Picker, Photo/Image, File attachment  
\- Lyrics is an always-visible field (not an addable content block), alongside role, instrument, key, tempo, and notes  
\- Audio import is NOT in Quick Capture — available from the Ideas page and Idea Detail only  
\- Classify idea (role \+ section intent) via quick-select pills  
\- Instrument selection via dropdown of saved instruments \+ "Add New"  
\- Instrument selection auto-sets synth preview patch

MIDI recording from connected controller:  
\- Web MIDI API (Chrome/Edge only, feature-detect with fallback messaging)  
\- \~10 synth patches: piano, electric piano, bass, synth bass, brass, strings, synth lead, synth pad, organ, mallet (via Tone.js \+ smplr)  
\- Patch selection before recording — what you hear is what gets saved  
\- Patch switching should be fast, even at the cost of audio quality

Audio-to-MIDI conversion:  
\- @spotify/basic-pitch, client-side  
\- Preview extracted MIDI before confirming  
\- Available in Idea Detail (on any audio attachment) — not yet in Quick Capture (future improvement)

Instrument management:  
\- Dedicated Instruments page with CRUD  
\- Name \+ Type fields  
\- Type auto-maps to synth preview patch  
\- Synth-type instruments get an additional Patches list for named presets  
\- Instrument dropdown in Quick Capture and Idea Detail

Song workspace:  
\- Custom sections, reorderable via drag-and-drop  
\- Place ideas into sections, move between sections  
\- Song-level and section-level lyrics (textarea)  
\- Production journal (plain text, organized by topic, image attachments as separate files)  
\- Todo list (text \+ optional timestamp, checkable, sortable, deletable)  
\- Song audio versions (upload, unlimited, one "main")  
\- References (any combination of text \+ URL \+ audio \+ file attachment)  
\- Artwork and file assets  
\- Business metadata  
\- Shows which albums the song belongs to

Idea pool:  
\- Default landing zone for captures  
\- Browse/search/filter  
\- Move, copy, or turn ideas into songs

Ideas page:  
\- All ideas (pool \+ assigned to songs)  
\- Full filtering and search  
\- First-class navigation item

Album/project organization:  
\- Songs can be on multiple albums (many-to-many)  
\- Track listing ordering independent per album  
\- Album-level metadata, artwork, credits  
\- Global production notes (plain text)  
\- Reference material (plain text \+ file attachments)  
\- Album notes (plain text)

Export:  
\- File System Access API (Chrome/Edge) \+ JSZip fallback \+ browser-fs-access  
\- Structured folder output  
\- Export lyrics as .txt, production journal as .md

Playback:  
\- All playback (audio, MIDI, note sequences, references, song versions) loops by default  
\- Inline play buttons on idea cards everywhere — play without opening the detail panel  
\- If an idea has both audio and MIDI, show both play buttons

\#\#\# P1 — High Value, Second Priority

Tab view for bass/guitar, performance chart generation, structured instrument patch logging, feedback tracking, advanced search.

\#\#\# Not in MVP

Collaboration, DAW plugin integration, notation export, piano roll editor, advanced audio editing, AI-assisted anything, user accounts, cloud sync, native iOS app, native Android app (web PWA covers Android), rich text editing.

\#\# Platform & Technical Considerations

MVP platform: Desktop \+ Android (via responsive web app \+ PWA). Fully client-side. No backend.

Android Chrome fully supports every API this app requires — Web MIDI (via USB-C OTG or Bluetooth MIDI), AudioWorklet, IndexedDB, and TensorFlow.js. The web app IS the Android app: responsive Tailwind breakpoints \+ PWA manifest makes it installable on Android home screens with no native code. iOS native remains post-MVP because Safari does not support Web MIDI.

Browser support: Chrome and Edge primary. Firefox partial (Web MIDI requires Site Permission Add-On, no File System Access disk pickers). Safari minimal (no Web MIDI, no disk pickers). Feature-detect and provide clear fallback UI.

Key technical stack:  
\- React 19 \+ Vite 8 SPA, TypeScript 5.x  
\- Tailwind CSS v4 (CSS-first config) \+ shadcn/ui (new-york style)  
\- Tone.js \+ smplr for synth engine  
\- @spotify/basic-pitch for audio-to-MIDI  
\- AudioWorklet for lossless WAV capture  
\- Dexie.js 4.4.x for IndexedDB  
\- @tonejs/midi for MIDI file I/O  
\- @dnd-kit for drag-and-drop  
\- Zustand for UI state  
\- NO rich text editors (plain textarea everywhere)  
\- File System Access API \+ JSZip \+ browser-fs-access for export

Post-MVP additions:  
\- Backend API \+ Postgres \+ S3 for cloud sync  
\- User auth  
\- Native iOS app with CoreMIDI (iOS Safari does not support Web MIDI)  
\- Dexie Cloud for sync

\#\# Open Questions

1\. Pricing model.  
2\. Audio-to-MIDI accuracy expectations and correction workflows.  
3\. How structured should instrument patch metadata be beyond name/type?  
4\. Mobile roadmap timing for iOS (requires native app).  
5\. Browser storage limits for prolific users.  
6\. Note picker UX — needs design exploration (see Iteration 8 in AGENTS.md).

\#\# Success Metrics

\- Capture-to-saved time: under 15 seconds  
\- Idea retrieval: under 10 seconds  
\- Export usability: files open correctly in major DAWs  
\- Audio-to-MIDI utility: "close enough" 70%+ of the time  
\- Documentation completeness: journal produces meaningful liner notes  
\- Retention: ideas move from pool to song at a healthy rate