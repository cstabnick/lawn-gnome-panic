Epic: 2 (the six events)
Depends on: none

## Goal
`games/gnomylpics/src/hero/audio.ts` is Gnome Hero's jam: a synthesized drum beat locked to the song clock, and a short plucked note for every hit, one instrument per seat, all in A minor pentatonic so any random chart sounds musical. Pure WebAudio: oscillators, gain envelopes, filters and a generated noise buffer. No files, no libraries.

## Owns
- `games/gnomylpics/src/hero/audio.ts` only (fill the stub; keep its exported names, types and doc comments).

## Read first
- `games/gnomylpics/src/hero/audio.ts`: the stub with the final API (`JamOpts { bpm, leadS, songS }`, `Jam { tick, note, clunk, dispose }`, `createJam(opts)`).

## Change
- `createJam(opts)`:
  - `const ctx = new AudioContext()`; `master = ctx.createGain()` (gain 0.5) → `ctx.destination`. A 1 s white-noise `AudioBuffer` made once.
  - Browsers start the context suspended: call `ctx.resume()` right away (ignore the promise rejection) and also on the first `keydown` / `pointerdown` on `window` (listeners added here, removed in `dispose`).
  - **Clock mapping:** `anchor` = `ctx.currentTime - songT`. Set it on the first `tick`; on later ticks re-anchor only if the drift `|ctx.currentTime - songT - anchor| > 0.05`.
  - **Drums:** 8th-note grid, `step = 60 / opts.bpm / 2`. Keep `next` = index of the next 8th to schedule (start at 0 = song time 0). In `tick(songT)`: while `next * step < songT + 0.15` and `next * step < opts.songS`: if `next * step >= songT - 0.05` schedule it at `anchor + next * step` (skip ones already in the past), then `next += 1`. Pattern by `next % 8`: kick on 0 and 4 (also on 6 in the second half of the song), snare on 2 and 6, closed hat on every 8th (louder on even). If the song clock jumps back (songT < (next - 4) * step) reset `next = Math.ceil(songT / step)`.
    - kick: sine osc, frequency 150 → 40 Hz `exponentialRampToValueAtTime` over 0.12 s, gain 0.9 → 0.001 over 0.15 s.
    - snare: noise buffer source → bandpass (1800 Hz, Q 0.8) → gain 0.5 → 0.001 over 0.12 s; plus a triangle 190 Hz blip 0.06 s at gain 0.2.
    - hat: noise → highpass 7000 Hz → gain 0.15 (0.08 on odd 8ths) → 0.001 over 0.03 s.
  - **note(lane, seat, mine):** A minor pentatonic, base A3 = 220 Hz. Semitones per lane `[0, 3, 5, 7]`; add `+12` for lane notes at random 25% (Math.random is fine here: the view is not simulated). Per seat instrument: seat 0 `sawtooth` through a lowpass 2200 Hz (lead), seat 1 `triangle` one octave down (bass), seat 2 `square` through lowpass 1600 Hz (keys), seat 3 `sine` one octave up (flute). Envelope: attack 0.005 s to peak (`mine ? 0.35 : 0.12`), exponential decay to 0.001 over 0.28 s; stop the oscillator after 0.32 s. Schedule at `ctx.currentTime` (immediate).
  - **clunk():** square 80 Hz, lowpass 400 Hz, gain 0.25 → 0.001 over 0.08 s.
  - **dispose():** remove the listeners, `ctx.close()` (ignore rejection). Calls after dispose do nothing.
  - Never throw: if `AudioContext` is missing (`typeof AudioContext === 'undefined'`) return a silent Jam with no-op methods.
- No module-level DOM or `window` access (only inside `createJam`).

## Done when
- `npx tsc --noEmit -p games/gnomylpics` shows no errors in `src/hero/audio.ts`.
- `node -e "process.exit(require('fs').readFileSync('games/gnomylpics/src/hero/audio.ts','utf8').includes('void opts') ? 1 : 0)"` exits 0.

## Out of scope
Every other file: `src/hero/chart.ts`, `src/minigames/**`, `src/olympic/**` belong to other workers. Never run vite, npm install or npm test for the workspace.
