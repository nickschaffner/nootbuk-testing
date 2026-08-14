# Liner Notes — Design System

## Context

The user is building **Liner Notes**, a fully client-side (React + Vite + Tailwind + shadcn, Dexie/IndexedDB, Tone.js, Web MIDI, Basic Pitch) music idea-capture and song-documentation web app for a solo bedroom/semi-pro producer. Before prototyping the app in Claude Design, they want a **design system reference page** to lock the visual language.

Art direction: *as if Saul Bass and Dieter Rams designed music software in the late 1960s.* The five reference images and the `create_make_theme` result converge on a **Swiss/functional + textured-paper** stance: warm bone/paper ground, one vermillion red-orange accent, dense black, subtle print grain, heavy grotesque display type, mono technical micro-labels, and hardware motifs (faders, knobs, VU meters, piano keys, dot sequences, ledger grids).

Requirements: **default dark mode + a light mode**, desktop-first (target 1280px+, responsive foundations, one ~1000px breakpoint), minimal chrome ("Notion/Linear, not Pro Tools"). Every component is drawn from the PRD / Tech Architecture / Wireframes so the system is complementary to the technical constraints (client-side, API-ready schema, ~10 synth patches, capture modes, idea/song/album data model).

Deliverable chosen by user: **Foundations + full component gallery** (a single interactive style-guide page — not the working app).

## Approach

Extend the existing scaffold in place. This is a single-page interactive reference rendered by `src/App.tsx`, with all theme tokens and global wiring in `src/index.css` (per `AGENTS.md` this scaffold uses `index.css`, not `styles/theme.css`). No router, no backend, no data libraries — this is a static showcase with local React state for interactivity (theme toggle, tabs, pill selection, transport play/stop, toggles, accordions).

### Files
- `src/index.css` — fonts, tokens, grain, base wiring (primary edit surface for the design language).
- `src/App.tsx` — page shell + section composition.
- `src/components/ds/*` — one file per component group (see gallery below). Keep components presentational and token-driven; default-export the page, named-export gallery pieces.
- `src/lib/notes.ts` — tiny helper for note-name/MIDI display data used by the note picker and sequence viewer (display only; mirrors the PRD `NoteEvent`/`IdeaNoteSequence` shapes).

### Typography (Google Fonts via CSS2 `@import` at top of `src/index.css`)
- **Display / headings:** `Archivo` (use heavy + expanded weights) — bold grotesque, the Bass voice.
- **Body / UI:** `Archivo` regular/medium — neutral neo-grotesque, the Rams voice.
- **Mono technical labels/readouts:** `Space Mono` — VU/patch/parameter micro-labels, uppercase, letter-spaced.

### Tokens (`:root` = light paper; `.dark` = default, applied to `<html>`)
Define via `@theme` + `:root`/`.dark` in `index.css`. Core palette:
- Paper/bone ground, near-black ink, **vermillion `#E8380D`-ish** accent (brightened slightly in dark for AA), warm grays for meters/muted, hairline border.
- Map to the standard token names the gallery uses: `--background/foreground`, `--card/-foreground`, `--primary/-foreground`, `--secondary`, `--muted/-foreground`, `--accent`, `--border`, `--ring`, `--radius` (near-0 — Swiss square corners). Provide a `.dark` block; default the app to dark by setting `class="dark"` on the root element in `src/main.tsx`/`index.html` shell or via App effect.
- Subtle print **grain** as a fixed overlay (SVG `feTurbulence` data-URI or a low-opacity radial noise), toggled with theme; kept behind content and non-interactive.

### Page structure (`App.tsx`)
1. **Masthead** — "LINER NOTES / DESIGN SYSTEM", version tag, and a **dark/light toggle** (persisted to `localStorage`). Big vermillion rule + mono meta line.
2. **Foundations**
   - Color tokens (swatches with hex + token name, both modes visible via toggle).
   - Typography scale (display → body → mono label specimens).
   - Grid & spacing, hairline rules, radius.
   - Motif library: dot sequences, VU bars, piano-key divider, ledger grid, the red bar.
3. **Component gallery** (each drawn from PRD/wireframes):
   - **Buttons** — primary (vermillion), secondary (outline), ghost; plus the unmistakable **Record** button (red circle) with recording state.
   - **Inputs** — text field, inline metadata fields (Key / Tempo / Time Sig), textarea (notes/lyrics), key–value **patch-settings** editor (ledger rows).
   - **Selectors** — **Role** pills (melody, bassline, chords, drums, riff, synth, vocal, texture, sample, other), **Section-intent** pills (verse, chorus, bridge…), single-select chip behavior.
   - **Badges** — Idea status (raw → developed → used → archived), Song status (sketch → … → released) as ledger/meter-style tags.
   - **Idea Card** — classification badge, auto-title ("Bassline — Dm — 92 BPM"), waveform thumb / MIDI note-count / image-count indicator, relative timestamp, inline quick-play.
   - **Song row** — title, status badge, key/tempo, last-modified.
   - **Section container** — collapsible, drag handle, "Add Idea", holds idea cards; "Unassigned" variant.
   - **Segmented control / Tabs** — Quick Capture modes: Audio · MIDI · Notes · Text · Photo.
   - **Note picker** — chromatic keyboard (black/white keys), octave selector, chord-type chips (Maj/Min/7/m7/Maj7/sus2/sus4/dim/aug), building a horizontal note-badge sequence.
   - **Note-sequence / mini piano-roll viewer** — read-only horizontal bars on a pitch axis (ledger grid).
   - **Transport & waveform player** — play/stop, scrubber, time readout; **VU meter**, **faders**, and **knobs** as the patch/metronome controls (10 synth patches listed).
   - **Toggles & switches** — metronome, dark mode, boolean settings.
   - **Dropdown / Select** — patch selector, "Save to Song ›".
   - **Dialog/modal shells** — Quick Capture and Export dialog framing (static, showing folder-structure preview `SongName/midi/verse-bassline-001.mid`).
   - **Table / ledger grid** — album track listing (track #, title, status, key, tempo).
4. **Footer** — mono colophon (fonts, palette, motif credits), grain note.

### Interactivity
Working React state for: theme toggle (+localStorage), capture-mode tabs, pill single-select, accordion collapse, transport play/stop pulse, note-picker sequence building, switches. No audio engine — visual/stateful only (this is a spec, not the app).

## Verification
- Vite dev server is already running on `$PORT`; changes hot-reload — open the preview and visually confirm both modes.
- Toggle dark ⇄ light: confirm tokens flip, grain adapts, vermillion stays legible (AA: body ≥ 4.5:1, large/interactive ≥ 3:1) on both grounds.
- Resize below ~1000px: grids collapse and composition stays intentional.
- Exercise each interactive piece (tabs, pills, accordion, note picker, transport, switches).
- Sanity-check the build only if an import is uncertain; localized styling needs no full typecheck.
