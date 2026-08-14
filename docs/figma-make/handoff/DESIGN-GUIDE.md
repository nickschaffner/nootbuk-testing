# Nootbuk — "Liner Notes" Design System (Cursor implementation guide)

This is the visual + interaction spec for **Nootbuk**, a musician's idea-capture and
song-documentation tool. It is a **design handoff**, not the running app — implement it
against the existing Nootbuk codebase to your best ability. Where this guide and the
current prototype disagree, **this guide wins on visuals and layout**; keep the
prototype's data layer, routing, and behavior.

**Companion files**
- `liner-notes.css` — the token layer + global utilities + optional plain-CSS component
  classes. Drop the token/utility parts in as-is.
- Reference React source: `src/components/ds/*` (`foundations`, `controls`, `content`,
  `capture`, `library`) + `src/index.css`. These are presentational specimens; mine them
  for exact class recipes.
- Screenshots (provided separately) show the target layouts.

---

## 1. Art direction

> As if **Saul Bass** and **Dieter Rams** designed music software in the **late 1960s**.

- **Grounds:** warm paper/bone in light, near-black ink in dark. **Dark is the default.**
- **One accent only:** vermillion `#E5330C` (light) / `#F4471F` (dark). Never add a second hue.
- **Square corners** (`--radius: 2px`). No soft/rounded cards. Round only true circles
  (transport play button, status dots, record dot).
- **Hairline borders** everywhere; the `--hairline` token is the workhorse divider.
- **Faded letterpress grain** (`.noise`) on solid fills only — feathered, never a flat screen.
- **Type:** Archivo Expanded (black, uppercase) for display; Archivo for body/UI;
  Space Mono (uppercase, tracked, `.label-mono`) for technical micro-labels.
- Minimal chrome — "Notion/Linear, not Pro Tools."

---

## 2. Setup

1. **Fonts** — Google Fonts `@import` at the very top of your global CSS (already in
   `liner-notes.css`): Archivo, Archivo Expanded, Space Mono.
2. **Tokens** — copy the `:root` (light) and `.dark` (dark) blocks. Set `class="dark"` on
   `<html>` for the default; toggling removes it for paper/light. Persist to `localStorage`.
3. **Tailwind v4 (recommended, matches the prototype):** expose tokens with `@theme inline`
   so utilities resolve — `bg-background`, `text-foreground`, `bg-card`, `bg-panel`,
   `border-hairline`, `text-muted-foreground`, `bg-primary`, `text-keys-white/black`, etc.
   See `src/index.css` for the exact mapping. If you are **not** on Tailwind, use the
   `.ln-*` classes in `liner-notes.css`.
4. **Do not** add an unlayered universal reset (`* { margin: 0 }`) — it overrides layered
   framework rules and breaks spacing.

---

## 3. Tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#efe9dd` | `#14120d` | page ground |
| `--foreground` | `#17150f` | `#ece5d5` | ink / text / strong borders |
| `--card` | `#f5f0e6` | `#1c1913` | raised surface |
| `--panel` | `#e6dfd0` | `#24201a` | recessed surface: toolbars, lanes, docks |
| `--primary` | `#e5330c` | `#f4471f` | the single accent |
| `--primary-foreground` | `#f7f2e7` | `#14120d` | text on accent |
| `--muted-foreground` | `#6a6355` | `#9a917d` | mono labels, secondary text |
| `--border` | `#cbc2ae` | `#342e24` | standard border |
| `--hairline` | `#b7ad96` | `#453d2f` | **workhorse divider** |
| `--ring` | `#e5330c` | `#f4471f` | focus outline |
| `--grid-line` | `rgba(23,21,15,.10)` | `rgba(236,229,213,.10)` | roll/beat grid |
| `--keys-white/black` | — | — | on-screen keyboard |
| `--radius` | `2px` | `2px` | corners |

**Contrast:** body ≥ 4.5:1, large/interactive ≥ 3:1 in **both** modes. Vermillion is
brightened in dark for this reason — keep both values.

---

## 4. Typography

- **Display / headings** — `font-display` (Archivo Expanded), weight 800–900, uppercase,
  `tracking-tight`, `leading-[0.92]`. Section titles, the masthead.
- **Body / UI** — `font-sans` (Archivo), 400–700.
- **Mono micro-labels** — `.label-mono` (Space Mono, uppercase, `letter-spacing:.14em`,
  ~11px, muted). Every field label, patch/param caption, timestamp, section kicker.

Rule of thumb: **if it labels a control, it's `.label-mono`; if it's a heading, it's
Expanded black uppercase; everything else is Archivo.**

---

## 5. Core primitives

Match these recipes (Tailwind classes in the reference; `.ln-*` equivalents in the CSS).

- **Button** — square, hairline or accent border, uppercase 700 label. Primary = solid
  vermillion (often with `.noise`). Secondary = `border-foreground`, inverts on hover.
  Ghost = borderless muted → primary on hover.
