const ACCEPTED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.aiff', '.aif'] as const

const MIME_BY_EXTENSION: Record<string, string> = {
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.aiff': 'audio/aiff',
  '.aif': 'audio/aiff',
}

export function isAcceptedAudioFile(file: File): boolean {
  const extension = getFileExtension(file.name)
  return ACCEPTED_AUDIO_EXTENSIONS.includes(
    extension as (typeof ACCEPTED_AUDIO_EXTENSIONS)[number],
  )
}

export function getFileExtension(filename: string): string {
  const index = filename.lastIndexOf('.')
  if (index === -1) {
    return ''
  }

  return filename.slice(index).toLowerCase()
}

export function getAudioMimeType(filename: string, fileType: string): string {
  if (fileType) {
    return fileType
  }

  const extension = getFileExtension(filename)
  return MIME_BY_EXTENSION[extension] ?? 'application/octet-stream'
}

function writeString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index))
  }
}

export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8
  const blockAlign = numChannels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = samples.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]))
    view.setInt16(
      offset,
      sample < 0 ? sample * 0x8000 : sample * 0x7fff,
      true,
    )
    offset += bytesPerSample
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

export function concatenateFloat32Buffers(buffers: Float32Array[]): Float32Array {
  const totalLength = buffers.reduce((sum, buffer) => sum + buffer.length, 0)
  const result = new Float32Array(totalLength)
  let offset = 0

  for (const buffer of buffers) {
    result.set(buffer, offset)
    offset += buffer.length
  }

  return result
}

export async function getAudioDuration(blob: Blob): Promise<number> {
  const context = new AudioContext()
  try {
    const audioBuffer = await context.decodeAudioData(await blob.arrayBuffer())
    return audioBuffer.duration
  } finally {
    await context.close()
  }
}

export async function extractWaveformPeaks(
  blob: Blob,
  barCount = 120,
): Promise<number[]> {
  const context = new AudioContext()
  try {
    const audioBuffer = await context.decodeAudioData(await blob.arrayBuffer())
    const channelData = audioBuffer.getChannelData(0)
    const samplesPerBar = Math.max(1, Math.floor(channelData.length / barCount))
    const peaks: number[] = []

    for (let bar = 0; bar < barCount; bar += 1) {
      const start = bar * samplesPerBar
      const end = Math.min(start + samplesPerBar, channelData.length)
      let max = 0

      for (let index = start; index < end; index += 1) {
        max = Math.max(max, Math.abs(channelData[index]))
      }

      peaks.push(max)
    }

    return peaks
  } finally {
    await context.close()
  }
}

export function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00'
  }

  const wholeSeconds = Math.floor(seconds)
  const minutes = Math.floor(wholeSeconds / 60)
  const remainingSeconds = wholeSeconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
