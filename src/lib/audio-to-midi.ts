import {
  addPitchBendsToNoteEvents,
  BasicPitch,
  noteFramesToTime,
  outputToNotesPoly,
  type NoteEventTime,
} from '@spotify/basic-pitch'

import type { NoteEvent } from '@/types/idea'

const BASIC_PITCH_MODEL_URL = '/basic-pitch/model/model.json'
const BASIC_PITCH_SAMPLE_RATE = 22050

let cachedBasicPitch: BasicPitch | null = null
let modelLoadPromise: Promise<BasicPitch> | null = null

export async function loadBasicPitchModel(): Promise<BasicPitch> {
  if (cachedBasicPitch) {
    return cachedBasicPitch
  }

  if (!modelLoadPromise) {
    modelLoadPromise = (async () => {
      const basicPitch = new BasicPitch(BASIC_PITCH_MODEL_URL)
      await basicPitch.model
      cachedBasicPitch = basicPitch
      return basicPitch
    })().catch((error) => {
      modelLoadPromise = null
      throw error
    })
  }

  return modelLoadPromise
}

export function basicPitchNotesToNoteEvents(notes: NoteEventTime[]): NoteEvent[] {
  return notes
    .map((note) => ({
      pitch: Math.round(note.pitchMidi),
      startTime: note.startTimeSeconds,
      duration: Math.max(note.durationSeconds, 0.01),
      velocity: Math.max(1, Math.round(note.amplitude * 127)),
    }))
    .sort((a, b) => a.startTime - b.startTime)
}

export async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
  const context = new AudioContext()
  try {
    return await context.decodeAudioData(await blob.arrayBuffer())
  } finally {
    await context.close()
  }
}

export async function prepareAudioBufferForBasicPitch(
  audioBuffer: AudioBuffer,
): Promise<AudioBuffer> {
  if (
    audioBuffer.sampleRate === BASIC_PITCH_SAMPLE_RATE &&
    audioBuffer.numberOfChannels === 1
  ) {
    return audioBuffer
  }

  const frameCount = Math.ceil(audioBuffer.duration * BASIC_PITCH_SAMPLE_RATE)
  const offlineContext = new OfflineAudioContext(
    1,
    frameCount,
    BASIC_PITCH_SAMPLE_RATE,
  )

  const source = offlineContext.createBufferSource()
  source.buffer = audioBuffer
  source.connect(offlineContext.destination)
  source.start(0)

  return offlineContext.startRendering()
}

export async function convertAudioBufferToNoteEvents(
  audioBuffer: AudioBuffer,
  onProgress?: (progress: number) => void,
): Promise<NoteEvent[]> {
  const basicPitch = await loadBasicPitchModel()
  const resampledBuffer = await prepareAudioBufferForBasicPitch(audioBuffer)
  const frames: number[][] = []
  const onsets: number[][] = []
  const contours: number[][] = []

  await basicPitch.evaluateModel(
    resampledBuffer,
    (nextFrames, nextOnsets, nextContours) => {
      frames.push(...nextFrames)
      onsets.push(...nextOnsets)
      contours.push(...nextContours)
    },
    (progress) => onProgress?.(progress),
  )

  const notes = noteFramesToTime(
    addPitchBendsToNoteEvents(
      contours,
      outputToNotesPoly(frames, onsets, 0.25, 0.25, 5),
    ),
  )

  return basicPitchNotesToNoteEvents(notes)
}

export async function convertAudioBlobToNoteEvents(
  blob: Blob,
  onProgress?: (progress: number) => void,
): Promise<NoteEvent[]> {
  const audioBuffer = await decodeAudioBlob(blob)
  return convertAudioBufferToNoteEvents(audioBuffer, onProgress)
}
