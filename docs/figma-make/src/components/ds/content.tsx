import { useState } from 'react'
import { MonoLabel, Panel, SectionHead, Specimen } from './primitives'
import { CHORD_TYPES, NOTE_NAMES, isBlackKey, type NoteName } from '../../lib/notes'

// ── Waveform thumbnail (deterministic bars) ──────────────────────────────────
function Waveform({ n = 40, accent = false }: { n?: number; accent?: boolean }) {
  const bars = Array.from({ length: n }, (_, i) => 20 + Math.abs(Math.sin(i * 1.7) * 80))
  return (
    <div className="flex h-8 items-center gap-[2px]" aria-hidden>
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[2px]"
          style={{
            height: `${h}%`,
            backgroundColor: accent ? 'var(--primary)' : 'var(--muted-foreground)',
          }}
        />
      ))}
    </div>
  )
}

function PlayBtn() {
  const [playing, setPlaying] = useState(false)
  return (
    <button
      onClick={() => setPlaying((p) => !p)}
      aria-label="Play"
      className="focusable flex h-8 w-8 shrink-0 items-center justify-center border border-foreground text-foreground transition-colors hover:bg-primary hover:border-primary hover:text-primary-foreground"
    >
      <span className="text-[10px] leading-none">{playing ? '■' : '▶'}</span>
    </button>
  )
}

// ── Idea card ────────────────────────────────────────────────────────────────
function IdeaCard({
  role,
  title,
  media,
  time,
}: {
  role: string
  title: string
  media: React.ReactNode
  time: string
}) {
  return (
    <Panel className="noise group p-4 transition-colors hover:border-foreground">
      <div className="flex items-start justify-between gap-3">
        <span className="border border-foreground px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
          {role}
        </span>
        <MonoLabel>{time}</MonoLabel>
      </div>
      <p className="mt-3 text-sm font-bold">{title}</p>
      <div className="mt-3 flex items-center gap-3">
        <PlayBtn />
        <div className="min-w-0 flex-1">{media}</div>
      </div>
    </Panel>
  )
}

// ── Song row ─────────────────────────────────────────────────────────────────
function SongRow({ n, title, status, key_, tempo, time }: Record<string, string>) {
  return (
    <div className="focusable grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-hairline py-3 last:border-b-0 hover:bg-muted/40">
      <span className="label-mono text-primary">{n}</span>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <MonoLabel>
          {key_} · {tempo} BPM
        </MonoLabel>
      </div>
      <div className="text-right">
        <span className="border border-hairline px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          {status}
        </span>
        <p className="label-mono mt-1">{time}</p>
      </div>
    </div>
  )
}

// ── Section container (collapsible) ──────────────────────────────────────────
function SectionBlock() {
  const [open, setOpen] = useState(true)
  return (
    <Panel>
      <button
        onClick={() => setOpen((o) => !o)}
        className="focusable flex w-full items-center gap-3 border-b border-hairline px-4 py-3 text-left"
      >
        <span className="label-mono text-muted-foreground">⣿</span>
        <span className="font-display text-sm font-extrabold uppercase tracking-wide">Verse 1</span>
        <MonoLabel className="ml-auto">{open ? '2 IDEAS ▾' : '2 IDEAS ▸'}</MonoLabel>
      </button>
      {open ? (
        <div className="space-y-2 p-3">
          <div className="flex items-center gap-3 border border-hairline bg-card px-3 py-2">
            <PlayBtn />
            <span className="border border-foreground px-1.5 py-0.5 text-[10px] font-bold uppercase">
              Bassline
            </span>
            <span className="truncate text-sm font-semibold">Bassline — Dm — 92 BPM</span>
            <MonoLabel className="ml-auto">14 NOTES</MonoLabel>
          </div>
          <div className="flex items-center gap-3 border border-hairline bg-card px-3 py-2">
            <PlayBtn />
            <span className="border border-foreground px-1.5 py-0.5 text-[10px] font-bold uppercase">
              Vocal
            </span>
            <span className="truncate text-sm font-semibold">“How many times…”</span>
            <MonoLabel className="ml-auto">LYRIC</MonoLabel>
          </div>
          <button className="focusable w-full border border-dashed border-hairline py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:border-foreground hover:text-foreground">
            + Add Idea
          </button>
        </div>
      ) : null}
    </Panel>
  )
}

// ── Capture tabs ─────────────────────────────────────────────────────────────
const CAPTURE_MODES = ['Audio', 'MIDI', 'Notes', 'Text', 'Photo'] as const

