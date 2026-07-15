# urGlimpse

A lightweight, dependency-free web app that records your screen and microphone, previews the result, and lets you download or discard it as a WebM file. Built with plain HTML, CSS, and JavaScript in an Industrial Skeuomorphism design system — no frameworks, no external libraries.

## Features

- Record your screen (tab, window, or entire display)
- Record microphone audio, with graceful fallback to system or tab audio
- Live preview while recording with a pulsing REC indicator and timer
- Download the recording as a `.webm` file
- Pause / Resume / Stop controls, plus a Delete action to discard footage
- Fully client-side: nothing is uploaded; footage never leaves your browser

## Project structure

```
urGlimpse/
├── index.html        # App markup: header, capture module, result reel, and docs/footer sections
├── style.css         # Industrial skeuomorphism design system (neumorphic tokens, LEDs, panels)
├── script.js         # Capture, record, pause/resume, stop, download, and delete logic
├── vercel.json       # Static deploy configuration for Vercel
├── LICENSE           # MIT License
└── README.md         # This file
```

## How it works

The app uses three native browser APIs:

- `navigator.mediaDevices.getDisplayMedia()` — captures the screen (with optional system audio)
- `navigator.mediaDevices.getUserMedia()` — captures the microphone
- `MediaRecorder` — encodes the combined stream into a WebM blob

The screen and microphone tracks are merged into a single `MediaStream`, recorded in 1-second chunks, and assembled into a downloadable blob on stop.

## Project workflow

```
        +-------------------+
        |   Start Recording |
        +---------+---------+
                  |
                  v
        +------------------------+      user cancels / no support
        |  getDisplayMedia()     +------------------------+
        |  pick screen + audio   |                         |
        +---------+--------------+                         |
                  |                                        v
                  v                                 +---------------+
        +------------------------+                  |  Abort / alert|
        |  getUserMedia() mic    |                  +---------------+
        |  (fallback if denied)  |
        +---------+--------------+
                  |
                  v
        +------------------------+
        |  MediaRecorder starts  |
        |  REC LED + timer on     |
        +---------+--------------+
                  |
      +-----------+-----------+
      |                       |
      v                       v
+-----------+         +------------------+
|  Pause    |         |  Resume          |
+-----------+         +------------------+
      |                       |
      +-----------+-----------+
                  |
                  v
        +------------------------+
        |  Stop                   |
        |  blob -> playback video |
        +---------+--------------+
                  |
      +-----------+-----------+
      |                       |
      v                       v
+---------------+     +------------------+
|  Download WebM|     |  Delete footage  |
+---------------+     +------------------+
```

## How to run locally

Screen capture requires a secure context, so serve the app over `http://localhost` or `https` rather than opening the file directly.

```bash
# From the project folder
python -m http.server 8000
# then open http://localhost:8000
```

Click **Start**, pick what to share, grant microphone access, and use Pause / Resume / Stop as needed. When finished, preview the reel and Download or Delete it.

## Tech stack

Plain HTML, CSS, and JavaScript using the browser `MediaRecorder`, `getDisplayMedia`, and `getUserMedia` APIs. No external libraries. Fonts (Inter, JetBrains Mono) are loaded from Google Fonts.

## Browser support

Works best in Chromium-based browsers (Chrome, Edge, Brave). Screen capture is not available over `file://` or in non-secure contexts.

## Contributors

- N-PCs — creator and maintainer

## License

Released under the MIT License.
