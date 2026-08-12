import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

interface AudioPlayButtonProps {
  blob: Blob
  className?: string
  size?: 'default' | 'icon' | 'icon-sm'
}

export function AudioPlayButton({
  blob,
  className,
  size = 'icon-sm',
}: AudioPlayButtonProps) {
  const contextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const context = new AudioContext()
    contextRef.current = context

    void (async () => {
      try {
        const audioBuffer = await context.decodeAudioData(await blob.arrayBuffer())
        if (!cancelled) {
          bufferRef.current = audioBuffer
          setIsReady(true)
        }
      } catch {
        if (!cancelled) {
          setIsReady(false)
        }
      }
    })()

    return () => {
      cancelled = true
      try {
        sourceRef.current?.stop()
      } catch {
        // Source may already be stopped.
      }
      sourceRef.current?.disconnect()
      void context.close()
    }
  }, [blob])

  async function togglePlayback(event?: React.MouseEvent) {
    event?.stopPropagation()

    const context = contextRef.current
    const buffer = bufferRef.current
    if (!context || !buffer) {
      return
    }

    if (isPlaying) {
      try {
        sourceRef.current?.stop()
      } catch {
        // Source may already be stopped.
      }
      sourceRef.current?.disconnect()
      sourceRef.current = null
      setIsPlaying(false)
      return
    }

    const source = context.createBufferSource()
    source.buffer = buffer
    source.connect(context.destination)
    source.onended = () => {
      setIsPlaying(false)
      sourceRef.current = null
    }

    await context.resume()
    source.start(0)
    sourceRef.current = source
    setIsPlaying(true)
  }

  return (
    <Button
      type="button"
      size={size}
      variant="ghost"
      className={className}
      disabled={!isReady}
      onClick={(event) => void togglePlayback(event)}
    >
      {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      <span className="sr-only">{isPlaying ? 'Stop audio' : 'Play audio'}</span>
    </Button>
  )
}
