Epic: E16-B (countryside, second parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
Red deer are a tuft-hunting quarry: a new species `deer` ("Trellisdown Red Deer") lives in two spots in Trellisdown,
with its call sound, tuft and keepsake, and every hunting test still passes.

## Background (confirmed)
Hunting (`src/hunting/`): a shot knocks the quarry over in a puff; while it lies there a gnome with a Tuft License
combs a tuft from it (sometimes a rare keepsake); it gets up and runs off. Tufts sell at the Tuft & Tally Lodge. The
ambient deer herds are a different system (`src/critters/countryside.ts`, another worker) and live elsewhere; the
hunting deer use the same body prefab, `deer-hind` (another worker adds it to `@lawn/prefabs` at the same time; a
missing prefab draws a grey box, so do not guard against it).

## Read first
- `games/gnome-theft-auto/src/hunting/species.ts`: `SpeciesId`, `SPECIES` (copy the `fox` entry's shape), `HUNT_SPOTS`,
  `HUNT`.
- `games/gnome-theft-auto/src/hunting/sounds.ts`: the call recipes list (line ~11) and one recipe, e.g.
  `'hunt-pheasant'`.
- `games/gnome-theft-auto/src/hunting/sounds.test.ts` and `games/gnome-theft-auto/src/hunting/spawn.test.ts`: what is
  checked per species and per spot.
- `games/gnome-theft-auto/src/hunting/lodge.ts` / `lodgeUi.ts`: only to see whether a per-species list needs the new id
  (grep for `'pheasant'` across `src/hunting/` and `src/` and add `deer` wherever every species is listed by hand).

## Change
- `src/hunting/species.ts`:
  - `SpeciesId` + `'deer'`.
  - `SPECIES` + (after pheasant) `{ id: 'deer', name: 'Trellisdown Red Deer', plural: 'Trellisdown Red Deer',
    region: 'west-estates', prefab: 'deer-hind', scale: 1, radius: 0.7, height: 1.6, walk: 1.1, run: 9.5, turn: 3,
    hear: 34, sight: 18, style: 'run', fleeSeconds: 9, downTime: 7, puff: 0xa8743f, call: 'hunt-deer',
    callEvery: [8, 16], stride: 0.9, print: 'paw', printColor: 0x3a2a1a, active: 'always',
    tuft: { id: 'tuft-deer', name: 'Red-deer winter tuft', price: 26, color: 0xa8743f },
    keepsake: { id: 'keep-deer', name: 'Shed antler tine', price: 110, chance: 0.12, color: 0xe8dcc0 },
    hint: 'Grazes the empty Trellisdown pasture west of the vineyard at dawn and dusk. Barks once and is gone: come up slowly, downwind, on foot.',
    blurb: 'Tall, red and polite about it. A deer knocked over stands up, looks at you as if you had trodden on a row, and leaves.' }`.
    (`print: 'paw'` is the closest footprint shape we have; keep it.)
  - `HUNT_SPOTS` + `{ species: 'deer', x: -1290, z: -440, count: 3, spread: 12, leash: 60 }` and
    `{ species: 'deer', x: -1240, z: -840, count: 3, spread: 12, leash: 60 }` (both open Trellisdown ground, away from
    roads, the vineyard and the cult camp site; `openSpot` nudges them).
- `src/hunting/sounds.ts`: a `'hunt-deer'` call recipe in the same style as the others: a short, hoarse, dog-like
  "bark" (a noisy burst with a quick pitch drop, ~0.35 s), added to the list of call ids.
- Any other place in `src/hunting/` that lists every species by hand (only if tests or types need it).

## Contract
Species id `deer`, call id `hunt-deer`, item ids `tuft-deer` and `keep-deer`, prefab `deer-hind`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/hunting` passes (every hunting test, incl. the new species and spots).
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/hunting/`.

## Out of scope
`src/critters.ts`, `src/critters/*`, `packages/*` (the prefab is another worker's), every other file.
