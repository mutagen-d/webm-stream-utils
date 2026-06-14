# WebM/EBML streaming utils

A high-level toolkit for playing and recording live WebM/EBML streams in the browser.
Built on top of [ebml-demuxer](https://github.com/mutagen-d/ebml-demuxer.git) and Media Source Extensions (MSE).

## Features

- `EbmlPlayer`: Play live WebM streams chunk-by-chunk using MSE.
- `EbmlRecorder`: Record browser MediaStream (screen/camera) and cleanly separate the WebM header from the data chunks.
- Designed specifically for live streaming and real-time data transmission.

## Installation

```
npm install webm-stream-utils
```

or

```
yarn add webm-stream-utils
```

or cdn

```html
<script src="https://cdn.jsdelivr.net/npm/webm-stream-utils@1.0.0/dist/webm-stream-utils.iife.full.min.js"></script>
<script>
  const { EbmlPlayer, EbmlRecorder } = window.WebmStream
</script>
```

## Usage

### Playing a WebM Stream (`EbmlPlayer`)

Use this to play incoming WebM chunks (e.g., from a `WebSocket` or `Fetch` stream) directly into an `<video>` or `<audio>` element.

```js
const { EbmlPlayer } = require('webm-stream-utils');

const videoElement = document.querySelector('video');
const player = new EbmlPlayer(videoElement, { isLive: true });

// Example: Receiving chunks from a WebSocket
socket.on('webm-chunk', (buffer) => {
  player.write(buffer);
});
```

### Recording a MediaStream (`EbmlRecorder`)

Use this to capture screen/camera feeds.
It automatically parses the stream and emits the WebM header separately from the actual video/audio data.

```js
const { EbmlRecorder } = require('webm-stream-utils');

async function startRecording() {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
  });

  const recorder = new EbmlRecorder(stream, {
    mimeType: 'video/webm; codecs="vp8,opus"',
  });

  // Emitted once when the WebM header is ready
  recorder.on('header', (headerBuffer) => {
    console.log('WebM header ready:', headerBuffer.length, 'bytes');
    ws.send(headerBuffer)
    // Send to server or initialize a SourceBuffer
  });

  // Emitted continuously with the rest of the video data
  recorder.on('data', (dataBuffer) => {
    console.log('Received data chunk:', dataBuffer.length, 'bytes');
    ws.send(dataBuffer)
    // Send to server via WebSocket
  });

  // Start recording, collecting data every 1000ms
  recorder.start(1000);
}
```

## API

`EbmlPlayer`
  - `new EbmlPlayer(media, [options])`
    - `media`: `HTMLVideoElement` or `HTMLAudioElement`.
    - `options`: `{ isLive?: boolean, tracks?: Array<'video' | 'audio'> }`, default for `options.tracks = ['video', 'audio']`
  - `write(buffer: Buffer)`: Appends a new WebM/EBML chunk to the player.

`EbmlRecorder`
  - `new EbmlRecorder(stream, [options])`
    - `stream`: A browser `MediaStream`.
    - `options`: Standard `MediaRecorderOptions` (e.g., `mimeType`, `videoBitsPerSecond`).
  - `start([timeslice])`: Starts recording. timeslice is the interval in ms to emit data.
  - `stop()`: Stops the recording.
  - Events:
    - `'header'`: Emitted with a Buffer containing the WebM header.
    - `'data'`: Emitted with a Buffer containing the subsequent WebM data chunks.
