class PCMRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.recording = false
    this.buffers = []

    this.port.onmessage = (event) => {
      if (event.data === 'start') {
        this.recording = true
        this.buffers = []
      } else if (event.data === 'stop') {
        this.recording = false
        this.port.postMessage({ type: 'stop', buffers: this.buffers })
      }
    }
  }

  process(inputs) {
    if (!this.recording) {
      return true
    }

    const input = inputs[0]
    if (!input || input.length === 0) {
      return true
    }

    const channelData = input[0]
    if (channelData) {
      this.buffers.push(new Float32Array(channelData))
    }

    return true
  }
}

registerProcessor('pcm-recorder-processor', PCMRecorderProcessor)
