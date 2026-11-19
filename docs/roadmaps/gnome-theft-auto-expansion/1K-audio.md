Epic: 1 (Modules), issue 1K: gun, reload, parachute and plane sounds (audio.ts)
Depends on: none

## Environment
Working directory: C:\Users\cstab\Documents\gaming (Git Bash; if node is not found: export PATH="/c/Program Files/nodejs:$PATH"; dependencies are installed).
Game: games/gnome-theft-auto (Vite + TypeScript + three.js 0.187). Several other workers are editing other files of this game at the same time: change only the files named under "Change". Do not run `npm run build` or `npm run dev`, do not start servers, do not git commit.
The check is `npx tsc --noEmit -p games/gnome-theft-auto`. An error in a file you do not own means another worker is mid-edit: ignore it unless your change caused it. NEVER edit types.ts, config.ts or collide.ts: they are final contracts, already written. Read them first (types.ts: every interface; config.ts: WORLD_HALF, CITY_HALF, ROAD_LINES, BIOMES, biomeAt, HIGHWAYS, BASE, AIRFIELD, VIEW, BUILDINGS, VEHICLES, FLY, GUNS, BULLET, CHUTE).
Conventions: y is up, 1 unit = one gnome's height (about 1.3). Yaw 0 faces +z, forward = (sin yaw, 0, cos yaw), turning right DECREASES yaw. The ground is flat (y = 0) everywhere. No per-frame allocation in hot loops (reuse scratch vectors). Free assets only: everything is built from code or from @lawn/prefabs (prefabs are data in packages/prefabs/src/catalog). The game is a gnome parody (lore setting: apocrypha): keep any text dry and cartoon-safe, no gore, no real brands.
The world: a 1200 x 1200 flat map. Turfton (the city grid, |x|,|z| <= 215) in the middle; outside it four biomes split along the diagonals: desert east (Fort Sandpit and the airfield with two planes), forest west, tundra north, farmland south, joined to the city by highways (config.ts HIGHWAYS).

## Goal
The game sounds like guns: gunshot, shotgun blast, reload clicks, a parachute whoosh, and a propeller-plane engine. All synthesised in code (Web Audio), no files.

## Read first
- games/gnome-theft-auto/src/audio.ts: the whole file (`playSfx` switch, `noiseBurst` and the other helpers, `setEngine`, `ensureEngine`).
- games/gnome-theft-auto/src/types.ts: `Sfx` now also contains 'gunshot' | 'shotgun' | 'reload' | 'chute'.

## Change
- games/gnome-theft-auto/src/audio.ts:
  - `playSfx` cases: `'gunshot'`: a sharp crack (very short high noise burst) plus a low thump (a 120 to 50 Hz sine drop over 0.1 s); rate-limit to one per 0.03 s. `'shotgun'`: louder, longer (0.25 s) low-mid noise blast with a deeper thump. `'reload'`: two short metallic clicks (high bandpass noise bursts 0.35 s apart). `'chute'`: a 0.6 s whoosh (noise through a bandpass that sweeps from 400 to 1500 Hz and back, volume swelling then fading).
  - `setEngine(on: boolean, speed01: number, flying: boolean, plane?: boolean): void`: add the optional 4th parameter. When `plane` is true use a lower, buzzier propeller drone (sawtooth around 70 to 140 Hz with a tremolo around 28 Hz) whose pitch and volume rise with `speed01`; otherwise unchanged behaviour. Switching between plane and other engines must not leave the previous oscillator running.
  - Keep every existing export and sound.

## Contract
`export function play(s: Sfx): void`, `export function setEngine(on: boolean, speed01: number, flying: boolean, plane?: boolean): void`, `export function unlockAudio(): void` (as today).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` reports no error in audio.ts.

## Out of scope
types.ts, config.ts, main.ts, every other file.
