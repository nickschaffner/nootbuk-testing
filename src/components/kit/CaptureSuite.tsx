import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowLeftToLine,
  Copy,
  FileAudio,
  FileMusic,
  FolderInput,
  Image as ImageIcon,
  Import,
  Mic,
  Music2,
  Paperclip,
  Pause,
  Play,
  Piano,
  Plus,
  Redo2,
  Repeat,
  RotateCcw,
  Scissors,
  Sparkles,
  SquarePen,
  Trash2,
  Undo2,
  Upload,
  Wand2,
} from 'lucide-react'
import { cn } from './cn'
import { StudioBar } from './StudioBar'
import { OnScreenKeyboard } from './OnScreenKeyboard'
import { RecordButton } from './RecordButton'
import { SegmentedControl } from './SegmentedControl'
import { Toggle } from './Toggle'
import { Chip, Badge } from './Chip'
import { Pick } from './Pick'
import { Input, Textarea, MonoLabel } from './Field'
import { IconButton } from './IconButton'
import { Recess, EmptyState } from './Surfaces'
import { Menu, type MenuOption } from './Menu'
import {
  CHORD_TYPES,
  IDEA_ROLES,
  INSTRUMENT_TYPES,
  KEY_MODES,
  KEY_ROOTS,
  QUANTIZE_OPTIONS,
  SECTION_INTENTS,
  SYNTH_PATCHES,
  TIME_SIGNATURES,
} from './options'

// ─────────────────────────────────────────────────────────────────────────
// CaptureSuite — the reworked capture surface. Six data sources (0..1 of each
// per idea) presented through a tab bar, a shared StudioBar, per-tool content,
// a Play-Sources bar, and always-visible metadata. Presentational only:
// every control is stateful-for-show, no persistence, no audio engine.
//
// Composes the existing kit (StudioBar, OnScreenKeyboard, BeatLane, Menu,
// Chip, Pick, Field, Toggle, SegmentedControl, RecordButton, IconButton).
// Each piece is exported so specimens (and the app) can use them à la carte.
// ─────────────────────────────────────────────────────────────────────────

export type CaptureSource =
  | 'audio-recording'
  | 'midi-recording'
  | 'step-input'
  | 'midi-extraction'
  | 'midi-import'
  | 'audio-import'

export type CaptureTab =
  | 'record-audio'
  | 'record-midi'
  | 'step-input'
  | 'import'
  | 'extracted-midi'
  | 'imported-midi'
  | 'imported-audio'

// ── shared sample data ─────────────────────────────────────────────────────
const ROLL_ROWS = 6
const ROLL_BLOCKS: { start: number; width: number; row: number; active?: boolean }[] = [
  { start: 0, width: 1.5, row: 3, active: true },
  { start: 1.5, width: 1, row: 5 },
  { start: 2.5, width: 2, row: 2, active: true },
  { start: 4.5, width: 1, row: 4 },
  { start: 5.5, width: 2.5, row: 1, active: true },
]
const CHORD_OPTS = [{ value: 'off', label: 'Off' }, ...CHORD_TYPES]
const NOTE_LENGTHS = [{ value: '0.25', label: '¼' }, { value: '0.5', label: '½' }, { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '4', label: '4' }]

const SOURCE_META: Record<CaptureSource, { label: string; icon: ReactNode }> = {
  'audio-recording': { label: 'Recorded Audio', icon: <Mic size={14} /> },
  'midi-recording': { label: 'Recorded MIDI', icon: <Piano size={14} /> },
  'step-input': { label: 'Step Input', icon: <Music2 size={14} /> },
  'midi-extraction': { label: 'Extracted MIDI', icon: <Wand2 size={14} /> },
  'midi-import': { label: 'Imported MIDI', icon: <FileMusic size={14} /> },
  'audio-import': { label: 'Imported Audio', icon: <FileAudio size={14} /> },
}
/** Fixed left-to-right order for the play-sources bar. */
const SOURCE_ORDER: CaptureSource[] = ['audio-recording', 'midi-recording', 'step-input', 'midi-extraction', 'midi-import', 'audio-import']

// ═══════════════════════════════════════════════════════════════════════════
// Local atoms the kit doesn't provide
// ═══════════════════════════════════════════════════════════════════════════

function ToolHead({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-hairline bg-panel px-3 py-2">
      <MonoLabel className="text-primary">{children}</MonoLabel>
      {right ? <div className="ml-auto flex items-center gap-2">{right}</div> : null}
    </div>
  )
}

