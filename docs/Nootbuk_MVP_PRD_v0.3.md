\# Nootbuk — MVP Product Requirements Document

Draft v0.3 — August 2026

Changes from v0.2: Product renamed from "Liner Notes" to "Nootbuk". Updated tech stack versions (Vite 8, smplr, Tiptap 3, @dnd-kit, Zustand). AudioWorklet for WAV recording (not MediaRecorder). Added browser support constraints. Resolved open questions \#4 (note picker) and added browser-specific notes.

\---

\#\# Problem

Capturing a musical idea has too much friction, and the formats you end up with are lossy and disconnected.

A working musician generates a constant stream of creative artifacts: voice memos, lyric fragments, chord progressions, MIDI performances, note sequences scribbled on paper, photos of gear settings, production decisions, reference tracks. Today these live scattered across phone voice memos, markdown files, DAW project folders, scraps of paper, and text messages. By the time a song reaches production, half the original context is lost. The stuff that survives is either trapped inside a DAW project file (invisible outside that environment) or buried in an unstructured document that's doing six jobs at once.

The gap between "I just played something cool" and "that idea is safely captured in a way I can understand later" is where songs go to die.

\*\*Three specific capture failures this product solves:\*\*

1\. \*\*The Casio problem.\*\* You're on a battery-powered keyboard with no MIDI out. Your only options are writing note names on paper or recording audio on your phone. Two weeks later you're listening to that recording trying to guess what chord you played. The paper is gone.

2\. \*\*The bass guitar problem.\*\* You're writing on bass. No MIDI. You record a voice memo. You can hear it, but you can't \*see\* what notes you played. You can't transpose it, can't display it as tab, can't hand it to the tool that will eventually produce the track.

3\. \*\*The DAW graveyard problem.\*\* You have an idea worth saving, so you open your DAW and create a new project. This takes ages. The idea is now "good bassline.ableton" sitting on your hard drive in a folder you'll never reopen. The idea is technically preserved but practically dead — no context, no metadata, no connection to anything else.

Beyond capture, the ongoing documentation of a song's production — what gear was used, what signal chain shaped each instrument, what patches were saved, what the creative intent was — also has no natural home. This documentation is valuable both during production (as reference) and after (as liner notes, credits, and a record of how the song was made). Today it gets dumped into the same overloaded markdown file or simply never written down.

\#\# Target User

Solo semi-pro studio producer or bedroom producer. Someone who writes, performs, produces, and mixes their own music. Works across physical instruments (bass guitar, keyboards, harmonica) and software instruments (DAWs, synths, drum machines). Primary DAW is Ableton Live, but the product should be DAW-agnostic. Not a formally trained musician — doesn't read or write sheet music, thinks in note names and personal shorthand rather than standard notation.

Later versions may expand to collaborative workflows (bands, producer-artist pairs), but the MVP is built for a solo creator.

\#\# Product Vision

A musician's idea capture and song documentation tool that \*understands music\* — not just files.

It knows what MIDI is. It can show you what notes you played. It can play them back. It can hold audio next to lyrics next to a photo of your amp settings next to a note that says "play this with a pick near the bridge, dark and sparse." And all of that lives in a structure that grows with the song from initial noodle to finished production, so when a song is done you have a complete set of liner notes and production documentation as a natural byproduct of the creative process.

It sits alongside the DAW, not replacing it. Think of it as the notebook, the reference library, and the archive — a launchpad into production and a record of everything that happened during it.

\*\*Core principles:\*\*

