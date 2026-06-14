const { MSEBuffer } = require('./mse-buffer')

const TAG = '[MSEPlayer]'
class MSEPlayer {
  /**
   * @param {HTMLVideoElement | HTMLAudioElement} [media]
   * @param {{ videoMimeType?: string; audioMimeType?: string }} [opts]
   */
  constructor(media, opts) {
    /** @protected */
    this.opts = opts || {}
    /** @type {Exclude<typeof media, undefined>} */
    this.media = media
    /** 
     * @protected
     * @type {MediaSource} */
    this.mediaSource
    this.onMSOpen = this.onMSOpen.bind(this)

    /** @protected */
    this.videoBuffer = new MSEBuffer()
    /** @protected */
    this.audioBuffer = new MSEBuffer()
  }

  /**
   * @param {HTMLVideoElement | HTMLAudioElement} [media]
   * @param {{ videoMimeType?: string; audioMimeType?: string }} [opts]
   */
  init(media, opts) {
    if (media && this.media !== media) {
      this.clearMedia()
      this.media = media
    }
    if (opts) {
      this.opts = { ...this.opts, ...opts }
    }
    if (!this.mediaSource) {
      this.mediaSource = new MediaSource()
      this.mediaSource.addEventListener('sourceopen', this.onMSOpen)
    }
    if (this.media && !this.media.src && (this.opts.videoMimeType || this.opts.audioMimeType)) {
      this.media.src = URL.createObjectURL(this.mediaSource)
    }
  }

  /** @protected */
  onMSOpen() {
    console.log(TAG, '"sourceopen"')
    const { videoMimeType, audioMimeType } = this.opts || {}
    if (videoMimeType) {
      const sourceBuffer = this.mediaSource.addSourceBuffer(videoMimeType)
      this.videoBuffer.init(sourceBuffer)
    }
    if (audioMimeType) {
      const sourceBuffer = this.mediaSource.addSourceBuffer(audioMimeType)
      this.audioBuffer.init(sourceBuffer)
    }
  }

  /** @param {ArrayBuffer} data */
  appendVideo(data) {
    this.videoBuffer.appendBuffer(data)
  }

  /** @param {ArrayBuffer} data */
  appendAudio(data) {
    this.audioBuffer.appendBuffer(data)
  }

  /** @private */
  clearMedia() {
    if (this.media && this.media.src) {
      URL.revokeObjectURL(this.media.src)
      this.clearSource()
    }
  }
  /** @private */
  clearSource() {
    if (this.mediaSource && this.mediaSource.readyState == 'open') {
      this.mediaSource.endOfStream()
      this.mediaSource.removeEventListener('sourceopen', this.onMSOpen)
      this.mediaSource = undefined
      this.clearBuffers()
    }
  }

  /** @private */
  clearBuffers() {
    this.audioBuffer.clear()
    this.videoBuffer.clear()
  }
}

module.exports = { MSEPlayer }