function Waveform({ accent = true, playing = false, bars = 56 }: { accent?: boolean; playing?: boolean; bars?: number }) {
  const heights = useMemo(() => Array.from({ length: bars }, (_, i) => 16 + Math.abs(Math.sin(i * 1.7)) * 82), [bars])
  return (
    <div className={cn('flex h-9 items-center gap-[2px]', playing && 'opacity-90')} aria-hidden>
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-[2px] shrink-0"
          style={{ height: `${h}%`, backgroundColor: accent ? 'var(--primary)' : 'var(--muted-foreground)' }}
        />
      ))}
    </div>
  )
}

/** A piano-roll: ledger grid of note blocks with loop handles + a playhead.
 *  `height` is a Tailwind height class so callers control its prominence. */
function MiniRoll({
  loop = false,
  playhead = 0.7,
  beats = 8,
  height = 'h-14',
  className,
}: {
  loop?: boolean
  playhead?: number
  beats?: number
  height?: string
  className?: string
}) {
  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-xs border border-hairline bg-background', height, className)}
      style={{
        backgroundImage: `repeating-linear-gradient(to right, var(--grid-line) 0, var(--grid-line) 1px, transparent 1px, transparent calc(100%/${beats}))`,
      }}
    >
      {ROLL_BLOCKS.map((b, i) => (
        <div
          key={i}
          className={cn(
            'absolute rounded-[1px] border',
            b.active ? 'noise border-primary bg-primary' : 'border-primary/40 bg-primary/20',
          )}
          style={{
            left: `calc(${(b.start / beats) * 100}% + 2px)`,
            width: `calc(${(b.width / beats) * 100}% - 4px)`,
            top: `calc(${(b.row / ROLL_ROWS) * 100}% + 2px)`,
            height: `calc(${100 / ROLL_ROWS}% - 4px)`,
          }}
        />
      ))}
      {loop && (
        <>
          <span className="pointer-events-none absolute inset-y-0 bg-primary/10" style={{ left: '12.5%', right: '37.5%' }} aria-hidden />
          <span className="absolute inset-y-0 flex w-3 items-start justify-center text-[10px] leading-none text-primary" style={{ left: 'calc(12.5% - 6px)' }} aria-hidden>◤</span>
          <span className="absolute inset-y-0 flex w-3 items-start justify-center text-[10px] leading-none text-primary" style={{ left: 'calc(62.5% - 6px)' }} aria-hidden>◥</span>
        </>
      )}
      {playhead >= 0 && <span className="absolute inset-y-0 z-10 w-px bg-primary" style={{ left: `${playhead * 100}%` }} aria-hidden />}
    </div>
  )
}

function SmallPick({ children, active }: { children: ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'focusable h-7 min-w-7 rounded-xs border px-1.5 text-xs font-bold transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-hairline hover:border-foreground',
      )}
    >
      {children}
    </button>
  )
}

