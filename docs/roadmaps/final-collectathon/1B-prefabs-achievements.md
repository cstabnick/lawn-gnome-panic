Epic: 1 Foundation
Depends on: none

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Run every command from there.
- Node: if `node`/`npm` is not found, in Git Bash run `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`.
- Another worker is creating `games/final-collectathon/` and editing `packages/music/` at the same time. Do not touch those.
- Repo rules: every achievement reward is a prefab no other achievement grants; RARE (`exclusive: true`) for the hard ones; a reward's prefab carries the slot's use (`wear-head`, `wear-back`, `wear-neck`, or `hold` for the hand).

## Goal

Add 13 new prefabs for the new game "The Final Collectathon" (collectibles, office props and six cosmetic rewards) and
its six achievements, so the game can show its pickups and reward gear.

## Read first

- `packages/prefabs/src/types.ts`: the `PrefabDef` / `Part` format. Shapes and `d`: box `[w,h,d]`, cyl `[rTop,rBottom,h]`, cone `[r,h]`, ball `[r]`, ring `[r, tube, arcDeg?]` (a hoop in the x-y plane facing +z; lay flat with `rot: [90,0,0]`), pill `[r, len]`, wedge `[w,h,d]`. `rot` in degrees.
- `packages/prefabs/src/catalog/cosmetics-neck.ts`: two finished `wear-neck` items (cord ring at `y = 0.01`, things hung forward on the chest at z about 0.17-0.2). Copy that layout for both neck items.
- `packages/prefabs/src/catalog/giant-pup.ts`: a small per-game catalog file to copy the shape of.
- `packages/prefabs/src/catalog/index.ts`: register the new file here.
- `packages/achievements/src/catalog.ts`: append the defs at the end of `ACHIEVEMENTS`.

## Modelling rules (from the prefab library)

