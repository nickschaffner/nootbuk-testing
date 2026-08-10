import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { WaveformCanvas } from '@/components/player/WaveformCanvas'
import { Button } from '@/components/ui/button'
import { extractWaveformPeaks, formatAudioTime } from '@/lib/audio'

interface AudioPlayerProps {
  blob: Blob
  mimeType?: string
  filename?: string
  className?: string
}

export function AudioPlayer({ blob, className }: AudioPlayerProps) {
  const contextRef = useRef<AudioContext | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const startedAtRef = useRef(0)
  const offsetRef = useRef(0)
  const isPlayingRef = useRef(false)
  const rafRef = useRef<number | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [peaks, setPeaks] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)

  function stopPlaybackSource() {
    try {
      sourceRef.current?.stop()
    } catch {
      // Source may already be stopped.
    }

    sourceRef.current?.disconnect()
    sourceRef.current = null

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  function tickPlaybackTime() {
    const context = contextRef.current
    const buffer = bufferRef.current

    if (!context || !buffer || !isPlayingRef.current) {
      return
    }

    const nextTime = Math.min(
      offsetRef.current + (context.currentTime - startedAtRef.current),
      buffer.duration,
    )
    setCurrentTime(nextTime)

    if (nextTime >= buffer.duration) {
      return
    }

    rafRef.current = requestAnimationFrame(tickPlaybackTime)
  }

  function startPlaybackSource(fromOffset: number) {
    const context = contextRef.current
    const buffer = bufferRef.current

    if (!context || !buffer) {
      return
    }

    stopPlaybackSource()

    const source = context.createBufferSource()
    source.buffer = buffer
    source.connect(context.destination)
    source.onended = () => {
      if (sourceRef.current !== source) {
        return
      }

      offsetRef.current = 0
      setCurrentTime(buffer.duration)
      isPlayingRef.current = false
      setIsPlaying(false)
      sourceRef.current = null
    }

    source.start(0, fromOffset)
    offsetRef.current = fromOffset
    startedAtRef.current = context.currentTime
    sourceRef.current = source
    isPlayingRef.current = true
    setIsPlaying(true)
    rafRef.current = requestAnimationFrame(tickPlaybackTime)
  }

  useEffect(() => {
    let cancelled = false
    const context = new AudioContext()
    contextRef.current = context

    void (async () => {
      try {
        const audioBuffer = await context.decodeAudioData(
          await blob.arrayBuffer(),
        )

        if (cancelled) {
          return
        }

        bufferRef.current = audioBuffer
        offsetRef.current = 0
        setDuration(audioBuffer.duration)
        setCurrentTime(0)
        setError(null)
      } catch (decodeError) {
        if (!cancelled) {
          console.warn('Audio decode failed:', decodeError)
          setError('Could not decode audio.')
        }
      }
    })()

    void extractWaveformPeaks(blob).then((nextPeaks) => {
      if (!cancelled) {
        setPeaks(nextPeaks)
      }
    })

    return () => {
      cancelled = true
      isPlayingRef.current = false
      stopPlaybackSource()
      void context.close()
      contextRef.current = null
      bufferRef.current = null
    }
  }, [blob])

  async function togglePlayback() {
    const context = contextRef.current
    const buffer = bufferRef.current

    if (!context || !buffer || error) {
      return
    }

    if (isPlayingRef.current) {
      offsetRef.current = Math.min(
        offsetRef.current + (context.currentTime - startedAtRef.current),
        buffer.duration,
      )
      stopPlaybackSource()
      isPlayingRef.current = false
      setIsPlaying(false)
      setCurrentTime(offsetRef.current)
      return
    }

    try {
      await context.resume()
      startPlaybackSource(offsetRef.current)
    } catch (playbackError) {
      console.warn('Audio playback failed:', playbackError)
    }
  }

  function handleSeek(progress: number) {
    const buffer = bufferRef.current

    if (!buffer || duration <= 0) {
      return
    }

    const nextOffset = progress * duration
    offsetRef.current = nextOffset
    setCurrentTime(nextOffset)

    if (isPlayingRef.current) {
      void contextRef.current?.resume().then(() => {
        startPlaybackSource(nextOffset)
      })
    }
  }

  const progress = duration > 0 ? currentTime / duration : 0

  return (
    <div className={className}>
      {error ? <p className="mb-2 text-xs text-destructive">{error}</p> : null}

      <WaveformCanvas
        peaks={peaks}
        progress={progress}
        onSeek={handleSeek}
      />

      <div className="mt-2 flex items-center gap-3">
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={Boolean(error) || duration === 0}
          onClick={() => void togglePlayback()}
        >
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>

        <span className="text-xs tabular-nums text-muted-foreground">
          {formatAudioTime(currentTime)} / {formatAudioTime(duration)}
        </span>
      </div>
    </div>
  )
}
