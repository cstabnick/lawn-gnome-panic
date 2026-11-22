Epic: 3 (Wild World: world expansion and the region map)
Depends on: none

## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree; stay in it, use absolute paths).
- Git Bash: if `node` is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first. Dependencies are installed.
- Five other workers are editing other files at the same time (`src/world.ts`, `src/textures.ts`, `src/hud.ts`,
  `src/biomes.ts`, `tools/level-editor`, `docs/lore`). Do not touch their files. If a type-check error is in a file
  you do not own, wait a minute and rerun; do not fix it.
- Do not commit, push or open a PR. Do not run `npm run build`, do not start a dev server, and do not run
  `UPDATE_GOLDEN=1` (the golden test will show `layout.places` changed: expected, the planner regenerates it).

## Goal
The rest of the game knows the map grew: NPC drivers have errands to the new far ends of the map, townsgnomes and
drivers spawned in Loch Moss and Tallgrass Commons get a regional look, flyers' camera range covers the bigger map,
and the Grand Tour achievement counts all seven regions.

## Read first
- `games/gnome-theft-auto/src/config.ts`: `VIEW` (around line 158) and `PLACES` (around line 330, the `Place`
  interface and the `far` entries at the end).
- `games/gnome-theft-auto/src/gnomes.ts` lines 40-80: the per-biome look in the function that calls `biomeAt(x, z)`.
- `games/gnome-theft-auto/src/errands.ts` lines 1-40 and 85-110: how `PLACES` is used (a driver goes to the road node
  nearest the place; `far` places are skipped by push-bikes).
- `packages/achievements/src/catalog.ts` around line 452: `gta-explorer`.

## Change
- `games/gnome-theft-auto/src/config.ts`:
  - `PLACES`: append these `far: true`, `weight: 1` errands (each sits on a highway end, so the nearest road node is
    the road's end):
    `{ id: 'loch-moss', name: 'Loch Moss', reason: 'to Loch Moss to look at the water', x: -720, z: -480 }`,
    `{ id: 'tallgrass-commons', name: 'Tallgrass Commons', reason: 'to Tallgrass Commons for a lie-down in the long grass', x: -720, z: 420 }`,
    `{ id: 'far-east', name: 'the far Dust Flats', reason: 'out to the far Dust Flats for the quiet', x: 870, z: 50 }`,
    `{ id: 'puddle-coast', name: 'the Puddle Sea coast', reason: 'down to the coast to see the Puddle Sea', x: 0, z: 870 }`.
    Leave the existing entries exactly as they are.
  - `VIEW.cameraFar`: 700 to 900 (a plane at height sees across more of the 1800 m map; fog still hides the far edge).
    Leave `fogNear` and `fogFar` as they are (the atmosphere tests pin them).
  - Nothing else in config.ts.
- `games/gnome-theft-auto/src/gnomes.ts`: two more branches after the `farmland` one, same shape:
  `loch`: hats `[0x2f5d50, 0x6b8f71, 0x8a5a3b, 0x3b5f8a]`, shirts `[0x3f4a3c, 0x5a6b5e, 0x7a6a55]` (tweed and moss);
  `parkland`: hats `[0xf2c230, 0x9bd14d, 0xe85d75, 0xffffff]`, shirts `[0x7cbf4a, 0xf0e2a8, 0x5aa0d8]` (picnic colours).
- `packages/achievements/src/catalog.ts`: `gta-explorer` description to
  `'Visit every region: Turfton, the Dust Flats, Mossy Wood, Frostbite Fells, Cloverfield Farms, Loch Moss and Tallgrass Commons.'`
  and `target: 7`. Nothing else in that file.

## Contract
- `Place` interface unchanged: `{ id: string; name: string; reason: string; x: number; z: number; weight: number; far?: boolean }`.
- `BiomeId` already includes `'loch'` and `'parkland'` (`src/types.ts`); `biomeAt(x, z)` returns them for the two
  north-west and south-west corner regions.
- The `gta-explorer` id and its `emote` reward are unchanged.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes (from the repo root).
- From `games/gnome-theft-auto`: `npx vitest run src/traffic.test.ts src/atmosphere.test.ts src/radio` passes
  (if a test there pins the number of `PLACES`, update that test's number only).
- `npm test -w packages/achievements` passes.

## Out of scope
- `src/world.ts`, `src/hud.ts`, `src/biomes.ts`, `src/levels.ts`, any `.level.json`, the golden fixture,
  `src/traffic.ts`, `src/npcs.ts` (traffic and townsgnomes spawn around the player, so the map size does not change
  their density).
