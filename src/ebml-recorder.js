const { Decoder, Encoder } = require("ebml.js")
const { EventEmitter } = require('ebml-demuxer')

/**
 * Класс для записи экрана/камеры и передачи видео на сервер
 * 
 * События:
 * - `"header"` - заголовок webm
 * - `"data"` - остальные данные
 * 
 * ```js
 * const stream = await navigator.mediaDevices.getDisplayMedia({
 *  video: {
 *    width: 1280,
 *    height: 720,
 *  },
 *  audio: true,
 * })
 * const recorder = new WebmRecorder(stream, {
 *  videoBitsPerSecond: 8_000_000,
 *  audioBitsPerSecond: 100_000,
 *  mimeType: 'video/webm; codecs="vp8,opus"',
 * })
 * recorder.on('header', (data) => {
 *  // Handle webm header (e.i. initialize SourceBuffer)
 * })
 * recorder.on('data', (data) => {
 *  // Handle rest data
 * })
 * ```
 */
class EbmlRecorder extends EventEmitter {
  /**
   * @param {MediaStream} stream
   * @param {MediaRecorderOptions} [options]
   */
  constructor(stream, options) {
    super()
    /** @private */
    this.recorder = new MediaRecorder(stream, options)
    this.onRecordData = this.onRecordData.bind(this)
    this.recorder.addEventListener('dataavailable', this.onRecordData)

    /** @private */
    this.decoder = new Decoder({ isLive: true })
    this.onDecodedData = this.onDecodedData.bind(this)
    this.decoder.on('data', this.onDecodedData)

    /** @private */
    this.encoder = new Encoder()
    this.onEncodedData = this.onEncodedData.bind(this)
    this.encoder.on('data', this.onEncodedData)

    /** @private */
    this.headerChunks = []
    /** 
     * @private
     * @type {Buffer} */
    this.mHeader
  }

  /** заголовок Webm */
  get header() {
    return this.mHeader
  }


  /** @param {number} [ms] */
  start(ms) {
    this.recorder.start(ms)
  }

  stop() {
    this.recorder.stop()
  }

  clear() {
    this.decoder.off('data', this.onDecodedData)
    this.encoder.off('data', this.onEncodedData)
    this.recorder.removeEventListener('dataavailable', this.onRecordData)
  }

  init() {
    this.decoder.on('data', this.onDecodedData)
    this.encoder.on('data', this.onEncodedData)
    this.recorder.addEventListener('dataavailable', this.onRecordData)
  }

  /**
   * @param {'header' | 'data'} event 
   * @param {(data: Buffer) => any} listener 
   */
  on(event, listener) {
    return super.on(event, listener)
  }

  /**
   * @param {'header' | 'data'} event 
   * @param {(data: Buffer) => any} listener 
   */
  once(event, listener) {
    return super.once(event, listener)
  }

  /** @private */
  onDecodedData(chunk) {
    if (chunk[0] === 'start' && chunk[1].name === 'EBML') {
      this.headerChunks.length = 0
      this.headerEnded = false
    }
    if (chunk[0] === 'start' && chunk[1].name === 'Cluster') {
      if (!this.headerEnded) {
        this.headerEnded = true
        this.handleHeader()
      }
    }
    if (!this.headerEnded) {
      this.headerChunks.push(chunk)
    } else {
      this.encoder.write(chunk)
    }
  }

  /** @private */
  onEncodedData(data) {
    this.emit('data', data)
  }

  /** @private */
  handleHeader() {
    const encoder = new Encoder()
    const data = []
    encoder.on('data', (buf) => { data.push(buf) })
    this.headerChunks.forEach(chunk => encoder.write(chunk))
    encoder.end()
    this.mHeader = Buffer.concat(data)
    this.emit('header', this.mHeader)
    this.headerChunks.length = 0
  }

  /**
   * @private
   * @param {BlobEvent} ev 
   */
  async onRecordData(ev) {
    const buffer = await ev.data.arrayBuffer()
    buffer._isBuffer = true
    this.decoder.write(buffer)
  }
}

module.exports = { EbmlRecorder }