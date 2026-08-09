import { useCallback, useEffect, useRef, useState } from 'react'

import {
  concatenateFloat32Buffers,
  encodeWav,
} from '@/lib/audio'

const WORKLET_URL = '/audio-worklet/pcm-recorder-processor.js'

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  const contextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const workletRef = useRef<AudioWorkletNode | null>(null)
  const sampleRateRef = useRef(44_100)

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    workletRef.current = null

    if (contextRef.current) {
      void contextRef.current.close()
      contextRef.current = null
    }

    setAnalyser(null)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setAudioBlob(null)

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const context = new AudioContext()
      contextRef.current = context
      sampleRateRef.current = context.sampleRate

      if (context.state === 'suspended') {
        await context.resume()
      }

      await context.audioWorklet.addModule(WORKLET_URL)

      const worklet = new AudioWorkletNode(context, 'pcm-recorder-processor')
      workletRef.current = worklet

      worklet.port.onmessage = (event: MessageEvent) => {
        if (event.data?.type !== 'stop') {
          return
        }

        const buffers = event.data.buffers as Float32Array[]
        const samples = concatenateFloat32Buffers(buffers)
        const wavBlob = encodeWav(samples, sampleRateRef.current)

        setAudioBlob(wavBlob)
        setIsRecording(false)
        cleanup()
      }

      const analyserNode = context.createAnalyser()
      analyserNode.fftSize = 2048
      setAnalyser(analyserNode)

      const silentGain = context.createGain()
      silentGain.gain.value = 0

      const source = context.createMediaStreamSource(stream)
      source.connect(analyserNode)
      analyserNode.connect(worklet)
      worklet.connect(silentGain)
      silentGain.connect(context.destination)

      worklet.port.postMessage('start')
      setIsRecording(true)
    } catch (caught) {
      let message = 'Failed to start recording.'

      if (caught instanceof DOMException && caught.name === 'NotAllowedError') {
        message =
          'Microphone permission denied. Allow mic access to record audio.'
      } else if (caught instanceof DOMException && caught.name === 'NotFoundError') {
        message = 'No microphone found. Connect a mic and try again.'
      } else if (caught instanceof Error) {
        message = caught.message
      }

      console.warn('startRecording failed:', caught)
      setError(message)
      setIsRecording(false)
      cleanup()
    }
  }, [cleanup])

  const stopRecording = useCallback(() => {
    try {
      workletRef.current?.port.postMessage('stop')
    } catch (caught) {
      console.warn('stopRecording failed:', caught)
      setError('Failed to stop recording.')
      setIsRecording(false)
      cleanup()
    }
  }, [cleanup])

  const resetRecording = useCallback(() => {
    setAudioBlob(null)
    setError(null)
  }, [])

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    startRecording,
    stopRecording,
    resetRecording,
    isRecording,
    audioBlob,
    error,
    analyser,
  }
}
