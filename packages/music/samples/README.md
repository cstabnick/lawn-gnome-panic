# @lawn/music Mix Analyzer & Samples

Programmatic mix quality analysis for `@lawn/music` tracks:

1. **Audio-Graph Topology Linter** (`src/analyze/graph.ts`):
   - Runs in pure Node (no WebAudio needed) via `npm test -w packages/music`.
   - Catches `stereo-into-reverb` (sending `StereoWidener`, `Chorus`, `Panner`, `AutoPanner`, or `Phaser` into `Reverb`), `excessive-stereo-width` (`StereoWidener.width > 0.7`), and `reverb-missing-highpass`.

2. **Offline DSP Mix Analyzer** (`src/analyze/dsp.ts` + `tools/analyze.mjs`):
   - Renders each track offline in headless Chromium via `Tone.Offline` at 48 kHz stereo.
   - Measures peak/RMS/crest factor, clipping, L/R correlation, Side-to-Mid ratio, mono-sum drop, L/R balance, 4-band spectral balance (`<100 Hz`, `100-400 Hz`, `400-4k Hz`, `>4k Hz`), and 25 ms dynamic spread.

## Commands

```bash
# Fast unit & graph topology tests (pure Node)
npm test -w packages/music

# Full offline render + DSP + graph analysis across all tracks
npm run analyze -w packages/music -- --no-fail

# Export 16-bit stereo WAV samples to packages/music/samples/wav/ for listening
npm run analyze -w packages/music -- --no-fail --wav samples/wav --json samples/report.json
```

`report.json` in this directory is a sample output from running the analyzer across `runTrack`, `menuTheme`, `trance`, `sectorTrack`, `golfAmbient`, and `bowlingAmbient` (`seed=42`, `duration=28s`).
