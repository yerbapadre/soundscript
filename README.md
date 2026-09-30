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

No build, no dependencies. Open `index.html` in a browser, or:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Stack

Vanilla HTML/CSS/JS. Web Audio API for synthesis (no samples), Canvas for the visuals, `OfflineAudioContext` for WAV rendering.
