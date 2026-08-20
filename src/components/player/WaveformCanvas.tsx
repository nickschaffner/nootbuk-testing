import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

interface WaveformCanvasProps {
  peaks?: number[]
  analyser?: AnalyserNode | null
  isLive?: boolean
  progress?: number
  className?: string
  onSeek?: (progress: number) => void
}

function themeColor(token: string, fallback: string): string {
  if (typeof document === 'undefined') {
    return fallback
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim()
  return value || fallback
}

export function WaveformCanvas({
  peaks = [],
  analyser = null,
  isLive = false,
  progress = 0,
  className,
  onSeek,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    let animationFrame = 0
    const timeDomainData = analyser
      ? new Uint8Array(analyser.fftSize)
      : null

    const drawStatic = () => {
      const width = canvas.width
      const height = canvas.height
      context.clearRect(0, 0, width, height)

      const primary = themeColor('--primary', '#e5330c')
      const muted = themeColor('--muted-foreground', '#6a6355')
      const barWidth = width / Math.max(peaks.length, 1)
      const playedWidth = width * progress

      peaks.forEach((peak, index) => {
        const barHeight = Math.max(1, peak * height * 0.9)
        const x = index * barWidth
        const y = (height - barHeight) / 2
        const isPlayed = x < playedWidth

        context.fillStyle = isPlayed ? primary : muted
        context.fillRect(x, y, Math.max(1, barWidth - 0.5), barHeight)
      })

      if (!isLive && peaks.length > 0) {
        const playheadX = Math.min(width, Math.max(0, playedWidth))
        context.strokeStyle = primary
        context.lineWidth = 2
        context.beginPath()
        context.moveTo(playheadX, 0)
        context.lineTo(playheadX, height)
        context.stroke()
      }
    }

    const drawLive = () => {
      if (!analyser || !timeDomainData) {
        return
      }

      analyser.getByteTimeDomainData(timeDomainData)

      const width = canvas.width
      const height = canvas.height
      context.clearRect(0, 0, width, height)
      context.lineWidth = 1
      context.strokeStyle = themeColor('--primary', '#e5330c')
      context.beginPath()

      const sliceWidth = width / timeDomainData.length
      let x = 0

      for (let index = 0; index < timeDomainData.length; index += 1) {
        const value = timeDomainData[index] / 128
        const y = (value * height) / 2

        if (index === 0) {
          context.moveTo(x, y)
        } else {
          context.lineTo(x, y)
        }

        x += sliceWidth
      }

      context.stroke()
      animationFrame = requestAnimationFrame(drawLive)
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(rect.width * window.devicePixelRatio))
      canvas.height = Math.max(
        1,
        Math.floor(rect.height * window.devicePixelRatio),
      )
    }

    resize()

    if (isLive && analyser) {
      drawLive()
    } else {
      drawStatic()
    }

    const observer = new ResizeObserver(() => {
      resize()
      if (!isLive) {
        drawStatic()
      }
    })

    observer.observe(canvas)

    return () => {
      cancelAnimationFrame(animationFrame)
      observer.disconnect()
      context.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [analyser, isLive, peaks, progress])

  function handleClick(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!onSeek || isLive) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const nextProgress = (event.clientX - rect.left) / rect.width
    onSeek(Math.max(0, Math.min(1, nextProgress)))
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn('h-20 w-full cursor-pointer rounded-md bg-muted/40', className)}
      onClick={handleClick}
    />
  )
}
