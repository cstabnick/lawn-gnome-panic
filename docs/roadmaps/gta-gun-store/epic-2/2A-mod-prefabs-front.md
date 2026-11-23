Epic: 2 (parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-gun-store/_common.md` first, then `docs/roadmaps/prefab-library/_common.md` for the prefab modelling, data and
examine-voice rules (ignore its Environment section: the working directory is the one in our `_common.md`; there the catalog checks are
`npx tsc --noEmit -p packages/prefabs` and `npm test -w packages/prefabs`). Two other workers fill `gta-gun-mods-b.ts` and `gta-gun-store.ts`.

## Goal
13 gun-mod prefabs exist in `packages/prefabs/src/catalog/gta-gun-mods-a.ts`: the optics, muzzle devices, barrels and underbarrel parts
that the game bolts onto its guns.

## Read first
- `packages/prefabs/src/types.ts`: `PrefabDef`, `Part`, shapes and what `d` means.
- `packages/prefabs/src/palette.ts`: colour names (or use 0xRRGGBB numbers).
- `packages/prefabs/src/catalog/gta-guns-air.ts`: the four guns these fit on (`gta-pistol`, `gta-smg`, `gta-shotgun`, `gta-rifle`). Note their size:
  a pistol barrel is a 0.012-radius cylinder, a rifle is 0.9 long. Mods are just as small.
- `packages/prefabs/src/catalog/gta-glaze-exhaust.ts`: an example of small bolt-on parts in the same voice.

## Change
- `packages/prefabs/src/catalog/gta-gun-mods-a.ts` (already registered in `catalog/index.ts`, exports `GTA_GUN_MODS_A: readonly PrefabDef[] = []`):
  fill the array. Keep the export name.

### Authoring convention (the game relies on it)
Every mod is authored in the GUN's own frame, where the barrel points along +y, the gun's TOP is the -z side and its UNDERSIDE (trigger,
magazine) is the +z side. So a mod that runs along the barrel is a long thing standing upright along y. Each prefab still stands on y = 0
and is centred on x and z (the catalog test checks that). The game measures each part's bounding box and slides it onto a mount point, so
the exact origin does not matter beyond the test rules. Keep every part between 0.03 and 0.35 on its longest side.

Category `'tool'`, uses `['place']`, `emoji: []`, tags lower-case words including `gun`, `mod` and the noun. No `grip` (they are not held).
Examine: 5 lines each, GTA parody voice is fine (like gta-guns-air.ts): what it looks like, a saying, a tip, a dry joke, an odd detail.

| id | name | look (gun frame: along y = along the barrel) | size guide |
|---|---|---|---|
| `gunmod-red-dot` | Dew-Drop Dot | Short squat sight: a small box base with a round glass bead on top glowing red (`glow: true`) at its front end. The base (the side that touches the gun) is on +z. | ~0.05 x 0.07 (y) x 0.045 |
| `gunmod-holo` | Firefly Holo | An open rectangular window frame (4 thin boxes) standing on a flat base, a faint green glass pane (`alpha: 0.4`) inside, a tiny glowing yellow dot (the firefly). Base on +z. | ~0.06 x 0.08 x 0.06 |
| `gunmod-long-scope` | Long-Look Scope | A long dark tube along y with fatter bell ends, a glowing blue lens at the +y end, two ring mounts reaching toward +z (the feet), and a small turret knob on -z. | ~0.06 x 0.24 x 0.07 |
| `gunmod-jam-jar-scope` | Jam-Jar Scope | A comedy scope: a glass jam jar (`glass`, alpha 0.4) lying along y with a red-and-white gingham-ish lid (two boxes or a cyl in red) at +y and a dark plum blob inside; two wire ring mounts toward +z. | ~0.09 x 0.2 x 0.1 |
| `gunmod-suppressor` | Hush-Puppy Suppressor | A fat matte-black cylinder along y with two thin rings and a dark bore cap at +y. | radius 0.025, length 0.16 |
| `gunmod-muzzle-brake` | Muzzle Brake | A short steel cylinder along y with slots: 2-3 thin black boxes cut across its sides (they may poke out a hair) and a ring at the tip. | radius 0.022, length 0.06 |
| `gunmod-kazoo` | Party Kazoo | A party kazoo pointing along +y: a tapered yellow body (`cone` or `cyl` with different radii), a red stripe ring, a little round buzzer bump on -z. | ~0.05 x 0.12 x 0.05 |
| `gunmod-squeaker` | Squeaky Duck | A tiny yellow rubber duck head on a short collar: collar cylinder at the bottom (fits over the muzzle), a yellow ball head, an orange flat beak pointing along +y, two black eye dots. | ~0.06 x 0.09 x 0.06 |
| `gunmod-long-barrel` | Long Barrel | A long thin steel cylinder along y with a slightly fatter dark ring at each end. | radius 0.015, length 0.24 |
| `gunmod-heavy-barrel` | Heavy Barrel | A thick dark iron cylinder along y with three raised fluting ribs (thin long boxes) along it and a heavy crown ring at +y. | radius 0.025, length 0.18 |
| `gunmod-ported-barrel` | Ported Barrel | A steel cylinder along y with a row of 3-4 small black port boxes along its -z (top) side and a ring at +y. | radius 0.017, length 0.16 |
| `gunmod-foregrip` | Twig Foregrip | A little forked twig handle: a mount block on -z side at the top, a wooden stick (`wood`) hanging toward +z, a small knot ball. Its long axis is z here: it sticks out from under the barrel. | ~0.04 x 0.05 x 0.12 |
| `gunmod-laser` | Firefly Laser | A small box housing along y with a glass jar bit holding a glowing yellow-green firefly ball, a glowing red emitter dot at +y. Mount side on -z. | ~0.04 x 0.08 x 0.045 |

## Contract
- File exports `GTA_GUN_MODS_A: readonly PrefabDef[]` with exactly the 13 ids above (kebab-case, unique in the library).
- Each prefab: lowest point within ±0.03 of y = 0, largest side between 0.03 and 3, roughly centred on x and z.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no errors in `gta-gun-mods-a.ts`.
- `npm test -w packages/prefabs` passes for every test whose name contains one of your ids (if another worker's ids fail, ignore those).
- You have read the file once top to bottom checking each prefab against its row.

## Out of scope
Every other file. In particular `catalog/index.ts`, `gta-gun-mods-b.ts`, `gta-gun-store.ts`, `gta-guns-air.ts` and anything under `games/`.
