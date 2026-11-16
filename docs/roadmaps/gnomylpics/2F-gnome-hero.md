Epic: 2 (the six events)
Depends on: none (it calls `src/hero/audio.ts`, which another worker fills at the same time; its exported API is final and its stub works silently)

## Goal
`games/gnomylpics/src/minigames/oly-gnome-hero.ts` is **Gnome Hero**: a random, beat-driven, 4-lane rhythm jam. Notes fall down a highway in time with a drum beat; hit each one in its lane as it crosses the line. The four gnomes stand on a stage with guitars and jam together: every hit (yours or theirs) plays a note in a pentatonic scale, so random charts always sound like music. Most points wins.

## Owns
- `games/gnomylpics/src/hero/chart.ts` (new), `games/gnomylpics/src/hero/chart.test.ts` (new)
- `games/gnomylpics/src/minigames/oly-gnome-hero.ts` (replace the template), `games/gnomylpics/src/minigames/oly-gnome-hero.test.ts` (new)
- NOT `src/hero/audio.ts` (another worker). Import it: `import { createJam, type Jam } from '../hero/audio';` — `createJam({ bpm, leadS, songS })` → `{ tick(songT), note(lane, seat, mine), clunk(), dispose() }`.

## Read first
- `games/gnomylpics/src/hero/audio.ts` (the API you call), `src/olympic/rank.ts`, `src/olympic/field.ts`, `src/olympic/run.ts` (only `cpuSkill`).
- `packages/party/src/types.ts` — the contract; `packages/party/src/rng.ts` — `mulberry32(seed)`.

## `src/hero/chart.ts` (pure, no DOM)
```ts
export type Lane = 0 | 1 | 2 | 3;
export interface Note { t: number; lane: Lane }
export interface Chart { bpm: number; beat: number; leadS: number; songS: number; notes: Note[] }
export const LEAD_S = 2;
export function makeChart(seed: number): Chart;
/** makeChart, memoised for the last 4 seeds (a Map). */
export function chartFor(seed: number): Chart;
```
- `rng = mulberry32(seed)`; `bpm = 96 + Math.floor(rng() * 8) * 4` (96..124); `beat = 60 / bpm`; `bars = Math.floor(38 / (4 * beat))`.
- For bar `b` in `0..bars-2` and 8th step `i` in `0..7`: `sec = b / bars`; chance = `i % 2 === 0 ? Math.min(0.9, 0.55 + 0.35 * sec) : 0.1 + 0.4 * sec`; if `rng() < chance` add a note at `t = LEAD_S + (b * 8 + i) * beat / 2` (rounded to 4 decimals).
- Last bar: one note on its first beat.
- Lanes: a random walk from lane 1: each note `step = rng() < 0.15 ? random lane : lane + (rng() < 0.5 ? -1 : 1) * (rng() < 0.7 ? 1 : 0)`, clamped to 0..3; never the same lane 3 times in a row (move it one towards the middle).
- `songS = LEAD_S + bars * 4 * beat`.
- `chart.test.ts`: same seed → equal charts; notes sorted by t, all within `[LEAD_S, songS)`; `30 <= songS <= 42`; 60..220 notes; lanes 0..3; no lane 3 times in a row.

## Slice rules (constants at the top)
```ts
const PERFECT = 0.06, GOOD = 0.15;   // seconds either side of a note
const PTS_PERFECT = 100, PTS_GOOD = 50;
const COMBO_STEP = 8, MAX_MULT = 4;  // multiplier = min(MAX_MULT, 1 + floor(combo / COMBO_STEP)), combo AFTER the hit
const END_PAD = 1.5;                 // the round ends at songS + END_PAD
const LOOKAHEAD = 1.6;               // view: seconds of notes visible on the highway
// meta.maxSeconds = 50
```
- meta: `id: 'oly-gnome-hero'`, `title: 'Gnome Hero'`, `goal: 'Hit the most notes on the beat and score the most points.'`, `controls: 'Lanes: A S D F (or ← ↓ ↑ →, or J K L ;), or tap the four lane buttons.'`.
- `interface I { score: number; hits: number; miss: number; combo: number; best: number; lane: number; auto: boolean }`.
- Seat: `{ score: number; hits: number; miss: number; combo: number; best: number; lane: number; skill: number }`. `S = { t: number; seed: number; ni: number; seats: Seat[] }` (`ni` = the next chart note the CPU judging reaches).
- `init`: `seed = Math.floor(rng() * 2147483647)`; seats all zero, `lane: 1`, `skill: 0.65 + rng() * 0.3`.
- `step(s, inputs, dt, rng)`: `s.t += dt`; `const c = chartFor(s.seed)`;
  - Human seats (input not null and `auto === false`): copy `score, hits, miss, combo, best, lane` from the input (they judge themselves on their screen; this is a friendly party).
  - CPU judging: `while (s.ni < c.notes.length && c.notes[s.ni].t <= s.t - GOOD)`: for every seat k whose input is not null and `auto === true`: `if (rng() < skill)` → hit: `combo += 1`, `best = max`, `hits += 1`, `lane = note.lane`, `score += (rng() < skill ? PTS_PERFECT : PTS_GOOD) * mult(combo)`; else `miss += 1`, `combo = 0`. Then `s.ni += 1`.
