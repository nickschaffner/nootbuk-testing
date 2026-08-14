# Liner Notes — Wireframes & User Flow

Draft v0.1 — August 2026

For use with Claude Design. Reference the Tech Architecture doc for stack constraints.

---

## Design Constraints (from Tech Stack)

- **React \+ Vite SPA** — single-page app, client-side routing  
- **Tailwind CSS \+ shadcn/ui** — use shadcn component primitives (Button, Dialog, Sheet, Card, DropdownMenu, Tabs, etc.) with Tailwind utility classes  
- **Desktop-first** — target 1280px+ viewport. Use responsive foundations (no hard-coded widths) but optimize for desktop. Mobile is post-MVP.  
- **Dark mode preferred** — the target user works in dimly lit studios. Design for dark theme first, light as secondary.  
- **Minimal chrome** — studio software is visually dense enough. This tool should feel clean and fast, not like another DAW. Think Notion or Linear, not Pro Tools.

---

## Information Architecture

Home (Idea Pool \+ Recent Songs)

├── Quick Capture (modal/overlay)

│   ├── Audio Record

│   ├── MIDI Record

│   ├── Note Picker

│   ├── Text / Lyrics

│   └── Photo / Image

├── Song Workspace

│   ├── Song Header (title, key, tempo, status)

│   ├── Sections Panel (user-defined, reorderable)

│   │   └── Ideas within each section (reorderable, draggable between sections)

│   ├── Song Lyrics View

│   ├── Production Journal

│   ├── References

│   ├── Assets (artwork, files)

│   └── Business Metadata

├── Idea Detail (modal or panel)

│   ├── Media attachments (audio player, MIDI player, images)

│   ├── Note sequence viewer

│   ├── Classification, musical context, instrument/patch metadata

│   ├── Lyrics / notes

│   └── Audio-to-MIDI conversion trigger

├── Album View

│   ├── Track listing (reorderable)

│   ├── Album metadata, artwork

│   ├── Global production notes

│   └── Reference material

└── Export Dialog

---

## Screen Descriptions

### 1\. Home — Idea Pool & Recent Songs

**Purpose:** Landing page. Shows the user's working state: ideas they've captured that aren't in a song yet, and songs they're actively working on.

**Layout:** Two-column or split view.

Left / primary area: **Idea Pool.** A list or grid of unattached ideas. Each idea card shows:

- Classification icon/badge (melody, bassline, drums, etc.)  
- Title or first line of notes (auto-generated if no title: "Bassline — Dm — 92bpm")  
- Waveform thumbnail if it has audio, note count if it has MIDI  
- Timestamp (relative: "2 hours ago", "3 days ago")  
- Quick-play button (plays audio or MIDI inline without opening)

The pool should support simple filtering: by role (melody, bass, etc.), by status, or just search. Don't overdesign this — a filter dropdown and a search field.

Right / secondary area or top section: **Recent Songs.** A compact list of songs the user has been working on, sorted by last modified. Each row shows title, status badge, last modified. Clicking opens the Song Workspace.

**Prominent element:** A floating or pinned "Capture" button (could be bottom-right FAB-style or a persistent element in the header). This is the highest-frequency action in the app. One click opens the Quick Capture overlay.

**Navigation:** Sidebar or top nav with: Home (Pool), Songs, Albums. Keep it minimal.

---

### 2\. Quick Capture (Modal / Overlay)

**Purpose:** Create a new idea as fast as possible. This is the most critical UX in the app. Speed is everything.

**Entry point:** The Capture button on the Home screen, or a global keyboard shortcut.

**Layout:** A modal or slide-over panel. NOT a full page — the user should feel like they're quickly jotting something down, not "starting a new project."

**Content:** A tabbed or segmented control at the top with capture modes:

**Audio** — large Record button (red circle, unmistakable). Tap to start, tap to stop. Waveform visualizes while recording. After recording, shows the waveform with playback controls and an "Extract MIDI" button.

**MIDI** — shows connected MIDI devices (or "No MIDI device detected" with help text). Device selector dropdown if multiple. Patch selector (the \~10 instrument sounds: Piano, E. Piano, Bass, Synth Bass, Brass, Strings, Synth Lead, Synth Pad, Organ, Mallet). Record button. Metronome toggle with BPM input. While recording, notes light up on a simple visualization. After recording, shows the note list with playback.

