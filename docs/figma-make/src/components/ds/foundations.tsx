import { MonoLabel, Panel, SectionHead, Specimen } from './primitives'
import { NOTE_NAMES, isBlackKey } from '../../lib/notes'

const TOKENS: { name: string; token: string; light: string; dark: string }[] = [
  { name: 'Paper / Ground', token: '--background', light: '#EFE9DD', dark: '#14120D' },
  { name: 'Ink / Foreground', token: '--foreground', light: '#17150F', dark: '#ECE5D5' },
  { name: 'Panel', token: '--panel', light: '#E6DFD0', dark: '#24201A' },
  { name: 'Vermillion', token: '--primary', light: '#E5330C', dark: '#F4471F' },
  { name: 'Muted', token: '--muted', light: '#DED6C5', dark: '#2A251D' },
  { name: 'Muted Ink', token: '--muted-foreground', light: '#6A6355', dark: '#9A917D' },
  { name: 'Hairline', token: '--hairline', light: '#B7AD96', dark: '#453D2F' },
]

function Swatch({ hex, label, token }: { hex: string; label: string; token: string }) {
  return (
    <div className="border border-hairline">
      <div className="h-16 w-full" style={{ backgroundColor: hex }} />
      <div className="flex items-center justify-between gap-2 border-t border-hairline px-2 py-1.5">
        <span className="text-xs font-semibold">{label}</span>
        <span className="label-mono">{hex}</span>
      </div>
      <div className="border-t border-hairline px-2 py-1">
        <MonoLabel>{token}</MonoLabel>
      </div>
    </div>
  )
}

// ── Motifs ─────────────────────────────────────────────────────────────────
function DotSequence() {
  const sizes = [16, 11, 8, 13, 6, 15, 9, 12, 7]
  return (
    <div className="flex items-center gap-3">
      {sizes.map((s, i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: s,
            height: s,
            backgroundColor: i % 3 === 0 ? 'var(--primary)' : 'var(--foreground)',
          }}
        />
      ))}
    </div>
  )
}

function PianoDivider() {
  return (
    <div className="flex h-14 w-full overflow-hidden border border-hairline">
      {Array.from({ length: 21 }).map((_, i) => {
        const black = isBlackKey(NOTE_NAMES[i % 12])
        return (
          <div
            key={i}
            className="flex-1 border-r border-hairline last:border-r-0"
            style={{ backgroundColor: black ? 'var(--keys-black)' : 'var(--keys-white)' }}
          />
        )
      })}
    </div>
  )
}

function LedgerGrid() {
  return (
    <div
      className="h-24 w-full border border-hairline"
      style={{
        backgroundImage:
          'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
        backgroundSize: '18px 18px',
      }}
    />
  )
}

export default function Foundations() {
  return (
    <section id="foundations" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <SectionHead no="01" title="Foundations" kicker="Ground · Ink · Vermillion" />

      <div className="space-y-14">
        <Specimen index="01.1" name="Palette" note="Two grounds, one accent">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {TOKENS.map((t) => (
              <Swatch key={t.token} hex={t.dark} label={t.name} token={t.token} />
            ))}
          </div>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
            A single vermillion carries every interactive accent. Everything else is warm
            ink on bone paper, inverted for the studio-dark default. Swatches show current
            mode — flip the switch in the masthead to compare.
          </p>
        </Specimen>

        <Specimen index="01.2" name="Typography" note="Archivo · Archivo Expanded · Space Mono">
          <div className="space-y-6">
            <div className="border-b border-hairline pb-5">
              <MonoLabel>Display — Archivo Expanded 900</MonoLabel>
              <p className="font-display text-5xl font-black uppercase tracking-tight md:text-6xl">
                Capture the idea
              </p>
            </div>
            <div className="border-b border-hairline pb-5">
              <MonoLabel>Body — Archivo 400 / 600</MonoLabel>
              <p className="mt-1 max-w-2xl text-base leading-relaxed">
                The gap between “I just played something cool” and “that idea is safely
                captured” is where songs go to die. <span className="font-semibold">Capture speed
                is everything.</span>
              </p>
            </div>
            <div>
              <MonoLabel>Mono — Space Mono, uppercase, tracked</MonoLabel>
              <p className="label-mono mt-2 text-foreground">
                KEY Dm · TEMPO 92 BPM · 4/4 · MINITAUR · REV 1 CHORUS 1 DELAY OFF
              </p>
            </div>
          </div>
        </Specimen>

        <Specimen index="01.3" name="Motifs" note="Hardware-derived">
          <div className="grid gap-8 md:grid-cols-2">
            <Panel className="p-5">
              <MonoLabel>Dot sequence — status / density</MonoLabel>
              <div className="mt-4">
                <DotSequence />
              </div>
            </Panel>
            <Panel className="p-5">
              <MonoLabel>Piano-key divider</MonoLabel>
              <div className="mt-4">
                <PianoDivider />
              </div>
            </Panel>
            <Panel className="p-5">
              <MonoLabel>Ledger grid — sequences / tables</MonoLabel>
              <div className="mt-4">
                <LedgerGrid />
              </div>
            </Panel>
            <Panel className="p-5">
              <MonoLabel>Rule + block</MonoLabel>
              <div className="mt-4 space-y-3">
                <span className="block h-2 w-full bg-primary" />
                <span className="block h-px w-full bg-hairline" />
                <div className="flex gap-2">
                  <span className="h-10 w-3 bg-foreground" />
                  <span className="h-10 w-3 bg-foreground" />
                  <span className="h-10 w-3 bg-primary" />
                  <span className="h-10 w-3 bg-foreground" />
                </div>
              </div>
            </Panel>
          </div>
        </Specimen>
      </div>
    </section>
  )
}
