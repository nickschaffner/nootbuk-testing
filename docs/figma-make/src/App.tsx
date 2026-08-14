import { useEffect, useState } from 'react'
import Foundations from './components/ds/foundations'
import Controls from './components/ds/controls'
import Content from './components/ds/content'
import Capture from './components/ds/capture'
import Library from './components/ds/library'

function useTheme() {
  const [dark, setDark] = useState(true)
  useEffect(() => {
    const saved = localStorage.getItem('ln-theme')
    if (saved) setDark(saved === 'dark')
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('ln-theme', dark ? 'dark' : 'light')
  }, [dark])
  return { dark, setDark }
}

function Masthead({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  return (
    <header className="border-b border-foreground">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="label-mono text-primary">Design System · v0.1 · Aug 2026</p>
            <h1 className="mt-2 font-display text-4xl font-black uppercase leading-[0.92] tracking-tight md:text-6xl">
              Liner
              <br />
              Notes
            </h1>
          </div>
          <button
            onClick={() => setDark(!dark)}
            className="focusable flex items-center gap-2 border border-foreground px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-foreground hover:text-background"
            aria-pressed={dark}
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: dark ? 'var(--primary)' : 'var(--foreground)' }}
            />
            {dark ? 'Studio Dark' : 'Paper Light'}
          </button>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-hairline pt-4">
          <span className="label-mono">A music idea-capture & documentation tool</span>
          <span className="label-mono text-muted-foreground">
            Saul Bass × Dieter Rams · c. 1969
          </span>
          <span className="ml-auto flex gap-1.5" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: i === 2 ? 'var(--primary)' : 'var(--foreground)' }}
              />
            ))}
          </span>
        </div>
      </div>
    </header>
  )
}

export default function App() {
  const { dark, setDark } = useTheme()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Masthead dark={dark} setDark={setDark} />
      <main>
        <Foundations />
        <div className="mx-auto max-w-6xl px-6">
          <div className="noise h-3 w-full bg-primary" />
        </div>
        <Controls />
        <Content />
        <div className="mx-auto max-w-6xl px-6">
          <div className="noise h-3 w-full bg-primary" />
        </div>
        <Capture />
        <div className="mx-auto max-w-6xl px-6">
          <div className="noise h-3 w-full bg-primary" />
        </div>
        <Library />
      </main>
      <footer className="border-t border-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <p className="label-mono text-muted-foreground">
            Archivo · Archivo Expanded · Space Mono — Vermillion #E5330C
          </p>
          <p className="label-mono text-muted-foreground">
            Client-side · React + Vite + Tailwind · Dexie / Tone.js / Web MIDI
          </p>
        </div>
      </footer>
    </div>
  )
}
