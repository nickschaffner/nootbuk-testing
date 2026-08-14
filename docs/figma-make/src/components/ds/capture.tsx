import { useState } from 'react'
import { MonoLabel, SectionHead, Specimen } from './primitives'
import { CHORD_TYPES, NOTE_NAMES, PATCHES, isBlackKey } from '../../lib/notes'

/* ============================================================
   SECTION 04 — CAPTURE SUITE
   One idea, one surface. Tempo, time signature, GRID, patch, the
   transport (play / restart / loop) and undo / redo are GLOBAL to
   the whole capture — they live once in a shared Studio Bar, not
   reprinted inside every block. Because Note Picker and MIDI Record
   are never on screen at once, one segmented switch swaps between
   them beneath that bar; each tool shows only its own local tools.
   ============================================================ */

const GRID_STEPS = ['1 beat', '1/2 beat', '1/4 beat', '1/8 beat', '1/16 beat']
const TIME_SIGS = ['4/4', '3/4', '6/8', '5/4', '7/8']
const CHORD_OPTS = ['Off', ...CHORD_TYPES]
const LENGTHS = ['¼', '½', '1', '2', '4']

// ── Frames ───────────────────────────────────────────────────────────────────
function WindowFrame({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <figure className={`min-w-0 ${className}`}>
      <figcaption className="mb-2 flex items-center gap-2">
        <span className="h-1.5 w-1.5 bg-primary" />
        <MonoLabel className="text-foreground">{label}</MonoLabel>
      </figcaption>
      <div className="overflow-hidden border border-foreground bg-card shadow-[6px_6px_0_0_var(--primary)]">{children}</div>
    </figure>
  )
}
function PhoneFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure className="shrink-0">
      <figcaption className="mb-2 flex items-center gap-2">
        <span className="h-1.5 w-1.5 bg-primary" />
        <MonoLabel className="text-foreground">{label}</MonoLabel>
      </figcaption>
      <div className="relative w-[304px] overflow-hidden rounded-[18px] border-[6px] border-foreground bg-card">
        <div className="flex items-center justify-center border-b border-hairline bg-background py-1.5">
          <span className="h-1 w-10 rounded-full bg-hairline" />
        </div>
        {children}
      </div>
    </figure>
  )
}

