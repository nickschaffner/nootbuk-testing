import { useState } from 'react'
import { MonoLabel, Panel, SectionHead, Specimen } from './primitives'
import { PATCHES } from '../../lib/notes'

const ROLES = ['Melody', 'Bassline', 'Chords', 'Drums', 'Riff', 'Synth', 'Vocal', 'Texture', 'Sample', 'Other']
const SECTIONS = ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Solo', 'Breakdown', 'Outro']
const IDEA_STATUS = ['Raw', 'Developed', 'Used', 'Archived']
const SONG_STATUS = ['Sketch', 'Writing', 'Arranging', 'Production', 'Mixing', 'Mastering', 'Released']

// ── Buttons ──────────────────────────────────────────────────────────────
function Btn({
  children,
  variant = 'primary',
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
}) {
  const base =
    'focusable inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors'
  const styles = {
    primary: 'noise bg-primary text-primary-foreground hover:brightness-110',
    secondary:
      'border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background',
    ghost: 'text-muted-foreground hover:text-foreground',
  }[variant]
  return <button className={`${base} ${styles}`}>{children}</button>
}

// ── Record button ──────────────────────────────────────────────────────────
function RecordButton() {
  const [rec, setRec] = useState(false)
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => setRec((r) => !r)}
        className="focusable flex h-16 w-16 items-center justify-center rounded-full border-2 border-foreground transition-colors"
        aria-pressed={rec}
        aria-label="Record"
      >
        <span
          className={`noise bg-primary transition-all ${rec ? 'rec-pulse h-5 w-5 rounded-[2px]' : 'h-9 w-9 rounded-full'}`}
        />
      </button>
      <div>
        <MonoLabel>{rec ? '● Recording' : 'Tap to record'}</MonoLabel>
        <p className="text-sm font-semibold">{rec ? '00:04.1' : 'Audio capture'}</p>
      </div>
    </div>
  )
}

// ── Pill selector (single select) ───────────────────────────────────────────
function PillGroup({ items, initial }: { items: string[]; initial?: string }) {
  const [sel, setSel] = useState(initial ?? items[0])
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const active = it === sel
        return (
          <button
            key={it}
            onClick={() => setSel(it)}
            className={`focusable border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-hairline text-muted-foreground hover:border-foreground hover:text-foreground'
            }`}
          >
            {it}
          </button>
        )
      })}
    </div>
  )
}

// ── Status badge (dot + label, ledger style) ────────────────────────────────
function StatusRow({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {items.map((s, i) => (
        <span key={s} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5"
            style={{
              backgroundColor:
                i === items.length - 1 ? 'var(--primary)' : 'var(--foreground)',
              opacity: 0.35 + (0.65 * i) / (items.length - 1),
            }}
          />
          <MonoLabel className="text-foreground">{s}</MonoLabel>
        </span>
      ))}
    </div>
  )
}

