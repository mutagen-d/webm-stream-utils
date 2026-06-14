const TAG = '[MSEBuffer]'
class MSEBuffer {
  /**
   * @param {SourceBuffer} [sourceBuffer]
   * @param {AppendMode} [mode]
   */
  constructor(sourceBuffer, mode) {

    this.onError = this.onError.bind(this)
    this.onUpdateEnd = this.onUpdateEnd.bind(this)
    this.append = this.append.bind(this)
    /** 
     * @protected
     * @type {ArrayBuffer[]} */
    this.pending = []
    /** @protected */
    this.updating = false
    /** @protected */
    this.timer = undefined
    /** 
     * @protected 
     * @type {SourceBuffer} */
    this.sourceBuffer
    /** 
     * @protected
     * @type {AppendMode} */
    this.mode
    this.init(sourceBuffer, mode || 'sequence')
  }

  /**
   * @param {SourceBuffer} [sourceBuffer]
   * @param {AppendMode} [mode]
   */
  init(sourceBuffer, mode) {
    this.mode = mode || this.mode
    if (sourceBuffer && this.sourceBuffer !== sourceBuffer) {
      this.clear()
      this.sourceBuffer = sourceBuffer
      this.sourceBuffer.mode = this.mode
      this.sourceBuffer.addEventListener('error', this.onError)
      this.sourceBuffer.addEventListener('updateend', this.onUpdateEnd)
    }
    this.append()
  }

  clear() {
    clearTimeout(this.timer)
    if (this.sourceBuffer) {
      this.pending.length = 0
      this.sourceBuffer.removeEventListener('error', this.onError)
      this.sourceBuffer.removeEventListener('updateend', this.onUpdateEnd)
      this.updating = false
    }
  }

  /** @protected */
  onUpdateEnd() {
    console.log(TAG, '"updateend"')
    this.updating = false
    if (this.pending.length) {
      this.appendBuffer(this.pending.shift())
    } 
  }

  /** @protected */
  onError(err) {
    console.error(TAG, '"error"', err)
  }

  /**
   * @param {ArrayBuffer} data
   */
  appendBuffer(data) {
    if (this.updating || !this.sourceBuffer || this.sourceBuffer.updating) {
      this.pending.push(data)
      this.append()
    } else {
      this.updating = true
      this.sourceBuffer.appendBuffer(data)
    }
  }

  /** 
   * вызывается для подстраховки на случай, если буфер еще не создан а все данные уже закинуты в `this.pending`
   * @protected */
  append() {
    clearTimeout(this.timer)
    if (this.updating || !this.sourceBuffer || this.sourceBuffer.updating) {
      this.timer = setTimeout(this.append, 500)
    } else if (this.pending.length) {
      this.appendBuffer(this.pending.shift())
    }
  }
}

module.exports = { MSEBuffer }