function CaptureTabs() {
  const [mode, setMode] = useState<(typeof CAPTURE_MODES)[number]>('Notes')
  return (
    <div>
      <div className="flex border border-foreground">
        {CAPTURE_MODES.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`focusable flex-1 border-r border-foreground px-2 py-2 text-xs font-bold uppercase tracking-wider last:border-r-0 transition-colors ${
              mode === m ? 'bg-foreground text-background' : 'hover:bg-muted'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="mt-4 min-h-24 border border-hairline bg-panel p-4">
        {mode === 'Notes' ? (
          <NotePicker />
        ) : (
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{mode}</span> capture surface —{' '}
            {mode === 'Audio'
              ? 'one-tap record with live waveform.'
              : mode === 'MIDI'
                ? 'device auto-detect, patch select, metronome.'
                : mode === 'Text'
                  ? 'freeform lyric / description field.'
                  : 'file picker · camera trigger (mobile, later).'}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Note picker ──────────────────────────────────────────────────────────────
function NotePicker() {
  const [octave, setOctave] = useState(3)
  const [seq, setSeq] = useState<string[]>(['C3', 'F3', 'G#3', 'G3'])
  const [chord, setChord] = useState<string | null>(null)
  const add = (name: NoteName) => setSeq((s) => [...s, `${chord ? name + chord : name + octave}`])
  return (
    <div className="space-y-3">
      {/* keyboard */}
      <div className="flex h-24 overflow-hidden border border-foreground">
        {NOTE_NAMES.map((name) => {
          const black = isBlackKey(name)
          return (
            <button
              key={name}
              onClick={() => add(name)}
              aria-label={`${name}${octave}`}
              className={`focusable flex flex-1 items-end justify-center border-r border-hairline pb-1 text-[9px] font-bold last:border-r-0 transition-colors hover:bg-primary hover:text-primary-foreground ${
                black ? 'text-keys-white' : 'text-keys-black'
              }`}
              style={{ backgroundColor: black ? 'var(--keys-black)' : 'var(--keys-white)' }}
            >
              {name}
            </button>
          )
        })}
      </div>
      {/* octave + chord */}
      <div className="flex flex-wrap items-center gap-2">
        <MonoLabel>Oct</MonoLabel>
        {[2, 3, 4, 5].map((o) => (
          <button
            key={o}
            onClick={() => setOctave(o)}
            className={`focusable h-6 w-6 border text-xs font-bold ${
              octave === o ? 'border-primary bg-primary text-primary-foreground' : 'border-hairline'
            }`}
          >
            {o}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-hairline" />
        <MonoLabel>Chord</MonoLabel>
        {CHORD_TYPES.map((c) => (
          <button
            key={c}
            onClick={() => setChord((cur) => (cur === c ? null : c))}
            className={`focusable border px-2 py-1 text-[10px] font-bold uppercase ${
              chord === c ? 'border-primary bg-primary text-primary-foreground' : 'border-hairline text-muted-foreground'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      {/* sequence */}
      <div className="flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
        <PlayBtn />
        {seq.map((s, i) => (
          <span key={i} className="border border-foreground px-2 py-1 text-xs font-bold">
            {s}
          </span>
        ))}
        {seq.length ? (
          <button
            onClick={() => setSeq([])}
            className="focusable ml-auto text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  )
}

// ── Mini piano-roll (read-only) ──────────────────────────────────────────────
function PianoRoll() {
  const notes = [
    { p: 2, t: 0, d: 2 },
    { p: 5, t: 2, d: 1 },
    { p: 8, t: 3, d: 2 },
    { p: 4, t: 5, d: 1 },
    { p: 7, t: 6, d: 3 },
    { p: 1, t: 9, d: 2 },
  ]
  const rows = 10
  const cols = 12
  return (
    <div
      className="relative border border-hairline bg-panel"
      style={{
        height: rows * 14,
        backgroundImage:
          'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
        backgroundSize: `${100 / cols}% 14px`,
      }}
    >
      {notes.map((n, i) => (
        <span
          key={i}
          className="noise absolute bg-primary"
          style={{
            top: n.p * 14 + 2,
            left: `${(n.t / cols) * 100}%`,
            width: `${(n.d / cols) * 100}%`,
            height: 10,
          }}
        />
      ))}
    </div>
  )
}

// ── Transport / waveform player ──────────────────────────────────────────────
function Transport() {
  const [playing, setPlaying] = useState(false)
  return (
    <Panel className="p-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="focusable flex h-11 w-11 items-center justify-center rounded-full border-2 border-foreground hover:bg-primary hover:border-primary hover:text-primary-foreground"
          aria-label={playing ? 'Stop' : 'Play'}
        >
          <span className="text-xs">{playing ? '■' : '▶'}</span>
        </button>
        <div className="flex-1">
          <Waveform n={60} accent={playing} />
        </div>
        <div className="text-right">
          <p className="label-mono text-foreground">00:12 / 00:31</p>
          <MonoLabel>44.1k · WAV</MonoLabel>
        </div>
      </div>
      <div className="mt-3 h-1 w-full bg-muted">
        <span className="block h-full bg-primary" style={{ width: playing ? '38%' : '0%' }} />
      </div>
    </Panel>
  )
}

// ── Dialog shells ────────────────────────────────────────────────────────────
function DialogShell({ title, kicker, children }: { title: string; kicker: string; children: React.ReactNode }) {
  return (
    <div className="border border-foreground bg-card shadow-[6px_6px_0_0_var(--primary)]">
      <div className="flex items-center justify-between border-b border-foreground px-4 py-3">
        <div className="flex items-baseline gap-3">
          <MonoLabel className="text-primary">{kicker}</MonoLabel>
          <span className="font-display text-sm font-extrabold uppercase tracking-wide">{title}</span>
        </div>
        <button className="focusable text-sm" aria-label="Close">
          ✕
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export default function Content() {
  return (
    <section id="content" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <SectionHead no="03" title="Composed" kicker="Cards · Capture · Playback" />
      <div className="space-y-14">
        <Specimen index="03.1" name="Idea cards & pool" note="Auto-titled captures">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <IdeaCard
              role="Bassline"
              title="Bassline — Dm — 92 BPM"
              media={<Waveform accent />}
              time="2 HRS AGO"
            />
            <IdeaCard
              role="Chords"
              title="Chord progression — C"
              media={<MonoLabel className="text-foreground">MIDI · 8 NOTES</MonoLabel>}
              time="YESTERDAY"
            />
            <IdeaCard
              role="Riff"
              title="Casio riff — G#2 idea"
              media={<MonoLabel className="text-foreground">NOTES · 4 · + 1 IMG</MonoLabel>}
              time="3 DAYS AGO"
            />
          </div>
        </Specimen>

        <Specimen index="03.2" name="Song workspace pieces" note="Sections · recent songs">
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionBlock />
            <Panel className="p-4">
              <MonoLabel>Recent songs</MonoLabel>
              <div className="mt-2">
                <SongRow n="01" title="The Show" status="Production" key_="C" tempo="100" time="1 HR" />
                <SongRow n="02" title="Totoroids" status="Mixing" key_="Am" tempo="128" time="2 DAYS" />
                <SongRow n="03" title="Les Fleurs (idea)" status="Sketch" key_="F#" tempo="84" time="1 WK" />
              </div>
            </Panel>
          </div>
        </Specimen>

        <Specimen index="03.3" name="Quick capture" note="Segmented modes · note picker">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <CaptureTabs />
            <div className="space-y-3">
              <MonoLabel>Extracted MIDI — read-only</MonoLabel>
              <PianoRoll />
              <Transport />
            </div>
          </div>
        </Specimen>

        <Specimen index="03.4" name="Overlays" note="Quick Capture · Export dialogs">
          <div className="grid gap-6 lg:grid-cols-2">
            <DialogShell kicker="NEW" title="Quick Capture">
              <div className="space-y-3">
                <Waveform n={50} accent />
                <div className="flex gap-2">
                  <span className="border border-primary bg-primary px-2 py-1 text-[10px] font-bold uppercase text-primary-foreground">
                    Bassline
                  </span>
                  <span className="border border-hairline px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">
                    Verse
                  </span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button className="noise flex-1 bg-primary px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                    Save to Pool
                  </button>
                  <button className="border border-foreground px-3 py-2 text-xs font-bold uppercase tracking-wider">
                    Save to Song ›
                  </button>
                </div>
              </div>
            </DialogShell>
            <DialogShell kicker="OUT" title="Export — The Show">
              <div className="space-y-1 border border-hairline bg-panel p-3 font-mono text-xs">
                <p className="text-muted-foreground">/The Show/</p>
                <p className="pl-3">midi/verse-bassline-001.mid</p>
                <p className="pl-3">audio/chorus-brass-001.wav</p>
                <p className="pl-3">images/pedal-board-001.jpg</p>
                <p className="pl-3 text-primary">notes/liner-notes.md</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <MonoLabel>4 MIDI · 2 AUDIO · 3 IMG</MonoLabel>
                <button className="noise bg-primary px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                  Save to Folder
                </button>
              </div>
            </DialogShell>
          </div>
        </Specimen>

        <Specimen index="03.5" name="Ledger table" note="Album track listing">
          <Panel className="overflow-hidden">
            <div className="grid grid-cols-[3rem_1fr_8rem_5rem] border-b border-foreground bg-foreground text-background">
              {['#', 'Title', 'Status', 'Key'].map((h) => (
                <span key={h} className="label-mono px-3 py-2 text-background">
                  {h}
                </span>
              ))}
            </div>
            {[
              ['1', 'Overture', 'Released', 'C'],
              ['2', 'The Show', 'Production', 'C'],
              ['3', 'Totoroids', 'Mixing', 'Am'],
              ['4', 'Honky Tonk', 'Writing', 'G'],
            ].map((r) => (
              <div
                key={r[0]}
                className="grid grid-cols-[3rem_1fr_8rem_5rem] border-b border-hairline last:border-b-0"
              >
                <span className="label-mono px-3 py-2.5 text-primary">{r[0]}</span>
                <span className="px-3 py-2.5 text-sm font-semibold">{r[1]}</span>
                <span className="label-mono px-3 py-2.5 text-foreground">{r[2]}</span>
                <span className="px-3 py-2.5 text-sm font-semibold">{r[3]}</span>
              </div>
            ))}
          </Panel>
        </Specimen>
      </div>
    </section>
  )
}
