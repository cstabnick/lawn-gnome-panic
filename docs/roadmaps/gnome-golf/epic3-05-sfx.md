Epic: 3 Trees, music, cigarillos and golf water · Issue 5: sounds for the cigarillo and golf water
Depends on: none

## Goal
Three new one-shot sounds in the existing WebAudio synth: a lighter flick with a first puff, a can cracking open, and a gulp.

## Read first
- `games/gnome-golf/src/audio.ts`: how `sfx(name, volume)` synthesizes each existing sound (noise buffer, oscillators, gain envelopes, the switch on name)
- `games/gnome-golf/src/config.ts`: `SfxName` (now includes 'light', 'crack', 'sip')

## Change
- `games/gnome-golf/src/audio.ts` only: add the three cases to `sfx`:
  - 'light': a lighter: 2 quick metallic clicks of the flint wheel (very short high-passed noise bursts ~4 kHz, 25 ms apart), a soft "fwoomp" of the flame (band-passed noise ~600 Hz, 0.25 s, gentle attack), then 0.4 s later a soft inhale/puff (low-passed noise, 0.5 s swell and fade). Quiet.
  - 'crack': a can opening: a sharp click (5 ms noise, high-passed 3 kHz) followed by a fizzy hiss (white noise, high-passed ~5 kHz, 0.45 s, decaying), with tiny random crackles (a few 2 ms clicks) during the hiss.
  - 'sip': two or three gulps: each a short low "glunk" (sine sliding 220 -> 140 Hz in 90 ms, with a little band-passed noise), 0.32 s apart, then a satisfied "ahh" (a breathy band-passed noise around 900 Hz with a slow 0.5 s fade, quiet).
  - Same rules as the existing sounds: do nothing before `startAudio`; slight random pitch variation.

## Contract
Keep `startAudio`, `sfx(name, volume = 1)`, `createAudioSystem(ctx)` exactly as they are.

## Done when
- `cd /home/user/lawn-gnome-panic/games/gnome-golf && npx tsc --noEmit -p .` shows no errors in `src/audio.ts`.
- `sfx('light')`, `sfx('crack')`, `sfx('sip')` each produce their sound once audio is started.

## Out of scope
Every other file. Music is music.ts (another worker).
