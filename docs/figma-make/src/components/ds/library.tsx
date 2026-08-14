import { useState } from 'react'
import { MonoLabel, Panel, SectionHead, Specimen } from './primitives'

/* ============================================================
   SECTION 05 — LIBRARY & DOCUMENTATION
   The controls that live outside capture: lifecycle steppers,
   the album-format toggle, todo ledgers, audio versions, the
   idea-card media quick-play cluster, reference listings, the
   instrument selector, and the shared empty / loading states.
   Every control mirrors a real surface in the app.
   ============================================================ */

// ── Status step indicator (StatusStepIndicator) ────────────────────────────────
const SONG_STATUSES = ['sketch', 'writing', 'arranging', 'production', 'mixing', 'mastering', 'released']
const ALBUM_STATUSES = ['draft', 'in-progress', 'released']

function StatusStepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div role="group" className="flex items-start">
      {steps.map((s, i) => {
        const reached = i <= current
        return (
          <div key={s} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <span className={`h-px flex-1 ${i === 0 ? 'opacity-0' : i <= current ? 'bg-primary' : 'bg-hairline'}`} />
              <button
                aria-current={i === current ? 'step' : undefined}
                className={`focusable h-2.5 w-2.5 shrink-0 rounded-full border-2 transition-colors ${
                  reached ? 'border-primary bg-primary' : 'border-hairline bg-transparent'
                }`}
              />
              <span className={`h-px flex-1 ${i === steps.length - 1 ? 'opacity-0' : i < current ? 'bg-primary' : 'bg-hairline'}`} />
            </div>
            <span className={`mt-1.5 truncate text-[10px] font-semibold uppercase tracking-wide ${reached ? 'text-foreground' : 'text-muted-foreground'}`}>
              {s.replace('-', ' ')}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Album format segmented toggle (AlbumHeader) ────────────────────────────────
function FormatToggle() {
  const [fmt, setFmt] = useState('EP')
  return (
    <div role="group" aria-label="Album format" className="inline-flex border border-hairline p-0.5">
      {['Single', 'LP', 'EP'].map((f) => (
        <button
          key={f}
          aria-pressed={fmt === f}
          onClick={() => setFmt(f)}
          className={`focusable px-3 py-1 text-xs font-bold uppercase tracking-wide transition-colors ${
            fmt === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  )
}

// ── Todo ledger (SongTodosTab) ─────────────────────────────────────────────────
function TodoRow({ text, ts, done }: { text: string; ts?: string; done?: boolean }) {
  const [checked, setChecked] = useState(done)
  return (
    <li className="flex items-center gap-2.5 border-b border-hairline py-2 last:border-b-0">
      <span className="cursor-grab text-muted-foreground" aria-hidden>⣿</span>
      <button
        onClick={() => setChecked((c) => !c)}
        role="checkbox"
        aria-checked={checked}
        aria-label={`Mark "${text}" complete`}
        className={`focusable flex h-4 w-4 shrink-0 items-center justify-center border ${checked ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground'}`}
      >
        {checked ? <span className="text-[9px] leading-none">✓</span> : null}
      </button>
      <span className={`flex-1 text-sm ${checked ? 'text-muted-foreground line-through' : ''}`}>{text}</span>
      {ts ? <span className="border border-hairline px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">{ts}</span> : null}
      <button className="focusable text-muted-foreground hover:text-primary" aria-label="Delete todo">🗑</button>
    </li>
  )
}

// ── Audio version row (SongVersionsTab) ────────────────────────────────────────
function VersionRow({ label, when, main }: { label: string; when: string; main?: boolean }) {
  const [playing, setPlaying] = useState(false)
  return (
    <li className="flex items-center gap-3 border border-hairline bg-card p-2.5">
      <button
        onClick={() => setPlaying((p) => !p)}
        aria-label="Play audio"
        className="focusable flex h-8 w-8 shrink-0 items-center justify-center border border-foreground text-[10px] hover:bg-primary hover:border-primary hover:text-primary-foreground"
      >
        {playing ? '❚❚' : '▶'}
      </button>
      <div className="min-w-0 flex-1">
        <input defaultValue={label} className="focusable w-full border-none bg-transparent text-sm font-semibold focus:outline-none" />
        <MonoLabel>Uploaded {when}</MonoLabel>
      </div>
      <button
        aria-label={main ? 'Main version' : 'Set as main version'}
        className={`focusable text-lg leading-none ${main ? 'text-primary' : 'text-hairline hover:text-foreground'}`}
      >
        {main ? '★' : '☆'}
      </button>
      <button className="focusable text-muted-foreground hover:text-primary" aria-label="Delete version">🗑</button>
    </li>
  )
}

// ── Idea card w/ media quick-play cluster (IdeaCard + IdeaMediaQuickPlay) ───────
function QuickPlay({ glyph, label }: { glyph: string; label: string }) {
  return (
    <button className="focusable flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-primary" aria-label={label} title={label}>
      <span className="text-xs">{glyph}</span>
    </button>
  )
}
function IdeaCard() {
  return (
    <Panel className="noise p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="border border-hairline px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Bassline</span>
        <div className="flex items-center gap-0.5">
          <QuickPlay glyph="♪" label="Play Note Picker" />
          <QuickPlay glyph="≈" label="Play MIDI Record" />
          <QuickPlay glyph="✦" label="Play Extracted MIDI" />
          <QuickPlay glyph="●" label="Play audio" />
        </div>
      </div>
      <p className="mt-3 text-sm font-bold">Bassline — Dm — 92 BPM</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Danelectro Longhorn</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="border border-hairline px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">The Show</span>
        <span className="ml-auto flex items-center gap-1.5 text-muted-foreground" aria-hidden>
          <span title="Has audio">●</span><span title="Has MIDI">⬡</span><span title="Has image">▣</span>
        </span>
      </div>
    </Panel>
  )
}

// ── Reference listing (SongReferencesTab / AlbumReferenceTab) ───────────────────
function RefRow({ type, children }: { type: string; children: React.ReactNode }) {
  return (
    <div className="border border-hairline bg-card p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <MonoLabel className="text-primary">{type}</MonoLabel>
        <button className="focusable text-muted-foreground hover:text-primary" aria-label="Remove reference">🗑</button>
      </div>
      {children}
    </div>
  )
}

// ── Instrument selector (InstrumentSelector) ───────────────────────────────────
function InstrumentSelect() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative w-full max-w-xs">
      <MonoLabel>Instrument</MonoLabel>
      <button onClick={() => setOpen((o) => !o)} className="focusable mt-1 flex w-full items-center justify-between border border-foreground bg-card px-3 py-2 text-sm font-semibold">
        Danelectro Longhorn <span className="text-primary">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ul className="absolute z-10 mt-1 w-full border border-foreground bg-card">
          {['None', 'Danelectro Longhorn', 'Casio SK-1', 'Minilogue'].map((n, i) => (
            <li key={n}>
              <button className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-primary hover:text-primary-foreground ${i === 1 ? 'text-primary' : ''}`}>
                {n}{i === 1 && <span className="label-mono">●</span>}
              </button>
            </li>
          ))}
          <li className="border-t border-hairline">
            <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground">＋ Add New…</button>
          </li>
        </ul>
      )}
    </div>
  )
}

export default function Library() {
  return (
    <section id="library" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <SectionHead no="05" title="Library & Docs" kicker="Lifecycle · Todos · Versions · References" />
      <div className="space-y-14">
        <Specimen index="05.1" name="Lifecycle & format" note="Free-jump steppers · album-format toggle">
          <div className="grid gap-8 lg:grid-cols-2">
            <Panel className="p-5">
              <MonoLabel>Song status — 7 stages</MonoLabel>
              <div className="mt-4"><StatusStepper steps={SONG_STATUSES} current={3} /></div>
            </Panel>
            <div className="space-y-6">
              <Panel className="p-5">
                <MonoLabel>Album status — 3 stages</MonoLabel>
                <div className="mt-4"><StatusStepper steps={ALBUM_STATUSES} current={1} /></div>
              </Panel>
              <Panel className="p-5">
                <MonoLabel>Album format</MonoLabel>
                <div className="mt-3"><FormatToggle /></div>
              </Panel>
            </div>
          </div>
        </Specimen>

        <Specimen index="05.2" name="Todos & versions" note="Checkbox ledger · main-take star">
          <div className="grid gap-8 lg:grid-cols-2">
            <Panel className="p-4">
              <div className="mb-3 flex items-end gap-2">
                <label className="flex-1"><MonoLabel>New todo</MonoLabel>
                  <input placeholder="What needs doing?" className="focusable mt-1 w-full border border-hairline bg-card px-2 py-1.5 text-sm focus:border-foreground" /></label>
                <label className="w-24"><MonoLabel>mm:ss</MonoLabel>
                  <input placeholder="1:24" className="focusable mt-1 w-full border border-hairline bg-card px-2 py-1.5 text-center text-sm focus:border-foreground" /></label>
                <button className="border border-foreground px-3 py-2 text-xs font-bold uppercase tracking-wide hover:bg-foreground hover:text-background">Add</button>
              </div>
              <ul>
                <TodoRow text="Re-cut the pre-chorus bass" ts="1:24" />
                <TodoRow text="Double the brass in chorus 2" done />
                <TodoRow text="Fix timing on the last fill" ts="2:58" />
              </ul>
            </Panel>
            <Panel className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <MonoLabel>Audio versions</MonoLabel>
                <button className="flex items-center gap-1.5 border border-foreground px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide hover:bg-foreground hover:text-background">⇪ Upload</button>
              </div>
              <ul className="space-y-2">
                <VersionRow label="Rough mix v3" when="2 hrs ago" main />
                <VersionRow label="Live take" when="yesterday" />
                <VersionRow label="idea-bounce.wav" when="3 days ago" />
              </ul>
            </Panel>
          </div>
        </Specimen>

        <Specimen index="05.3" name="Idea card & media" note="Per-type quick-play cluster">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <IdeaCard />
            <div className="sm:col-span-1 lg:col-span-2">
              <Panel className="h-full p-4">
                <MonoLabel>Quick-play cluster — one control per media type present</MonoLabel>
                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
                  {[
                    ['♪', 'Play Note Picker — MIDI through synth'],
                    ['≈', 'Play MIDI Record — MIDI through synth'],
                    ['✦', 'Play Extracted MIDI — from audio'],
                    ['●', 'Play audio — loops via Web Audio'],
                  ].map(([g, l]) => (
                    <div key={l} className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center border border-hairline text-primary">{g}</span>
                      <span className="text-muted-foreground">{l}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 border-t border-hairline pt-3 text-xs text-muted-foreground">
                  Presence icons (● ⬡ ▣) mark which media a card holds; the cluster only shows controls
                  for what can actually play.
                </p>
              </Panel>
            </div>
          </div>
        </Specimen>

        <Specimen index="05.4" name="References & instrument" note="Text · link · audio · instrument select">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-2">
              <MonoLabel>Reference listing</MonoLabel>
              <RefRow type="text"><p className="text-sm text-foreground">Verse feel like the bridge of “Pyramid Song” — swung, patient.</p></RefRow>
              <RefRow type="link"><a className="text-sm text-primary underline underline-offset-2">youtu.be/reference-track</a></RefRow>
              <RefRow type="audio">
                <div className="flex items-center gap-3">
                  <button className="focusable flex h-8 w-8 items-center justify-center border border-foreground text-[10px]">▶</button>
                  <div className="flex h-8 flex-1 items-center gap-[2px]" aria-hidden>
                    {Array.from({ length: 40 }, (_, i) => <span key={i} className="w-[2px] bg-muted-foreground" style={{ height: `${20 + Math.abs(Math.sin(i * 1.7) * 80)}%` }} />)}
                  </div>
                  <MonoLabel>00:31</MonoLabel>
                </div>
              </RefRow>
              <div className="flex flex-wrap gap-2 pt-1">
                <button className="border border-hairline px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide hover:border-foreground">＋ Text</button>
                <button className="border border-hairline px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide hover:border-foreground">＋ URL</button>
                <button className="border border-hairline px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide hover:border-foreground">⎙ Import Audio</button>
              </div>
            </div>
            <div className="space-y-6">
              <Panel className="p-5"><InstrumentSelect /></Panel>
              <div className="space-y-3">
                <MonoLabel>Empty & loading states</MonoLabel>
                <div className="border border-dashed border-hairline p-6 text-center text-sm text-muted-foreground">
                  No references yet.
                </div>
                <div className="flex items-center gap-2 border border-hairline bg-card p-3 text-sm text-muted-foreground">
                  <span className="rec-pulse h-2 w-2 rounded-full bg-primary" /> Loading versions…
                </div>
              </div>
            </div>
          </div>
        </Specimen>
      </div>
    </section>
  )
}
