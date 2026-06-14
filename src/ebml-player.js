const { EbmlDemuxer } = require('ebml-demuxer')
const { MSEPlayer } = require('./mse-player')

class EbmlPlayer {
  /**
   * @param {HTMLVideoElement | HTMLAudioElement} [media]
   * @param {{ isLive?: boolean; tracks?: Array<'video' | 'audio'> }} [options]
   */
  constructor(media, options) {
    this.player = new MSEPlayer(media)
    options ||= {}
    options.tracks ||= ['video', 'audio']
    this.stream = new EbmlDemuxer(options)

    this.onTracks = this.onTracks.bind(this)
    this.onVideo = this.onVideo.bind(this)
    this.onAudio = this.onAudio.bind(this)
    this.onKeyframe = this.onKeyframe.bind(this)
    /** 
     * @private
     * @type {number[]} */
    this.videoKeyframes = []
    /** 
     * @private
     * @type {number[]} */
    this.audioKeyframes = []

    this.stream.on('tracks', this.onTracks)
    this.stream.on('audio', this.onAudio)
    this.stream.on('video', this.onVideo)
    this.stream.on('keyframe', this.onKeyframe)
  }

  /** @param {Buffer} buffer */
  write(buffer) {
    this.stream.write(buffer)
  }

  /**
   * @private
   * @param {{ number: number; codec: string; type: 'audio' | 'video'; mime: string }[]} tracks 
   */
  onTracks(tracks) {
    const opts = {}

    const video = tracks.find(t => t.type === 'video')
    if (video) {
      opts.videoMimeType = video.mime
    }
    const audio = tracks.find(t => t.type === 'audio')
    if (audio) {
      opts.audioMimeType = audio.mime
    }

    this.player.init(undefined, opts)
  }

  /**
   * @private
   * @param {Buffer} data
   * @param {string} [codec]
   */
  onVideo(data, codec) {
    this.player.appendVideo(data)
  }

  /**
   * @private
   * @param {Buffer} data
   * @param {string} [codec]
   */
  onAudio(data, codec) {
    this.player.appendAudio(data)
  }

  onKeyframe(timecode, track) {
    switch (track) {
      case 'video':
        this.videoKeyframes.push(timecode)
        break
      case 'audio':
        this.audioKeyframes.push(timecode)
        break
    }
  }
}

module.exports = { EbmlPlayer }