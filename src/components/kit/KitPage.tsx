import { useState, type ReactNode } from 'react'
import {
  AudioLines,
  Command,
  Import,
  Mic,
  Music2,
  Piano,
  Plus,
  Search,
  Wand2,
} from 'lucide-react'
import {
  ALBUM_STATUSES,
  BLOCK_WIDTHS,
  Badge,
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
  Panel,
  Pick,
  QUANTIZE_OPTIONS,
  Radio,
  Recess,
  RecordButton,
  RedBar,
  SECTION_INTENTS,
  SegmentedControl,
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
  Window,
} from './index'

// ═══════════════════════════════════════════════════════════════════════════
// Local layout helpers — the catalog scaffold (not part of the kit itself).
// ═══════════════════════════════════════════════════════════════════════════

function KitSection({ no, title, kicker, children }: { no: string; title: string; kicker?: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <header className="mb-10">
        <div className="mb-3 flex items-center gap-3">
          <span className="label-mono text-primary">{no}</span>
          <span className="h-px flex-1 bg-primary" />
          {kicker ? <MonoLabel>{kicker}</MonoLabel> : null}
        </div>
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
  { token: '--foreground', light: '#17150f', dark: '#ece5d5', role: 'Ink / text' },
  { token: '--card', light: '#f5f0e6', dark: '#1c1913', role: 'Panel fill' },
  { token: '--panel', light: '#e6dfd0', dark: '#24201a', role: 'Header / inset fill' },
  { token: '--primary', light: '#e5330c', dark: '#f4471f', role: 'Vermillion accent' },
  { token: '--muted', light: '#ded6c5', dark: '#2a251d', role: 'Muted fill' },
  { token: '--muted-foreground', light: '#6a6355', dark: '#9a917d', role: 'Muted text' },
  { token: '--border', light: '#cbc2ae', dark: '#342e24', role: 'Border' },
  { token: '--hairline', light: '#b7ad96', dark: '#453d2f', role: 'Hairline rule' },
  { token: '--keys-white', light: '#f5f0e6', dark: '#ded6c5', role: 'White keys' },
  { token: '--keys-black', light: '#17150f', dark: '#0c0a07', role: 'Black keys' },
]

const TYPE_SCALE: { label: string; cls: string; sample: string; spec: string }[] = [
  { label: 'Display XL', cls: 'font-display text-5xl font-black uppercase tracking-tight', sample: 'Liner Notes', spec: 'Archivo Expanded · 900 · 3rem · tracking-tight' },
  { label: 'Display L', cls: 'font-display text-3xl font-black uppercase tracking-tight', sample: 'Song Workspace', spec: 'Archivo Expanded · 900 · 1.875rem' },
  { label: 'Heading', cls: 'font-display text-sm font-extrabold uppercase tracking-wide', sample: 'Quick Capture', spec: 'Archivo Expanded · 800 · 0.875rem' },
  { label: 'Body', cls: 'text-base', sample: 'A neutral neo-grotesque for interface copy and running text.', spec: 'Archivo · 400 · 1rem · 1.5' },
  { label: 'Body Small', cls: 'text-sm text-muted-foreground', sample: 'Secondary and helper text sits one step down.', spec: 'Archivo · 400 · 0.875rem' },
  { label: 'Mono Label', cls: 'label-mono', sample: 'Tempo · 120 BPM', spec: 'Space Mono · 400 · 0.6875rem · 0.14em · UPPER' },
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Type scale ─────────────────────────────────────────────────── */}
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

          <Spec name="Borders & Elevation" note="hairline + inset">
            <div className="flex flex-col gap-3">
              <div className="rounded-xs border border-hairline bg-card px-3 py-2 text-xs">border-hairline · flat panel</div>
              <Recess className="px-3 py-2 text-xs">inset well · shadow-[inset…] recess</Recess>
              <div className="rounded-xs border-2 border-primary px-3 py-2 text-xs">2px ring · focus / record</div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              No drop shadows for lift — depth is inset wells and hairlines. Focus is a 2px vermillion outline.
            </p>
          </Spec>
        </div>
      </KitSection>

      <div className="mx-auto max-w-6xl px-6"><RedBar /></div>

      {/* ── Buttons ────────────────────────────────────────────────────── */}
      <KitSection no="K.04" title="Buttons" kicker="Button · IconButton · RecordButton">
        <div className="grid gap-8">
          <Spec name="Button — variants" note="primary · secondary · ghost · danger · link">
            <Row>
              <Button variant="primary">Save to Pool</Button>
              <Button variant="secondary">Add Section</Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="danger">Delete</Button>
              <Button variant="link">Copy to MIDI Record</Button>
            </Row>
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
      <KitSection no="K.05" title="Selection" kicker="Segmented · Toggle · Chip · Pick">
        <div className="grid gap-8">
          <Spec name="SegmentedControl" note="capture modes">
            <div className="flex flex-col gap-3">
              <SegmentedControl options={captureModes} value={mode} onChange={setMode} />
              <SegmentedControl block options={KEY_MODES} value={keyMode} onChange={setKeyMode} />
            </div>
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
      <KitSection no="K.06" title="Forms & Fields" kicker="Field · Input · Textarea · Checkbox · Radio">
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
      <KitSection no="K.09" title="Library" kicker="StatusStepper · IdeaCard · rows">
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

      {/* ── Native HTML elements ───────────────────────────────────────── */}
      <KitSection no="K.10" title="HTML Elements" kicker="base typography & rhythm">
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
    </div>
  )
}
