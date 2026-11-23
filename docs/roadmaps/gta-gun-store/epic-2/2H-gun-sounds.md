Epic: 2 (parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-gun-store/_common.md` first. Another chunk of work is editing `audio.ts` in parallel: do NOT edit it.

## Goal
`playGunShot(gun, sound)` in `games/gnome-theft-auto/src/gunSounds.ts` plays the shot sound a gun's mods give: the stock gunshot, a
suppressed "pfft", a heavy boom, a kazoo buzz or a squeaky-duck squeak. Synthesized with Web Audio; self-contained.

## Read first
- `games/gnome-theft-auto/src/gunSounds.ts`: the stub (keep its export).
- `games/gnome-theft-auto/src/audio.ts` lines 1-140 and 260-290: `getAudioOutput()` (returns `{ ctx, master, muted } | null`, null until the
  first user gesture), the private helpers `noiseBuffer`, `release`, `decay`, `noiseBurst`, `tone` (copy small private versions of them
  into gunSounds.ts; do not export them from audio.ts), and the `'gunshot'` / `'shotgun'` cases (the stock sounds).
- `games/gnome-theft-auto/src/gunMods.ts`: `GunSoundId` = `'stock' | 'suppressed' | 'heavy' | 'kazoo' | 'squeak'`.

## Change
- `games/gnome-theft-auto/src/gunSounds.ts`:
  - `playGunShot(gun, sound)`: `'stock'` (or any unknown id) calls `play(gun === 'shotgun' ? 'shotgun' : 'gunshot')` from './audio' exactly as
    now. Every other sound: `const out = getAudioOutput(); if (!out) return;` and synthesize on `out.ctx` into `out.master` at `t = ctx.currentTime`.
    Rate-limit like audio.ts: skip when less than 0.03 s since the last modded shot.
  - Sounds (peaks are gain values; keep everything under 0.6; a shotgun makes each one ~1.5x longer and a bit lower):
    - `suppressed`: a soft "pfft": bandpass noise 0.07 s at 1400 Hz (Q 0.8) peak 0.16, plus a tiny high click (highpass noise 0.012 s at 5000 Hz, peak 0.06).
    - `heavy`: lowpass noise 0.4 s sweeping 1500 -> 180 Hz peak 0.55, a sine thump 0.35 s 85 -> 28 Hz peak 0.6, and a short highpass crack 0.03 s 3500 Hz peak 0.3.
    - `kazoo`: a 0.2 s buzzy note: a sawtooth oscillator around 330 Hz with vibrato (an LFO oscillator at 22 Hz through a gain of 25 Hz into
      `frequency`), sliding down to 260 Hz, through a bandpass at 1200 Hz (Q 3), gain envelope 0.005 s attack to 0.22 then decay. Pick the base
      pitch randomly from 300-360 Hz so a burst sounds like a tune.
    - `squeak`: a rubber duck: a square oscillator 0.13 s gliding 900 -> 1500 -> 800 Hz (two `linearRampToValueAtTime`s), through a
      lowpass at 3000 Hz, peak 0.14; plus a softer second squeak 0.06 s later at 70 % volume.
  - Disconnect every node when its source ends (like audio.ts `release`).
  - Export nothing else.

## Contract
`export function playGunShot(gun: GunKind, sound: GunSoundId): void` (unchanged from the stub). The app calls it once per shot, and the shop's
test-fire button calls it too.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `gunSounds.ts`.
- `audio.ts` is unchanged (`git diff --stat games/gnome-theft-auto/src/audio.ts` prints nothing).

## Out of scope
`audio.ts` and every other file.
