Epic: E09 step 1 (sound, voice, animation, direction)
Depends on: none
Worker: Haiku

## Environment
Read `docs/roadmaps/gta-batch-3/E09/_env.md` first. `src/anim/types.ts` is CRLF (do not edit it; the ids exist).

## Goal
L63 "more variations to existing high-usage animations": the 15 variant rows named in `VARIANT_IDS` exist, so plain
walks, panicked runs, the player's standing fidgets, horn startles, near-miss anger and spectator cheers are not the
same pose every time.

## Read first
- `games/gnome-theft-auto/src/anim/types.ts`: the axis notes at the top (armL/armR x < 0 swings forward, z outward is
  + for left / - for right; body [rx, ry, rz], lift), `VARIANT_IDS` and its doc comment (which category each id is),
  `AnimDef` (and its `pose(t)` rules: pure, a loop ends where it starts).
- `games/gnome-theft-auto/src/anim/styles.ts`: `walk(...)` / `stand(...)` helpers and the existing walk-/run- overlays
  (keep overlays subtle: their arm x is ADDED to the walk swing).
- `games/gnome-theft-auto/src/anim/reactsC.ts` or `reacts.ts`: shape of a one-shot reaction row (e.g. 'startle-horn').
- `games/gnome-theft-auto/src/anim/bits.ts`: shape of a 'bit' row (e.g. 'check-watch', 'dust-hat').
- `games/gnome-theft-auto/src/anim/anim.test.ts`: `checkRows(name, rows, ids, category)` and the "has every id exactly
  once" test (line ~125).

## Change
- `src/anim/variants.ts`: `VARIANT_ANIMS` with one row per id, in `VARIANT_IDS` order, all `emote: false`:
  - category 'style', `loop: true`, `onMove: true`, parts `['armL', 'armR', 'body']` (no legs):
    walk-easy (relaxed: arms a touch out, a slow sway, duration 1.2), walk-brisk (arms pumping a little forward, body
    leaned 0.08, duration 0.9), walk-amble (hands behind the back: arms x 0.5 z 0.05, body sway ry +-0.06, duration
    1.6); run-cover-head (both arms up over the hat: x -2.6, z +-0.4, body 0.2, duration 0.6), run-look-back (body ry
    oscillating +-0.35 once per cycle, arms pumping, duration 0.8), run-arms-up (arms straight up waving +-0.3, duration
    0.5).
  - category 'bit', `loop: false`: idle-weight-shift (2.2 s: body rz to one side and back, a small lift dip; parts body
    only), idle-hat-adjust (1.6 s: right arm up to the brim x -2.4 z -0.3 and back, a tiny nod), idle-look-back (2.0 s:
    body ry turns 0.6 over the shoulder and back).
  - category 'react', `loop: false`: startle-hop (0.9 s: a hop lift 0.25, arms flung out), startle-spin (1.0 s: body
    ry one full turn 2*PI with arms out), fist-wave-both (1.4 s: both fists up shaking), stomp-off (1.2 s: body lean and
    an arms-down huff, a lift bob), cheer-jump (1.2 s: two jumps with arms up), cheer-whistle (1.4 s: right hand to the
    mouth, left arm waving).
  Labels <= 12 characters, one emoji icon each.
- `src/anim/anim.test.ts`: import `VARIANT_ANIMS` and `VARIANT_IDS`; add `...VARIANT_IDS` to the "has every id exactly
  once" list; run the shared row checks on the variants per category (filter `VARIANT_ANIMS` by category and the ids
  by the same filter, then `checkRows('variant-' + cat, rows, ids, cat)` for 'style', 'bit', 'react'); add a test that
  the six 'style' variants are onMove, loop and have no legs.

## Contract
`export const VARIANT_ANIMS: readonly AnimDef<VariantAnimId>[]` (already imported by `src/anim/index.ts`). Ids exactly
as `VARIANT_IDS`. None in the emote menu (`emote: false`), so the online emote wire table needs no change.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/anim/anim.test.ts src/anim/round3.test.ts` passes.
- `npx tsc --noEmit -p .` passes.

## Out of scope
`types.ts`, `index.ts`, `persona.ts`, `playerIdle.ts`, `npcs.ts` (issue 11), `online/`.
