import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import {
  Album,
  AudioLines,
  Command,
  Copy,
  Import,
  Mic,
  Music2,
  Pencil,
  Piano,
  Plus,
  Search,
  Trash2,
  Wand2,
} from 'lucide-react'
import { Noise } from './Noise'
import {
  ALBUM_STATUSES,
  BLOCK_WIDTHS,
  Badge,
  Length,
  BeatLane,
  Button,
  Checkbox,
  Chip,
  CHORD_TYPES,
  EmptyState,
  Field,
  IconButton,
  IDEA_ROLES,
  Input,
  KEY_MODES,
  MonoLabel,
  OnScreenKeyboard,
  PageHeader,
  Panel,
  Pick,
  QUANTIZE_OPTIONS,
  Radio,
  Recess,
  RecordButton,
  PlayButton,
  RuleHeader,
  RedBar,
  SearchBar,
  SECTION_INTENTS,
  SegmentedControl,
  TabSwitcher,
  SONG_STATUSES,
  StatusStepper,
  StudioBar,
  SYNTH_PATCHES,
  TIME_SIGNATURES,
  Textarea,
  Toggle,
  TodoRow,
  AudioVersionRow,
  IdeaCard,
  IdeaRow,
  SongRow,
  Menu,
  SongCard,
  AlbumCard,
  EmptyLibraryCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type TableSort,
  Window,
} from './index'

const LucideIconGallery = lazy(() => import('./LucideIconGallery'))

// ═══════════════════════════════════════════════════════════════════════════
// Local layout helpers — the catalog scaffold (not part of the kit itself).
// ═══════════════════════════════════════════════════════════════════════════

function KitSection({ no, title, kicker, children }: { no: string; title: string; kicker?: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <header className="mb-10">
        <RuleHeader title={no} subtitle={kicker} className="mb-3" />
        <h2 className="font-display text-3xl font-black uppercase tracking-tight md:text-4xl">{title}</h2>
      </header>
      {children}
    </section>
  )
}

function Spec({ name, note, children }: { name: string; note?: string; children: ReactNode }) {
  return (
    <div className="border-t border-hairline pt-3">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-sm font-extrabold uppercase tracking-wide">{name}</h3>
        {note ? <MonoLabel className="text-right">{note}</MonoLabel> : null}
      </div>
      {children}
    </div>
  )
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>
}

// ═══════════════════════════════════════════════════════════════════════════
// Reference data for the foundations sections
// ═══════════════════════════════════════════════════════════════════════════

const COLORS: { token: string; light: string; dark: string; role: string }[] = [
  { token: '--background', light: '#efe9dd', dark: '#14120d', role: 'Page ground' },
  { token: '--deeper', light: '#c2bcaa', dark: '#171512', role: 'Desktop nav chrome' },
  { token: '--foreground', light: '#17150f', dark: '#ece5d5', role: 'Ink / text' },
  { token: '--card', light: '#f5f0e6', dark: '#1c1913', role: 'Panel fill' },
  { token: '--panel', light: '#e6dfd0', dark: '#24201a', role: 'Header / inset fill' },
  { token: '--primary', light: '#e5330c', dark: '#f4471f', role: 'Vermillion accent' },
  { token: '--recorder-red', light: '#cd1a1a', dark: '#cd1a1a', role: 'Record controls & dots' },
  { token: '--muted', light: '#ded6c5', dark: '#2a251d', role: 'Muted fill' },
  { token: '--muted-foreground', light: '#6a6355', dark: '#9a917d', role: 'Muted text' },
  { token: '--border', light: '#cbc2ae', dark: '#342e24', role: 'Border' },
  { token: '--hairline', light: '#b7ad96', dark: '#453d2f', role: 'Hairline rule' },
  { token: '--keys-white', light: '#f5f0e6', dark: '#ded6c5', role: 'White keys' },
  { token: '--keys-black', light: '#17150f', dark: '#0c0a07', role: 'Black keys' },
  { token: '--deepest', light: '#17150f', dark: '#0c0a07', role: 'Studio transport / deepest fill' },
]

const TYPE_SCALE: { label: string; cls: string; sample: string; spec: string }[] = [
  { label: 'Display XL', cls: 'font-display text-5xl font-black uppercase tracking-tight', sample: 'Liner Notes', spec: 'Archivo Expanded · 900 · 3rem · tracking-tight' },
  { label: 'Display L', cls: 'font-display text-3xl font-black uppercase tracking-tight', sample: 'Song Workspace', spec: 'Archivo Expanded · 900 · 1.875rem' },
  { label: 'Heading', cls: 'font-display text-sm font-extrabold uppercase tracking-wide', sample: 'Quick Capture', spec: 'Archivo Expanded · 800 · 0.875rem' },
  { label: 'Body', cls: 'text-base', sample: 'A neutral neo-grotesque for interface copy and running text.', spec: 'Archivo · 400 · 1rem · 1.5' },
  { label: 'Body Small', cls: 'text-sm text-muted-foreground', sample: 'Secondary and helper text sits one step down.', spec: 'Archivo · 400 · 0.875rem' },
  { label: 'Mono Label', cls: 'label-mono', sample: 'Tempo · 120 BPM', spec: 'Space Mono · 400 · 0.6875rem · 0.14em · UPPER' },
]