- **Icon button** (`Ico`) — 28×28, hairline border, square; `is-active` → accent fill.
  Transport play is the one **round** (`rounded-full border-2`) button.
- **Segmented control** (`Seg`) — bordered row, active segment = `foreground` fill /
  `background` text. `whitespace-nowrap` on segments. Used for every either/or mode.
  `--lg`/`size="lg"` and full-width variants for touch.
- **Toggle** (`Tog`) — boolean chip; on = accent fill, off = hairline muted.
- **Chip / pill** — single-select classification (Role, Section intent, Chord). Active =
  accent fill. Include an explicit **"Off"/"None"** where the group can be empty.
- **Pick** — small square button for numeric groups (Octave 2–5, Note length ¼–4).
- **Field** — `.label-mono` above a square hairline input/select; focus → `border-foreground`.
- **Panel** — `card` + hairline. **Recess/panel** (`--panel`) for toolbars, lanes, docks.
- **Window frame** — `border-foreground` + hard offset shadow `6px 6px 0 0 var(--primary)`
  for modal/drawer mockups.

---

## 6. Motifs

- **Grain** (`.noise` / `.noise-strong`) — on the red bar, primary buttons, roll blocks,
  knobs. Solid fills only.
- **Red bar** — a `h-3` vermillion `.noise` rule used as a section divider.
- **Beat lane / piano roll** (`.ln-lane`) — `--panel` bg with the `--grid-line` grid; blocks
  are `primary/85` rectangles positioned by `left/width/top/height` %; selected block gets a
  `ring-2 ring-foreground`; a 1px `--primary` playhead.
- **On-screen keyboard** (`.ln-keys`) — flexed keys, `--keys-white/black`, press → accent.
- **Waveform** — thin vertical bars (2px) at varied heights; accent when active.
- **Status dots** — small squares/circles; the active one vermillion (masthead, steppers).

---

## 7. Capture Suite — the critical surface

This is the heart of the app. **Read this section carefully; the layout is deliberate.**

### 7.1 Architecture (non-negotiable)

An idea is a **bundle**, captured on **one surface**. These are **GLOBAL to the whole
capture** and live **once**, in a shared **Studio Bar** — never duplicated per block:

- **Tempo, Time signature, Grid, Patch** (the four params)
- **Transport: Play · Restart · Loop**
- **Undo / Redo**

**Note Picker** and **MIDI Record** are **never on screen at the same time.** They share the
Studio Bar and a single surface slot, swapped by **one segmented switch** (`Note Picker |
MIDI Record`). Each tool then shows **only its own local controls**. Do not re-print tempo/
time/grid/patch/transport inside either tool.

> "Grid" is the single shared quantize resolution — it is the same control the note timeline
> and the MIDI take both snap to. It lives in the Studio Bar, not in either tool.

### 7.2 Studio Bar layout (desktop)

Deliberate **two-part** layout — no wrapping into ragged rows, no dead space:

1. **Transport strip** (thin): Play (round) · Restart · Loop on the **left**;
   Undo · Redo on the **right** (`justify-between`).
2. **Parameter ledger**: a **4-column grid** — `Tempo | Time | Grid | Patch` — each with a
   `.label-mono` **above** a full-width field. The grid fills the width evenly.

### 7.3 Note Picker (local controls)

Layout, top → bottom:

1. **Timeline toolbar** — `Bars` stepper (− N +), `Add Bar`, `Clear`. (No quantize, no undo
   here — those are shared.)
2. **Scrolling bar region** — bars are **stacked lanes** that **scroll vertically** in a
   fixed-height container (fade at the bottom edge). Each lane = one bar with a left "BAR n"
   label and right **duplicate / delete** handles. The active bar shows the playhead.
3. **Docked footer** (stays put while bars scroll — separated by a `border-t-2 border-foreground`):
   - **Selected-block bar**: note name + Move ◀▶, Resize −＋, `Edit pitch`, Delete ✕.
   - **Keyboard** (2 octaves on desktop).
   - **Ordered control rows — in this exact priority:**
     1. **Chord** — chips **always visible** with an explicit **`Off`** (single notes).
        No on/off toggle, no popup. `Off · Maj · Min · 7 · m7 · Maj7 · sus2 · sus4 · dim · aug`.
     2. **Octave** — picks 2–5.
     3. **Note length** — picks ¼ ½ 1 2 4.
     4. **Input** — `Preview | Commit` segmented (ghost-confirm vs place-immediately).
     5. **Copy → MIDI Rec** — a **quiet secondary link**, right-aligned, last. (It is the
        lowest-priority control — never bigger than Chord.)

### 7.4 MIDI Record (local controls)

