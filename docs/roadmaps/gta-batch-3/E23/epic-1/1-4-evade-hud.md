Epic: E23-1 Framework (parallel)
Depends on: none
Model: sonnet

## Environment
Read `docs/roadmaps/gta-batch-3/E23/env.md` first (worktree, toolchain, line endings, contracts in place, rules).

## Goal
The HUD shows the player how to lose the Hat Watch (user: "player has no visual aid to see how to lose levels"): a
pulsing search circle on the minimap and the big map, and an EVADE meter under the hats. Data arrives as
`HudState.search` (`WatchSearch | null`, already declared in `types.ts`):
`{ x, z, r, seen, inside, evade (0..1), level, dispatchIn (s) }`.

## Read first
- `hud.ts`: CSS block at the top (`#gta-hud .gta-hats` l.~25, the wanted/hats slot), `drawMeter` (l.~248),
  `set(s)` (the `s.heat` block l.~1211 with `wantedEl`, `hoaEl`), `drawMap` (minimap, l.~914: world→canvas mapping,
  screen x mirrored: east (-x) on the right; `MAP_RANGE` 150, `MAP_VIEW`), `drawBig` (l.~1044: `X(x)`, `Y(z)`).
- `types.ts` `WatchSearch`, `HudState`.

## Change
- `hud.ts` only:
  - **Search circle, minimap**: in `drawMap`, after the background and before the blips, when `s.search` is set: a
    circle at the search centre with radius `r` in map units, fill `rgba(47,85,212,0.16)` (`rgba(212,175,55,0.18)` at
    level 4), dashed stroke 1.5 px (device-scaled) whose alpha pulses `0.55 + 0.35*sin(t*4)`; red stroke `#ff5a4d`
    while `seen`. Use the same coordinate mapping the blips use (copy it, mirrored x). Clip to the canvas.
  - **Big map**: the same circle via `X()`, `Y()` and `r * k`.
  - **EVADE meter**: a small element appended under the hats (inside the same column as `wantedEl`), class
    `gta-evade`, hidden when `s.search` is null. It holds a 64x6 px bar (fill width = `evade`) and a one-line label:
    `dispatchIn > 0` → `Units en route ${Math.ceil(dispatchIn)}s`; `seen` → `SEEN — break line of sight`;
    `!inside` → `Lying low ${pct}%`; else → `Leave the circle`. Font 11px, white with dark text-shadow, matching the
    HUD's existing style. Update only when the label/fill change (keep a `last` cache like the other fields). Must fit
    at 390x844 (no overflow off the right edge: check the hats column CSS for phones; `max-width` and
    `white-space: nowrap` with ellipsis is fine).
  - Nothing else in the HUD changes.
- A small pure helper you export for testing: `export function evadeLabel(s: WatchSearch): string` (the label rules
  above), and `hud.evade.test.ts` (new) testing the four label cases.

## Contract
Reads `HudState.search?: WatchSearch | null` (the lead passes `watch.search?.() ?? null` from app.ts). Nothing exported
besides `evadeLabel`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` clean for `hud.ts` and the test.
- `cd games/gnome-theft-auto && npx vitest run src/hud.evade.test.ts` passes, and any existing HUD-related tests still
  pass (`npx vitest run src/layout.golden.test.ts` if it touches hud CSS; if it fails only because of your CSS, report
  it, do not regenerate the golden).

## Out of scope
`police.ts` (issue 1-1), `app.ts` (lead), `types.ts`.
