export function isMidiSupported(): boolean {
  return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator
}

export function isDirectoryPickerSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.showDirectoryPicker === 'function'
  )
}

export function getUnsupportedFeatureMessages(): string[] {
  const messages: string[] = []

  if (!isMidiSupported()) {
    messages.push(
      'MIDI recording is not available in this browser. Use Chrome or Edge on desktop to record from a controller.',
    )
  }

  if (!isDirectoryPickerSupported()) {
    messages.push(
      'Save to Folder export requires Chrome or Edge. Download as ZIP works in all browsers.',
    )
  }

  return messages
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable) {
    return true
  }

  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export function shouldIgnoreGlobalShortcut(event: KeyboardEvent): boolean {
  return isEditableTarget(event.target)
}
