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

      const barWidth = width / Math.max(peaks.length, 1)
      const playedWidth = width * progress

      peaks.forEach((peak, index) => {
        const barHeight = Math.max(2, peak * height * 0.9)
        const x = index * barWidth
        const y = (height - barHeight) / 2
        const isPlayed = x < playedWidth

        context.fillStyle = isPlayed
          ? 'oklch(0.7 0.15 250)'
          : 'oklch(0.45 0 0)'
        context.fillRect(x, y, Math.max(1, barWidth - 1), barHeight)
      })
    }

    const drawLive = () => {
      if (!analyser || !timeDomainData) {
        return
      }

      analyser.getByteTimeDomainData(timeDomainData)

      const width = canvas.width
      const height = canvas.height
      context.clearRect(0, 0, width, height)
      context.lineWidth = 2
      context.strokeStyle = 'oklch(0.7 0.15 250)'
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
