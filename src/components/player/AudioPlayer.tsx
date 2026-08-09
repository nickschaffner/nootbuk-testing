import { Pause, Play } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { WaveformCanvas } from '@/components/player/WaveformCanvas'
import { Button } from '@/components/ui/button'
import { extractWaveformPeaks, formatAudioTime } from '@/lib/audio'

interface AudioPlayerProps {
  blob: Blob
  className?: string
}

export function AudioPlayer({ blob, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [peaks, setPeaks] = useState<number[]>([])

  const url = useMemo(() => URL.createObjectURL(blob), [blob])

  useEffect(() => {
    let cancelled = false

    void extractWaveformPeaks(blob).then((nextPeaks) => {
      if (!cancelled) {
        setPeaks(nextPeaks)
      }
    })

    return () => {
      cancelled = true
      URL.revokeObjectURL(url)
    }
  }, [blob, url])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [url])

  function togglePlayback() {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    void audio.play().then(() => setIsPlaying(true)).catch((error) => {
      console.warn('Audio playback failed:', error)
    })
  }

  function handleSeek(progress: number) {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration)) {
      return
    }

    audio.currentTime = progress * audio.duration
    setCurrentTime(audio.currentTime)
  }

  const progress = duration > 0 ? currentTime / duration : 0

  return (
    <div className={className}>
      <audio ref={audioRef} src={url} preload="metadata" />

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
          onClick={togglePlayback}
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