// ── Toggle switch (square, hardware) ─────────────────────────────────────────
function Switch({ label, initial = false }: { label: string; initial?: boolean }) {
  const [on, setOn] = useState(initial)
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        onClick={() => setOn((o) => !o)}
        aria-pressed={on}
        className={`focusable relative h-7 w-12 border transition-colors ${
          on ? 'border-primary bg-primary/15' : 'border-hairline bg-muted'
        }`}
      >
        <span
          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 transition-all ${
            on ? 'right-1 bg-primary' : 'left-1 bg-foreground'
          }`}
        />
      </button>
      <MonoLabel className="text-foreground">{label}</MonoLabel>
    </label>
  )
}

// ── Faders + Knobs + VU (hardware controls) ──────────────────────────────────
function Fader({ value }: { value: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-32 w-6 border border-hairline">
        <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-hairline" />
        <span
          className="absolute left-1/2 h-3 w-5 -translate-x-1/2 border border-foreground bg-foreground"
          style={{ bottom: `calc(${value}% - 6px)` }}
        />
      </div>
      <MonoLabel>{value}</MonoLabel>
    </div>
  )
}

function Knob({ deg, label }: { deg: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="noise noise-strong relative h-14 w-14 rounded-full border-2 border-foreground bg-foreground">
        <span
          className="absolute left-1/2 top-1 h-5 w-0.5 origin-bottom bg-background"
          style={{ transform: `translateX(-50%) rotate(${deg}deg)`, transformOrigin: 'bottom center' }}
        />
      </div>
      <MonoLabel>{label}</MonoLabel>
    </div>
  )
}

function VuMeter() {
  const bars = [70, 45, 88, 60, 95, 52, 78, 40, 66, 82]
  return (
    <div className="flex h-32 items-end gap-1.5 border border-hairline bg-panel px-3 py-2">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-2"
          style={{
            height: `${h}%`,
            backgroundColor: h > 85 ? 'var(--primary)' : 'var(--meter)',
          }}
        />
      ))}
    </div>
  )
}

// ── Patch selector (dropdown, open state shown) ──────────────────────────────
function PatchSelect() {
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState<string>('Bass')
  return (
    <div className="relative w-56">
      <button
        onClick={() => setOpen((o) => !o)}
        className="focusable flex w-full items-center justify-between border border-foreground bg-card px-3 py-2 text-sm font-semibold"
      >
        <span>{sel}</span>
        <span className="label-mono text-primary">{open ? '▲' : '▼'}</span>
      </button>
      {open ? (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto border border-foreground bg-card">
          {PATCHES.map((p) => (
            <li key={p}>
              <button
                onClick={() => {
                  setSel(p)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-primary hover:text-primary-foreground ${
                  p === sel ? 'text-primary' : ''
                }`}
              >
                {p}
                {p === sel ? <span className="label-mono">●</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export default function Controls() {
  return (
    <section id="controls" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <SectionHead no="02" title="Controls" kicker="Actions · Inputs · Hardware" />
      <div className="space-y-14">
        <Specimen index="02.1" name="Buttons" note="One accent, square corners">
          <div className="flex flex-wrap items-center gap-4">
            <Btn variant="primary">Save to Pool</Btn>
            <Btn variant="secondary">Save to Song ›</Btn>
            <Btn variant="ghost">Discard</Btn>
            <span className="mx-2 h-8 w-px bg-hairline" />
            <RecordButton />
          </div>
        </Specimen>

        <Specimen index="02.2" name="Inputs" note="Text · inline metadata · patch settings">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <label className="block">
                <MonoLabel>Instrument name</MonoLabel>
                <input
                  defaultValue="Danelectro Longhorn"
                  className="focusable mt-1 w-full border border-hairline bg-card px-3 py-2 text-sm focus:border-foreground"
                />
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Key', 'Dm'],
                  ['Tempo', '92'],
                  ['Time', '4/4'],
                ].map(([l, v]) => (
                  <label key={l} className="block">
                    <MonoLabel>{l}</MonoLabel>
                    <input
                      defaultValue={v}
                      className="focusable mt-1 w-full border border-hairline bg-card px-2 py-2 text-center text-sm font-semibold focus:border-foreground"
                    />
                  </label>
                ))}
              </div>
              <label className="block">
                <MonoLabel>Notes</MonoLabel>
                <textarea
                  rows={2}
                  defaultValue="Play with a pick near the bridge — dark and sparse."
                  className="focusable mt-1 w-full resize-none border border-hairline bg-card px-3 py-2 text-sm focus:border-foreground"
                />
              </label>
            </div>
            <Panel className="p-4">
              <MonoLabel>Patch settings — key / value</MonoLabel>
              <div className="mt-3 divide-y divide-hairline border border-hairline">
                {[
                  ['REV', '1'],
                  ['CHORUS', '1'],
                  ['DELAY', 'OFF'],
                  ['STRUM', '2'],
                ].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-2">
                    <span className="label-mono border-r border-hairline px-3 py-2 text-foreground">
                      {k}
                    </span>
                    <span className="px-3 py-2 text-sm font-semibold">{v}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </Specimen>

        <Specimen index="02.3" name="Selectors" note="Role · Section intent — single-select">
          <div className="space-y-5">
            <div>
              <MonoLabel>Role</MonoLabel>
              <div className="mt-2">
                <PillGroup items={ROLES} initial="Bassline" />
              </div>
            </div>
            <div>
              <MonoLabel>Section intent</MonoLabel>
              <div className="mt-2">
                <PillGroup items={SECTIONS} initial="Verse" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-8 pt-2">
              <Switch label="Metronome" initial />
              <Switch label="Bluetooth MIDI" />
              <PatchSelect />
            </div>
          </div>
        </Specimen>

        <Specimen index="02.4" name="Status" note="Idea lifecycle · Song lifecycle">
          <div className="space-y-5">
            <div>
              <MonoLabel>Idea status</MonoLabel>
              <div className="mt-2">
                <StatusRow items={IDEA_STATUS} />
              </div>
            </div>
            <div>
              <MonoLabel>Song status</MonoLabel>
              <div className="mt-2">
                <StatusRow items={SONG_STATUS} />
              </div>
            </div>
          </div>
        </Specimen>

        <Specimen index="02.5" name="Hardware" note="Faders · knobs · VU — playback & mix">
          <Panel className="p-6">
            <div className="flex flex-wrap items-end gap-x-10 gap-y-6">
              <div className="flex gap-4">
                <Fader value={72} />
                <Fader value={54} />
                <Fader value={38} />
                <Fader value={61} />
              </div>
              <div className="flex gap-5">
                <Knob deg={-40} label="Rev" />
                <Knob deg={20} label="Tone" />
                <Knob deg={110} label="Drive" />
              </div>
              <div>
                <MonoLabel>Output</MonoLabel>
                <div className="mt-2">
                  <VuMeter />
                </div>
              </div>
            </div>
          </Panel>
        </Specimen>
      </div>
    </section>
  )
}
