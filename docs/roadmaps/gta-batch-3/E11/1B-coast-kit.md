Epic: 1 Foundation (prefabs, physics, lore, water)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E11/_env.md` first. Then read `docs/roadmaps/prefab-library/_common.md` for the prefab
rules, **except its "Environment" section** (the working directory there is wrong: use the one in `_env.md`).
Other workers edit `gta-coast.ts`, `gta-coast-gear.ts` and game files at the same time.

## Goal
`packages/prefabs/src/catalog/gta-coast-kit.ts` holds the boardwalk and beach kit of Saltbucket Shore.

## Read first
- `packages/prefabs/src/types.ts`, `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-coast.ts`: two finished coast prefabs (style, examine voice, `tint`/`trim` use).
- `packages/prefabs/src/catalog/gta-coast-kit.ts`: the file you fill (`GTA_COAST_KIT`, now empty).
- `docs/lore/entries/apocrypha/saltbucket-boardwalk.md`: the stalls and the mood (bucket-and-spade seaside town, sticky
  and cheerful). Examine lines may name Saltbucket, the Saltwater, the Spokewheel, Long Spoon Pier; never name a Tall
  One object's real purpose.

## Change
`packages/prefabs/src/catalog/gta-coast-kit.ts`: fill `GTA_COAST_KIT` with these 12 prefabs (category `'prop'` or
`'furniture'`, uses at least `['place']`, tags include `'gta'`, `'saltbucket'`, `'beach'` or `'boardwalk'` and the nouns,
`emoji: []`, 5 examine lines each, front faces +z):

| id | name | look (units: 1 = a gnome's height) |
|---|---|---|
| `boardwalk-stall` | Boardwalk Stall | a seaside kiosk ~1.6 wide, ~1.8 tall, 0.9 deep: a wooden counter at the front (+z), back wall, two posts, a striped awning sloping forward (alternate `'tint'` and white boxes), a blank sign board above the awning (`'trim'`). `tint` default 0xe8453c, `trim` default 0xf2e3c6. |
| `boardwalk-lamp` | Boardwalk Lamp | a green iron post ~2.4 tall on a round foot, a cross arm with two round glass globes (`glow: true`, warm white) and a little fish-shaped weather vane box on top. |
| `beach-hut` | Beach Hut | a small hut ~1.4 wide, 1.7 tall, 1.2 deep, `'tint'` walls with white trim, a pitched roof (two rotated boxes), a door on +z, two steps. `tint` default 0x4fa3d9. |
| `beach-umbrella` | Beach Umbrella | a pole ~1.5 tall, a canopy cone (`'tint'`) about 1.4 across, a small knob on top; `tint` default 0xf2b134. |
| `sandcastle` | Sandcastle | about 0.6 tall: a bucket-shaped keep (cone/cyl, sand colour), four smaller towers, a wall, a tiny flag; one tower half collapsed. |
| `lifeguard-chair` | Lifeguard Chair | a tall white wooden chair ~2.2 tall on four legs with a ladder at +z, a red cross board on the back, a small red float hanging off one side. |
| `candyfloss-cart` | Candyfloss Cart | a push cart ~1.3 long on two wheels, a drum on top, a big pink fluffy ball (balls scaled) on a stick, a striped little roof. |
| `tin-shy` | Tin Shy | a knock-down game: a counter with a back shelf; three pyramids of tin cans (small cylinders) on the shelf, three small balls on the counter, one can lying on its side on the ground. |
| `ski-rack` | Ski Rack | a wooden rack ~1.6 wide holding four upright water-skis (long thin boxes, two red, two yellow) and two tow handles hanging from a bar; a chalk board on top (use `'chalk'` with an `'ink'` line, like `tube-rack`). |
| `bucket-and-spade` | Bucket and Spade | a toy bucket (cylinder wider at the top, `'tint'`, a handle ring) with a small spade leaning in it; about 0.35 tall. `tint` default 0xe8453c. |
| `pier-post` | Pier Post | a thick wooden piling ~2.5 tall (cylinder radius ~0.12, colour `'wood-dark'`), barnacle bumps (small white/grey balls) near the bottom, a rope coil looped round it near the top. |
| `gull-sign` | Gull Sign | a wooden sign on one post ~1.4 tall with a white board and a painted gull silhouette (two thin dark boxes in a V) and a red "no" ring (a ring part) over it. |

Keep every prefab under 40 parts, lowest point at y 0, centred, largest side between 0.03 and 3.

## Contract
Prefab ids exactly as in the table. The game places them with `buildPrefab(id, { lights: false })` and a scale of about
2-3 (stall, hut, lamp) or 1-2 (small props); fronts face +z.

## Done when
- `cd packages/prefabs && npx tsc --noEmit -p .` has no errors in `gta-coast-kit.ts`.
- `cd packages/prefabs && npx vitest run -t "boardwalk-stall|boardwalk-lamp|beach-hut|beach-umbrella|sandcastle|lifeguard-chair|candyfloss-cart|tin-shy|ski-rack|bucket-and-spade|pier-post|gull-sign"` passes.

## Out of scope
Every other catalog file, `catalog/index.ts` (already registers `GTA_COAST_KIT`), anything under `games/`.
