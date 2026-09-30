# SoundScript

A typing-driven ambient instrument in the browser. Type text and each key plays a note; pick a scale and root to control what every key maps to, so anything you type stays in key. Layer multiple recorded tracks and export them as audio.

**Live:** https://yerbapadre.github.io/soundscript/

## Features

- **Type to play** — `A`–`Z`, `0`–`9` map onto the selected scale across octaves. `space` rests, `Enter` starts a new line.
- **Scales & root** — major, minor, pentatonic, blues, dorian, lydian, mixolydian, harmonic minor, chromatic.
- **Voices** — Bell, Marimba, Bass, Ambient, Pad, Pluck, Glass. Ambient reverb + feedback delay on everything.
- **Multitrack** — 4 tracks. Arm one, hit REC, and layer over the others playing back in sync. Per-track mute / solo / clear.
- **Export** — download the full mix or any single track as WAV.

## Run locally

No build, no dependencies — but the code is split into ES modules, which browsers won't load over `file://`. Serve it over HTTP:

```bash
./serve.sh        # http://localhost:8080
# or: python3 -m http.server 8080
```

## Stack

Vanilla HTML/CSS/JS, no framework, no build step. Native ES modules under `src/`, Web Audio API for synthesis (no samples), Canvas for the visuals, `OfflineAudioContext` for WAV rendering.

## Layout

```
index.html      markup only
styles.css      all styling
src/
  config.js     scales, voices, key map, shared settings
  scale.js      key → frequency mapping
  voices.js     the 7 synth voices (pure Web Audio recipes)
  audio.js      AudioContext, effects graph, playback, WAV render
  visuals.js    canvas rings + floating glyphs
  tracks.js     track state, transport, recording (no DOM)
  ui.js         DOM rendering + controls (no audio logic)
  input.js      keyboard → notes
  bus.js        tiny event emitter decoupling tracks <-> ui
  main.js       boot
```

Data/logic (`tracks.js`) never touches the DOM; UI (`ui.js`) never touches audio internals. They talk through `bus` events (`change`, `tick`).
