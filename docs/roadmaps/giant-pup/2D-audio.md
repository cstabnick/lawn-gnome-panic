Epic: 2 Fill the modules
Depends on: none

## Environment
Repository root: /home/user/lawn-gnome-panic (Linux; node and npm are on PATH; `npm install` has been run).
Game: games/giant-pup (Vite + TypeScript + three@0.187.0). A pet-care game: the player is a gnome in a fenced back yard caring for a giant goofy cartoon dog (pet, feed, water, bath, fetch, tricks).
Other workers are editing other files in games/giant-pup at the same moment. Touch only the files this issue names. Do not add npm dependencies. Do not commit.
Repo rules: assets are generated in code only (no downloaded files). Mobile first: anything interactive must work by touch, with 44 px minimum targets and no hover-only UI.
The file you own currently holds a STUB with the final exported signatures. Keep every exported name and signature exactly as written in "Contract" (other files already import them); replace the bodies.

## Goal
`games/giant-pup/src/audio.ts` synthesizes every sound effect with the Web Audio API (no files): barks for a big friendly dog, a squeaky ball, slurps, crunches, splashes and UI clicks.

## Read first
- games/giant-pup/src/audio.ts: the stub you replace.

## Change
- games/giant-pup/src/audio.ts only.
- Lazily create one `AudioContext` inside `unlockAudio()` (never at import time; `window.AudioContext ?? (window as any).webkitAudioContext`), call `ctx.resume()` if suspended. Master GainNode 0.6 → a DynamicsCompressor → destination. `play()` before unlock does nothing.
- Mute: `setMuted(m)` sets master gain to 0 or 0.6 and remembers it in localStorage key `giant-pup.muted` (wrap storage in try/catch); `isMuted()` returns it; the stored value is read the first time it's needed.
- A white-noise AudioBuffer (1 s) created once after unlock, reused for noisy sounds.
- Each `play(sfx)` builds short-lived nodes, ramps gains with `setValueAtTime` / `exponentialRampToValueAtTime` (never ramp to exactly 0; use 0.0001) and stops sources after their envelope. Add ±8% random pitch variation to the dog voices so they don't repeat identically. Rate-limit each sfx: ignore a call less than 60 ms after the previous call of the same sfx (`scrub` 90 ms, `snore` 1.5 s).
  - `bark`: big dog "ruff": a sawtooth at ~170 Hz dropping to 110 Hz over 0.18 s through a lowpass (1200 Hz, Q 4) with a fast attack, plus a short bandpassed noise burst at 900 Hz for the chesty bit. Two quick barks 0.22 s apart.
  - `woof`: one deeper, longer bark (~140→85 Hz, 0.3 s).
  - `whine`: sine 700→1000→650 Hz over 0.6 s with vibrato (LFO 7 Hz, depth 25 Hz), quiet.
  - `pant`: 4 short bandpassed noise puffs (1500 Hz) 0.12 s apart.
  - `squeak`: rubber toy: square wave 1400→2200→1500 Hz over 0.15 s through a bandpass.
  - `slurp`: 3 lowpassed noise gulps with the filter sweeping 400→1800 Hz, 0.15 s each.
  - `crunch`: kibble poured: 10 tiny noise clicks (highpass 2000 Hz) at random times over 0.4 s.
  - `splash`: noise burst through a lowpass sweeping 3000→400 Hz over 0.5 s.
  - `scrub`: very short (0.08 s) bandpassed noise at 2500 Hz, quiet.
  - `pop`: sine 600→200 Hz in 0.06 s (ball bounce).
  - `throw`: noise whoosh, bandpass sweeping 500→2500 Hz over 0.25 s.
  - `happy`: two-note rising chime (triangle, E5 then A5, 0.12 s each).
  - `snore`: lowpassed noise swelling in and out over 1.2 s at very low volume, with a 60 Hz sawtooth rumble.
  - `click`: tiny 1 kHz sine blip, 0.03 s.
  - `fail`: two descending soft triangle notes (A4, F4).

## Contract
```ts
export type Sfx =
  | 'bark' | 'woof' | 'whine' | 'pant' | 'squeak' | 'slurp' | 'crunch'
  | 'splash' | 'scrub' | 'pop' | 'throw' | 'happy' | 'snore' | 'click' | 'fail';
export function unlockAudio(): void;
export function play(sfx: Sfx): void;
export function setMuted(muted: boolean): void;
export function isMuted(): boolean;
```
Also: after `unlockAudio()` creates the context, apply the stored mute state.

## Done when
- `cd games/giant-pup && npx tsc --noEmit` passes.
- No `new AudioContext` or `localStorage` access runs at module import time (only inside functions).

## Out of scope
Every other file: games/giant-pup/src/main.ts, brain.ts, dog.ts, scene.ts, fx.ts, ui.ts, config.ts.
