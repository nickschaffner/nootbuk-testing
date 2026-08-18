# Liner Notes — UI Kit

Standalone, presentational React components for **Nootbuk**. No app logic, no
data layer, no routing — every component takes plain props and renders. Styling
is Tailwind v4 utilities over the Liner Notes design tokens (defined in
`src/index.css`). Icons are [`lucide-react`](https://lucide.dev).

Browse every component, state, and token live at the **UI Kit** tab in the
masthead (route `#/kit`, rendered by `KitPage.tsx`).

## Import

```tsx
import { Button, IdeaCard, StudioBar, IDEA_ROLES } from '@/components/kit'
```

One barrel (`index.ts`) re-exports every component, its prop types, and the
option constants. Individual files also export cleanly if you prefer
(`import { Button } from '@/components/kit/Button'`).

## Conventions

- **Controlled** — stateful controls (`Toggle`, `SegmentedControl`, `Chip`,
  `StatusStepper`, `RecordButton`) take a value + `onChange`/`onClick`. They
  never hold their own state.
- **`className` passthrough** — every component merges an optional `className`
  last, so consumers can override spacing/layout.
- **`forwardRef`** — primitives (`Button`, `IconButton`, `RecordButton`, `Chip`,
  `Pick`, `Input`, `Textarea`, `Checkbox`, `Radio`) forward refs to their root
  DOM node.
- **Tokens, not hex** — colors reference CSS vars via utilities
  (`bg-primary`, `border-hairline`, `text-muted-foreground`). Both light and
  dark modes come for free.
- **Square by default** — `rounded-xs` (2px). Round only for record dots,
  knobs, and radios.
- **Noise + hard shadow** — solid vermillion fills carry noise (feathered
  print grain). Elevation is the signature hard vermillion drop shadow
  (`.shadow-hard`, `.shadow-hard-sm`, `.shadow-hard-press`) — sharp, no blur —
  or inset wells (`Recess`). No soft shadows. All defined in `src/index.css`.

### Noise — the base concept

One grayscale grain tile lives in the `--grain-image` CSS variable
(`src/index.css`) and is reused system-wide, so the tooth always matches.
Three ways to apply it to **any** element:

1. **Utility class** (solid fills that can host a `::after`):
   - `.noise-flat` — uniform full coverage (the general base)
   - `.noise` — feathered toward the top-left corner (letterpress tooth)
   - `.noise-strong` — denser/coarser, for dark or heavy fills
2. **`<Noise/>` component** — an overlay for elements that can't host a
   pseudo-element (images, gradients, video). Place inside a `relative`
   container; pass `over` to sit above content.
3. **Raw variable** — `style={{ backgroundImage: 'var(--grain-image)' }}` for
   bespoke cases.

Tune any of them with `--grain-size`, `--grain-opacity`, `--grain-blend`,
`--grain-mask` (set on the element or a parent).

## Components

### Primitives

| Component | Key props | Notes |
|---|---|---|
| `Button` | `variant` `primary\|secondary\|ghost\|danger\|link`, `size` `sm\|md\|lg`, `icon?` | Text action. Forwards `<button>` props. |
| `IconButton` | `shape` `square\|round`, `variant` `solid\|outline\|ghost`, `size` `sm\|md\|lg`, `aria-label` (required) | Single-glyph action; pass one icon as children. |
| `PlayButton` | `playing`, `size` `sm\|md\|lg` | Round vermillion play/pause. Hollow keys-black triangle. |
| `RecordButton` | `recording`, `size` `md\|lg`, `shape` `round\|square` | Idle dot → stop square with pulse. |

### Selection

| Component | Key props | Notes |
|---|---|---|
| `SegmentedControl` | `options: Option[]`, `value`, `onChange`, `size`, `block` | Mutually-exclusive; active segment fills vermillion. |
| `Toggle` | `checked`, `onChange`, `label?`, `disabled?` | Hardware-style switch. |
| `Chip` | `selected?`, `tone` `default\|accent`, `onClick` | Selectable tag (roles, intents, chords). |
| `Badge` | `tone` `neutral\|accent\|outline` | Non-interactive status tag. |
| `Length` | children (`mm:ss`) | Outline duration chip. Use everywhere a length or playhead time is shown. |
| `Pick` | `options: Option[]`, `label?`, `placeholder?` | Native `<select>` in the ledger idiom. |

### Forms

| Component | Key props | Notes |
|---|---|---|
| `Field` | `label`, `htmlFor?`, `hint?` | Mono label + control wrapper. |
| `MonoLabel` | `htmlFor?` | Uppercase tracked eyebrow. |
| `Input` / `Textarea` | native props | Square-cornered fields. |
| `SearchBar` | native input props | Leading search icon in a `bg-panel` box, flush against the field. One hairline frame. |
| `Checkbox` / `Radio` | native props + `label?` | Swiss square check / round radio. |

### Surfaces

| Component | Key props | Notes |
|---|---|---|
| `Noise` | `variant` `flat\|feathered\|strong`, `over?`, `opacity?`, `size?`, `blend?` | Grain overlay for elements that can't host `::after` (images, gradients). Drop inside a `relative` container. |
| `Panel` | `as?` `div\|section\|article`, `raised?` `true\|'noise'` | Hairline-framed card (subtle noise). `raised` → vermillion hard shadow. `raised="noise"` → inverse fill + grain drop. |
| `Recess` | — | Inset well (readouts, rolls). |
| `Window` | `title`, `right?`, `raised?` | Titled panel with mono header bar. `raised` → dialog framing. |
| `RedBar` | `grain?`, `height?` | Vermillion divider rule. |
| `RuleHeader` | `title`, `subtitle?` | Vermillion mono title + 1px rule. Optional muted subtitle on the right. Light/dark via tokens. |
| `EmptyState` | `icon?`, `title`, `hint?`, `action?` | Placeholder for empty pools/sections. |

### Studio

| Component | Key props | Notes |
|---|---|---|
| `StudioBar` | `playing`, `loop`, `tempo`, `timeSig`, `grid`, `patch` + `on*` handlers | Shared transport + Time/Tempo/Grid/Patch ledger. |
| `OnScreenKeyboard` | `octave`, `octaves`, `highlighted: string[]`, `onNote` | Chromatic keyboard; highlight by `"C#4"`. |
| `BeatLane` | `beats`, `blocks: BeatBlock[]`, `label?` | One bar of the mini piano-roll. `BeatBlock = { start, width, label?, active? }`. |

### Library

| Component | Key props | Notes |
|---|---|---|
| `StatusStepper` | `stages: Option[]`, `value`, `onChange?` | Fills up to the active stage. Song = 7 stages, album = 3. |
| `Menu` | `items: MenuOption[]`, `align?`, `label?`, `trigger?` | Portal overlay. Inverse Panel with `.shadow-noise` grain drop. One enabled item → that action's icon instead of ⋯. |
| `IdeaCard` | `role`, `title`, `instrument?`, `location?`, `timestamp?`, `media?: MediaKind[]`, `onPlay?`, `onMenu?` | Pool atom. `MediaKind = 'audio'\|'midi'\|'image'`. |
| `SongCard` | `title`, `status`, `todoCount?`, `length?`, `lastWorked?`, `artwork?`, `playing?`, `onPlay?`, `menuItems?`, `onOpen?` | Figma variant 3 only. Inset square cover (`p-3` `gap-3`), `shadow-hard`. To-do chip omitted at 0. `Length` + `PlayButton`. |
| `AlbumCard` | `title`, `status`, `trackCount`, `timestamp?`, `artworkUrl?`, `menuItems?`, `onOpen?` | Same shell as SongCard. Outline chip is track count (hidden at 0). Play and length omitted. |
| `EmptyLibraryCard` | `label?`, `onCreate?` | Dashed slot matching card height. CTA when `label` + `onCreate` are set. |
| `TodoRow` | `text`, `completed?`, `timestamp?`, `onToggle?`, `onDelete?` | Production to-do. Playhead time uses `Length`. |
| `AudioVersionRow` | `label`, `filename?`, `duration?`, `isMain?`, `playing?` + `on*` | Saved take/version. `Length` then play. |

### Table

| Component | Key props | Notes |
|---|---|---|
| `Table` | `sort?`, `onSort?` | Agnostic hairline grid. Parent owns data + sort. |
| `TableHead` | `column?` | Text label → sortable (click toggles asc/desc). Empty / non-text heads are not. `column` defaults to the label. |
| `TableHeader` / `TableBody` / `TableRow` / `TableCell` | | Row hover. Clickable when `onClick` is set. |
| `TableActions` | `children` | Right-packed cluster. |
| `IdeaRow` | `role`, `title`, `ideaKey?`, `tempo?`, `lastWorked?`, `plays?`, `menuItems?`, `onOpen?` | Pool line on top of Table. Use `ideaKey` (not `key`). |

## Option constants

`options.ts` mirrors the working app's enums so selectors offer identical
choices. Each is an `Option[]` (`{ value, label }`):

`IDEA_ROLES` · `SECTION_INTENTS` · `IDEA_STATUSES` · `SONG_STATUSES` ·
`ALBUM_STATUSES` · `ALBUM_FORMATS` · `CHORD_TYPES` · `SYNTH_PATCHES` ·
`INSTRUMENT_TYPES` · `QUANTIZE_OPTIONS` · `BLOCK_WIDTHS` · `TIME_SIGNATURES` ·
`KEY_ROOTS` · `KEY_MODES`. Plus `WHITE_NOTES` / `BLACK_NOTES` for keyboards.

```tsx
import { SegmentedControl, IDEA_ROLES } from '@/components/kit'

<SegmentedControl options={IDEA_ROLES} value={role} onChange={setRole} />
```

## Examples

```tsx
// A pool card
<IdeaCard
  role="Bassline"
  title="Bassline — Dm — 92 BPM"
  instrument="Jazz Bass"
  location="Pool"
  timestamp="2h ago"
  media={['audio', 'midi']}
  onPlay={play}
/>

// A pool row
<Table sort={sort} onSort={setSort}>
  <TableHeader>
    <TableRow>
      <TableHead column="role">Role</TableHead>
      <TableHead column="title">Title</TableHead>
      <TableHead column="key">Key</TableHead>
      <TableHead column="tempo">BPM</TableHead>
      <TableHead column="updated">Updated</TableHead>
      <TableHead />
    </TableRow>
  </TableHeader>
  <TableBody>
    <IdeaRow
      role="Bassline"
      title="Bassline — Dm — 92 BPM"
      ideaKey="Dm"
      tempo={92}
      lastWorked="2h ago"
      plays={plays}
      menuItems={items}
      onOpen={open}
    />
  </TableBody>
</Table>

// The capture transport
<StudioBar
  playing={playing}
  tempo={tempo}
  grid={grid}
  patch={patch}
  onPlayToggle={togglePlay}
  onTempoChange={setTempo}
  onGridChange={setGrid}
  onPatchChange={setPatch}
/>

// Manual note entry
<OnScreenKeyboard octave={4} highlighted={notes} onNote={toggleNote} />
```