- Units: 1 = one gnome's height. Hat about 0.45 tall; potion 0.2; sword 0.55.
- Every prefab stands on the ground: lowest point at y = 0 (±0.03), centred on x and z, front faces +z. `at` is the centre of the shape (a box of height h on the ground has `at.y = h/2`).
- 3 to 15 parts, 40 maximum; `seg` 4 to 12. Chunky, flat-shaded, readable at 32 px.
- `uses` with `'hold'` needs `grip` (the point a hand holds), long things upright, handle at the bottom.
- `c`: a palette name from `packages/prefabs/src/palette.ts` or a `0xRRGGBB` number; `glow: true` for shiny/lit bits.
- `emoji` without the U+FE0F selector. `tags` lower-case single words.
- `examine`: 5 lines, each 9-160 characters, all different, in a dry gnome voice: (1) what it looks like up close, (2) a saying, (3) a tip, (4) a dry joke, (5) an odd detail. These come from an office of collectors (Bucketworth & Sons, in the Annex by Club Gnome's square); gnomes rename office things ("silver squiggles" for paperclips). No real games or films.

## Change

### `packages/prefabs/src/catalog/final-collectathon.ts` (new)

```ts
// New prefabs for final-collectathon (The Final Collectathon). One owner: add entries here and nowhere else.
import type { PrefabDef } from '../types';

export const FINAL_COLLECTATHON: readonly PrefabDef[] = [ /* the 13 below */ ];
```

| id | name | category | uses | look (approx size) |
|---|---|---|---|---|
| `fc-paperclip` | Clip | `material` | `['collect']` | A silver paperclip standing upright: three nested U-loops made from thin `pill`s and half `ring`s (arc 180) of `steel`, about 0.16 tall, 0.07 wide, 0.01 thick. emoji `['📎']` |
| `fc-sticky-note` | Sticky Square | `document` | `['collect', 'read']` | A yellow square note standing slightly tilted back on a tiny base: box 0.16 x 0.16 x 0.01 (`0xffe066`), a darker strip at the top (the glue), two thin grey "writing" lines. emoji `['🟨']` |
| `fc-appreciation-token` | Token of Appreciation | `trinket` | `['collect']` | An upright coin (cyl rotated `[90,0,0]`, radius 0.1, thickness 0.025, `gold`) with a raised `ball` heart-ish bump and a thin ring rim. emoji `['🪙']` |
| `fc-collector-badge` | Collector's Badge | `trinket` | `['collect']` | A pin badge standing upright: a round pink face (cyl r 0.09, `0xff8fd0`) with a white star-ish centre (small cone/ball cluster) and two ribbon tails (thin boxes) hanging below. emoji `['📛']` |
| `fc-water-cooler` | Water Cooler | `furniture` | `['place']`, `footprint: { r: 0.25, h: 1.1 }` | A white cabinet (box 0.4 x 0.6 x 0.4) with a big upside-down blue bottle on top (cyl + ball, `glass` or `0x7fc6ff` with `alpha: 0.6`), a tiny tap, a stack of paper cups. About 1.1 tall. emoji `['🚰']` |
| `fc-photocopier` | Photocopier | `furniture` | `['place']`, `footprint: { r: 0.5, h: 0.8 }` | A grey box machine 0.9 x 0.7 x 0.6 with a lid, a paper tray sticking out at +x, a green `glow` button and a dark glass strip. emoji `[]` |
| `fc-nameplate` | Desk Nameplate | `prop` | `['place', 'read']` | A small brass wedge plate (wedge 0.3 x 0.08 x 0.06, `brass`) with a dark name panel on its sloped front. emoji `[]` |
| `fc-visitor-lanyard` | Visitor Lanyard | `trinket` | `['wear-neck']` | Cord ring under the chin like the cosmetics-neck examples (ring r 0.21, `rot [90,0,0]`, `at [0, 0.01, -0.05]`, a red-blue colour), and a white card (box 0.1 x 0.13 x 0.01) hanging at the chest `at ~[0, 0.07, 0.19]` with a blue stripe. |
| `fc-giant-paperclip` | Giant Paperclip | `tool` | `['hold', 'swing']`, `grip: [0, 0.08, 0]` | The Clip at hand-held size: about 0.55 tall, nested U-loops of `steel` pills and half rings, standing upright, the lower loop is the handle. |
| `fc-employee-cap` | Employee of the Month Cap | `armor` | `['wear-head']` | A navy baseball cap: squashed ball crown (scale `[1, 0.6, 1]`, r 0.2) on the ground plane, a flat brim box sticking out at +z, a gold star badge (`glow`) on the front. |
| `fc-bottomless-sack` | Bottomless Sack | `container` | `['wear-back']` | An overstuffed burlap sack (squashed ball, `burlap` or `0xb08a5a`) about 0.45 tall, tied at the top with string, with a Clip, a Sticky Square and an acorn poking out of the top (small parts). |
| `fc-sun-hat` | Shellshore Sun Hat | `armor` | `['wear-head']` | A wide straw sun hat: a flat wide brim (cyl r 0.32, h 0.02, `straw` or `0xe8cf8a`), a low crown (cyl r 0.15, h 0.12), a blue ribbon band, a small shell on the band. |
| `fc-shell-necklace` | Shell Necklace | `trinket` | `['wear-neck']` | Cord ring as in the examples, with five small shells (squashed balls / cones in `0xf6e3d0`, `0xf2b8a0`, white) hung forward on the chest at z about 0.17-0.2, one bigger pink shell in the middle. |

If a palette name does not exist in `palette.ts`, use the `0x` number given. Neck items must stay clear of the head
sphere (centre `[0, 0.8, 0]`, radius 0.17) and face: keep everything below y = 0.25 and at z ≥ -0.06 for the hanging
parts, as the examples do.

### `packages/prefabs/src/catalog/index.ts`

Add `import { FINAL_COLLECTATHON } from './final-collectathon';` and `...FINAL_COLLECTATHON,` at the end of the
`CATALOG` array (after `...COSMETICS_BACK,`).

### `packages/achievements/src/catalog.ts`

Append before the closing `];` of `ACHIEVEMENTS`:

```ts
  // ---- The Final Collectathon ----
  {
    id: 'collectathon-hello', game: 'final-collectathon', gameTitle: 'The Final Collectathon',
    title: 'Hello.', description: 'Say hello back to the secretary.',
    reward: { slot: 'neck', prefabId: 'fc-visitor-lanyard', label: 'Visitor Lanyard' },
  },
  {
    id: 'collectathon-clip-art', game: 'final-collectathon', gameTitle: 'The Final Collectathon',
    title: 'Clip Art', description: 'Collect 1,000 Clips on Floor 2.',
    reward: { slot: 'hand', prefabId: 'fc-giant-paperclip', label: 'Giant Paperclip' },
  },
  {
    id: 'collectathon-employee-of-the-month', game: 'final-collectathon', gameTitle: 'The Final Collectathon',
    title: 'Employee of the Month', description: 'Earn 50 Recognitions on Floor 2½.', target: 50,
    reward: { slot: 'head', prefabId: 'fc-employee-cap', label: 'Employee of the Month Cap' },
  },
  {
    id: 'collectathon-the-point', game: 'final-collectathon', gameTitle: 'The Final Collectathon',
    title: 'The Point', description: 'Collect everything there is to collect.',
    reward: { slot: 'back', prefabId: 'fc-bottomless-sack', label: 'Bottomless Sack' },
  },
  {
    id: 'collectathon-not-taking-it', game: 'final-collectathon', gameTitle: 'The Final Collectathon',
    title: "I'm Not Taking the Job", description: 'Tell the secretary you are not taking the job, and leave.',
    reward: { slot: 'head', prefabId: 'fc-sun-hat', label: 'Shellshore Sun Hat', exclusive: true },
  },
  {
    id: 'collectathon-easter-eggs', game: 'final-collectathon', gameTitle: 'The Final Collectathon',
    title: 'Collector of Secrets', description: 'Find all 8 easter eggs.', target: 8,
    reward: { slot: 'neck', prefabId: 'fc-shell-necklace', label: 'Shell Necklace', exclusive: true },
  },
```

### `docs/cosmetics.md`

Add the six rows to the inventory table in the same format as the existing rows (e.g.
`| **Hello.** (\`collectathon-hello\`) | final-collectathon | Say hello back to the secretary. | Visitor Lanyard (\`fc-visitor-lanyard\`) | Gear: neck |  |`; RARE ones put `RARE` in the last column, matching how existing RARE rows do it), and update the numbers in the "Counts" section (+6 achievements, +6 gear: head +2, neck +2, back +1, hand +1, RARE +2).

## Contract

Prefab ids exactly as in the table (the game refers to `fc-paperclip`, `fc-sticky-note`, `fc-appreciation-token`,
`fc-collector-badge`, `fc-water-cooler`, `fc-photocopier`, `fc-nameplate`). Achievement ids exactly as above.

## Done when

- `npm test -w packages/prefabs` passes (fix any test naming one of your ids: grounded, sizes, examine lines, grip).
- `npm test -w packages/achievements` passes.
- `npm test -w packages/gnome` passes (the gear-clearance test checks every `wear-neck` prefab; if it names yours, move its parts forward/down).
- `npx tsc --noEmit -p packages/prefabs` succeeds.

## Out of scope

Any other catalog file, `packages/prefabs/src/*.ts` other than `catalog/index.ts`, `games/**`, `packages/music/**`.
