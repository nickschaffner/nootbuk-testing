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
  const [deviceWarning, setDeviceWarning] = useState<string | null>(null)

  const midiAccessRef = useRef<MIDIAccess | null>(null)
  const activeInputRef = useRef<MIDIInput | null>(null)
  const activeNotesRef = useRef<Map<number, ActiveRecordingNote>>(new Map())
  const recordStartRef = useRef(0)
  const isRecordingRef = useRef(false)
  const selectedDeviceIdRef = useRef<string | null>(null)
  const optionsRef = useRef(options)

  optionsRef.current = options

  useEffect(() => {
    isRecordingRef.current = isRecording
  }, [isRecording])

  useEffect(() => {
    selectedDeviceIdRef.current = selectedDeviceId
  }, [selectedDeviceId])

  const finalizeActiveNotes = useCallback(() => {
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

  const refreshDevices = useCallback(
    (access: MIDIAccess) => {
      const previousSelectedId = selectedDeviceIdRef.current
      const devices = Array.from(access.inputs.values()).map((input) => ({
        id: input.id,
        name: input.name || 'Unknown device',
      }))

      setMidiDevices(devices)

      if (
        previousSelectedId &&
        !devices.some((device) => device.id === previousSelectedId)
      ) {
        bindInput(null)

        if (isRecordingRef.current) {
          finalizeActiveNotes()
          setIsRecording(false)
          setDeviceWarning(
            'MIDI device disconnected. Recording stopped and notes were saved.',
          )
        } else {
          setDeviceWarning('MIDI device disconnected.')
        }
      }

      setSelectedDeviceId((current) => {
        if (current && devices.some((device) => device.id === current)) {
          return current
        }

        return devices[0]?.id ?? null
      })
    },
    [bindInput, finalizeActiveNotes],
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
    setDeviceWarning(null)
    setNoteEvents([])
    activeNotesRef.current.clear()
    recordStartRef.current = performance.now() / 1000
    setIsRecording(true)
  }, [])

  const stopRecording = useCallback(() => {
    finalizeActiveNotes()
    setIsRecording(false)
  }, [finalizeActiveNotes])

  const resetRecording = useCallback(() => {
    activeNotesRef.current.clear()
    setNoteEvents([])
    setIsRecording(false)
    setError(null)
    setDeviceWarning(null)
  }, [])

  const clearDeviceWarning = useCallback(() => {
    setDeviceWarning(null)
  }, [])

  const selectDevice = useCallback((deviceId: string) => {
    setDeviceWarning(null)
    setSelectedDeviceId(deviceId)
  }, [])

  return {
    isSupported,
    midiDevices,
    selectedDeviceId,
    setSelectedDeviceId: selectDevice,
    isRecording,
    noteEvents,
    error,
    deviceWarning,
    clearDeviceWarning,
    startRecording,
    stopRecording,
    resetRecording,
  }
}
