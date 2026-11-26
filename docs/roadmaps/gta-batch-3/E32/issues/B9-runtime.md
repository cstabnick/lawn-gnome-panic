Epic: E32-B (nine holes, parallel build)
Depends on: none · Worker: haiku

First read `docs/roadmaps/gta-batch-3/E32/issues/_env.md`.

## Goal
The golf runtime plays the nine: it unlocks the three new achievements, stands the gnome on the potting-shed roof for
hole 7 (and lets the player climb up and down with an E prompt at the ladder), and tells the player where the next tee
is when it is through the Turn Gate.

## Read first
- `games/gnome-theft-auto/src/golf/runtime.ts` (about 425 lines): `putPlayer`, `standAtBall`, `startRound`,
  `handleEvents` (the 'holed' and 'round-done' branches), `onAction` ('next-hole', 'to-ball'), `prompt()` /
  `interact()`, the rustle loop `for (const s of [...yard.soft, ...bottom.soft])`.
- `games/gnome-theft-auto/src/golf/runtime.test.ts` (how the runtime is installed with fake deps).
- `games/gnome-theft-auto/src/terrain.ts`: `groundAt(x, z, y = Infinity)` (terrain or the highest walkable rooftop at
  or below y) — check its body to confirm it includes rooftops (`rooftopSurfaceBelow`).
- `games/gnome-theft-auto/src/golf/types.ts`: `GOLF_ACH`, `HOLES`, `HOLE_ORDER`, `POTTING_SHED`, `TURN_GATE`.

## Change (only `src/golf/runtime.ts` and `src/golf/runtime.test.ts`)
1. `putPlayer`: player `y = groundAt(x, z)` (and the vehicle's too) instead of `heightAt(x, z)`, so a tee on the shed
   roof puts the gnome on the roof (the roof is registered as a walkable rooftop by another file; until then groundAt
   returns the terrain, which is fine).
2. Achievements in `handleEvents`:
   - on `'holed'`: if `e.hole === 5 && e.strokes <= e.par` → `deps.unlock(GOLF_ACH.maze)`.
   - on `'round-done'`: every hole scored → `deps.unlock(GOLF_ACH.fullNine)` (round-done only fires when all are scored,
     but check `s.scores.every(x => x !== null)` and that none was a pick-up: a picked-up hole scores `MAX_STROKES` and
     is still "finished" — count it, keep it simple); `e.toPar < 0` → `deps.unlock(GOLF_ACH.underPar)`.
   Keep the existing `GOLF_ACH.card` unlock.
3. Ladder prompt: in `prompt(x, z)` (on foot), when within 1.8 m of `POTTING_SHED.ladder` and the player's y is below
   ground + 1 → `'Climb the ladder to the 7th tee'` and `interact` puts the player on the roof at
   (`POTTING_SHED.x + 2`, `POTTING_SHED.z`) facing west (`yaw = -Math.PI / 2`) via `putPlayer`; when the player is on
   the roof (y above ground + 2) and within 2.5 m of (`POTTING_SHED.x + POTTING_SHED.w / 2`, `POTTING_SHED.z`) →
   `'Climb down the ladder'` → `putPlayer(POTTING_SHED.ladder.x + 1.2, POTTING_SHED.ladder.z, Math.PI / 2)`. Put these
   before the tee-off prompts. Use `deps.player.y` for the height check and `heightAt` for the ground.
4. After `nextHole` starts a new hole (in the 'next-hole' action), if the new hole's tee is on the other side of the
   old fence from the player (`(player.z < TURN_GATE.z) !== (tee.z < TURN_GATE.z)`), `toast('Hole N: through the Turn
   Gate.')` with N = the new hole's card number. On hole 7 toast `'Hole 7: tee off from the potting shed roof. Up the
   ladder.'` instead.
5. The rustle loop allocates a new array every frame: precompute `const softSpots = [...yard.soft, ...bottom.soft]`
   once after both are built and loop over it.
- `src/golf/runtime.test.ts`: add tests: unlock called with `gta-out-of-the-maze` after holing hole index 5 at par
  (drive the round through the exported test hooks the existing tests use, or call the event handler path the tests
  already exercise; if that is not reachable, test the pure decision by extracting a small exported helper
  `achievementsFor(event, scores)` and test that); the ladder prompt text appears at the ladder.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/golf/runtime.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` clean for runtime.ts.

## Out of scope
bottomGarden.ts (it registers the rooftop), round.ts, types.ts, hud.ts, save.ts.
