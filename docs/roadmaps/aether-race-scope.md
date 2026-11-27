# Aether Board: race changes on the default route only

Goal: the 70 % top-speed cut (and with it the race course and clock, already free-ride only) applies to the default
free-ride route only. Descent (`?mode=descent`) and Flood Run (`?mode=flood`) keep the old speeds (maxSpeed 62, ley 48).

| Epic | Done when | Issues |
|---|---|---|
| 1. Scope the speed cap | `npm run build -w games/aether-board` and `npm test -w games/aether-board` pass | 2 (parallel) |

The planner, in parallel with the workers, edits `AGENTS.md` and `.claude/skills/decompose/SKILL.md` (delegation defaults).

## Epic 1

~~~~text
Epic: 1. Scope the speed cap
Depends on: none

## Environment
Working directory: /home/user/lawn-gnome-panic (Linux, node on PATH, dependencies installed: do not run npm install).
Another worker is editing games/aether-board/README.md at the same time; do not touch it. Do not commit.
Files src/config.ts and src/physics.ts use CRLF line endings: keep them CRLF (use the Edit tool, not a script that
rewrites the file).

## Goal
The 70 % top speed applies only to free ride (the default route, generateWorld called without a `hill`). Descent and
Flood worlds ride at the original speeds again.

## Read first
- games/aether-board/src/config.ts: TUNE.maxSpeed (now 43.4) and TUNE.leyMax (now 34)
- games/aether-board/src/world.ts: `export interface World` (near line 120) and the `const w: World = {...}` literal
  near the end of generateWorld (about line 916)
- games/aether-board/src/physics.ts: the soft speed cap (`const cap = TUNE.maxSpeed * ...`, about line 280) and the
  ley-line push (`gr.speed < TUNE.leyMax`, about line 804)

## Change
- src/config.ts: set `maxSpeed: 62,` with comment `// soft cap (free ride scales it by RACE_SPEED_SCALE)` and
  `leyMax: 48,` with comment `// free ride scales it by RACE_SPEED_SCALE`. Right after the TUNE object add:
  ```ts
  /** Free ride (the race to the gate) caps top speed at this share of TUNE.maxSpeed and TUNE.leyMax. Descent and Flood Run do not. */
  export const RACE_SPEED_SCALE = 0.7;
  ```
- src/world.ts: add to `interface World`, after `bumpers`:
  `/** Free ride (the default route): the race to the gate, with the race speed cap. False in Descent and Flood Run. */ race: boolean;`
  and in the `const w: World = {...}` literal add `race: !hill,`.
- src/physics.ts: import RACE_SPEED_SCALE from './config' (add it to the existing config import). Then
  `const cap = TUNE.maxSpeed * (w.race ? RACE_SPEED_SCALE : 1) * (1 + 0.25 * p.flow);`
  and `if (r.ley && gr.speed < TUNE.leyMax * (w.race ? RACE_SPEED_SCALE : 1)) gr.speed += TUNE.leyAccel * dt;`
  (`w` is the World parameter of both functions.)
- src/world.race.test.ts: in the test 'Descent and Flood Run worlds have no bumpers' also assert
  `expect(generateWorld(3).race).toBe(true)`, and `.race` is false for both the Descent and the Flood world.

## Contract
`World.race: boolean`; `RACE_SPEED_SCALE = 0.7` exported from config.ts. Nothing else changes names.

## Done when
- `npx tsc --noEmit -p games/aether-board` succeeds
- `npm test -w games/aether-board` passes (all tests)

## Out of scope
games/aether-board/README.md (another worker), docs/, AGENTS.md, any other game or package.
~~~~

~~~~text
Epic: 1. Scope the speed cap
Depends on: none

## Environment
Working directory: /home/user/lawn-gnome-panic. Another worker is editing games/aether-board/src/* at the same time;
do not touch any file under src/. Do not commit. README.md may use CRLF line endings: keep them (use the Edit tool).

## Goal
The Aether Board README says the reduced top speed applies to free ride only.

## Read first
- games/aether-board/README.md: the bullet starting `- **The race course**:` (it ends with "Top speed is 43.4 m/s
  (`TUNE.maxSpeed`, 70 % of the old 62; ley-lines 34).")

## Change
- games/aether-board/README.md: replace that last sentence with:
  "Free ride's top speed is 70 % of Descent's and Flood Run's (`RACE_SPEED_SCALE` in `config.ts` scales
  `TUNE.maxSpeed` 62 and `TUNE.leyMax` 48 to 43.4 and 34 when `World.race` is set)."
  Keep the line wrapping of the surrounding bullet (about 120 characters per line, two-space continuation indent).

## Contract
none

## Done when
- `grep -n "RACE_SPEED_SCALE" games/aether-board/README.md` prints the new line
- `grep -c "Top speed is 43.4" games/aether-board/README.md` prints 0

## Out of scope
Everything except games/aether-board/README.md.
~~~~