const TABLE_SPEC_ROWS = [
  { name: 'Jazz Bass', kind: 'Bass', year: 1960 },
  { name: 'Casio CT-X700', kind: 'Keys', year: 2018 },
  { name: 'Massive', kind: 'Synth', year: 2007 },
]

const IDEA_SPEC_ROWS = [
  { role: 'Bassline', title: 'Bassline — Dm — 92 BPM', ideaKey: 'Dm', tempo: 92, tracks: 1, lastWorked: '2h ago', updatedAt: 2 },
  { role: 'Melody', title: 'Falling in the dark, again', ideaKey: 'Am', tempo: 108, tracks: 1, lastWorked: '1d ago', updatedAt: 24 },
  { role: 'Sample', title: 'Rain loop off the balcony', ideaKey: null as string | null, tempo: null as number | null, tracks: null as number | null, lastWorked: '3d ago', updatedAt: 72 },
]

// ═══════════════════════════════════════════════════════════════════════════
// The catalog page
// ═══════════════════════════════════════════════════════════════════════════

export default function KitPage() {
  // interactive demo state
  const [mode, setMode] = useState('audio')
  const [metro, setMetro] = useState(true)
  const [count, setCount] = useState(false)
  const [role, setRole] = useState('bassline')
  const [chord, setChord] = useState('minor')
  const [rec, setRec] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [songStatus, setSongStatus] = useState('production')
  const [albumStatus, setAlbumStatus] = useState('in-progress')
  const [notes, setNotes] = useState<string[]>(['C4', 'D#4', 'G4'])
  const [keyMode, setKeyMode] = useState('minor')
  const [todoDone, setTodoDone] = useState(false)
  const [main, setMain] = useState(true)
  const [tableSort, setTableSort] = useState<TableSort | null>(null)
  const [ideaTableSort, setIdeaTableSort] = useState<TableSort | null>(null)
  const [view, setView] = useState('cards')

  const captureModes = [
    { value: 'audio', label: 'Audio' },
    { value: 'midi', label: 'MIDI' },
    { value: 'notes', label: 'Notes' },
    { value: 'text', label: 'Text' },
    { value: 'photo', label: 'Photo' },
  ]

  function toggleNote(n: string) {
    setNotes((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]))
  }

  const tableSpecRows = useMemo(() => {
    if (!tableSort) {
      return TABLE_SPEC_ROWS
    }
    const direction = tableSort.direction === 'asc' ? 1 : -1
    return [...TABLE_SPEC_ROWS].sort((a, b) => {
      if (tableSort.column === 'name') return a.name.localeCompare(b.name) * direction
      if (tableSort.column === 'kind') return a.kind.localeCompare(b.kind) * direction
      if (tableSort.column === 'year') return (a.year - b.year) * direction
      return 0
    })
  }, [tableSort])

  const ideaSpecRows = useMemo(() => {
    if (!ideaTableSort) {
      return IDEA_SPEC_ROWS
    }
    const direction = ideaTableSort.direction === 'asc' ? 1 : -1
    return [...IDEA_SPEC_ROWS].sort((a, b) => {
      if (ideaTableSort.column === 'role') return a.role.localeCompare(b.role) * direction
      if (ideaTableSort.column === 'title') return a.title.localeCompare(b.title) * direction
      if (ideaTableSort.column === 'key') {
        const left = a.ideaKey ?? ''
        const right = b.ideaKey ?? ''
        if (!left && !right) return 0
        if (!left) return 1
        if (!right) return -1
        return left.localeCompare(right) * direction
      }
      if (ideaTableSort.column === 'tempo') {
        if (a.tempo == null && b.tempo == null) return 0
        if (a.tempo == null) return 1
        if (b.tempo == null) return -1
        return (a.tempo - b.tempo) * direction
      }
      if (ideaTableSort.column === 'tracks') {
        if (a.tracks == null && b.tracks == null) return 0
        if (a.tracks == null) return 1
        if (b.tracks == null) return -1
        return (a.tracks - b.tracks) * direction
      }
      if (ideaTableSort.column === 'updated') {
        return (a.updatedAt - b.updatedAt) * direction
      }
      return 0
    })
  }, [ideaTableSort])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Type scale ─────────────────────────────────────────────────── */}
      <KitSection no="K.015" title="Rule Header" kicker="title · optional subtitle">
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
          Vermillion mono title, a 1px primary rule, optional muted subtitle. Tokens follow{' '}
          <code className="font-mono">.dark</code> — paper light and studio dark. Use for page
          sections (<code className="font-mono">Recent</code>) and catalog marks (
          <code className="font-mono">K.01</code>).
        </p>
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <MonoLabel>Title only</MonoLabel>
            <RuleHeader title="Recent" />
          </div>
          <div className="space-y-2">
            <MonoLabel>Title + subtitle</MonoLabel>
            <RuleHeader title="K.01" subtitle="Archivo · Archivo Expanded · Space Mono" />
          </div>
        </div>
      </KitSection>

      <KitSection no="K.016" title="Page Header" kicker="rule · title · rule · optional CTA">
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
          List-page masthead. Locked to <code className="font-mono">h-16</code> — the same height as
          the sidebar brand bar. Title is Display L (<code className="font-mono">text-3xl</code>) with{' '}
          <code className="font-mono">leading-none</code>, flanked by 2px vermillion rules. The left
          stub replaces the old icon slot; the right rule runs to the button (or the edge). Pass a{' '}
          <code className="font-mono">Button variant=&quot;secondary&quot; size=&quot;sm&quot;</code> in{' '}
          <code className="font-mono">action</code> for create pages; omit it on docs/dev pages.
        </p>
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <MonoLabel>With CTA</MonoLabel>
            <PageHeader
              title="Songs"
              action={
                <Button variant="secondary" size="sm">
                  + New Song
                </Button>
              }
            />
          </div>
          <div className="space-y-2">
            <MonoLabel>Title only</MonoLabel>
            <PageHeader title="Calibration" />
          </div>
        </div>
      </KitSection>

      <KitSection no="K.01" title="Typography" kicker="Archivo · Archivo Expanded · Space Mono">
        <div className="flex flex-col gap-6">
          {TYPE_SCALE.map((t) => (
            <div key={t.label} className="grid gap-2 border-t border-hairline pt-4 md:grid-cols-[10rem_1fr]">
              <MonoLabel className="pt-1">{t.label}</MonoLabel>
              <div>
                <p className={t.cls}>{t.sample}</p>
                <p className="label-mono mt-2 text-muted-foreground">{t.spec}</p>
              </div>
            </div>
          ))}
        </div>
      </KitSection>

      {/* ── Color ──────────────────────────────────────────────────────── */}
      <KitSection no="K.02" title="Color Tokens" kicker="Light hex / Dark hex">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLORS.map((c) => (
            <div key={c.token} className="flex items-center gap-3 rounded-xs border border-hairline bg-card p-2">
              <span
                className="size-12 shrink-0 rounded-xs border border-hairline"
                style={{ backgroundColor: `var(${c.token})` }}
              />
              <div className="min-w-0">
                <p className="label-mono text-foreground">{c.token}</p>
                <p className="text-xs text-muted-foreground">{c.role}</p>
                <p className="label-mono text-muted-foreground">
                  {c.light} · {c.dark}
                </p>
              </div>
            </div>
          ))}
        </div>
      </KitSection>

      {/* ── Noise base concept ─────────────────────────────────────────── */}
      <KitSection no="K.025" title="Noise" kicker="one grain · any element">
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
          A single grayscale grain tile lives in <code className="font-mono">--grain-image</code> and is
          reused everywhere. Apply it with a utility class on any solid fill, or drop the{' '}
          <code className="font-mono">&lt;Noise/&gt;</code> overlay over anything that can't host a
          pseudo-element (images, gradients). Tune with{' '}
          <code className="font-mono">--grain-size / --grain-opacity / --grain-blend / --grain-mask</code>.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { cls: 'noise-flat', name: '.noise-flat', note: 'uniform · the base' },
            { cls: 'noise', name: '.noise', note: 'feathered corner' },
            { cls: 'noise-strong', name: '.noise-strong', note: 'dense · dark fills' },
          ].map((v) => (
            <div key={v.cls} className={`${v.cls} flex h-28 flex-col justify-end rounded-xs bg-primary p-3 text-primary-foreground`}>
              <span className="label-mono">{v.name}</span>
              <span className="text-xs opacity-80">{v.note}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {/* grain over neutral fills */}
          <div className="noise-flat flex h-24 items-center justify-center rounded-xs border border-hairline bg-muted">
            <span className="label-mono text-muted-foreground">on muted</span>
          </div>
          {/* <Noise> overlay over a gradient (no solid fill / pseudo available) */}
          <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-xs border border-hairline bg-gradient-to-br from-primary to-foreground">
            <span className="label-mono relative z-[2] text-primary-foreground">&lt;Noise over/&gt;</span>
            <Noise variant="flat" over />
          </div>
          <div className="noise flex h-24 items-center justify-center rounded-xs border border-foreground bg-card">
            <span className="label-mono text-muted-foreground">on card</span>
          </div>
        </div>
      </KitSection>

      {/* ── Space / radius / shadow / outline ──────────────────────────── */}
      <KitSection no="K.03" title="Space · Radius · Elevation">
        <div className="grid gap-8 md:grid-cols-3">
          <Spec name="Radius" note="--radius 2px">
            <div className="flex items-end gap-3">
              {[
                { c: 'rounded-xs', l: '1px' },
                { c: 'rounded-sm', l: '2px' },
                { c: 'rounded-md', l: '6px' },
                { c: 'rounded-full', l: 'pill' },
              ].map((r) => (
                <div key={r.l} className="flex flex-col items-center gap-1.5">
                  <span className={`size-12 border border-hairline bg-muted ${r.c}`} />
                  <MonoLabel>{r.l}</MonoLabel>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Square by default — components use <code className="font-mono">rounded-xs</code>. Round only for
              knobs, record dots, radios.
            </p>
          </Spec>

          <Spec name="Spacing" note="4px base scale">
            <div className="flex items-end gap-3">
              {[1, 2, 3, 4, 6].map((s) => (
                <div key={s} className="flex flex-col items-center gap-1.5">
                  <span className="bg-primary" style={{ width: s * 4, height: s * 4 }} />
                  <MonoLabel>{s * 4}</MonoLabel>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Panels pad <code className="font-mono">p-3</code>; rows <code className="font-mono">px-2 py-1.5</code>;
              sections <code className="font-mono">py-14</code>.
            </p>
          </Spec>

          <Spec name="Borders & Elevation" note="hairline · inset · hard shadow">
            <div className="flex flex-col gap-4">
              <div className="rounded-xs border border-hairline bg-card px-3 py-2 text-xs">border-hairline · flat panel</div>
              <Recess className="px-3 py-2 text-xs">inset well · shadow-[inset…] recess</Recess>
              <div className="noise shadow-hard rounded-xs border border-foreground bg-card px-3 py-2 text-xs">
                <code className="font-mono">.shadow-hard</code> · 6px vermillion offset + noise
              </div>
              <div className="shadow-noise rounded-xs">
                <div className="scheme-inverse noise rounded-xs border border-hairline bg-card px-3 py-2 text-xs text-foreground">
                  <code className="font-mono">.shadow-noise</code> · 6px grain drop · inverse fill
                </div>
              </div>
              <div className="shadow-hard-press rounded-xs border border-foreground bg-card px-3 py-2 text-xs">
                <code className="font-mono">.shadow-hard-press</code> · hover / press me
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Two depth systems: inset wells (readouts) and the signature <strong>hard vermillion drop
              shadow</strong> — a sharp, blur-less block for raised surfaces. Fills carry <code className="font-mono">.noise</code> tooth. Focus is a 2px vermillion outline.
            </p>
          </Spec>
        </div>
      </KitSection>

      <div className="mx-auto max-w-6xl px-6"><RedBar /></div>

      {/* ── Buttons ────────────────────────────────────────────────────── */}
      <KitSection no="K.04" title="Buttons" kicker="Button · IconButton · PlayButton · RecordButton">
        <div className="grid gap-8">
          <Spec name="Button — variants" note="primary · secondary · outline · ghost · danger · link">
            <Row>
              <Button variant="primary">Save to Pool</Button>
              <Button variant="secondary">Add Section</Button>
              <Button variant="outline">+ 12 More Ideas</Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="danger">Delete</Button>
              <Button variant="link">Copy to MIDI Record</Button>
            </Row>
          </Spec>
          <Spec name="Button — outline block" note="full-width hairline · load-more">
            <Button variant="outline" block onClick={() => undefined}>
              + 12 More Ideas
            </Button>
          </Spec>
          <Spec name="Button — sizes & states" note="sm · md · lg">
            <Row>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button icon={<Plus size={15} />}>With Icon</Button>
              <Button disabled>Disabled</Button>
            </Row>
          </Spec>
          <Spec name="IconButton" note="square / round · solid · outline · ghost">
            <Row>
              <IconButton aria-label="Add" variant="solid"><Plus size={16} /></IconButton>
              <IconButton aria-label="Search" variant="outline"><Search size={16} /></IconButton>
              <IconButton aria-label="Import" variant="ghost"><Import size={16} /></IconButton>
              <IconButton aria-label="Command" shape="round" variant="outline"><Command size={16} /></IconButton>
              <IconButton aria-label="Piano" shape="round" variant="ghost" size="lg"><Piano size={18} /></IconButton>
            </Row>
          </Spec>
          <Spec name="PlayButton" note="round vermillion · hollow triangle">
            <Row>
              <PlayButton aria-label="Play" playing={false} onClick={() => undefined} />
              <PlayButton aria-label="Pause" playing onClick={() => undefined} />
              <PlayButton aria-label="Play disabled" playing={false} disabled />
            </Row>
          </Spec>
          <Spec name="RecordButton" note="idle → recording (pulses)">
            <Row>
              <RecordButton recording={rec} onClick={() => setRec((r) => !r)} />
              <RecordButton recording={rec} size="lg" shape="square" onClick={() => setRec((r) => !r)} />
              <span className="text-xs text-muted-foreground">Click to toggle · {rec ? 'RECORDING' : 'idle'}</span>
            </Row>
          </Spec>
        </div>
      </KitSection>

      {/* ── Selection controls ─────────────────────────────────────────── */}
      <KitSection no="K.05" title="Selection" kicker="Segmented · Tabs · Toggle · Chip · Length · Pick">
        <div className="grid gap-8">
          <Spec name="SegmentedControl" note="capture modes">
            <div className="flex flex-col gap-3">
              <SegmentedControl options={captureModes} value={mode} onChange={setMode} />
              <SegmentedControl block options={KEY_MODES} value={keyMode} onChange={setKeyMode} />
            </div>
          </Spec>
          <Spec name="TabSwitcher" note="view / section tabs · vermillion rule">
            <TabSwitcher
              options={[
                { value: 'cards', label: 'Cards' },
                { value: 'table', label: 'Table' },
              ]}
              value={view}
              onChange={setView}
            />
          </Spec>
          <Spec name="Toggle" note="metronome · count-in">
            <Row>
              <Toggle label="Metronome" checked={metro} onChange={setMetro} />
              <Toggle label="Count-in" checked={count} onChange={setCount} />
              <Toggle label="Disabled" checked={false} disabled />
            </Row>
          </Spec>
          <Spec name="Chip / Pill — roles" note="single-select">
            <div className="flex flex-wrap gap-2">
              {IDEA_ROLES.map((r) => (
                <Chip key={r.value} selected={role === r.value} onClick={() => setRole(r.value)}>
                  {r.label}
                </Chip>
              ))}
            </div>
          </Spec>
          <Spec name="Chip — section intents" note="accent tone">
            <div className="flex flex-wrap gap-2">
              {SECTION_INTENTS.map((s) => (
                <Chip key={s.value} tone="accent">{s.label}</Chip>
              ))}
            </div>
          </Spec>
          <Spec name="Chip — chord types" note="note picker">
            <div className="flex flex-wrap gap-2">
              {CHORD_TYPES.map((c) => (
                <Chip key={c.value} selected={chord === c.value} onClick={() => setChord(c.value)}>
                  {c.label}
                </Chip>
              ))}
            </div>
          </Spec>
          <Spec name="Badge — statuses" note="non-interactive">
            <Row>
              <Badge tone="accent">Released</Badge>
              <Badge tone="neutral">Sketch</Badge>
              <Badge tone="outline">Pool</Badge>
            </Row>
          </Spec>
          <Spec name="Length" note="mm:ss chip · used everywhere duration is shown">
            <Row>
              <Length>0:42</Length>
              <Length>1:24</Length>
              <Length>3:12</Length>
              <Length>32:14</Length>
            </Row>
          </Spec>
          <Spec name="Pick — native select" note="patch · grid · time · key">
            <div className="grid max-w-xl grid-cols-2 gap-3 md:grid-cols-4">
              <Pick label="Patch" options={SYNTH_PATCHES} defaultValue="piano" />
              <Pick label="Grid" options={QUANTIZE_OPTIONS} defaultValue="0.25" />
              <Pick label="Time" options={TIME_SIGNATURES} defaultValue="4/4" />
              <Pick label="Width" options={BLOCK_WIDTHS} defaultValue="1" />
            </div>
          </Spec>
        </div>
      </KitSection>

      {/* ── Forms ──────────────────────────────────────────────────────── */}
      <KitSection no="K.06" title="Forms & Fields" kicker="Field · Input · SearchBar · Textarea · Checkbox · Radio">
        <div className="grid gap-8">
          <Spec name="SearchBar" note="leading icon box · panel fill · flush field">
            <div className="max-w-md">
              <SearchBar placeholder="Search" />
            </div>
          </Spec>
          <Panel className="p-5">
          <form className="grid gap-5 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
            <Field label="Idea Title" htmlFor="f-title">
              <Input id="f-title" placeholder="Bassline — Dm — 92 BPM" />
            </Field>
            <Field label="Instrument" htmlFor="f-inst" hint="Free text, e.g. 'Jazzmaster'">
              <Input id="f-inst" placeholder="Instrument name" />
            </Field>
            <Field label="Lyrics / Notes" htmlFor="f-notes" className="md:col-span-2">
              <Textarea id="f-notes" rows={3} placeholder="Jot a line…" />
            </Field>
            <div className="flex flex-col gap-2">
              <MonoLabel>Content Blocks</MonoLabel>
              <Checkbox label="Audio recording" defaultChecked />
              <Checkbox label="MIDI capture" />
              <Checkbox label="Note picker" defaultChecked />
            </div>
            <div className="flex flex-col gap-2">
              <MonoLabel>Save Target</MonoLabel>
              <Radio name="target" label="Save to Pool" defaultChecked />
              <Radio name="target" label="Save to Song" />
              <Radio name="target" label="Save to Section" />
            </div>
            <div className="flex gap-3 md:col-span-2">
              <Button type="submit">Save Idea</Button>
              <Button type="reset" variant="ghost">Reset</Button>
            </div>
          </form>
        </Panel>
        </div>
      </KitSection>

      <div className="mx-auto max-w-6xl px-6"><RedBar /></div>

      {/* ── Surfaces ───────────────────────────────────────────────────── */}
      <KitSection no="K.07" title="Surfaces" kicker="Panel · Recess · Window · RedBar · EmptyState">
        <div className="grid gap-6 md:grid-cols-2">
          <Panel className="p-4">
            <MonoLabel>Panel</MonoLabel>
            <p className="mt-2 text-sm text-muted-foreground">Hairline-framed card on the card fill. The default surface for grouped content.</p>
          </Panel>
          <Recess className="p-4">
            <MonoLabel>Recess</MonoLabel>
            <p className="mt-2 text-sm text-muted-foreground">Inset well for readouts and piano rolls — depth via inset shadow, not lift.</p>
          </Recess>
          <Window title="Chord Picker" right={<Badge tone="accent">Live</Badge>}>
            <p className="text-sm text-muted-foreground">Titled panel with a mono header bar. Used for the chord window and dialogs.</p>
          </Window>
          <EmptyState
            icon={<Music2 size={28} />}
            title="No ideas yet"
            hint="Capture your first idea — audio, MIDI, or a few notes."
            action={<Button size="sm" icon={<Plus size={14} />}>Capture</Button>}
          />
        </div>

        <Spec name="Raised surfaces" note="vermillion hard · grain inverse">
          <div className="grid gap-8 md:grid-cols-2">
            <Panel raised className="p-4">
              <MonoLabel>Panel · raised</MonoLabel>
              <p className="mt-2 text-sm text-muted-foreground">
                The <code className="font-mono">raised</code> prop lifts the panel onto the hard vermillion shadow with a foreground border — used for dialogs and pop-outs.
              </p>
            </Panel>
            <Panel raised="noise" className="p-4">
              <MonoLabel>Panel · raised=&quot;noise&quot;</MonoLabel>
              <p className="mt-2 text-sm text-muted-foreground">
                Inverse fill (paper on dark, studio on light) with a grain drop instead of vermillion. Menu pop-out uses this.
              </p>
            </Panel>
            <Window raised title="Quick Capture" right={<Badge tone="accent">Modal</Badge>}>
              <p className="text-sm text-muted-foreground">Dialog framing: header bar carries noise, body sits on the hard shadow.</p>
            </Window>
          </div>
        </Spec>
      </KitSection>

      {/* ── Studio ─────────────────────────────────────────────────────── */}
      <KitSection no="K.08" title="Studio" kicker="StudioBar · OnScreenKeyboard · BeatLane">
        <div className="grid gap-8">
          <Spec name="StudioBar" note="shared transport + ledger">
            <StudioBar
              playing={playing}
              onPlayToggle={() => setPlaying((p) => !p)}
              loop
              tempo={120}
            />
          </Spec>
          <Spec name="OnScreenKeyboard" note="click to toggle notes">
            <div className="max-w-xl">
              <OnScreenKeyboard octave={4} highlighted={notes} onNote={toggleNote} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {notes.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No notes selected</span>
                ) : (
                  notes.map((n) => <Badge key={n} tone="outline">{n}</Badge>)
                )}
              </div>
            </div>
          </Spec>
          <Spec name="BeatLane" note="mini piano-roll bar · 4/4">
            <div className="max-w-xl">
              <BeatLane
                label="Bar 1"
                beats={4}
                blocks={[
                  { start: 0, width: 1, label: 'C2', active: true },
                  { start: 1.5, width: 0.5, label: 'D#2' },
                  { start: 2, width: 2, label: 'G2' },
                ]}
              />
            </div>
          </Spec>
        </div>
      </KitSection>

      {/* ── Library ────────────────────────────────────────────────────── */}
      <KitSection no="K.09" title="Library" kicker="StatusStepper · IdeaCard · SongCard · AlbumCard · Menu">
        <div className="grid gap-8">
          <Spec name="StatusStepper — song" note="7 stages · click to set">
            <StatusStepper stages={SONG_STATUSES} value={songStatus} onChange={setSongStatus} />
          </Spec>
          <Spec name="StatusStepper — album" note="3 stages">
            <StatusStepper stages={ALBUM_STATUSES} value={albumStatus} onChange={setAlbumStatus} />
          </Spec>
          <Spec name="IdeaCard" note="pool atom">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <IdeaCard role="Bassline" title="Bassline — Dm — 92 BPM" instrument="Jazz Bass" location="Pool" timestamp="2h ago" media={['audio', 'midi']} />
              <IdeaCard role="Melody" title="Falling in the dark, again" instrument="Synth Lead" location="Nightdrive" timestamp="1d ago" media={['midi']} />
              <IdeaCard role="Sample" title="Rain loop off the balcony" location="Pool" timestamp="3d ago" media={['audio', 'image']} />
            </div>
          </Spec>
          <Spec name="SongCard" note="Figma variant 3 · raised · to-do hidden at 0 · play only with a file">
            <div className="grid gap-8 sm:grid-cols-2">
              <SongCard
                title="Static Bloom"
                status="Mixing"
                lastWorked="5h ago"
                todoCount={3}
                length="4:12"
                artwork="/kit/song-artwork.svg"
                menuItems={[
                  { label: 'Add to album', icon: <Album size={15} />, onSelect: () => undefined },
                  { label: 'Delete', icon: <Trash2 size={15} />, destructive: true, onSelect: () => undefined },
                ]}
                onPlay={() => undefined}
              />
              <SongCard
                title="Glass Highway"
                status="Arranging"
                lastWorked="1d ago"
                menuItems={[
                  { label: 'Add to album', icon: <Album size={15} />, onSelect: () => undefined },
                  { label: 'Delete', icon: <Trash2 size={15} />, destructive: true, onSelect: () => undefined },
                ]}
              />
            </div>
          </Spec>
          <Spec name="AlbumCard" note="same as SongCard · track count · no play/length">
            <div className="grid gap-8 sm:grid-cols-2">
              <AlbumCard
                title="Night Drive"
                status="In progress"
                trackCount={8}
                timestamp="3d ago"
                artworkUrl="/kit/album-artwork.svg"
                menuItems={[{ label: 'Delete', icon: <Trash2 size={15} />, destructive: true, onSelect: () => undefined }]}
              />
              <AlbumCard
                title="Glass Highway"
                status="Draft"
                trackCount={0}
                timestamp="1d ago"
                menuItems={[{ label: 'Delete', icon: <Trash2 size={15} />, destructive: true, onSelect: () => undefined }]}
              />
            </div>
          </Spec>
          <Spec name="Menu" note="inverse panel · grain drop">
            <Menu
              label="Song"
              align="end"
              items={[
                { label: 'Rename', icon: <Pencil size={15} /> },
                { label: 'Duplicate', icon: <Copy size={15} /> },
                { label: 'Delete', icon: <Trash2 size={15} />, destructive: true },
              ]}
            />
          </Spec>
          <Spec name="EmptyLibraryCard" note="blank slot vs CTA">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <EmptyLibraryCard />
              <EmptyLibraryCard label="+ New Album" onCreate={() => undefined} />
            </div>
          </Spec>
          <Spec name="TodoRow" note="production to-do">
            <div className="max-w-xl space-y-2">
              <TodoRow text="Re-cut the second verse bass" timestamp="1:24" completed={todoDone} onToggle={setTodoDone} />
              <TodoRow text="Bounce a rough for the drive" completed />
            </div>
          </Spec>
          <Spec name="AudioVersionRow" note="saved takes">
            <div className="max-w-xl space-y-2">
              <AudioVersionRow label="Rough mix v3" filename="nightdrive-v3.wav" duration="3:41" isMain={main} onToggleMain={() => setMain((m) => !m)} />
              <AudioVersionRow label="Demo take" filename="demo-01.wav" duration="3:12" />
            </div>
          </Spec>
          <Spec name="Quick-play sources" note="glyph legend">
            <Row>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Music2 size={15} /> Note Picker</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><AudioLines size={15} /> MIDI Record</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Wand2 size={15} /> Extracted MIDI</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Mic size={15} /> Audio</span>
            </Row>
          </Spec>
        </div>
      </KitSection>

      <div className="mx-auto max-w-6xl px-6"><RedBar /></div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <KitSection no="K.10" title="Table" kicker="agnostic · sortable heads">
        <div className="grid gap-8">
          <Spec name="Table" note="any labeled head sorts · empty heads do not · parent owns the data">
            <Table sort={tableSort} onSort={setTableSort}>
              <TableHeader>
                <TableRow>
                  <TableHead column="name">Name</TableHead>
                  <TableHead column="kind">Type</TableHead>
                  <TableHead column="year">Year</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableSpecRows.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="label-mono text-muted-foreground">{row.kind}</TableCell>
                    <TableCell className="label-mono text-muted-foreground">{row.year}</TableCell>
                    <TableCell />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Spec>
          <Spec name="IdeaRow" note="pool composition · labeled heads sort · plays first · menu has no head">
            <Table sort={ideaTableSort} onSort={setIdeaTableSort}>
              <TableHeader>
                <TableRow>
                  <TableHead />
                  <TableHead column="role">Role</TableHead>
                  <TableHead column="title">Title</TableHead>
                  <TableHead column="key">Key</TableHead>
                  <TableHead column="tempo">BPM</TableHead>
                  <TableHead column="tracks">Tracks</TableHead>
                  <TableHead column="updated">Updated</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ideaSpecRows.map((row) => (
                  <IdeaRow
                    key={row.title}
                    role={row.role}
                    title={row.title}
                    ideaKey={row.ideaKey}
                    tempo={row.tempo}
                    tracks={row.tracks}
                    lastWorked={row.lastWorked}
                    plays={
                      row.role === 'Sample' ? undefined : (
                        <div className="flex items-center gap-0.5">
                          <IconButton aria-label="Play MIDI" variant="ghost" size="sm">
                            <Music2 size={15} />
                          </IconButton>
                          {row.role === 'Bassline' ? (
                            <IconButton aria-label="Play audio" variant="ghost" size="sm">
                              <Mic size={15} />
                            </IconButton>
                          ) : null}
                        </div>
                      )
                    }
                    menuItems={[
                      { label: 'Turn into Song', onSelect: () => undefined },
                      { label: 'Move to Song', onSelect: () => undefined },
                      { label: 'Copy to Song', onSelect: () => undefined },
                      { label: 'Delete', icon: <Trash2 size={15} />, destructive: true, onSelect: () => undefined },
                    ]}
                  />
                ))}
              </TableBody>
            </Table>
          </Spec>
          <Spec name="SongRow" note="todo chip after title · last col sticks · solo delete is trash">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead />
                  <TableHead column="title">Title</TableHead>
                  <TableHead column="status">Status</TableHead>
                  <TableHead column="key">Key</TableHead>
                  <TableHead column="tempo">Tempo</TableHead>
                  <TableHead column="time">Time</TableHead>
                  <TableHead column="albums">Albums</TableHead>
                  <TableHead column="updated">Updated</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                <SongRow
                  title="Nightdrive"
                  status="Production"
                  todoCount={3}
                  length="3:41"
                  songKey="Dm"
                  tempo={92}
                  time="4/4"
                  albums={2}
                  lastWorked="2d ago"
                  plays={<PlayButton aria-label="Play song" />}
                  menuItems={[{ label: 'Delete', destructive: true, onSelect: () => undefined }]}
                />
                <SongRow
                  title="Static Bloom"
                  status="Sketch"
                  songKey="A"
                  tempo={128}
                  time="4/4"
                  menuItems={[{ label: 'Delete', destructive: true, onSelect: () => undefined }]}
                />
              </TableBody>
            </Table>
          </Spec>
        </div>
      </KitSection>

      <div className="mx-auto max-w-6xl px-6"><RedBar /></div>

      {/* ── Native HTML elements ───────────────────────────────────────── */}
      <KitSection no="K.11" title="HTML Elements" kicker="base typography & rhythm">
        <Panel className="p-6">
          <div className="prose-kit flex flex-col gap-4">
            <h1 className="font-display text-4xl font-black uppercase tracking-tight">Heading 1</h1>
            <h2 className="font-display text-3xl font-black uppercase tracking-tight">Heading 2</h2>
            <h3 className="font-display text-2xl font-extrabold uppercase tracking-wide">Heading 3</h3>
            <h4 className="font-display text-xl font-extrabold uppercase tracking-wide">Heading 4</h4>
            <h5 className="font-display text-lg font-bold uppercase tracking-wide">Heading 5</h5>
            <h6 className="font-display text-base font-bold uppercase tracking-wide">Heading 6</h6>
            <p className="text-base leading-relaxed">
              Body copy in Archivo. A quick capture is a <strong>bundle</strong>, not a single take — you can stack{' '}
              <em>audio</em>, MIDI, and a few <a href="#" className="text-primary underline underline-offset-2">picked notes</a>{' '}
              into one idea. Inline <code className="rounded-xs bg-muted px-1 py-0.5 font-mono text-sm">verse-bassline-001.mid</code> reads in mono.
            </p>
            <blockquote className="border-l-2 border-primary pl-4 text-muted-foreground italic">
              “As if Saul Bass and Dieter Rams designed music software in the late 1960s.”
            </blockquote>
            <ul className="ml-5 list-disc space-y-1 text-sm">
              <li>Unordered — capture, classify, arrange</li>
              <li>Ideas float in the pool until placed</li>
            </ul>
            <ol className="ml-5 list-decimal space-y-1 text-sm">
              <li>Capture</li>
              <li>Move to a section</li>
              <li>Export to the DAW</li>
            </ol>
            <pre className="overflow-x-auto rounded-xs border border-hairline bg-background p-3 font-mono text-xs">{`Nightdrive/
├─ midi/verse-bassline-001.mid
├─ audio/chorus-vox-002.wav
└─ lyrics.txt`}</pre>
            <hr className="border-hairline" />
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-hairline text-left">
                  <th className="label-mono py-2">#</th>
                  <th className="label-mono py-2">Track</th>
                  <th className="label-mono py-2">Key</th>
                  <th className="label-mono py-2">Tempo</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['1', 'Nightdrive', 'Dm', '92'],
                  ['2', 'Static Bloom', 'A', '128'],
                  ['3', 'Low Ceiling', 'F#m', '74'],
                ].map((r) => (
                  <tr key={r[0]} className="border-b border-hairline/60">
                    {r.map((c, i) => (
                      <td key={i} className={`py-2 ${i === 0 ? 'label-mono text-primary' : ''}`}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </KitSection>

      <KitSection no="K.12" title="Lucide Icons" kicker="lucide-react · full set · click to copy name">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading icon library…</p>}>
          <LucideIconGallery />
        </Suspense>
      </KitSection>
    </div>
  )
}