// ── Atoms ─────────────────────────────────────────────────────────────────────
function Seg({ options, value, onChange, className = '', size = 'sm' }: { options: string[]; value: string; onChange: (v: string) => void; className?: string; size?: 'sm' | 'lg' }) {
  return (
    <div className={`inline-flex border border-foreground ${className}`}>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`focusable flex-1 whitespace-nowrap border-r border-foreground font-bold uppercase tracking-wide last:border-r-0 transition-colors ${
            size === 'lg' ? 'px-3 py-2 text-xs' : 'px-2.5 py-1 text-[10px]'
          } ${value === o ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}
function Tog({ children, on, onClick, className = '' }: { children: React.ReactNode; on?: boolean; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`focusable whitespace-nowrap border px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${className} ${
        on ? 'border-primary bg-primary text-primary-foreground' : 'border-hairline text-muted-foreground hover:border-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
function Ico({ children, active, label, className = '' }: { children: React.ReactNode; active?: boolean; label?: string; className?: string }) {
  return (
    <button
      aria-label={label}
      className={`focusable flex h-7 w-7 items-center justify-center border text-xs transition-colors ${className} ${
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-hairline hover:border-foreground'
      }`}
    >
      {children}
    </button>
  )
}
// small square pick button used for octave / note-length groups
function Pick({ children, active, label }: { children: React.ReactNode; active?: boolean; label?: string }) {
  return (
    <button aria-label={label} className={`focusable h-7 min-w-7 border px-1.5 text-xs font-bold ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-hairline hover:border-foreground'}`}>{children}</button>
  )
}
function Chip({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span className={`whitespace-nowrap border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-hairline text-muted-foreground'}`}>{children}</span>
  )
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <MonoLabel>{label}</MonoLabel>
      <input defaultValue={value} className="focusable mt-1 w-full border border-hairline bg-card px-2 py-1.5 text-center text-sm font-semibold focus:border-foreground" />
    </label>
  )
}
function Waveform({ n = 40, accent = false }: { n?: number; accent?: boolean }) {
  const bars = Array.from({ length: n }, (_, i) => 18 + Math.abs(Math.sin(i * 1.7) * 82))
  return (
    <div className="flex h-8 items-center gap-[2px]" aria-hidden>
      {bars.map((h, i) => <span key={i} className="w-[2px]" style={{ height: `${h}%`, backgroundColor: accent ? 'var(--primary)' : 'var(--muted-foreground)' }} />)}
    </div>
  )
}

/* ── GLOBAL Studio Bar ─────────────────────────────────────────────────────────
   Deliberate two-part layout: a thin transport strip (play/restart/loop left,
   undo/redo right), then a 4-column parameter ledger that fills the width evenly.
   No ragged wrapping, no dead space.                                              */
function StudioBar() {
  const [playing, setPlaying] = useState(false)
  const [loop, setLoop] = useState(true)
  return (
    <div className="border border-foreground bg-panel">
      <div className="flex items-center justify-between border-b border-hairline px-2 py-1.5">
        <div className="flex items-center gap-1">
          <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'} className="focusable flex h-8 w-8 items-center justify-center rounded-full border-2 border-foreground text-[11px] hover:bg-primary hover:border-primary hover:text-primary-foreground">{playing ? '❚❚' : '▶'}</button>
          <Ico label="Restart">↺</Ico>
          <Ico label="Loop" active={loop}>⟳</Ico>
        </div>
        <div className="flex items-center gap-1"><Ico label="Undo">↶</Ico><Ico label="Redo">↷</Ico></div>
      </div>
      <div className="grid grid-cols-4 gap-2 p-2">
        <label className="block"><MonoLabel>Tempo</MonoLabel>
          <input defaultValue="92" className="focusable mt-1 w-full border border-hairline bg-card px-2 py-1.5 text-center text-sm font-semibold focus:border-foreground" /></label>
        <label className="block"><MonoLabel>Time</MonoLabel>
          <select className="focusable mt-1 w-full border border-hairline bg-card px-1.5 py-1.5 text-sm font-semibold" defaultValue="4/4">{TIME_SIGS.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label className="block"><MonoLabel>Grid</MonoLabel>
          <select className="focusable mt-1 w-full border border-hairline bg-card px-1.5 py-1.5 text-sm font-semibold" defaultValue="1/4 beat">{GRID_STEPS.map((q) => <option key={q}>{q}</option>)}</select></label>
        <label className="block"><MonoLabel>Patch</MonoLabel>
          <select className="focusable mt-1 w-full border border-hairline bg-card px-1.5 py-1.5 text-sm font-semibold" defaultValue="Bass">{PATCHES.map((p) => <option key={p}>{p}</option>)}</select></label>
      </div>
    </div>
  )
}

/* ── One bar row in the Note-Picker timeline ──────────────────────────────────── */
function BarLane({ n, h = 84, selected = false, active = false, label = true }: { n: number; h?: number; selected?: boolean; active?: boolean; label?: boolean }) {
  const blocks = n === 1
    ? [{ t: 0, d: 2, p: 6, label: 'C3' }, { t: 2, d: 1, p: 3, label: 'F3', sel: selected }, { t: 3, d: 1, p: 1, label: 'G#3' }, { t: 4, d: 2, p: 2, label: '◈', chord: true }, { t: 6, d: 1.5, p: 5, label: 'G3' }]
    : n === 2
      ? [{ t: 0, d: 1.5, p: 4, label: 'A3' }, { t: 2, d: 2, p: 2, label: 'D3' }, { t: 5, d: 1, p: 5, label: 'E3' }]
      : [{ t: 1, d: 1, p: 3, label: 'C3' }]
  const cols = 8; const rows = 8
  return (
    <div className="flex items-stretch gap-1">
      {label && (
        <div className={`flex w-9 shrink-0 flex-col items-center justify-center border ${active ? 'border-primary bg-primary/10' : 'border-hairline bg-panel'}`}>
          <span className="text-[8px] font-bold uppercase tracking-wide text-muted-foreground">Bar</span>
          <span className={`text-sm font-black ${active ? 'text-primary' : ''}`}>{n}</span>
        </div>
      )}
      <div className="relative flex-1 border border-hairline bg-panel" style={{ height: h, backgroundImage: 'linear-gradient(90deg, var(--grid-line) 1px, transparent 1px), linear-gradient(var(--grid-line) 1px, transparent 1px)', backgroundSize: `${100 / cols}% ${h / rows}px` }}>
        {active && <span className="absolute top-0 bottom-0 z-10 w-px bg-primary" style={{ left: '25%' }} />}
        {blocks.map((b, i) => (
          <span key={i} className={`noise absolute flex items-center justify-center text-[8px] font-bold ${b.sel ? 'bg-primary text-primary-foreground ring-2 ring-foreground' : 'bg-primary/85 text-primary-foreground'}`} style={{ left: `${(b.t / cols) * 100}%`, width: `${(b.d / cols) * 100}%`, top: (b.p * h) / rows + 2, height: h / rows - 3 }}>{b.label}</span>
        ))}
      </div>
      <div className="flex flex-col justify-center gap-1"><Ico label={`Duplicate bar ${n}`}>⧉</Ico><Ico label={`Delete bar ${n}`}>🗑</Ico></div>
    </div>
  )
}

function TouchKeyboard({ octaves = 2, height = 128 }: { octaves?: number; height?: number }) {
  const keys = Array.from({ length: octaves }).flatMap((_, o) => NOTE_NAMES.map((name) => ({ name, o })))
  return (
    <div className="flex overflow-hidden border border-foreground" style={{ height }}>
      {keys.map(({ name, o }, i) => {
        const black = isBlackKey(name)
        return (
          <button key={`${name}-${o}-${i}`} aria-label={`${name}${3 + o}`} className={`focusable flex flex-1 items-end justify-center border-r border-hairline pb-1.5 text-[9px] font-bold last:border-r-0 transition-colors hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground ${black ? 'text-keys-white' : 'text-keys-black'}`} style={{ backgroundColor: black ? 'var(--keys-black)' : 'var(--keys-white)' }}>
            {name === 'C' ? `C${3 + o}` : name}
          </button>
        )
      })}
    </div>
  )
}

// chord chips — always present with an explicit "Off"; no toggle to open
function ChordChips({ value, onChange, scroll = false }: { value: string; onChange: (v: string) => void; scroll?: boolean }) {
  return (
    <div className={`flex gap-1.5 ${scroll ? 'overflow-x-auto pb-1' : 'flex-wrap'}`}>
      {CHORD_OPTS.map((c) => (
        <button key={c} onClick={() => onChange(c)} className={`focusable shrink-0 whitespace-nowrap border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${value === c ? 'border-primary bg-primary text-primary-foreground' : 'border-hairline text-muted-foreground hover:border-foreground hover:text-foreground'}`}>{c}</button>
      ))}
    </div>
  )
}

/* ── NOTE PICKER surface — scrolling bars, docked keyboard + ordered controls ─── */
function NotePickerSurface() {
  const [chord, setChord] = useState('Off')
  const [mode, setMode] = useState('Commit')
  return (
    <div className="border border-hairline bg-card">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-hairline px-3 py-2">
        <span className="font-display text-xs font-extrabold uppercase tracking-wide">Timeline</span>
        <div className="flex items-center gap-1"><MonoLabel>Bars</MonoLabel><Ico label="Fewer bars">−</Ico><span className="w-4 text-center text-xs font-bold">3</span><Ico label="More bars">＋</Ico></div>
        <div className="ml-auto flex items-center gap-2">
          <button className="focusable border border-foreground px-2 py-1 text-[10px] font-bold uppercase hover:bg-foreground hover:text-background">Add Bar</button>
          <button className="focusable px-1.5 py-1 text-[10px] font-bold uppercase text-muted-foreground hover:text-primary">Clear</button>
        </div>
      </div>

      {/* SCROLLING bar region — keyboard & controls below stay docked */}
      <div className="relative max-h-[180px] space-y-1.5 overflow-y-auto px-3 py-2.5">
        <BarLane n={1} active selected /><BarLane n={2} /><BarLane n={3} />
        <div className="pointer-events-none sticky bottom-0 -mb-2.5 h-4 bg-gradient-to-t from-card to-transparent" aria-hidden />
      </div>

      {/* DOCKED footer */}
      <div className="border-t-2 border-foreground bg-panel">
        <div className="flex items-center gap-2 border-b border-hairline px-3 py-1.5">
          <span className="text-xs font-black text-primary">F3</span><MonoLabel>selected</MonoLabel>
          <span className="ml-1 flex items-center gap-1"><Ico label="Move left">◀</Ico><Ico label="Move right">▶</Ico><Ico label="Shrink">−</Ico><Ico label="Grow">＋</Ico></span>
          <Tog on className="ml-1">Edit pitch</Tog>
          <button className="focusable ml-auto flex h-7 w-7 items-center justify-center border border-hairline text-xs hover:border-primary hover:text-primary" aria-label="Delete block">✕</button>
        </div>

        <div className="px-3 pt-3"><TouchKeyboard octaves={2} height={116} /></div>

        {/* ordered controls: 1 Chord · 2 Octave · 3 Note length · 4 Preview/Commit · 5 Copy */}
        <div className="space-y-3 px-3 py-3">
          <div><MonoLabel>Chord</MonoLabel><div className="mt-1"><ChordChips value={chord} onChange={setChord} /></div></div>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <div><MonoLabel>Octave</MonoLabel><div className="mt-1 flex gap-1">{[2, 3, 4, 5].map((o) => <Pick key={o} active={o === 3}>{o}</Pick>)}</div></div>
            <div><MonoLabel>Note length</MonoLabel><div className="mt-1 flex gap-1">{LENGTHS.map((w) => <Pick key={w} active={w === '1'}>{w}</Pick>)}</div></div>
            <div><MonoLabel>Input</MonoLabel><div className="mt-1"><Seg options={['Preview', 'Commit']} value={mode} onChange={setMode} /></div></div>
            <button className="focusable ml-auto self-end text-[10px] font-bold uppercase tracking-wide text-muted-foreground underline-offset-2 hover:text-primary hover:underline">Copy → MIDI Rec</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── MIDI RECORD surface ───────────────────────────────────────────────────────── */
function FoldedRoll({ h = 100, loop = false }: { h?: number; loop?: boolean }) {
  const notes = [{ t: 0, d: 1.5, p: 3 }, { t: 1.5, d: 1, p: 5 }, { t: 2.5, d: 2, p: 2 }, { t: 4.5, d: 1, p: 6 }, { t: 5.5, d: 2.5, p: 4 }]
  const cols = 8; const rows = 8
  return (
    <div className="relative border border-hairline bg-panel" style={{ height: h, backgroundImage: 'linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)', backgroundSize: `${100 / cols}% 100%` }}>
      {loop && <span className="absolute top-0 bottom-0 bg-primary/10" style={{ left: '12.5%', right: '37.5%' }} aria-hidden />}
      {loop && <span className="absolute top-0 bottom-0 flex w-3 items-start justify-center text-[10px] text-primary" style={{ left: 'calc(12.5% - 6px)' }} aria-label="Loop start">◤</span>}
      {loop && <span className="absolute top-0 bottom-0 flex w-3 items-start justify-center text-[10px] text-primary" style={{ left: 'calc(62.5% - 6px)' }} aria-label="Loop end">◥</span>}
      <span className="absolute top-0 bottom-0 z-10 w-px bg-primary" style={{ left: '72%' }} />
      {notes.map((n, i) => <span key={i} className="noise absolute bg-primary" style={{ left: `${(n.t / cols) * 100}%`, width: `${(n.d / cols) * 100}%`, top: (n.p * h) / rows, height: h / rows - 2 }} />)}
    </div>
  )
}
function RecordButton({ rec, onClick, full = false }: { rec: boolean; onClick?: () => void; full?: boolean }) {
  return (
    <button onClick={onClick} className={`focusable flex items-center justify-center gap-2.5 text-xs font-black uppercase tracking-wider ${full ? 'w-full py-3' : 'px-4 py-2.5'} ${rec ? 'border-2 border-foreground bg-foreground text-background' : 'border-2 border-primary bg-primary text-primary-foreground'}`}>
      <span className={`inline-block bg-current ${rec ? 'rec-pulse h-3.5 w-3.5' : 'h-3.5 w-3.5 rounded-full'}`} />
      {rec ? 'Stop' : 'Record'}
    </button>
  )
}
function MidiRecordSurface() {
  const [rec, setRec] = useState(false)
  const [recMode, setRecMode] = useState('Record')
  return (
    <div className="border border-hairline bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-primary" />
        <select className="focusable border border-hairline bg-card px-1.5 py-1 text-xs font-semibold" defaultValue="Arturia KeyStep" aria-label="MIDI device"><option>Arturia KeyStep</option><option>Minilogue</option></select>
        <MonoLabel className="text-muted-foreground">connected</MonoLabel>
        <button className="focusable ml-auto px-1.5 py-1 text-[10px] font-bold uppercase text-muted-foreground hover:text-primary">Clear take</button>
      </div>

      <div className="px-3 py-2.5">
        <FoldedRoll loop />
        <div className="mt-2 flex items-center gap-3">
          <label className="flex items-center gap-1"><MonoLabel>Loop start</MonoLabel><input defaultValue="1.0" className="focusable w-14 border border-hairline bg-card px-1.5 py-0.5 text-center font-mono text-xs" /></label>
          <label className="flex items-center gap-1"><MonoLabel>Length</MonoLabel><input defaultValue="4" className="focusable w-12 border border-hairline bg-card px-1.5 py-0.5 text-center font-mono text-xs" /></label>
        </div>
      </div>

      {/* dock: record button anchors left; mode + toggles stack tidily to its right */}
      <div className="flex items-start gap-4 border-t-2 border-foreground bg-panel px-3 py-3">
        <RecordButton rec={rec} onClick={() => setRec((r) => !r)} />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-2"><MonoLabel>Mode</MonoLabel><Seg options={['Record', 'Overdub']} value={recMode} onChange={setRecMode} /></div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Tog>Count-in</Tog><Tog on>Metronome</Tog>
            <span className="mx-0.5 h-6 w-px bg-hairline" />
            <Tog>Quantize notes</Tog><Tog on>Snap controls</Tog>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Instrument surface (mode switch) ──────────────────────────────────────────── */
function InstrumentBlock() {
  const [tool, setTool] = useState('Note Picker')
  return (
    <div className="border border-hairline bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-hairline bg-panel px-2.5 py-1.5">
        <MonoLabel className="text-primary">Instrument</MonoLabel>
        <Seg options={['Note Picker', 'MIDI Record']} value={tool} onChange={setTool} />
      </div>
      <div className="space-y-2.5 p-2.5"><StudioBar />{tool === 'Note Picker' ? <NotePickerSurface /> : <MidiRecordSurface />}</div>
    </div>
  )
}

// ── Content blocks ──────────────────────────────────────────────────────────────
const ADD_TOOLS: [string, string][] = [['●', 'Record Audio'], ['⇪', 'Import Audio'], ['⬡', 'Record MIDI'], ['♪', 'Note Picker'], ['▣', 'Photo'], ['⎙', 'File']]
function ContentBlock({ kind, children }: { kind: string; children: React.ReactNode }) {
  return (
    <div className="border border-hairline bg-panel">
      <div className="flex items-center justify-between border-b border-hairline px-3 py-1.5"><MonoLabel className="text-primary">{kind}</MonoLabel><button className="focusable text-xs text-muted-foreground hover:text-primary" aria-label="Remove block">✕</button></div>
      <div className="p-2.5">{children}</div>
    </div>
  )
}
function MetaCard() {
  return (
    <div className="space-y-3 border border-hairline bg-card p-3">
      <div><MonoLabel>Role</MonoLabel><div className="mt-1.5 flex flex-wrap gap-1.5"><Chip active>Bassline</Chip><Chip>Melody</Chip><Chip>Chords</Chip><Chip>Drums</Chip><Chip>Riff</Chip></div></div>
      <div><MonoLabel>Section intent (optional)</MonoLabel><div className="mt-1.5 flex flex-wrap gap-1.5"><Chip>None</Chip><Chip active>Verse</Chip><Chip>Chorus</Chip><Chip>Bridge</Chip></div></div>
      <div><MonoLabel>Instrument</MonoLabel><div className="focusable mt-1 flex items-center justify-between border border-hairline bg-card px-2 py-1.5 text-sm font-semibold">Danelectro Longhorn <span className="text-primary">▾</span></div></div>
      <div className="grid grid-cols-2 gap-2"><Field label="Key" value="Dm" /><Field label="Tempo" value="92" /></div>
    </div>
  )
}
function SaveBar() {
  return (
    <div className="flex gap-2">
      <button className="noise flex-1 bg-primary px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground">Save to Pool</button>
      <button className="border border-foreground px-3 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-foreground hover:text-background">Save to Song ›</button>
    </div>
  )
}

// ── 04.1 desktop ────────────────────────────────────────────────────────────────
function CaptureDesktop() {
  return (
    <WindowFrame label="Desktop drawer · one surface, shared studio bar" className="w-full">
      <div className="flex items-center justify-between border-b border-foreground px-4 py-3">
        <div className="flex items-baseline gap-3"><MonoLabel className="text-primary">NEW · UNSAVED</MonoLabel><span className="font-display text-sm font-extrabold uppercase tracking-wide">Quick Capture</span></div>
        <button className="focusable text-sm" aria-label="Close">✕</button>
      </div>
      <div className="space-y-3 p-4">
        <div><MonoLabel>Add to this idea</MonoLabel>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {ADD_TOOLS.map(([g, n]) => <button key={n} className="focusable flex items-center gap-1.5 border border-hairline bg-card px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide hover:border-foreground hover:bg-muted"><span aria-hidden className="text-primary">{g}</span>{n}</button>)}
          </div>
        </div>
        <ContentBlock kind="Record Audio · 00:12 · WAV">
          <div className="flex items-center gap-3">
            <button className="focusable flex h-8 w-8 shrink-0 items-center justify-center border border-foreground text-[10px] hover:bg-primary hover:border-primary hover:text-primary-foreground">▶</button>
            <div className="flex-1"><Waveform n={52} accent /></div>
            <button className="border border-hairline px-1.5 py-1 text-[9px] font-bold uppercase text-muted-foreground hover:border-foreground hover:text-foreground">Extract MIDI</button>
          </div>
        </ContentBlock>
        <InstrumentBlock />
        <MetaCard />
      </div>
      <div className="border-t border-foreground bg-panel p-3"><SaveBar /></div>
    </WindowFrame>
  )
}

/* ── Mobile shared bar: transport + a single tappable readout that opens the sheet */
function MobileBar({ loop, setLoop, onSettings }: { loop: boolean; setLoop: (v: boolean) => void; onSettings: () => void }) {
  return (
    <div className="flex items-center gap-2 border-b border-hairline bg-panel px-3 py-2">
      <button className="focusable flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-foreground text-[10px]">▶</button>
      <button onClick={() => setLoop(!loop)} className={`focusable flex h-8 w-8 shrink-0 items-center justify-center border text-xs ${loop ? 'border-primary bg-primary text-primary-foreground' : 'border-hairline'}`} aria-label="Loop">⟳</button>
      <button onClick={onSettings} className="focusable flex flex-1 items-center justify-between gap-2 border border-hairline bg-card px-2.5 py-1.5" aria-label="Studio settings">
        <span className="label-mono whitespace-nowrap text-foreground">92 · 4/4 · Bass</span>
        <span className="text-base leading-none text-muted-foreground">⋯</span>
      </button>
    </div>
  )
}
function MobileStudioSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end bg-foreground/40">
      <div className="border-t-2 border-foreground bg-card">
        <div className="flex items-center justify-between border-b border-hairline px-3 py-2"><span className="font-display text-xs font-extrabold uppercase tracking-wide">Studio settings</span><button onClick={onClose} className="focusable text-sm" aria-label="Close settings">✕</button></div>
        <div className="space-y-3 p-3">
          <p className="label-mono text-muted-foreground">Shared by Note Picker &amp; MIDI Record</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Tempo" value="92" />
            <label className="block"><MonoLabel>Time</MonoLabel><select className="focusable mt-1 w-full border border-hairline bg-card px-2 py-1.5 text-center text-sm font-semibold" defaultValue="4/4">{TIME_SIGS.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label className="block"><MonoLabel>Grid</MonoLabel><select className="focusable mt-1 w-full border border-hairline bg-card px-2 py-1.5 text-center text-sm font-semibold" defaultValue="1/4 beat">{GRID_STEPS.map((q) => <option key={q}>{q}</option>)}</select></label>
            <label className="block"><MonoLabel>Patch</MonoLabel><select className="focusable mt-1 w-full border border-hairline bg-card px-2 py-1.5 text-center text-sm font-semibold" defaultValue="Bass">{PATCHES.map((p) => <option key={p}>{p}</option>)}</select></label>
          </div>
          <button onClick={onClose} className="w-full bg-primary py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground">Done</button>
        </div>
      </div>
    </div>
  )
}

// mobile note-picker dock: chords + length always visible; no submenu, nothing offscreen
function MobileNoteDock() {
  const [chord, setChord] = useState('Off')
  return (
    <>
      <div className="flex items-center gap-2 border-b border-hairline px-3 py-1.5">
        <MonoLabel className="text-foreground">Oct 3</MonoLabel>
        <button className="focusable ml-auto flex items-center gap-1 border border-foreground px-2 py-1 text-[10px] font-bold uppercase tracking-wide hover:bg-foreground hover:text-background" aria-label="Add bar">＋ Bar</button>
      </div>
      <div className="px-3 py-2"><BarLane n={1} h={72} active label={false} /></div>
      <div className="p-3 pt-0"><TouchKeyboard octaves={1} height={132} /></div>
      <div className="space-y-2.5 border-t border-hairline bg-panel px-3 py-2.5">
        <div><MonoLabel>Chord</MonoLabel><div className="mt-1"><ChordChips value={chord} onChange={setChord} scroll /></div></div>
        <div className="flex items-end gap-4">
          <div><MonoLabel>Note length</MonoLabel><div className="mt-1 flex gap-1">{LENGTHS.map((w) => <Pick key={w} active={w === '1'}>{w}</Pick>)}</div></div>
        </div>
        <div><MonoLabel>Input</MonoLabel><div className="mt-1"><Seg options={['Preview', 'Commit']} value="Commit" onChange={() => {}} className="w-full" size="lg" /></div></div>
      </div>
    </>
  )
}
// mobile midi-record dock (device connected)
function MobileMidiDock({ loop }: { loop: boolean }) {
  const [rec, setRec] = useState(false)
  return (
    <>
      <div className="flex items-center gap-2 border-b border-hairline px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-xs font-semibold">Arturia KeyStep</span>
        <MonoLabel className="ml-auto text-muted-foreground">connected</MonoLabel>
      </div>
      <div className="px-3 py-2"><FoldedRoll h={72} loop={loop} /></div>
      <div className="space-y-2.5 border-t border-hairline bg-panel px-3 py-2.5">
        <RecordButton rec={rec} onClick={() => setRec((r) => !r)} full />
        <div><MonoLabel>Mode</MonoLabel><div className="mt-1"><Seg options={['Record', 'Overdub']} value="Record" onChange={() => {}} className="w-full" size="lg" /></div></div>
        <div className="grid grid-cols-2 gap-1.5"><Tog className="text-center">Count-in</Tog><Tog on className="text-center">Metronome</Tog><Tog className="text-center">Quantize notes</Tog><Tog on className="text-center">Snap controls</Tog></div>
      </div>
    </>
  )
}

// ── 04.1 mobile ─────────────────────────────────────────────────────────────────
function CaptureMobile() {
  const [tool, setTool] = useState('Notes')
  const [loop, setLoop] = useState(true)
  const [sheet, setSheet] = useState(false)
  return (
    <PhoneFrame label="Mobile · docked input, ⋯ opens shared settings">
      <div className="flex items-center justify-between border-b border-foreground px-3 py-2.5"><button className="focusable text-sm" aria-label="Close">✕</button><span className="font-display text-xs font-extrabold uppercase tracking-wide">Quick Capture</span><MonoLabel className="text-primary">NEW</MonoLabel></div>
      <div className="border-b border-hairline bg-panel px-3 py-2">
        <div className="flex gap-2 overflow-x-auto pb-1">{ADD_TOOLS.map(([g, n]) => <button key={n} className="focusable flex shrink-0 flex-col items-center gap-1 border border-hairline bg-card px-2.5 py-1.5"><span aria-hidden className="text-primary">{g}</span><span className="text-[8px] font-bold uppercase tracking-wide">{n.split(' ')[0]}</span></button>)}</div>
      </div>
      <div className="flex items-center justify-between bg-panel px-3 py-1.5"><MonoLabel className="text-primary">Instrument</MonoLabel><Seg options={['Notes', 'MIDI']} value={tool} onChange={setTool} /></div>
      <MobileBar loop={loop} setLoop={setLoop} onSettings={() => setSheet(true)} />
      {tool === 'Notes' ? <MobileNoteDock /> : <MobileMidiDock loop={loop} />}
      <div className="border-t border-foreground bg-panel p-3"><div className="flex gap-2"><button className="noise flex-1 bg-primary py-2.5 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">Save to Pool</button><button className="border border-foreground px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider">Song ›</button></div></div>
      {sheet && <MobileStudioSheet onClose={() => setSheet(false)} />}
    </PhoneFrame>
  )
}

/* ── Mobile MIDI Record — no-device fallback ───────────────────────────────────── */
function MidiNoDeviceMobile() {
  return (
    <PhoneFrame label="Mobile · MIDI Record — no controller detected">
      <div className="flex items-center justify-between border-b border-foreground px-3 py-2.5"><button className="focusable text-sm" aria-label="Close">✕</button><span className="font-display text-xs font-extrabold uppercase tracking-wide">MIDI Record</span><MonoLabel className="text-primary">NEW</MonoLabel></div>
      <MobileBar loop setLoop={() => {}} onSettings={() => {}} />
      <div className="p-3">
        <div className="border border-dashed border-hairline bg-panel p-5 text-center">
          <span className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-muted-foreground">⬡</span>
          <p className="text-sm font-bold">No MIDI controller detected</p>
          <p className="mt-1 text-xs text-muted-foreground">Connect a device, or capture without one:</p>
          <div className="mt-3 flex flex-col gap-2">
            <button className="border-2 border-primary bg-primary py-2.5 text-xs font-bold uppercase tracking-wide text-primary-foreground">Use on-screen keys</button>
            <button className="border border-foreground py-2.5 text-xs font-bold uppercase tracking-wide">Import .mid file</button>
            <button className="focusable py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:text-primary">↻ Re-scan for devices</button>
          </div>
        </div>
        <p className="mt-2 label-mono text-center text-muted-foreground">Web MIDI needs Chrome / Edge</p>
      </div>
    </PhoneFrame>
  )
}
// full mobile MIDI record (connected) — reuses the capture chrome
function MidiRecordMobile() {
  const [loop, setLoop] = useState(true)
  const [sheet, setSheet] = useState(false)
  return (
    <PhoneFrame label="Mobile · MIDI Record — recording">
      <div className="flex items-center justify-between border-b border-foreground px-3 py-2.5"><button className="focusable text-sm" aria-label="Close">✕</button><span className="font-display text-xs font-extrabold uppercase tracking-wide">MIDI Record</span><MonoLabel className="text-primary">NEW</MonoLabel></div>
      <MobileBar loop={loop} setLoop={setLoop} onSettings={() => setSheet(true)} />
      <MobileMidiDock loop={loop} />
      <div className="border-t border-foreground bg-panel p-3"><div className="flex gap-2"><button className="noise flex-1 bg-primary py-2.5 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">Save to Pool</button><button className="border border-foreground px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider">Song ›</button></div></div>
      {sheet && <MobileStudioSheet onClose={() => setSheet(false)} />}
    </PhoneFrame>
  )
}

function Legend({ items }: { items: [string, string][] }) {
  return (
    <div className="mt-6 grid gap-x-8 gap-y-2 border-t border-hairline pt-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([k, v]) => <div key={k}><MonoLabel className="text-foreground">{k}</MonoLabel><p className="mt-0.5 text-xs text-muted-foreground">{v}</p></div>)}
    </div>
  )
}

export default function Capture() {
  return (
    <section id="capture" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <SectionHead no="04" title="Capture Suite" kicker="Shared studio bar · Note Picker · MIDI Record" />
      <p className="-mt-6 mb-12 max-w-2xl text-sm text-muted-foreground">
        One idea, one surface. Tempo, time signature, <span className="font-bold text-foreground">grid</span>,
        patch, the transport and undo / redo are <span className="font-bold text-foreground">global</span> — they
        live once in the Studio Bar. Note Picker and MIDI Record never share the screen, so one segmented switch
        swaps between them; each shows only its own local tools.
      </p>

      <div className="space-y-16">
        <Specimen index="04.1" name="Quick Capture — unified shell" note="Studio bar shared · instrument surface swaps">
          <div className="grid items-start gap-8 lg:grid-cols-[1.35fr_auto]"><CaptureDesktop /><CaptureMobile /></div>
          <Legend items={[
            ['Studio Bar', 'Transport strip + a 4-column ledger (Tempo · Time · Grid · Patch) — fills width, no wrap.'],
            ['One switch', 'Note Picker ⇄ MIDI Record share the bar and one surface slot.'],
            ['Mobile bar', 'Transport + a single “92 · 4/4 · Bass” readout that IS the ⋯ settings trigger.'],
            ['Add-bar', 'Audio / MIDI / Notes / Photo / File append removable blocks.'],
            ['Bar tabs (mobile)', 'Switch bars without scrolling the keyboard off screen.'],
            ['Save', 'Pool by default; “Save to Song ›” reveals song + section pickers.'],
          ]} />
        </Specimen>

        <Specimen index="04.2" name="Note Picker" note="Scrolling bars · docked keyboard · chords always shown">
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_auto]">
            <WindowFrame label="Desktop · bars scroll; keyboard + ordered controls stay docked">
              <div className="space-y-2.5 p-3"><StudioBar /><NotePickerSurface /></div>
            </WindowFrame>
            <PhoneFrame label="Mobile · chords + length inline, nothing offscreen">
              <MobileBar loop setLoop={() => {}} onSettings={() => {}} /><MobileNoteDock />
            </PhoneFrame>
          </div>
          <Legend items={[
            ['Bars scroll', 'The bar region scrolls; the keyboard, selected-block bar and controls stay docked.'],
            ['Control order', '1 Chord · 2 Octave · 3 Note length · 4 Preview/Commit · 5 Copy → MIDI Rec.'],
            ['Chord', 'Always visible as chips with an explicit “Off” — no toggle to open, no popup on mobile.'],
            ['Selected block', 'Move ◀▶, resize −＋, Edit pitch, delete.'],
            ['Octave (mobile)', 'Swipe the keys — no arrows to hunt for.'],
            ['Grid & undo', 'Shared — set in the Studio Bar, not here.'],
          ]} />
        </Specimen>

        <Specimen index="04.3" name="MIDI Record" note="Anchored record button · overdub · snap · loop · mobile">
          <div className="space-y-8">
            <WindowFrame label="Desktop · record button anchors the dock; mode + toggles stack to its right">
              <div className="space-y-2.5 p-3"><StudioBar /><MidiRecordSurface /></div>
            </WindowFrame>
            <div className="flex flex-wrap gap-8"><MidiRecordMobile /><MidiNoDeviceMobile /></div>
          </div>
          <Legend items={[
            ['Record button', 'Big, filled vermillion — anchors the dock left; flips to a pulsing Stop while live.'],
            ['Dock layout', 'Mode segmented + toggles stack neatly right of the button — no floating clusters.'],
            ['Count-in / Metronome', 'Pre-roll toggle; metronome is the one control live mid-take.'],
            ['Quantize / Snap', '“Quantize notes” snaps the take; “Snap controls” snaps loop + seek.'],
            ['Loop region', 'Drag ◤◥ handles or type start / length in bar.beat.'],
            ['No device', 'On-screen keys or .mid import with a re-scan — never a dead end.'],
          ]} />
        </Specimen>
      </div>
    </section>
  )
}