1. **Device row** — connection dot + input `<select>` + "connected"; `Clear take` on the right.
2. **Folded roll** — piano-roll take with a shaded **loop region** and draggable `◤ ◥`
   handles; `Loop start` / `Length` numeric inputs (bar.beat).
3. **Record dock** (`border-t-2 border-foreground`): the **big filled vermillion Record
   button anchors the left** (flips to a pulsing `Stop` while live — `.rec-pulse`, dot goes
   square). To its right, controls **stack tidily** (no floating clusters):
   - `Mode`: `Record | Overdub` segmented.
   - Toggle row: `Count-in` · `Metronome` — hairline divider — `Quantize notes` · `Snap controls`.

### 7.5 Mobile capture

- **Add-bar** of content tools scrolls horizontally (Audio / Import / MIDI / Notes / Photo / File).
- **Instrument switch**: `Notes | MIDI` segmented.
- **Collapsed Studio Bar** = one line: Play · Loop, then a single tappable readout
  **"92 · 4/4 · Bass"** that **IS** the settings trigger (the `⋯`). Tapping it opens the
  **Studio Settings bottom sheet** with the full Tempo / Time / Grid / Patch fields.
  Keep the readout `whitespace-nowrap`; do not let it wrap.
- **Note Picker (mobile):**
  - One compact row above the lane: **`Oct 3`** readout on the left, **`＋ Bar`** on the right.
    **No numbered bar tabs**, no "swipe" hint copy. Octave changes by swiping the keys.
  - Lane (single bar shown, no redundant internal "BAR" label), then **1-octave keyboard**.
  - **Chord chips inline** (horizontal-scroll, always visible, with `Off`) — never a popup/window.
  - **Note length** picks inline.
  - **Input** = full-width `Preview | Commit` (must never run offscreen).
- **MIDI Record (mobile), connected:** device row → roll → full-width Record → full-width
  `Record | Overdub` → a **2×2 toggle grid** (Count-in / Metronome / Quantize / Snap).
- **MIDI Record (mobile), no device:** a real **empty state**, not a caption — dashed panel,
  "No MIDI controller detected", primary **Use on-screen keys**, secondary **Import .mid**,
  ghost **↻ Re-scan**, plus a muted "Web MIDI needs Chrome / Edge" note. Never a dead end.

### 7.6 Save

`Save to Pool` (default, primary) + `Save to Song ›` (reveals song + section pickers).
If opened from a section's "Add Idea", pre-select that song + section.

---

## 8. Library & documentation components

- **Status stepper** — free-jump lifecycle. **Song = 7 stages** (sketch · writing ·
  arranging · production · mixing · mastering · released). **Album = 3 stages** (draft ·
  in-progress · released). Dots on a connecting line; the line fills vermillion up to the
  current step; each dot is clickable; reached dots filled.
- **Album Format** — segmented `Single | LP | EP` (multi-toggle; default EP).
- **Todo ledger** — add row (`What needs doing?` + `mm:ss` + Add), then rows: grip · checkbox ·
  strikethrough-when-done label · timestamp badge · delete.
- **Audio version rows** — play · editable label · "Uploaded {relative time}" · **main-take
  star** (★ single-select) · delete; plus **Upload Audio**.
- **Idea card** — role badge (top-left), **media quick-play cluster** (top-right: one control
  per media type actually present — Note Picker ♪ / MIDI Record ≈ / Extracted MIDI ✦ / Audio ●),
  auto-title ("Bassline — Dm — 92 BPM"), instrument, location badge, presence icons (● ⬡ ▣).
- **References** — three shapes: **text** (autosave textarea), **url** (link), **audio**
  (waveform player). Add panel: `＋ Text` / `＋ URL` / `Import Audio`.
- **Instrument selector** — `<select>` with `None` / existing / `＋ Add New…` (inline create:
  Name + Type).
- **Empty / loading** — dashed hairline boxes ("No X yet…"); a small `.rec-pulse` dot for loading.

---

## 9. Do / Don't

**Do**
- Keep one accent; use vermillion for state (active/selected/recording), not decoration.
- Square everything except true circles.
- Put `.label-mono` on every control label.
- Hoist shared studio params up; keep each tool's local controls minimal.
- Provide real fallbacks (no-device, empty pool) — never dead ends.

**Don't**
- Introduce a second color, rounded cards, or drop shadows (except the window offset).
- Duplicate tempo/time/grid/patch/transport inside Note Picker or MIDI Record.
- Hide chords behind a toggle/popup, or let mobile controls overflow the viewport.
- Give `Copy → MIDI Rec` more weight than chord selection.
- Add an unlayered `*` reset.

---

## 10. Responsive

Desktop-first, target ≥ 1280px with one ~1000px breakpoint. Below it, multi-column ledgers
collapse and the capture surface switches to the mobile patterns in §7.5. All Chrome-only
features (Web MIDI, File System Access) must **degrade gracefully** with the fallbacks above.