function ChordChips({ mobile = false }: { mobile?: boolean }) {
  const [value, setValue] = useState('off')
  return (
    <div className={cn('flex gap-1.5', mobile ? 'overflow-x-auto pb-1' : 'flex-wrap')}>
      {CHORD_OPTS.map((c) => (
        <Chip key={c.value} selected={value === c.value} onClick={() => setValue(c.value)} className="shrink-0">
          {c.label}
        </Chip>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab bar
// ═══════════════════════════════════════════════════════════════════════════

const ALWAYS_TABS: CaptureTab[] = ['record-audio', 'record-midi', 'step-input', 'import']
const COND_TAB_SOURCE: Partial<Record<CaptureTab, CaptureSource>> = {
  'extracted-midi': 'midi-extraction',
  'imported-midi': 'midi-import',
  'imported-audio': 'audio-import',
}
const TAB_META: Record<CaptureTab, { label: string; icon: ReactNode }> = {
  'record-audio': { label: 'Record Audio', icon: <Mic size={14} /> },
  'record-midi': { label: 'Record MIDI', icon: <Piano size={14} /> },
  'step-input': { label: 'Step Input', icon: <Music2 size={14} /> },
  import: { label: 'Import', icon: <Import size={14} /> },
  'extracted-midi': { label: 'Extracted MIDI', icon: <Wand2 size={14} /> },
  'imported-midi': { label: 'Imported MIDI', icon: <FileMusic size={14} /> },
  'imported-audio': { label: 'Imported Audio', icon: <FileAudio size={14} /> },
}

export interface CaptureTabsProps {
  value: CaptureTab
  onChange?: (tab: CaptureTab) => void
  /** Sources with content — their conditional tabs are appended. */
  present?: CaptureSource[]
  mobile?: boolean
  className?: string
}

export function CaptureTabs({ value, onChange, present = [], mobile = false, className }: CaptureTabsProps) {
  const tabs: CaptureTab[] = [
    ...ALWAYS_TABS,
    ...(Object.entries(COND_TAB_SOURCE) as [CaptureTab, CaptureSource][])
      .filter(([, src]) => present.includes(src))
      .map(([tab]) => tab),
  ]
  return (
    <div className={cn('flex border-b border-foreground', mobile ? 'overflow-x-auto' : 'flex-wrap', className)} role="tablist">
      {tabs.map((tab) => {
        const active = tab === value
        const conditional = tab in COND_TAB_SOURCE
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(tab)}
            className={cn(
              'focusable flex shrink-0 items-center gap-1.5 whitespace-nowrap border-r border-hairline px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors last:border-r-0',
              active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span aria-hidden className={cn(!active && 'text-primary')}>{TAB_META[tab].icon}</span>
            {TAB_META[tab].label}
            {conditional && !active ? <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden /> : null}
          </button>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Tool panels (one per tab)
// ═══════════════════════════════════════════════════════════════════════════

export function AudioRecorderPanel({ mobile = false }: { mobile?: boolean }) {
  const [rec, setRec] = useState(false)
  return (
    <div className="rounded-xs border border-hairline bg-card">
      <ToolHead right={<button type="button" className="focusable rounded-xs border border-hairline px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:border-foreground hover:text-foreground"><Wand2 className="mr-1 inline" size={12} />Extract MIDI</button>}>
        Record Audio
      </ToolHead>
      <div className={cn('flex gap-3 p-3', mobile ? 'flex-col items-stretch' : 'items-center')}>
        <RecordButton recording={rec} onClick={() => setRec((r) => !r)} size={mobile ? 'lg' : 'md'} className={mobile ? 'self-center' : ''} />
        <Recess className={cn('flex items-center gap-3 px-3 py-2', mobile ? '' : 'flex-1')}>
          <span className="label-mono shrink-0 text-primary">{rec ? '● 00:12' : '00:12'}</span>
          <div className="min-w-0 flex-1 overflow-hidden"><Waveform accent playing={rec} bars={mobile ? 40 : 64} /></div>
        </Recess>
      </div>
    </div>
  )
}

export function MidiRecordPanel({ mobile = false, loop = true, preloaded }: { mobile?: boolean; loop?: boolean; preloaded?: 'extracted' | 'imported' }) {
  const [rec, setRec] = useState(false)
  const [mode, setMode] = useState('record')
  const [metro, setMetro] = useState(true)
  const [countIn, setCountIn] = useState(false)
  const [quantize, setQuantize] = useState(false)
  const [snap, setSnap] = useState(true)

  const title = preloaded
    ? preloaded === 'extracted' ? 'Extracted MIDI' : 'Imported MIDI'
    : 'Record MIDI'

  return (
    <div className="rounded-xs border border-hairline bg-card">
      <ToolHead right={preloaded ? <Badge tone="outline">{preloaded === 'extracted' ? 'From audio' : 'From .mid'}</Badge> : null}>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-recorder-red" aria-hidden />
          {title}
        </span>
      </ToolHead>

      <div className="space-y-4 p-3">
        {/* 1 · recording bar — the star; give it the room */}
        <MiniRoll loop={loop} height={mobile ? 'h-28' : 'h-36'} />

        {/* 2 · recording controls */}
        <div className="space-y-3">
          <div className={cn('flex gap-3', mobile ? 'flex-col items-stretch' : 'items-center')}>
            <RecordButton recording={rec} onClick={() => setRec((r) => !r)} className={mobile ? 'self-center' : ''} />
            <div className={cn('flex items-center gap-2', mobile && 'justify-center')}>
              <MonoLabel>Mode</MonoLabel>
              <SegmentedControl
                options={[{ value: 'record', label: 'Record' }, { value: 'overdub', label: 'Overdub' }]}
                value={mode}
                onChange={setMode}
              />
            </div>
            {!mobile && (
              <div className="ml-auto flex items-center gap-2">
                <button type="button" className="focusable rounded-xs border border-hairline px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:border-foreground hover:text-foreground"><Scissors className="mr-1 inline" size={12} />Trim start</button>
                <button type="button" className="focusable rounded-xs border border-hairline px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:border-foreground hover:text-foreground">Clear take</button>
              </div>
            )}
          </div>
          <div className={cn(mobile ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap items-center gap-x-4 gap-y-2')}>
            <Toggle label="Count-in" checked={countIn} onChange={setCountIn} />
            <Toggle label="Metronome" checked={metro} onChange={setMetro} />
            <Toggle label="Quantize" checked={quantize} onChange={setQuantize} />
            <Toggle label="Snap" checked={snap} onChange={setSnap} />
          </div>
          {mobile && (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="focusable rounded-xs border border-hairline py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:border-foreground hover:text-foreground"><Scissors className="mr-1 inline" size={12} />Trim start</button>
              <button type="button" className="focusable rounded-xs border border-hairline py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:border-foreground hover:text-foreground">Clear take</button>
            </div>
          )}
        </div>

        {/* 3 · loop range — secondary, compact */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-hairline pt-3">
          <MonoLabel>Loop</MonoLabel>
          <label className="flex items-center gap-1.5"><span className="text-[10px] text-muted-foreground">start</span><Input defaultValue="1.0" className="h-7 w-14 px-2 text-center font-mono text-xs" /></label>
          <label className="flex items-center gap-1.5"><span className="text-[10px] text-muted-foreground">length</span><Input defaultValue="4" className="h-7 w-12 px-2 text-center font-mono text-xs" /></label>
        </div>

        {/* 4 · device — least prominent */}
        {!preloaded && (
          <label className="flex items-center gap-2">
            <MonoLabel className="shrink-0">Device</MonoLabel>
            <Pick aria-label="MIDI device" options={[{ value: 'keystep', label: 'Arturia KeyStep' }, { value: 'minilogue', label: 'Minilogue XD' }]} className="h-7 max-w-52 flex-1 text-[11px]" defaultValue="keystep" />
          </label>
        )}
      </div>
    </div>
  )
}

export function MidiNoDevicePanel({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className="rounded-xs border border-hairline bg-card">
      <ToolHead>Record MIDI</ToolHead>
      <div className="p-3">
        <EmptyState
          icon={<Piano size={22} />}
          title="No MIDI controller detected"
          hint="Connect a device, or capture without one."
          action={
            <div className={cn('mt-1 flex gap-2', mobile ? 'w-full flex-col' : 'flex-wrap justify-center')}>
              <button type="button" className="focusable rounded-xs border-2 border-primary bg-primary px-3 py-2 text-xs font-bold uppercase tracking-wide text-primary-foreground">Use on-screen keys</button>
              <button type="button" className="focusable rounded-xs border border-foreground px-3 py-2 text-xs font-bold uppercase tracking-wide hover:bg-foreground hover:text-background">Import .mid file</button>
              <button type="button" className="focusable px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:text-primary"><RotateCcw className="mr-1 inline" size={12} />Re-scan</button>
            </div>
          }
        />
        <p className="mt-2 text-center label-mono text-muted-foreground">Web MIDI needs Chrome / Edge</p>
      </div>
    </div>
  )
}

export function StepInputPanel({ mobile = false }: { mobile?: boolean }) {
  const [input, setInput] = useState('commit')
  return (
    <div className="rounded-xs border border-hairline bg-card">
      <ToolHead
        right={
          <>
            <button type="button" className="focusable rounded-xs border border-foreground px-2 py-1 text-[10px] font-bold uppercase tracking-wide hover:bg-foreground hover:text-background"><Plus className="mr-0.5 inline" size={12} />Bar</button>
            <button type="button" className="focusable px-1.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:text-primary">Clear</button>
          </>
        }
      >
        Step Input
      </ToolHead>

      {/* timeline — bars with per-bar line controls; scrolls, keyboard stays docked */}
      <div className="max-h-[168px] space-y-2 overflow-y-auto p-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-stretch gap-2">
            <div className={cn('flex w-9 shrink-0 flex-col items-center justify-center rounded-xs border', n === 1 ? 'border-primary bg-primary/10' : 'border-hairline bg-panel')}>
              <span className="text-[8px] font-bold uppercase tracking-wide text-muted-foreground">Bar</span>
              <span className={cn('text-sm font-black', n === 1 && 'text-primary')}>{n}</span>
            </div>
            <MiniRoll className="flex-1" playhead={n === 1 ? 0.25 : -1} loop={false} />
            {!mobile && (
              <div className="flex flex-col justify-center gap-1">
                <IconButton aria-label={`Duplicate bar ${n}`} variant="ghost" size="sm"><Copy size={13} /></IconButton>
                <IconButton aria-label={`Delete bar ${n}`} variant="ghost" size="sm"><Trash2 size={13} /></IconButton>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* docked footer: keyboard + ordered controls */}
      <div className="border-t-2 border-foreground bg-panel">
        <div className="p-3 pb-0">
          <OnScreenKeyboard octave={mobile ? 4 : 3} octaves={mobile ? 1 : 2} highlighted={['F3', 'A3']} className={mobile ? 'h-28' : 'h-24'} />
        </div>
        <div className={cn('p-3', mobile ? 'space-y-3' : 'space-y-3')}>
          <div><MonoLabel>Chord</MonoLabel><div className="mt-1"><ChordChips mobile={mobile} /></div></div>
          <div className={cn('gap-x-6 gap-y-3', mobile ? 'space-y-3' : 'flex flex-wrap items-end')}>
            <div><MonoLabel>Octave</MonoLabel><div className="mt-1 flex gap-1">{[2, 3, 4, 5].map((o) => <SmallPick key={o} active={o === 3}>{o}</SmallPick>)}</div></div>
            <div><MonoLabel>Note length</MonoLabel><div className="mt-1 flex gap-1">{NOTE_LENGTHS.map((w) => <SmallPick key={w.value} active={w.value === '1'}>{w.label}</SmallPick>)}</div></div>
            <div className={mobile ? '' : ''}>
              <MonoLabel>Input</MonoLabel>
              <div className="mt-1"><SegmentedControl block={mobile} options={[{ value: 'preview', label: 'Preview' }, { value: 'commit', label: 'Commit' }]} value={input} onChange={setInput} /></div>
            </div>
            {!mobile && (
              <button type="button" className="focusable ml-auto self-end text-[10px] font-bold uppercase tracking-wide text-muted-foreground underline-offset-2 hover:text-primary hover:underline">Copy → MIDI Record</button>
            )}
          </div>
          {mobile && (
            <button type="button" className="focusable w-full rounded-xs border border-hairline py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:border-foreground hover:text-foreground">Copy → MIDI Record</button>
          )}
        </div>
      </div>
    </div>
  )
}

export function ImportPanel({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className="rounded-xs border border-hairline bg-card">
      <ToolHead>Import</ToolHead>
      <div className={cn('gap-3 p-3', mobile ? 'flex flex-col' : 'grid grid-cols-2')}>
        {[
          { icon: <FileAudio size={18} />, title: 'Import Audio', hint: 'WAV · MP3 · AIFF' },
          { icon: <FileMusic size={18} />, title: 'Import MIDI', hint: '.mid file' },
        ].map((b) => (
          <button
            key={b.title}
            type="button"
            className="focusable flex flex-col items-center justify-center gap-1.5 rounded-xs border border-dashed border-hairline bg-panel px-4 py-6 text-center transition-colors hover:border-foreground hover:bg-muted"
          >
            <span className="text-primary" aria-hidden>{b.icon}</span>
            <span className="text-sm font-bold uppercase tracking-wide">{b.title}</span>
            <span className="label-mono text-muted-foreground">{b.hint}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function AudioPlayerPanel({ mobile = false }: { mobile?: boolean }) {
  const [playing, setPlaying] = useState(false)
  return (
    <div className="rounded-xs border border-hairline bg-card">
      <ToolHead right={<button type="button" className="focusable rounded-xs border border-hairline px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:border-foreground hover:text-foreground"><Wand2 className="mr-1 inline" size={12} />Extract MIDI</button>}>
        <span className="inline-flex items-center gap-1.5">Imported Audio <Badge tone="outline">Read-only</Badge></span>
      </ToolHead>
      <div className={cn('flex items-center gap-3 p-3', mobile && 'flex-wrap')}>
        <IconButton aria-label={playing ? 'Pause' : 'Play'} shape="round" variant="outline" size="md" onClick={() => setPlaying((p) => !p)}>
          {playing ? <span className="text-xs">❚❚</span> : <span className="text-xs">▶</span>}
        </IconButton>
        <Recess className="flex flex-1 items-center gap-3 px-3 py-2">
          <div className="min-w-0 flex-1 overflow-hidden"><Waveform accent={false} bars={mobile ? 40 : 64} /></div>
          <span className="label-mono shrink-0 text-muted-foreground">0:00 / 3:41</span>
        </Recess>
      </div>
    </div>
  )
}

/** Renders the tool for the active tab. */
export function CaptureTabContent({ tab, mobile = false, midiDevice = true }: { tab: CaptureTab; mobile?: boolean; midiDevice?: boolean }) {
  switch (tab) {
    case 'record-audio':
      return <AudioRecorderPanel mobile={mobile} />
    case 'record-midi':
      return midiDevice ? <MidiRecordPanel mobile={mobile} /> : <MidiNoDevicePanel mobile={mobile} />
    case 'step-input':
      return <StepInputPanel mobile={mobile} />
    case 'import':
      return <ImportPanel mobile={mobile} />
    case 'extracted-midi':
      return <MidiRecordPanel mobile={mobile} preloaded="extracted" />
    case 'imported-midi':
      return <MidiRecordPanel mobile={mobile} preloaded="imported" />
    case 'imported-audio':
      return <AudioPlayerPanel mobile={mobile} />
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Play-sources bar
// ═══════════════════════════════════════════════════════════════════════════

export interface PlaySourcesBarProps {
  /** Sources present on the idea, in any order (rendered in the fixed order). */
  present: CaptureSource[]
  /** Currently-playing sources. */
  playing?: CaptureSource[]
  /** Sources that can't play right now (e.g. same-type already playing). */
  disabled?: CaptureSource[]
  onToggle?: (source: CaptureSource) => void
  mobile?: boolean
  className?: string
  /** Drop per-slot frames so a parent can own the outline. Default look unchanged. */
  embedded?: boolean
}

export function PlaySourcesBar({ present, playing = [], disabled = [], onToggle, className, embedded = false }: PlaySourcesBarProps) {
  // Always the same six slots. A slot is "live" (present-content) → prominent
  // and clickable; otherwise it's dimmed. Icons only, no labels.
  return (
    <div
      className={cn(embedded ? 'grid grid-cols-6' : 'grid grid-cols-6 gap-1.5', className)}
      role="group"
      aria-label="Play sources"
    >
      {SOURCE_ORDER.map((s) => {
        const live = present.includes(s)
        const isPlaying = playing.includes(s)
        const isDisabled = !live || disabled.includes(s)
        return (
          <button
            key={s}
            type="button"
            disabled={isDisabled}
            aria-pressed={isPlaying}
            aria-label={SOURCE_META[s].label}
            title={SOURCE_META[s].label}
            onClick={() => onToggle?.(s)}
            className={cn(
              'focusable flex h-9 items-center justify-center transition-colors',
              embedded
                ? cn(
                    'rounded-none border-r border-hairline last:border-r-0',
                    isPlaying
                      ? 'noise bg-primary text-primary-foreground'
                      : live
                        ? 'bg-card text-foreground hover:bg-muted hover:text-primary'
                        : 'cursor-not-allowed bg-panel text-muted-foreground/30',
                  )
                : cn(
                    'rounded-xs border',
                    isPlaying
                      ? 'noise border-primary bg-primary text-primary-foreground'
                      : live
                        ? 'border-foreground bg-card text-foreground hover:border-primary hover:text-primary'
                        : 'cursor-not-allowed border-hairline bg-panel text-muted-foreground/30',
                  ),
            )}
          >
            <span aria-hidden>{SOURCE_META[s].icon}</span>
          </button>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Metadata + actions
// ═══════════════════════════════════════════════════════════════════════════

function actionItems(location: 'pool' | 'song'): MenuOption[] {
  if (location === 'pool') {
    return [
      { label: 'Turn into Song', icon: <Sparkles size={15} /> },
      { label: 'Move to Song', icon: <FolderInput size={15} /> },
      { label: 'Copy to Song', icon: <Copy size={15} /> },
      { label: 'Copy into New Song', icon: <Plus size={15} /> },
    ]
  }
  return [
    { label: 'Move to Song', icon: <FolderInput size={15} /> },
    { label: 'Copy to Song', icon: <Copy size={15} /> },
    { label: 'Copy into New Song', icon: <Plus size={15} /> },
    { label: 'Move to Pool', icon: <ArrowLeftToLine size={15} /> },
    { label: 'Copy to Pool', icon: <Copy size={15} /> },
  ]
}

const INSTRUMENT_OPTS = [...INSTRUMENT_TYPES, { value: '__add', label: '+ Add new instrument…' }]

export interface CaptureMetadataProps {
  location?: 'pool' | 'song'
  mobile?: boolean
  className?: string
}

export function CaptureMetadata({ location = 'pool', mobile = false, className }: CaptureMetadataProps) {
  const [role, setRole] = useState('bassline')
  return (
    <div className={cn('space-y-3 rounded-xs border border-hairline bg-card p-3', className)}>
      <label className="block"><MonoLabel>Notes</MonoLabel><Textarea rows={2} defaultValue="Danelectro through the spring reverb — keep it loose." className="mt-1" /></label>
      <label className="block"><MonoLabel>Lyrics</MonoLabel><Textarea rows={2} placeholder="Add lyrics…" className="mt-1" /></label>

      <div className={cn('gap-3', mobile ? 'space-y-3' : 'grid grid-cols-3')}>
        <div>
          <MonoLabel>Key</MonoLabel>
          <div className="mt-1 flex gap-1.5">
            <Pick aria-label="Key root" options={KEY_ROOTS} defaultValue="D" className="flex-1" />
            <Pick aria-label="Key mode" options={KEY_MODES} defaultValue="minor" className="flex-1" />
          </div>
        </div>
        <label className="block"><MonoLabel>Tempo</MonoLabel><Input type="number" defaultValue={92} className="mt-1 h-8" /></label>
        <div><MonoLabel>Time Signature</MonoLabel><div className="mt-1"><Pick aria-label="Time signature" options={TIME_SIGNATURES} defaultValue="4/4" /></div></div>
      </div>

      <div>
        <MonoLabel>Role</MonoLabel>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {IDEA_ROLES.map((r) => (
            <Chip key={r.value} selected={role === r.value} onClick={() => setRole(r.value)}>{r.label}</Chip>
          ))}
        </div>
      </div>

      <div className={cn('gap-3', mobile ? 'space-y-3' : 'grid grid-cols-2')}>
        <div><MonoLabel>Section Intent</MonoLabel><div className="mt-1"><Pick aria-label="Section intent" options={SECTION_INTENTS} defaultValue="verse" /></div></div>
        <div><MonoLabel>Instrument</MonoLabel><div className="mt-1"><Pick aria-label="Instrument" options={INSTRUMENT_OPTS} defaultValue="bass" /></div></div>
      </div>

      <div>
        <MonoLabel>Attachments</MonoLabel>
        <div className="mt-1.5 space-y-2">
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2].map((i) => (
              <button key={i} type="button" className="focusable relative flex size-14 items-center justify-center overflow-hidden rounded-xs border border-hairline bg-gradient-to-br from-primary/80 to-foreground text-primary-foreground hover:border-foreground" aria-label={`Open image ${i + 1}`}>
                <ImageIcon size={16} className="opacity-80" />
              </button>
            ))}
          </div>
          {[
            { icon: <FileAudio size={14} />, name: 'balcony-rain.wav' },
            { icon: <Paperclip size={14} />, name: 'chart-scan.pdf' },
          ].map((f) => (
            <button key={f.name} type="button" className="focusable flex w-full items-center gap-2 rounded-xs border border-hairline bg-panel px-2.5 py-1.5 text-left text-xs font-medium hover:border-foreground">
              <span className="text-primary" aria-hidden>{f.icon}</span>
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
            </button>
          ))}
          <button type="button" className="focusable flex w-full items-center justify-center gap-1.5 rounded-xs border border-dashed border-hairline py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:border-foreground hover:text-foreground">
            <Upload size={13} /> Add attachment
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-hairline pt-3">
        <button type="button" className="focusable inline-flex items-center gap-1.5 rounded-xs border border-primary px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-primary hover:bg-primary hover:text-primary-foreground">
          <Trash2 size={13} /> Delete
        </button>
        <Menu
          label="Idea actions"
          items={actionItems(location)}
          trigger={
            <button type="button" className="focusable inline-flex items-center gap-1.5 rounded-xs border border-foreground px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide hover:bg-foreground hover:text-background">
              <SquarePen size={13} /> Actions
            </button>
          }
        />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Mobile studio readout → settings sheet
// ═══════════════════════════════════════════════════════════════════════════

function MobileStudioReadout() {
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [loop, setLoop] = useState(true)
  // Transport (play, restart, loop, undo/redo) stays exposed on the bar;
  // only the settings — tempo/time-sig/grid/patch — collapse behind the ⋯ readout.
  return (
    <>
      {/* transport — identical buttons/icons to the desktop StudioBar strip */}
      <div className="flex items-center gap-1.5 border-b border-hairline bg-panel px-2 py-2">
        <IconButton aria-label={playing ? 'Pause' : 'Play'} variant={playing ? 'solid' : 'outline'} size="sm" onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </IconButton>
        <IconButton aria-label="Restart" variant="ghost" size="sm"><RotateCcw size={15} /></IconButton>
        <IconButton aria-label="Loop" aria-pressed={loop} variant={loop ? 'solid' : 'ghost'} size="sm" onClick={() => setLoop((v) => !v)}><Repeat size={15} /></IconButton>
        <span className="mx-0.5 h-5 w-px bg-hairline" aria-hidden />
        <IconButton aria-label="Undo" variant="ghost" size="sm"><Undo2 size={15} /></IconButton>
        <IconButton aria-label="Redo" variant="ghost" size="sm"><Redo2 size={15} /></IconButton>
        <button type="button" onClick={() => setOpen(true)} className="focusable ml-auto flex items-center gap-1.5 rounded-xs border border-hairline bg-card px-2.5 py-1.5" aria-label="Studio settings">
          <span className="label-mono text-foreground">92 · 4/4</span>
          <span className="leading-none text-muted-foreground">⋯</span>
        </button>
      </div>
      {open && (
        <div className="absolute inset-0 z-20 flex flex-col justify-end bg-foreground/40">
          <div className="border-t-2 border-foreground bg-card">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <span className="font-display text-xs font-extrabold uppercase tracking-wide">Studio settings</span>
              <IconButton aria-label="Close settings" variant="ghost" size="sm" onClick={() => setOpen(false)}><span className="text-sm">✕</span></IconButton>
            </div>
            {/* settings only — two dropdowns per line, roomy */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 p-4">
              <label className="block"><MonoLabel className="mb-1.5 block">Time</MonoLabel><Pick aria-label="Time signature" options={TIME_SIGNATURES} defaultValue="4/4" className="h-10" /></label>
              <label className="block"><MonoLabel className="mb-1.5 block">Tempo</MonoLabel><Input type="number" defaultValue={92} className="h-10" /></label>
              <label className="block"><MonoLabel className="mb-1.5 block">Grid</MonoLabel><Pick aria-label="Grid" options={QUANTIZE_OPTIONS} defaultValue="0.25" className="h-10" /></label>
              <label className="block"><MonoLabel className="mb-1.5 block">Patch</MonoLabel><Pick aria-label="Patch" options={SYNTH_PATCHES} defaultValue="bass" className="h-10" /></label>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Composed surface
// ═══════════════════════════════════════════════════════════════════════════

export interface CaptureSurfaceProps {
  mobile?: boolean
  /** Initial active tab. */
  tab?: CaptureTab
  /** Sources present on the idea (drives conditional tabs + play bar). */
  present?: CaptureSource[]
  /** Sources currently playing (play bar state). */
  playing?: CaptureSource[]
  /** Idea location — governs the Actions menu. */
  location?: 'pool' | 'song'
  /** Whether a MIDI controller is connected (Record MIDI tab). */
  midiDevice?: boolean
  className?: string
}

export function CaptureSurface({
  mobile = false,
  tab = 'record-midi',
  present = ['midi-recording'],
  playing = [],
  location = 'pool',
  midiDevice = true,
  className,
}: CaptureSurfaceProps) {
  const [active, setActive] = useState<CaptureTab>(tab)
  // if the active conditional tab loses its source it would vanish; keep it simple for the kit
  return (
    <div className={cn('flex flex-col', className)}>
      <CaptureTabs value={active} onChange={setActive} present={present} mobile={mobile} />
      {mobile ? <MobileStudioReadout /> : <div className="border-b border-hairline p-3"><StudioBar /></div>}
      <div className="space-y-3 p-3">
        <CaptureTabContent tab={active} mobile={mobile} midiDevice={midiDevice} />
        <PlaySourcesBar present={present} playing={playing} mobile={mobile} />
        <CaptureMetadata location={location} mobile={mobile} />
      </div>
    </div>
  )
}
