Epic: 2 Features
Depends on: none

## Environment
- Repo: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\bowling-npcs` (a git worktree). Work only inside it. Game: `games/gnome-bowling` (TypeScript + Vite + vitest). In Git Bash, if node is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed.
- Five other workers are editing other files in this same game at the same time. Change only the files listed under Change. Do not run `vite build` / `npm run build`, and do not run any git command that writes (commit, stash, checkout, reset). Do not start a dev server.
- Type-check: `cd games/gnome-bowling && npx tsc --noEmit -p .` . An error in a file you do not own is another worker mid-edit: ignore it and mention it in your report.
- Tests: `cd games/gnome-bowling && npx vitest run src/npc.test.ts`.

## Goal
CPU bowlers pick real throws: a search over candidate throws using the game's own physics, with skill deciding how well they search and how much they wobble, so Robo-Gnome is scary, Big Lou is solid, Granny is steady and Gnome Chad sprays it everywhere. They also get personality quips.

## Read first
- `games/gnome-bowling/src/npc.ts`: the roster `NPCS` (id, name, title, look, color, skill 0..1, speed, spin, pitch) and the two stub functions you replace: `npcThrow` and `npcQuip`.
- `games/gnome-bowling/src/config.ts`: `ThrowInput` ({ x, aim, speed, spin }), `THROW` ranges (`xRange` 0.45, `aimRange` 0.05, `speedMin` 3.5, `speedMax` 10), `PIN_SPOTS`, `ResultKind`, and the coordinate notes at the top (+x is the bowler's LEFT; spin > 0 hooks toward +x).
- `games/gnome-bowling/src/physics.ts`: only the signature `export function simulateThrow(input: ThrowInput, standing: readonly boolean[]): SimResult` — `result.down[i]` is true for each pin (0..9) knocked down; `result.gutter` is true for a gutter ball. It is deterministic and costs about 3.5 ms per call.
- `games/gnome-bowling/src/physics.test.ts`: test style. A known strike from a full rack: `{ x: -0.25, aim: 0, speed: 9, spin: 0.6 }`.

## Change
- `games/gnome-bowling/src/npc.ts`: replace the bodies of `npcThrow` and `npcQuip` (keep the signatures and the roster exactly; you may add private helpers and constants).
  - `npcThrow(profile, standing, rand)`:
    1. Candidates. Always include the bowler's "home" throw: for a full rack the pocket ball `{ x: -0.25, aim: 0, speed: profile.speed, spin: profile.spin }`; for a spare, a straight throw aimed at the standing pins: x = the mean of the standing pins' PIN_SPOTS x, clamped to +/-0.42, aim 0, speed max(profile.speed, 7), spin 0. Then add random candidates drawn with `rand()`: x uniform in [-0.42, 0.42], aim uniform in [-0.05, 0.05], speed = profile.speed +/- 1, spin = either profile.spin or 0 (half and half). The number of candidates N = round(4 + 20 * profile.skill) (so at most 24: keep it there, each one is ~3.5 ms on the frame).
    2. Score each candidate with `simulateThrow(c, standing)`: score = pins knocked among those standing (count of i where standing[i] && down[i]), minus 5 if `gutter`. Pick the best (first wins ties).
    3. Wobble the chosen throw by (1 - skill): x += (rand() - 0.5) * 2 * 0.14 * (1 - skill); aim += (rand() - 0.5) * 2 * 0.03 * (1 - skill); speed += (rand() - 0.5) * 2 * 1.5 * (1 - skill); spin += (rand() - 0.5) * 2 * 0.5 * (1 - skill).
    4. Clamp to THROW ranges (x to +/-xRange, aim to +/-aimRange, speed to speedMin..speedMax, spin to -1..1) and return.
  - `npcQuip(id, kind, count)`: a private table `QUIPS: Record<NpcId, Partial<Record<'strikes' | 'spare' | 'bad' | 'split' | 'meh', string[]>>>` with 3-5 short lines (under ~8 words, written to be spoken by a text-to-speech voice: no emoji, no symbols) per group per bowler, in character:
    - Big Lou: gruff league veteran from the seventies ("That's how we did it in seventy-eight.").
    - Granny Gnertrude: sweet, slightly savage grandma ("Oh my stars!", "Back in my day pins were heavier.").
    - Robo-Gnome 3000: a robot ("Strike protocol complete. Beep boop.", "Error. Gutter detected. Rebooting.").
    - Gnome Chad: a dude bro who blames everything ("Bro!", "The lane is rigged, bro.").
    Groups: 'strikes' for strike/double/turkey/hambone, 'spare' for spare, 'bad' for gutter/miss, 'split' for split, 'meh' for nine/pins. Return a random line (Math.random is fine here) from the group, or null when the group is missing; for 'meh' return null half the time.
- `games/gnome-bowling/src/npc.test.ts` (new), vitest, deterministic: a seeded `rand` (e.g. `let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647;`). Tests:
  1. `npcThrow` output is always inside THROW ranges for every NPC (10 seeds each, full rack and a random leave).
  2. Over 12 seeds on a full rack, Robo-Gnome 3000 averages at least 8 pins (`simulateThrow` its returned throw).
  3. Over 12 seeds, Robo-Gnome's average on a full rack is higher than Gnome Chad's.
  4. Spare pick-up: with only the 10 pin standing (`standing[9]` true, others false), Robo-Gnome knocks it down in at least 6 of 12 seeds.
  5. `npcQuip` returns a non-empty string or null for every NPC and every ResultKind.
  If a threshold fails, tune the private constants in npc.ts (candidate counts, wobble sizes, the spare home throw), not the test thresholds, and not the roster values.

## Contract
Keep exactly (game.ts and audio.ts call these):
```ts
export function npcThrow(profile: NpcProfile, standing: readonly boolean[], rand: () => number): ThrowInput;
export function npcQuip(id: NpcId, kind: ResultKind, count: number): string | null;
```
and keep `NpcProfile`, `NPCS`, `NPC_ORDER`, `isNpcId` unchanged.

## Done when
- `cd games/gnome-bowling && npx vitest run src/npc.test.ts` passes (all 5 tests).
- `cd games/gnome-bowling && npx vitest run src/physics.test.ts src/scoring.test.ts` still passes.
- `npx tsc --noEmit -p .` has no errors in `src/npc.ts` or `src/npc.test.ts`.
- Report the measured averages (Robo, Chad) and the spare pick-up count.

## Out of scope
Every other file, especially `game.ts`, `config.ts`, `physics.ts`, `menu.ts`, `audio.ts`, `announcer.ts`.
