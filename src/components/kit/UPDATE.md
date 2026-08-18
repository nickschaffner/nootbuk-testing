# UI Kit — Update Log (for Cursor)

Pull these into the Nootbuk app. Newest first.

---

## 2026-08-17 · Noise as a reusable base concept

Noise is no longer hard-wired to specific components — it's now a first-class,
reusable primitive that can be applied to any element, now or in the future.

### 1. Single shared grain — `src/index.css`

The grain tile is extracted into a CSS variable so everything reuses the exact
same tooth:

```css
:root {
  --grain-image: url("data:image/svg+xml,…fractalNoise…");
  --grain-size: 140px;
  --grain-blend: overlay;
}
```

Per-element tuning knobs (override on the element or a parent):
`--grain-size`, `--grain-opacity`, `--grain-blend`, `--grain-mask`.

### 2. Standalone utility variants — `src/index.css`

Each is now a **single self-contained class** (previously `.noise-strong` only
worked stacked on `.noise`). Add one class to any solid-fill element:

- `.noise-flat` — uniform full-coverage grain · **the general base**
- `.noise` — feathered toward the top-left corner (letterpress tooth)
- `.noise-strong` — denser, coarser feather for dark/solid fills

### 3. New `<Noise/>` overlay component — `src/components/kit/Noise.tsx`

For elements that can't host a `::after` (images, gradients, video). Drop it
inside any `relative` container:

```tsx
<div className="relative overflow-hidden">
  <img … />
  <Noise variant="flat" over />
</div>
```

Props: `variant` (`flat|feathered|strong`), `over` (sit above content),
`opacity`, `size`, `blend`, `className`. Exported from the barrel.

### 4. Catalog — `KitPage.tsx`

New **K.025 Noise** section: the three utility variants on vermillion, the
`<Noise over>` overlay on a gradient, and grain on muted/card fills, with the
tuning variables documented.

### Files touched
```
src/index.css                     (grain var + standalone noise variants)
src/components/kit/Noise.tsx       (new)
src/components/kit/index.ts        (export Noise)
src/components/kit/KitPage.tsx     (K.025 Noise section)
README.md                          (Noise base-concept docs)
```

Verified: `tsc --noEmit` clean, `vite build` clean. No behavior change to
existing components — they still get their grain, now via the shared variable.

---

## 2026-08-17 · Restore noise + hard vermillion drop shadow

Two signature traits from the design system that were missing in the first kit
pass are now back and reusable.

### 1. New CSS utilities — `src/index.css`

Add these classes (they sit alongside `.noise` / `.focusable`). They are the
canonical way to apply the signature elevation, so reference them by name
rather than re-deriving the box-shadow:

```css
.shadow-hard      { box-shadow: 6px 6px 0 0 var(--primary); }
.shadow-hard-sm   { box-shadow: 4px 4px 0 0 var(--primary); }
.shadow-hard-press {
  box-shadow: 6px 6px 0 0 var(--primary);
  transition: box-shadow .12s ease, transform .12s ease;
}
.shadow-hard-press:hover  { box-shadow: 3px 3px 0 0 var(--primary); transform: translate(2px,2px); }
.shadow-hard-press:active { box-shadow: 1px 1px 0 0 var(--primary); transform: translate(4px,4px); }
```

- `.shadow-hard` — sharp, blur-less vermillion block for **raised surfaces**
  (dialogs, pop-outs, cards on hover). Pair with `border-foreground`.
- `.shadow-hard-sm` — tighter step for smaller elements / hover lifts.
- `.shadow-hard-press` — interactive: the shadow presses in on hover/active so
  the element appears to depress. Use on standalone raised buttons.

> Depth model: **inset wells** (`Recess`, readouts) for recessed things, and the
> **hard vermillion shadow** for raised things. No soft/blurred shadows anywhere.

### 2. `noise` restored on every vermillion fill

The feathered print-grain (`.noise`) is back on all solid vermillion surfaces —
it was silently dropped. Now applied in:

| Component | Where |
|---|---|
| `Button` | `primary` variant fill (also `hover:brightness-110`, was `opacity`) |
| `IconButton` | `solid` variant fill (also `hover:brightness-110`) |
| `RecordButton` | recording state fill |
| `Chip` | `selected` fill |
| `Badge` | `accent` tone fill |
| `StatusStepper` | completed/active segment bars |
| `BeatLane` | active note blocks |
| `Panel` / `Window` | base surface (subtle grain on the card/header) |
| `IdeaCard` | card surface |

### 3. New props / hover states

- **`Panel`** — added `raised?: boolean`. When true: `border-foreground` +
  `.shadow-hard` (+ existing noise). Use for dialogs/pop-outs.
- **`Window`** — added `raised?: boolean` (same behavior); header bar now carries
  noise. Use for the Quick Capture / Export dialog framing.
- **`IdeaCard`** — hover now firms the border to `foreground` and lifts on
  `.shadow-hard-sm` (was a faint border tint only).
- **`TodoRow`, `AudioVersionRow`** — added `hover:border-foreground/60`.

### 4. Catalog page — `KitPage.tsx`

- `K.03 Space · Radius · Elevation` now documents `.shadow-hard` and
  `.shadow-hard-press` with live swatches, and states the two-system depth model.
- `K.07 Surfaces` gains a **Raised surfaces** row showing `<Panel raised>` and
  `<Window raised>`.

### Files touched
```
src/index.css                       (+ 3 shadow utilities)
src/components/kit/Button.tsx
src/components/kit/IconButton.tsx
src/components/kit/RecordButton.tsx
src/components/kit/Chip.tsx
src/components/kit/StatusStepper.tsx
src/components/kit/BeatLane.tsx
src/components/kit/Surfaces.tsx      (Panel/Window `raised` prop)
src/components/kit/IdeaCard.tsx
src/components/kit/TodoRow.tsx
src/components/kit/AudioVersionRow.tsx
src/components/kit/KitPage.tsx
```

Verified: `tsc --noEmit` clean, `vite build` clean.

---

## 2026-08-17 · Initial UI Kit

First drop of the standalone, presentational component library under
`src/components/kit/` — see `README.md` for the full component/prop/option
reference. Barrel export at `index.ts`; live catalog at the **UI Kit** masthead
tab (`#/kit`). Depends on `lucide-react`.