**Notes** — the note/chord picker. A visual keyboard or note grid. Select a note (C, C\#, D, etc.), select octave (0-8), add to sequence. Or select a chord type (Maj, Min, 7, m7, Maj7, sus2, sus4, dim, aug) and a root note. The sequence builds as a horizontal list of note badges. Play button to hear the sequence. Can also select instrument patch for playback.

**Text** — plain text input for lyrics, ideas, descriptions. Just a textarea.

**Photo** — file picker or camera trigger (for when mobile arrives). Grid of attached images.

**Below the capture area:** Quick metadata fields that are always visible regardless of mode:

- Role selector (melody, bassline, chords, drums, riff, etc.) — pill/chip selector, single-select  
- Section intent (verse, chorus, bridge, etc.) — pill selector, optional  
- Instrument name (freeform text input)  
- Key and Tempo (small inline inputs)  
- Notes field (freeform textarea — "play with a pick", "sounds like X")

**Save action:** "Save to Pool" button (default). Or "Save to Song \>" which opens a dropdown of existing songs and their sections. The user should be able to save in 2 clicks maximum after stopping a recording.

---

### 3\. Song Workspace

**Purpose:** The main workspace for a song. Where ideas get organized, lyrics get written, and production gets documented.

**Layout:** Multi-panel layout. Suggestions:

**Header bar:** Song title (editable inline), key, tempo, time signature, status dropdown. All editable directly in the header without opening a settings panel.

**Main area — Sections & Ideas (left/center, takes most space):**

A vertical list of sections. Each section is a collapsible container:

- Section header: name (editable), drag handle for reordering  
- Inside: idea cards arranged vertically. Each card is compact — shows classification badge, title/description preview, media indicator (audio waveform thumb, MIDI note count, image count). Click to open Idea Detail. Quick-play button inline.  
- Ideas can be dragged between sections (drop zones light up)  
- "Add Idea" button within each section (opens Quick Capture with this section pre-selected)  
- An "Unassigned" section at the bottom for ideas floating in the song but not placed in a section yet

"Add Section" button at the bottom of the section list. User types a name.

**Right sidebar or tab panel — Song-level content:**

Tabs or accordion sections for:

- **Lyrics** — full-screen-able text editor. Song-level lyrics view. Could also show per-section lyrics pulled from ideas, or let the user write a unified lyric sheet.  
- **Production Journal** — rich text editor (Tiptap/BlockNote). Organized by topic if the user wants (e.g., "Bass", "Brass", "Mix Notes") or just a running log. Image embeds for gear photos.  
- **References** — list of reference entries. Each is a text note, a URL, or an imported audio clip with playback.  
- **Assets** — file grid. Artwork, photos, supporting documents.  
- **Details** — business metadata fields (songwriter, publisher, IPI, credits, copyright, sample credits).

**Export button** in the header or sidebar — opens the Export Dialog.

---

### 4\. Idea Detail (Modal or Slide-over Panel)

**Purpose:** View and edit everything about a single idea. Opened by clicking an idea card anywhere in the app.

**Layout:** A modal or right-side panel that slides over the current view. Wide enough to show media and metadata side by side.

**Content:**

**Top: Media section.**

- If audio: waveform player with play/pause, scrubber, time display. "Extract MIDI" button.  
- If MIDI: note list or simple piano-roll-like visualization (horizontal bars on a pitch axis — read-only, not editable). Playback controls. Patch selector to change the playback sound.  
- If note sequence (from manual picker): note badges in sequence. Playback controls with patch selector.  
- If images: thumbnail grid, click to expand.  
- Multiple media can coexist on one idea — show them stacked.

**Below: Metadata and text.**

- Classification (role \+ section intent) — editable selectors  
- Musical context (key, tempo, time sig) — inline editable fields  
- Instrument / patch — name, preset, settings key-value editor  
- Lyrics — textarea  
- Notes — textarea  
- Status — dropdown

**Bottom: Actions.**

- "Move to Song" or "Change Section" — reassign this idea  
- "Duplicate" — create a copy  
- "Archive" — soft delete  
- "Delete" — hard delete with confirmation

---

### 5\. Album View

**Purpose:** Organize songs into an album, manage album-level metadata and production notes.

**Layout:** Simpler than the Song Workspace.

**Header:** Album title (editable), subtitle, status, artwork (upload/replace).

**Main area: Track listing.** Ordered list of songs. Drag to reorder. Each row shows: track number, song title, status badge, key, tempo. Click to open Song Workspace for that song.

"Add Song" button — create new or select existing.

**Below or sidebar: Album-level content.**

- **Global Production Notes** — rich text editor. Signal chains, gear lists, mixing methodology, sonic direction. This is the album-wide production bible.  
- **Reference Material** — rich text with file attachments. Book notes, technique references.  
- **Credits** — text fields for album-level credits, release date, label, catalog number.

---

### 6\. Export Dialog

**Purpose:** Get media files out of the app and into the filesystem for DAW use.

**Layout:** Modal dialog.

**Content:**

- Song name and summary (X audio files, Y MIDI files, Z images)  
- Preview of the folder structure that will be created  
- Format options: "Save to Folder" (uses File System Access API — user picks a directory) or "Download as ZIP"  
- Checkboxes for what to include: Audio, MIDI, Images, Lyrics (as .txt), Production Journal (as .md)  
- Export button

Keep it simple. The export structure is defined in the PRD — the dialog just lets the user trigger it and pick a destination.

---

## Key User Flows

### Flow 1: Quick idea capture (the primary flow)

User is noodling on a MIDI keyboard at their desk

  → Clicks "Capture" button (or keyboard shortcut)

  → Quick Capture modal opens on MIDI tab

  → MIDI controller is auto-detected, patch defaults to Piano

  → User selects "Bass" patch

  → Clicks Record, plays a bassline

  → Clicks Stop

  → Notes are displayed, playback available

  → User selects role: "Bassline", types instrument: "Minitaur"

  → Clicks "Save to Pool"

  → Modal closes, idea appears in Pool

Total time target: under 15 seconds from capture to saved.

### Flow 2: Audio capture with MIDI extraction

User recorded a bass guitar line on their phone as a voice memo

  → Drags the .wav file onto the app (or clicks import)

  → New idea created with audio attachment, opens Idea Detail

  → User clicks "Extract MIDI"

  → Loading indicator while Basic Pitch processes (a few seconds)

  → Extracted notes are displayed alongside the audio waveform

  → User plays back the MIDI — sounds close enough

  → User tags it: role "Bassline", key "Cm", tempo "92"

  → Saves to Pool

### Flow 3: Building a song from pool ideas

User has 6 ideas in their Pool from the past week

  → Creates a new Song: "The Show", key: C, tempo: 100

  → Adds sections: Intro, Verse 1, Bridge, Verse 2, Outro

  → Opens the Pool in a side panel or navigates to it

  → Drags "Bassline — C" idea into Verse 1

  → Drags "Chord progression" idea into Intro

  → Opens Verse 1's bassline idea, adds lyrics: "How many times we going down this road?"

  → Opens Production Journal, creates a "Bass" entry

  → Writes: "Danelectro Longhorn, DI into preamp, La Bella 760FS-S strings. 

    Octave up pedal (Pitch Fork) kicks in at Verse 2."

  → Attaches a photo of the pedal board settings

### Flow 4: Exporting to DAW

Song is in "production" status, user wants to start tracking in Ableton

  → Clicks Export

  → Dialog shows: 4 MIDI files, 2 audio files, 3 images

  → User clicks "Save to Folder", picks \~/Music/The Show/

  → Files are written:

      /The Show/midi/verse1-bassline-001.mid

      /The Show/midi/intro-chords-001.mid

      /The Show/audio/verse1-bassline-001.wav

      /The Show/notes/lyrics.txt

      /The Show/notes/production-journal.md

  → User opens Ableton, drags MIDI files from Finder into tracks

### Flow 5: Documenting during production (building liner notes)

User is deep in production on "Totoroids" in Ableton

  → Switches to Liner Notes app

  → Opens "Totoroids" Song Workspace

  → Goes to Production Journal

  → Creates entry: "Guitar (Lead)"

  → Writes: "First time using Shreddage Stratus (patch saved as Totoroids). 

    Lead doubled-up and panned L/R with ADT doubling. 

    All guitars tracked through Swollen Pickle for Smashing Pumpkins Siamese Dream sound."

  → Drops in a screenshot of the Stratus patch settings

  → Creates entry: "Brass (Lead)"

  → Writes: "Started with Summer Madness preset on Massive in Maschine+. 

    Arp riff: G5, E5, C5, E5..."

  → This documentation accumulates over weeks of production

  → When the song is released, the journal IS the liner notes  
