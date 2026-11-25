Epic: E17 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first.

## Goal
Gnomes can stand on one leg: a new looping idle animation `'one-leg'` (the Flock of the One Leg stand like herons
before their flamingo). Ambient gnomes and players can use it like any other idle.

## Read first
- `games/gnome-theft-auto/src/anim/types.ts` (`IDLE_IDS` at line ~28, `AnimDef`, pose parts: armL, armR, legL, legR,
  body, head?, lift)
- `games/gnome-theft-auto/src/anim/idles.ts` (`IDLE_ANIMS`: e.g. 'cross-arms', 'sit-ground' rows; the helper `s(t, k)`)
- `games/gnome-theft-auto/src/anim/anim.test.ts` and `games/gnome-theft-auto/src/anim/variety.test.ts` (what they check
  for every idle: label length <= 12, looping poses, counts)

## Change
- `games/gnome-theft-auto/src/anim/types.ts`: append `'one-leg'` to `IDLE_IDS` (last entry).
- `games/gnome-theft-auto/src/anim/idles.ts`: add a row `{ id: 'one-leg', label: 'One Leg', icon: '🦩', category: 'idle',
  duration: 4.0, loop: true, parts: ['armL', 'armR', 'legL', 'legR', 'body'], emote: true, pose: (t) => ({ ... }) }`:
  the left leg bent up behind (legL rotated about x ~ -1.4 rad, i.e. thigh back, like a heron), the right leg straight,
  arms out a little to the sides for balance with a slow small wobble (use the file's `s(t, k)` helper with whole k so
  the loop is seamless), body upright with a tiny sway, `lift` 0.
- If a test lists idle ids or counts explicitly (e.g. an expected array or a number), update that expectation to include
  'one-leg' (that test file is then yours too; say so in your report).

## Contract
Idle id `'one-leg'` exists in `IDLE_IDS` and `IDLE_ANIMS`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/anim` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in anim files.

## Out of scope
Every file outside `src/anim/`.
