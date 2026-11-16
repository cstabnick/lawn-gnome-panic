Epic: 2 Features
Depends on: none

## Environment
- Repo: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\bowling-npcs` (a git worktree). Work only inside it. Game: `games/gnome-bowling` (TypeScript + Vite). In Git Bash, if node is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed.
- Five other workers are editing other files in this same game at the same time. Change only the files listed under Change. Do not run `vite build` / `npm run build`, and do not run any git command that writes (commit, stash, checkout, reset).
- Type-check: `cd games/gnome-bowling && npx tsc --noEmit -p .` . An error in a file you do not own is another worker mid-edit: ignore it and mention it in your report.
- A dev server is already running at http://localhost:5291/ (do not start or stop one). Smoke test, from the repo root: `bash tools/smoke.sh "http://localhost:5291/#cpu" bx-root` (a CPU-vs-CPU game plays by itself; prints console errors).
- You cannot hear audio. Be careful with WebAudio parameter rules: `exponentialRampToValueAtTime` needs a value > 0; schedule everything at `ac.currentTime + offset`; stop every source you start.

## Goal
An over-the-top bowling-alley PA announcer: a deep, slow robot voice (the browser's speech synthesis, which on Windows is a Microsoft voice) that calls the big moments with stretched words and echo tails, wrapped in WebAudio stingers (air horn, organ fanfare, sad trombone, drum roll, PA mic thump).

Speech synthesis output cannot go through WebAudio, so the "voice effects" are built from the speech itself: low pitch and slow rate, stretched spellings ('STEEEE-RIKE'), and echo tails (the last word again, quieter and lower, as extra queued parts).

## Read first
- `games/gnome-bowling/src/announcer.ts`: the stub you replace (two exports).
- `games/gnome-bowling/src/speech.ts`: `speak(parts, interrupt)`, `SpeechPart` ({ text, voice?: 'gnome' | 'announcer', pitch? 0..2, rate?, volume? 0..1 }), `speaking()`, `announcerOn()`.
- `games/gnome-bowling/src/audio.ts`: `audioOut(): { ac: AudioContext; out: AudioNode } | null` (null until the first tap or when muted — check it every time you play), and the helper style (`env`, `tone`, `burst`) to copy into your own file; the audio system's `update` shows how to detect phase changes and new results. Note: audio.ts speaks the gnome's own line at 0.15 s into 'result' unless `announcerOn() && announcerTakes(r)`.
- `games/gnome-bowling/src/config.ts`: `GameState` (phase, phaseTime, players, current, frame, result), `Phase`, `BallResult` (kind, count, player, serial, cartoon, streak), `ResultKind`, `Player` (name, npc).
- `games/gnome-bowling/src/npc.ts`: `NPCS[id].name` and `.title` for CPU bowlers.

## Change
- `games/gnome-bowling/src/announcer.ts` only. Keep the two exports' signatures.
  1. `announcerTakes(r: BallResult): boolean`: true for strike, double, turkey, hambone, spare, split, gutter; for nine, miss and pins true when `r.serial % 3 === 0`, else false. Pure.
  2. Stingers (private functions; each starts with `const o = audioOut(); if (!o) return;` and connects to `o.out`). Copy small `env`/`tone`/`noise` helpers from audio.ts into this file (you cannot import audio.ts's private ones). Keep each peak gain at or under 0.35.
     - `micThump()`: PA mic tap before a call: two low thumps (sine 90 -> 50 Hz, 0.08 s, 0.12 s apart) and a faint feedback whine (sine 2600 Hz, 0.25 s, peak 0.03).
     - `airHorn()`: BWAP BWAP BWAAAP: three blasts (0.18, 0.18, 0.6 s, gaps 0.06 s) of three detuned sawtooths (233, 235, 311 Hz) through a lowpass at 2200 Hz.
     - `organCharge()`: the ballpark "charge" bugle call on an organ (square + sine one octave up): notes G4 C5 E5 G5 (each 0.13 s), E5 (0.13 s), G5 (0.5 s). It is a traditional public-domain call.
     - `sadTrombone()`: wah wah wah waaah: sawtooth through a lowpass at 900 Hz, notes D4, C#4, C4 (0.35 s each) then B3 for 1.0 s with a 6 Hz vibrato (an LFO oscillator into the frequency through a gain of 8).
     - `drumRoll(seconds)`: noise bursts every 0.035 s getting louder, then a crash (highpass noise 1.2 s).
     - `crowd(level)`: 2 s of bandpassed noise swelling and falling, like `cheer()` in audio.ts.
  3. Lines (private tables; written for a robot voice: plain words, no emoji or symbols; several per event, never the same one twice in a row — copy `pickLine` from audio.ts). Each call is a list of SpeechParts with `voice: 'announcer'`, pitch 0.2 to 0.6, rate 0.75 to 0.95, ending with an echo tail: the last word repeated twice more as extra parts with volume 0.45 then 0.2 and pitch lowered by 0.1 each time (rate 1.1). Example strike call: `[{ text: 'STEEEEE-RIIIIKE!', pitch: 0.35, rate: 0.8 }, { text: 'strike', volume: 0.45, pitch: 0.25, rate: 1.1 }, { text: 'strike', volume: 0.2, pitch: 0.15, rate: 1.1 }]`.
     - game start: 'Ladies and gnomes! Welcome to the Gnome Bowl!' style lines; `organCharge()`.
     - bowler intro: 'Now bowling... <name>!'; for a CPU player 'Now bowling... <name>, <title>!' (NPCS[p.npc]); in the tenth frame (state.frame === 9) 'Tenth frame! It all comes down to this!' style instead.
     - strike / double / turkey (mention gobble) / hambone (over the top: 'Somebody call the fire department!'), spare, split, gutter (mock sympathy), nine/miss/pins (dry one-liners).
     - final: 'And the winner is...' then `drumRoll(1.6)`, then '<name>!' with `airHorn()` and `crowd(1)`.
  4. Stinger per result: strike and double `airHorn()` + `crowd(0.8)`; turkey and hambone `organCharge()` + `crowd(1)`; spare `organCharge()`; gutter and miss `sadTrombone()`; split `micThump()`. Every call is preceded by `micThump()`.
  5. `createAnnouncer(ctx): System` reads `ctx.state` every frame and triggers:
     - game start: when a new `state.players` array appears (compare the reference) and phase is 'intro'.
     - bowler intro: on entering 'intro' (not the game start one): announce when it is the player's first frame (frame 0), the tenth frame, or a CPU player; otherwise skip (keep it from getting annoying).
     - results: once per new `state.result.serial`, at `state.phaseTime >= 0.05` in 'result', only if `announcerTakes(r)`. Use `speak(parts, true)` (interrupt) for results.
     - final: once on entering 'final' (winner = highest `totalScore(p.rolls)` from `./scoring`).
     - Nothing at all while `!announcerOn()`; nothing in phases 'title' / 'lobby'.

## Contract
Keep exactly (audio.ts and main.ts use them):
```ts
export function announcerTakes(r: BallResult): boolean;
export function createAnnouncer(ctx: Ctx): System;
```

## Done when
- `cd games/gnome-bowling && npx tsc --noEmit -p .` has no errors in `src/announcer.ts`.
- `bash tools/smoke.sh "http://localhost:5291/#cpu" bx-root` prints SMOKE OK (from the repo root).
- Report every WebAudio node you start and where it is stopped.

## Out of scope
Every other file, especially `audio.ts`, `speech.ts`, `menu.ts`, `game.ts`, `config.ts`.