\- \*\*Capture speed is everything.\*\* Creating an idea must take seconds, not minutes. If there's enough friction to break creative flow, the tool has failed.  
\- \*\*Music-aware, not music-theory-dependent.\*\* The tool should understand notes, chords, keys, and tempo — but it should never require the user to know formal notation. If you can type \`C2, F2, G\#2, G2\`, the tool should understand that.  
\- \*\*One home for everything.\*\* Audio, MIDI, lyrics, images, notes, gear settings, references, artwork — if it's part of the song, it lives here.  
\- \*\*Export is a first-class feature.\*\* Ideas need to flow \*out\* of this tool and into a DAW easily. If export is painful, the tool becomes a graveyard instead of a launchpad.  
\- \*\*Documentation as byproduct.\*\* The act of organizing and annotating your work during creation should produce usable liner notes, production notes, and credits without a separate documentation pass.

\#\# Data Model

\#\#\# Idea

The atomic creative unit. A single musical thought, captured as quickly as possible.

\*\*An idea is a bundle, not a single file.\*\* It can contain any combination of media, text, and metadata. A typical idea might be a MIDI recording \+ a lyric fragment \+ a photo of gear settings \+ a note about intent. All of these belong together as one idea — they describe a single musical thought from different angles.

\*\*Media attachments\*\* (zero or more per idea, any combination):

\- Audio recording (captured in-app from mic as lossless WAV via AudioWorklet, or imported file)  
\- MIDI recording (captured in-app from connected controller, or imported .mid file)  
\- Audio-to-MIDI conversion output (audio in → MIDI extracted via pitch detection)  
\- Images / photos (pedal settings, patch screenshots, amp positions, handwritten notes)  
\- Note/chord sequences (entered via the note picker)  
\- File attachments (any supporting file)

\*\*Note/chord entry (manual):\*\* A simple visual picker for entering notes and chords without a MIDI controller. Tap a note name (C, C\#, D, etc.), select an octave, and it's added to a sequence. Same for chords (Cmaj, Dm7, etc.). Build out phrases note by note or chord by chord. The sequence is playable through the built-in synth engine and displayed as a simple visual list — not a notation editor, not a piano roll, just "here are the notes you entered, in order." This is the digital replacement for scribbling note names on paper — useful when you're away from a controller and want to capture what you just played on an acoustic instrument or what's in your head.

\*\*Classification:\*\*

\- Role: melody, bassline, chord progression, drum pattern, riff, synth line, vocal line, texture/pad, sound effect, sample, other  
\- Section intent (optional): verse, chorus, bridge, pre-chorus, intro, outro, breakdown, solo, unassigned

\*\*Musical context:\*\*

\- Key (optional)  
\- Tempo / BPM (optional)  
\- Time signature (optional)

\*\*Instrument & patch metadata:\*\*

\- Instrument name (freeform, e.g., "Casio CT-X700", "Danelectro Longhorn", "Minitaur")  
\- Patch/preset name (freeform, e.g., "37 voice", "Totoroids preset", "Summer Madness on Massive")  
\- Settings (key-value pairs, e.g., \`Rev: 1 | Chorus: 1 | Delay: off | Strum: 2\`)

\*\*Lyrics / lines:\*\* Freeform text. Can be a lyric fragment, a full verse, a vocal melody description, or anything text-based tied to this idea.

\*\*Freeform notes:\*\* Intent, mood, references, performance instructions, anything. "Play with a pick near the bridge." "Sounds like Les Fleurs." "This should feel loose and wild (honky tonk)."

\*\*Status:\*\* Raw capture → Developed → Used in song → Archived/Discarded

\*\*Timestamps:\*\* Created, last modified.

\#\#\# Song

Collects ideas into a structured composition. The primary workspace for a song in progress.

\*\*Song metadata:\*\*

\- Working title  
\- Key, tempo, time signature  
\- Status: sketch → writing → arranging → production → mixing → mastering → released  
\- Genre / style notes (freeform)

\*\*Sections:\*\* User-defined structural divisions of the song. Default suggestions (Intro, Verse, Chorus, Bridge, Outro) but fully customizable — the user names their own sections.

Ideas are placed into sections. An idea can be moved between sections freely — drag a verse idea into the chorus, turn a riff into an intro. Ideas within a section can be reordered. An idea can also remain unassigned to any section (floating within the song but not yet placed).

\*\*Song-level lyrics:\*\* A unified lyric sheet view, separate from per-idea lyrics. Can be written as a whole document. Lyrics can also be attached at the section level or pulled from individual ideas. The goal is flexibility — some people write lyrics as a unified piece, others attach them to specific musical ideas, others do both at different stages.

\*\*Production journal:\*\* Running freeform rich-text notes (via Tiptap 3\) with image embed support. This is the ongoing narrative of how the song is being made. Per-instrument writeups (gear used, signal chain, presets saved, how the sound evolved), mix decisions, creative pivots, session notes. This content \*becomes\* the liner notes.

The production journal should support per-instrument or per-element entries (e.g., a "Bass" entry, a "Brass" entry, a "Drums" entry within the journal), so documentation stays organized as it grows. These are not rigid categories — just a way to group journal entries by topic.

\*\*Reference tracks:\*\*

\- Text notes ("This should sound like Les Fleurs meets Phil Collins drumming")  
\- Links (URLs to streaming services, YouTube, articles)  
\- Imported audio clips

\*\*Artwork & assets:\*\* Images (cover art, promotional photos, visual references). Files attached at the song level.

\*\*Business metadata:\*\*

\- Songwriter name(s), publisher, IPI/ASCAP numbers  
\- Master engineer / credits  
\- Copyright line  
\- Sample credits / clearance notes

\#\#\# Album / Project

Optional grouping of songs. Not required — songs can exist independently.

\*\*Album metadata:\*\*

\- Title, subtitle/tagline  
\- Track listing with user-defined ordering  
\- Status  
\- Artwork / cover art  
\- Release metadata (date, label, catalog number)  
\- Credits

\*\*Global production notes:\*\* Album-level documentation that applies across all songs. Signal chain standards, gear lists, sonic direction, mixing methodology, reference tracks, mastering chain documentation. This is where "here's how I'm processing everything on this album" lives, separate from per-song production journals.

\*\*Reference material:\*\* Freeform notes, links, and attachments. Book notes, technique references, educational material — anything that informs the album's production but isn't specific to one song. (Example: notes taken while reading a mixing textbook that apply to the whole project.)

\#\#\# Idea Pool

The inbox. Ideas that don't belong to a song yet. Captured during noodling, practice, or random inspiration.

Ideas in the pool can be:

\- Browsed and searched  
\- Promoted to a new song (idea becomes the seed of a new song workspace)  
\- Moved into an existing song (dragged into a specific section or left floating)  
\- Archived or discarded

The pool should be the default destination for quick captures. "I just played something cool" → capture it → it lands in the pool → figure out what to do with it later.

\#\# MVP Features

\#\#\# P0 — The Core (ship-blocking)

\*\*Fast idea capture\*\*

\- A single idea can contain multiple types of content in any combination — e.g., a MIDI recording \+ a lyric line \+ a photo of pedal settings is one idea, not three. The capture UI presents content types as addable blocks, not exclusive tabs.  
\- Record audio from device microphone — captured as lossless WAV via AudioWorklet (not MediaRecorder, which outputs lossy formats in all browsers)  
\- Import audio files (wav, mp3, aiff, etc.)  
\- Import MIDI files (.mid)  
\- Manual note/chord entry via visual picker (tap to select notes/chords, build sequences)  
\- Add text / lyrics  
\- Attach images / photos (camera capture on mobile, file picker on desktop)  
\- Attach files  
\- Classify idea (role \+ section intent) via quick-select, not a form  
\- Add freeform notes  
\- Instrument/patch metadata entry (instrument name, preset, key-value settings)

\*\*MIDI recording from connected controller\*\*

\- Detect and connect to MIDI controllers (USB or Bluetooth) via Web MIDI API  
\- Record MIDI input to a simple click/metronome  
\- Play back recorded MIDI through a built-in synth engine  
\- Synth engine offers \~10 basic patches: piano, electric piano, bass, synth bass, brass, strings, synth lead, synth pad, organ, mallet (marimba/vibraphone)  
\- Patch selection at record time — pick a sound, play, what you hear is what gets saved  
\- Note: Web MIDI is Chrome/Edge only. Firefox requires Site Permission Add-On. Safari does not support Web MIDI. The app must feature-detect and show clear fallback messaging.

\*\*Audio-to-MIDI conversion\*\*

\- Process an audio recording (voice memo, bass recording, etc.) through pitch detection using @spotify/basic-pitch TypeScript library (runs entirely client-side in the browser, no server needed)  
\- Generate MIDI from detected pitches — polyphonic, instrument-agnostic, includes pitch bend detection  
\- Display extracted notes alongside original audio  
\- User can keep, edit, or discard the conversion result

\*\*Song workspace\*\*

\- Create songs with metadata (title, key, tempo, status)  
\- Define custom sections (user-named, reorderable via @dnd-kit)  
\- Place ideas into sections via drag-and-drop  
\- Move/reorder ideas between sections freely  
\- Song-level lyrics view (freeform text editor)  
\- Section-level lyrics (text attached to a specific section)  
\- Production journal (Tiptap 3 rich text with image embeds, organized by topic/instrument)  
\- Reference tracks (text notes \+ links \+ imported audio)  
\- Attach artwork and files at the song level  
\- Business metadata fields (songwriter, publisher, credits, copyright)

\*\*Idea pool\*\*

\- Default landing zone for new captures  
\- Browse/search all unattached ideas  
\- Move ideas from pool into songs  
\- Promote an idea to a new song

\*\*Album/project organization\*\*

\- Create albums, assign songs, order track listing  
\- Album-level metadata, artwork, and credits  
\- Global production notes (freeform rich text with images)  
\- Reference material attachments

\*\*Export\*\*

\- Export individual MIDI files from ideas  
\- Export individual audio files from ideas  
\- Export all media from a song as a well-structured folder: \`SongName/section-role-001.mid\`, etc.  
\- Structured folder output that can be opened in a file browser and dragged into a DAW  
\- Primary export: File System Access API (Chrome/Edge) — user picks a directory, files are written directly  
\- Fallback export: JSZip — download as .zip (Firefox, Safari, other browsers). Uses browser-fs-access library for graceful detection and fallback.  
\- Export song lyrics as plain text  
\- Export production journal / liner notes as text or markdown

\*\*Note playback\*\*

\- Manually entered note/chord sequences can be played back through the built-in synth  
\- User selects a patch for playback (same \~10 patches as MIDI recording)  
\- Simple transport: play, stop. No editing, no sequencing.

\#\#\# P1 — High Value, Second Priority

\*\*Tab view for bass/guitar\*\* — Display MIDI or parsed notes as tablature for bass (4-string) and guitar (6-string). User specifies tuning. Critical for the "I played this on bass and want to see the fret positions" workflow.

\*\*Performance chart generation\*\* — Structured view that combines notes, fret positions, lyrics, and performance instructions (like "BOUNCE", "OCT ON") aligned by section. Based on how The Show's bass chart works in the user's current notes.

\*\*Structured instrument patch logging\*\* — Beyond freeform key-value, offer known instrument profiles with common parameters. "Casio CT-X" with fields for voice number, pattern, reverb, chorus, etc.

\*\*Feedback tracking\*\* — Log external feedback on songs (reviewer comments, submission responses, evaluator notes). Date-stamped, source-tagged.

\*\*Search and filtering\*\* — Search across all ideas, songs, and albums by text content, classification, instrument, key, tempo, status, date.

\#\#\# Not in MVP

\- Collaboration / multi-user  
\- DAW plugin or direct DAW integration  
\- Notation export (MusicXML, standard notation, sheet music)  
\- Piano roll editor or MIDI sequencer  
\- Advanced MIDI editing (quantization, velocity curves, CC editing)  
\- Advanced audio editing (EQ, effects, multi-track mixing)  
\- Sync/integration with streaming platforms  
\- AI-assisted composition or lyric writing  
\- Video attachment or sync  
\- Social features or sharing/publishing

\#\# Platform & Technical Considerations

\*\*MVP platform: Desktop / laptop only. Fully client-side web app. No backend.\*\*

The long-term vision is mobile \+ desktop, with an asymmetric workflow — phone for capture, desktop for management and export. But mobile is not in the MVP. Audio-to-MIDI is not a sufficient substitute for real MIDI controller input on a phone, and iOS Safari doesn't support Web MIDI, so doing mobile right means native apps. That's a significant investment that shouldn't gate the initial launch.

MVP ships as a static client-side web app. All data lives locally in the browser (IndexedDB). MIDI recording, audio recording, synth playback, and audio-to-MIDI conversion all run client-side via browser APIs and JavaScript libraries. There is no server, no auth, no cloud storage. This cuts months of backend work and keeps focus on the core product experience.

Android mobile support is a fast-follow, not post-MVP. Android Chrome fully supports every API this app requires — Web MIDI (via USB-C OTG or Bluetooth MIDI), AudioWorklet, IndexedDB, and TensorFlow.js. The web app IS the Android app: once the desktop MVP is working, adding responsive Tailwind breakpoints and a PWA manifest makes it installable on Android home screens with no native code. iOS native remains post-MVP because Safari does not support Web MIDI.

\*\*Browser support:\*\* The MVP targets Chrome and Edge as primary browsers. Two key browser APIs are not universally supported:

\- \*\*Web MIDI API\*\* (hardware MIDI controller input): Chrome, Edge, Opera. Firefox 108+ desktop with Site Permission Add-On. Not supported in Safari (macOS or iOS), any iOS browser (all use WebKit), or Firefox for Android. \~78% global browser support.  
\- \*\*File System Access API\*\* (save-to-folder export): Chrome 86+, Edge 86+. Firefox and Safari only support OPFS (sandboxed, not user-visible disk). No mobile browser supports disk pickers.

Firefox and Safari users can still use: audio recording (AudioWorklet is universally supported), note picker, text/image capture, and ZIP export. They cannot use: hardware MIDI input or save-to-folder export. The app feature-detects both APIs and provides clear fallback UI.

\*\*The critical constraint: don't code into a corner.\*\* The MVP must be architected so that a backend and mobile clients can be added without rewriting the data model or core logic. This means:

\- \*\*Data schema is API-ready.\*\* Even though data lives locally in IndexedDB at MVP, every table uses UUIDs, explicit relationships, and ISO timestamps — so it maps cleanly to Postgres when a backend is added.  
\- \*\*Responsive UI foundations.\*\* The web app uses responsive layout primitives even if it's desktop-focused at MVP. Don't hard-code width assumptions. When mobile arrives, the component architecture should accommodate it.  
\- \*\*Capture interfaces are abstracted.\*\* The web app uses Web MIDI API and AudioWorklet behind a clean interface. When a native mobile app arrives, it implements the same interface via CoreMIDI (iOS) / Android MIDI API and native audio recording. The rest of the app doesn't care.  
\- \*\*All processing is client-side.\*\* Audio-to-MIDI runs in the browser via the @spotify/basic-pitch TypeScript library. Synth playback runs in the browser via Tone.js and smplr. No server dependencies to recreate when mobile arrives — the same libraries can be bundled into a React Native app or replaced with native equivalents.

\*\*Key technical stack (see Tech Architecture doc for full detail):\*\*

\- React 19 \+ Vite 8 SPA, TypeScript 5.x, Tailwind CSS v4 (CSS-first config, no tailwind.config.ts) \+ shadcn/ui (new-york style, OKLCH colors)  
\- Web MIDI API for MIDI controller input (Chrome, Edge — see browser support above)  
\- Tone.js (v15.1.22) \+ smplr for synth engine and instrument playback (\~10 patches: piano, electric piano, bass, synth bass, brass, strings, synth lead, synth pad, organ, mallet)  
\- @spotify/basic-pitch TypeScript library for audio-to-MIDI conversion (runs client-side, polyphonic, instrument-agnostic)  
\- AudioWorklet for lossless WAV audio capture  
\- Dexie.js 4.4.x (IndexedDB wrapper) for all local data and media storage  
\- @tonejs/midi for MIDI file import/export  
\- @dnd-kit for drag-and-drop (idea reordering, section management)  
\- Tiptap 3 for rich text editing (production journal)  
\- Zustand for UI state management  
\- File System Access API \+ JSZip \+ browser-fs-access for export to filesystem

\*\*Post-MVP additions (when needed):\*\*

\- Backend API (Node.js or Python) \+ Postgres \+ S3-compatible object storage for cloud sync and backup  
\- User auth (Clerk, Auth.js, or Supabase Auth)  
\- Native iOS app for mobile capture with CoreMIDI (iOS Safari does not support Web MIDI — native app required for iOS MIDI input). Android is covered by the responsive web app \+ PWA.  
\- Dexie Cloud (via dexie-cloud-addon) for sync — supports blob offloading and Y.js collaboration as of March 2026

\*\*File export structure:\*\*

/SongName/  
  /audio/  
    verse-bassline-001.wav  
    chorus-brass-001.wav  
  /midi/  
    verse-bassline-001.mid  
    intro-piano-001.mid  
  /images/  
    amp-settings-001.jpg  
    pedal-board-001.jpg  
  /notes/  
    production-journal.md  
    lyrics.txt  
    liner-notes.md

\#\# Open Questions

1\. \*\*Pricing model.\*\* Free with limits? Subscription? One-time purchase? The target user is a semi-pro — they spend money on gear and software but are price-sensitive about subscriptions. A one-time purchase or freemium model may fit the audience better than yet another monthly subscription.

2\. \*\*Audio-to-MIDI accuracy expectations.\*\* Basic Pitch is good but not perfect, especially for polyphonic content. It does not detect drums/percussion. Audio is downmixed to mono and resampled to 22050 Hz internally. Output MIDI is unquantized. Need to set user expectations and provide easy correction workflows. May want to let users manually adjust extracted MIDI via the note picker. Note: the library (v1.0.1) has not been updated in \~4 years — it's functionally stable but unmaintained. Pin @tensorflow/tfjs version and vendor model files.

3\. \*\*How structured should instrument/patch metadata be?\*\* The MVP proposes freeform key-value pairs. But if common instruments had known parameter templates (e.g., Casio keyboards with voice/pattern/reverb/chorus fields), capture would be faster. This might be a community-driven feature — user-submitted instrument profiles.

4\. \*\*Mobile roadmap timing.\*\* MVP is desktop-only, but when does mobile become critical? Post-validation with early users? After the first handful of paying customers? Mobile is where the highest-friction capture problem lives (couch \+ guitar \+ phone), so it can't wait too long.

5\. \*\*Browser storage limits.\*\* IndexedDB storage is generous (typically several GB) but not unlimited. For a prolific songwriter with lots of audio recordings, this could become a constraint. Need to monitor usage and consider an export/archive workflow or cloud backup before storage becomes an issue.

\#\# Success Metrics

\- \*\*Capture-to-saved time:\*\* An idea should go from "I just played something" to "it's saved with basic metadata" in under 15 seconds.  
\- \*\*Idea retrieval:\*\* User can find a specific idea from 2+ weeks ago in under 10 seconds via search or browsing.  
\- \*\*Export usability:\*\* Exported MIDI/audio files open correctly in Ableton, Logic, and other major DAWs with no conversion steps.  
\- \*\*Audio-to-MIDI utility:\*\* Users who convert audio to MIDI report the extracted notes are "close enough to be useful" at least 70% of the time.  
\- \*\*Documentation completeness:\*\* By the time a song reaches "released" status, the production journal contains enough information to generate a meaningful set of liner notes without a separate documentation pass.  
\- \*\*Retention signal:\*\* Users return to captured ideas — the pool doesn't just fill up and get ignored. Ideas move from pool → song at a healthy rate.