import { useCallback, useEffect, useRef, useState } from 'react'

import type { NoteEvent } from '@/types/idea'

export interface MidiInputDevice {
  id: string
  name: string
}

interface UseMidiOptions {
  onNoteOn?: (pitch: number, velocity: number) => void
  onNoteOff?: (pitch: number) => void
}

interface ActiveRecordingNote {
  pitch: number
  velocity: number
  startTime: number
}

export function useMidi(options: UseMidiOptions = {}) {
  const isSupported =
    typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator

  const [midiDevices, setMidiDevices] = useState<MidiInputDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [noteEvents, setNoteEvents] = useState<NoteEvent[]>([])
  const [error, setError] = useState<string | null>(null)

  const midiAccessRef = useRef<MIDIAccess | null>(null)
  const activeInputRef = useRef<MIDIInput | null>(null)
  const activeNotesRef = useRef<Map<number, ActiveRecordingNote>>(new Map())
  const recordStartRef = useRef(0)
  const isRecordingRef = useRef(false)
  const optionsRef = useRef(options)

  optionsRef.current = options

  useEffect(() => {
    isRecordingRef.current = isRecording
  }, [isRecording])

  const refreshDevices = useCallback((access: MIDIAccess) => {
    const devices = Array.from(access.inputs.values()).map((input) => ({
      id: input.id,
      name: input.name || 'Unknown device',
    }))

    setMidiDevices(devices)

    setSelectedDeviceId((current) => {
      if (current && devices.some((device) => device.id === current)) {
        return current
      }

      return devices[0]?.id ?? null
    })
  }, [])

  const handleMidiMessage = useCallback((event: MIDIMessageEvent) => {
    const data = event.data
    if (!data || data.length < 3) {
      return
    }

    const status = data[0] & 0xf0
    const pitch = data[1]
    const velocity = data[2]

    const isNoteOn = status === 0x90 && velocity > 0
    const isNoteOff = status === 0x80 || (status === 0x90 && velocity === 0)

    if (isNoteOn) {
      optionsRef.current.onNoteOn?.(pitch, velocity)

      if (isRecordingRef.current) {
        const startTime = performance.now() / 1000 - recordStartRef.current
        activeNotesRef.current.set(pitch, {
          pitch,
          velocity,
          startTime,
        })
      }

      return
    }

    if (isNoteOff) {
      optionsRef.current.onNoteOff?.(pitch)

      if (isRecordingRef.current) {
        const active = activeNotesRef.current.get(pitch)
        if (active) {
          const endTime = performance.now() / 1000 - recordStartRef.current
          const recorded: NoteEvent = {
            pitch: active.pitch,
            startTime: active.startTime,
            duration: Math.max(0.01, endTime - active.startTime),
            velocity: active.velocity,
          }

          setNoteEvents((current) =>
            [...current, recorded].sort((a, b) => a.startTime - b.startTime),
          )
          activeNotesRef.current.delete(pitch)
        }
      }
    }
  }, [])

  const bindInput = useCallback(
    (input: MIDIInput | null) => {
      if (activeInputRef.current) {
        activeInputRef.current.onmidimessage = null
      }

      activeInputRef.current = input

      if (input) {
        input.onmidimessage = handleMidiMessage
      }
    },
    [handleMidiMessage],
  )

  useEffect(() => {
    if (!isSupported) {
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const access = await navigator.requestMIDIAccess()
        if (cancelled) {
          return
        }

        midiAccessRef.current = access
        refreshDevices(access)

        access.onstatechange = () => {
          if (midiAccessRef.current) {
            refreshDevices(midiAccessRef.current)
          }
        }
      } catch (caught) {
        console.warn('requestMIDIAccess failed:', caught)
        setError('Unable to access MIDI devices.')
      }
    })()

    return () => {
      cancelled = true
      bindInput(null)
    }
  }, [bindInput, isSupported, refreshDevices])

  useEffect(() => {
    if (!midiAccessRef.current || !selectedDeviceId) {
      bindInput(null)
      return
    }

    const input = midiAccessRef.current.inputs.get(selectedDeviceId) ?? null
    bindInput(input)
  }, [bindInput, selectedDeviceId, midiDevices])

  const startRecording = useCallback(() => {
    setError(null)
    setNoteEvents([])
    activeNotesRef.current.clear()
    recordStartRef.current = performance.now() / 1000
    setIsRecording(true)
  }, [])

  const stopRecording = useCallback(() => {
    const endTime = performance.now() / 1000 - recordStartRef.current

    for (const active of activeNotesRef.current.values()) {
      setNoteEvents((current) =>
        [
          ...current,
          {
            pitch: active.pitch,
            startTime: active.startTime,
            duration: Math.max(0.01, endTime - active.startTime),
            velocity: active.velocity,
          },
        ].sort((a, b) => a.startTime - b.startTime),
      )
    }

    activeNotesRef.current.clear()
    setIsRecording(false)
  }, [])

  const resetRecording = useCallback(() => {
    activeNotesRef.current.clear()
    setNoteEvents([])
    setIsRecording(false)
    setError(null)
  }, [])

  return {
    isSupported,
    midiDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    isRecording,
    noteEvents,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  }
}