- `cpu(s, seat)`: `{ ...the seat's score/hits/miss/combo/best/lane, auto: true }` (the CPU's scoring happens in step).
- `result`: `s.t >= chart.songS + END_PAD` or `timeUp` → `placesFrom(seats.map(x => x.score), true)`.

## View
- **Clock:** `songT` starts at `s.t` on the first render, then `songT += dt`; if `Math.abs(s.t - songT) > 0.25` snap to `s.t`, else `songT += (s.t - songT) * Math.min(1, dt * 2)`. `chart = chartFor(s.seed)` (first render).
- **Audio:** on the first render `jam = createJam({ bpm: chart.bpm, leadS: chart.leadS, songS: chart.songS })`; every render `jam.tick(songT)`. When any OTHER seat's `hits` in `s` rises, `jam.note(s.seats[k].lane, k, false)` and strum its gnome. `dispose()` → `jam.dispose()`.
- **My judging** (only if `mySeat !== null`), in a closure: `judged: boolean[]` per chart note; my `score, hits, miss, combo, best, lane` counters.
  - On the first render mark every note with `t < songT` as judged (no misses for notes before I arrived).
  - Keys: a `window` `keydown` listener (ignore `e.repeat` and text inputs; `preventDefault` for these codes): lane 0 `KeyA ArrowLeft KeyJ`, lane 1 `KeyS ArrowDown KeyK`, lane 2 `KeyD ArrowUp KeyL`, lane 3 `KeyF ArrowRight Semicolon`. Touch (only if `matchMedia('(pointer: coarse)').matches`): four lane buttons across the bottom of the highway (`pointer-events:auto;touch-action:none`, `pointerdown` + `preventDefault`).
  - A press in lane L at `songT`: the first unjudged note in lane L with `|t - songT| <= GOOD` → judged; `combo += 1`, `best = max`, `hits += 1`, `lane = L`, `score += (|d| <= PERFECT ? PTS_PERFECT : PTS_GOOD) * mult(combo)`; show 'PERFECT'/'GOOD'; `jam.note(L, mySeat, true)`; strum my gnome. No such note → `combo = 0`, `jam.clunk()`, show 'MISS'.
  - Each render: unjudged notes with `t < songT - GOOD` → judged, `miss += 1`, `combo = 0`, show 'MISS'.
  - `input()` returns `{ score, hits, miss, combo, best, lane, auto: false }`.
- **Highway** (my seat only): a 2D `<canvas>` in `ui`, `position:absolute;left:50%;transform:translateX(-50%);bottom:4vh;width:min(92vw,420px);height:60vh;pointer-events:none`; size its backing store to its CSS size × devicePixelRatio. Draw each render: translucent dark background; 4 lanes in `['#4caf50', '#f44336', '#ffeb3b', '#2196f3']`; a hit line at 85% height with a ring per lane (filled bright for 100 ms after that lane is pressed); every unjudged note with `0 <= t - songT <= LOOKAHEAD` as a gem at `y = hitY - (t - songT) / LOOKAHEAD * hitY`; beat lines (thin) every beat; text above the hit line: the last judgement (fades in 0.4 s), `combo` and `x${mult}`.
- **Stage (3D)**: `scene.background = new THREE.Color(0x1a1033)`; ambient/hemisphere light dim (0.5) plus one `SpotLight` per seat above its gnome in the seat colour (`intensity` pulses up on each beat and on that seat's hits); a stage box (12×0.4×5, dark wood `0x5d4037`) at y -0.2; the floor beyond dark. `racers = addRacers(scene, seats)`, placed in a row at `(laneX(k) * 1.4, 0, 0)` via `poseRacer(racers[k], laneX(k) * 1.4, y, 0, 0, dt)` (they face +z, towards the camera). Bob: `y = 0.06 * Math.max(0, Math.cos(2 * Math.PI * songT / chart.beat))` on the beat.
- Guitar per gnome (a Group added to `racer.model.object`): body = `CylinderGeometry(0.22, 0.22, 0.08, 16)` rotated to face forward in the seat colour, neck = box 0.05×0.05×0.6 dark brown, at chest height across the body. Strum: set `model.arms.right.rotation.x = -1.2` and ease it back to 0 over ~0.15 s.
- Camera: `camera.position.set(0, 2.4, 7.5); camera.lookAt(0, 1.1, 0)`.
- Board rows: `${score}` (my row also `  x${mult}`). Banner `'JAM!'` on the first render; hint `'A S D F  or  ← ↓ ↑ →'` for the first 3 s.
- `dispose()`: remove the keydown listener, `jam.dispose()`.

## Done when / out of scope
Apply the common slice rules (pasted with this issue): `npx vitest run src/hero/chart.test.ts src/minigames/oly-gnome-hero.test.ts` passes (the slice test = `testMinigame(def)` plus one `it`: `runHeadless(def, 1)` ends with `timeUp === false` and every seat's place is valid). No edits outside the four owned files.
