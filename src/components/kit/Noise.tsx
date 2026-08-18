import { type CSSProperties } from 'react'
import { cn } from './cn'

// ─────────────────────────────────────────────────────────────────────────
// Noise — the print-grain base concept as a drop-in overlay.
//
// Prefer the CSS utilities (`.noise` / `.noise-flat` / `.noise-strong`) when
// the target has a solid fill and can host a `::after`. Reach for this
// component when it can't — over an <img>, a gradient, or an element that
// already uses its pseudo-elements. Drop it inside any `relative` container:
//
//   <div className="relative overflow-hidden">
//     <img … />
//     <Noise variant="flat" over />
//   </div>
//
// All variants share the single grain tile in `--grain-image` (index.css), so
// the tooth matches everything else in the system.
// ─────────────────────────────────────────────────────────────────────────

export type NoiseVariant = 'flat' | 'feathered' | 'strong'

const MASK: Record<NoiseVariant, string | undefined> = {
  flat: undefined,
  feathered: 'radial-gradient(135% 135% at 12% 10%, #000 0%, rgba(0,0,0,0.7) 45%, transparent 85%)',
  strong: 'radial-gradient(150% 150% at 20% 15%, #000 0%, rgba(0,0,0,0.75) 55%, transparent 92%)',
}

export interface NoiseProps {
  variant?: NoiseVariant
  /** Sit above content (needed over images); default sits behind. */
  over?: boolean
  /** 0–1. Defaults to the theme's --noise-opacity. */
  opacity?: number
  /** Tile size in px (default 140). */
  size?: number
  /** CSS mix-blend-mode (default 'overlay'). */
  blend?: CSSProperties['mixBlendMode']
  className?: string
}

export function Noise({ variant = 'flat', over = false, opacity, size = 140, blend = 'overlay', className }: NoiseProps) {
  const mask = MASK[variant]
  return (
    <span
      aria-hidden
      className={cn('pointer-events-none absolute inset-0', over ? 'z-[1]' : 'z-0', className)}
      style={{
        backgroundImage: 'var(--grain-image)',
        backgroundSize: `${size}px ${size}px`,
        mixBlendMode: blend,
        opacity: opacity ?? 'var(--noise-opacity, 0.85)',
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    />
  )
}
