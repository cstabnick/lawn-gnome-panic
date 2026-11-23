Epic: 2 (parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-gun-store/_common.md` first, then `docs/roadmaps/prefab-library/_common.md` for the prefab modelling, data and
examine-voice rules (ignore its Environment section: the working directory is the one in our `_common.md`; there the catalog checks are
`npx tsc --noEmit -p packages/prefabs` and `npm test -w packages/prefabs`). Two other workers fill `gta-gun-mods-a.ts` and `gta-gun-mods-b.ts`.

## Goal
`packages/prefabs/src/catalog/gta-gun-store.ts` holds the Ammu-Gnation storefront, three props for its back-room display stage, and six
achievement gear items (head, neck, back, hand).

## Read first
- `packages/prefabs/src/types.ts`, `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-brands.ts`: the `gta-pay-n-glaze` building (a big prop with `footprint`, modelled small and scaled up by
  the game) - copy its style.
- `packages/prefabs/src/catalog/gta-glaze-gear.ts`: finished gear for all four slots (`wear-head`, `wear-neck`, `wear-back`, a held
  `hold` item with `grip`). Copy how each is built (where the origin is, how big).

## Change
- `packages/prefabs/src/catalog/gta-gun-store.ts` (already registered; exports `GTA_GUN_STORE: readonly PrefabDef[] = []`): fill it. Keep the name.

Brand: Ammu-Gnation, olive drab `0x4b5d2a` (dark olive `0x3a4820`) with safety orange `0xff7a1a`. Slogan "The Gun Is Free. The Shiny Bits
Are Not." It is Turfton's gun-mod store: every gun is free (Fort Sandpit surplus), the store sells bolt-ons.

### 1. `gta-ammu-gnation` (the storefront) - copy these parts EXACTLY (the game's collision boxes are computed from them)
category `'prop'`, uses `['place']`, `footprint: { r: 2.4, h: 2.7 }`, tags e.g. `['ammu', 'gnation', 'gun', 'store', 'shop', 'mods', 'olive', 'orange', 'turfton']`.
Open front toward +z, walk-in, a counter inside. No floor part (the ground is the floor). `OLIVE = 0x4b5d2a`, `OLIVE_DARK = 0x3a4820`, `ORANGE = 0xff7a1a`.

```ts
{ s: 'box', d: [0.3, 2.0, 3.6], at: [2.05, 1.0, 0], c: OLIVE, mirror: true },              // side walls (x 1.9..2.2)
{ s: 'box', d: [3.84, 1.97, 0.3], at: [0, 0.995, -1.64], c: OLIVE },                        // back wall (between the side walls)
{ s: 'box', d: [4.6, 0.16, 3.9], at: [0, 2.08, 0.05], c: OLIVE_DARK },                      // roof
{ s: 'box', d: [0.32, 0.12, 0.04], at: [2.05, 1.6, 1.82], c: ORANGE, mirror: true },        // orange band on the wall fronts
{ s: 'box', d: [0.08, 0.1, 0.06], at: [1.5, 2.2, 1.9], c: 'iron-dark', mirror: true },      // sign posts
{ s: 'box', d: [3.6, 0.5, 0.08], at: [0, 2.45, 1.9], c: ORANGE },                           // sign board over the front
{ s: 'ring', d: [0.16, 0.03], at: [-1.45, 2.45, 1.96], c: 'white', glow: true },            // crosshair emblem ring
{ s: 'box', d: [0.36, 0.03, 0.02], at: [-1.45, 2.45, 1.97], c: 'white', glow: true },       // emblem cross bar
{ s: 'box', d: [0.03, 0.36, 0.02], at: [-1.45, 2.45, 1.975], c: 'white', glow: true },      // emblem upright bar
{ s: 'box', d: [2.4, 0.08, 0.02], at: [0.25, 2.45, 1.95], c: 'white', glow: true },         // lettering bar (stands in for the name)
{ s: 'box', d: [2.6, 0.4, 0.4], at: [0, 0.2, -0.7], c: 'wood-dark' },                       // counter
{ s: 'box', d: [2.7, 0.04, 0.48], at: [0, 0.42, -0.7], c: 'stone' },                        // counter top
{ s: 'box', d: [0.9, 0.18, 0.3], at: [0.6, 0.53, -0.7], c: 'glass', alpha: 0.35 },          // glass case on the counter
{ s: 'box', d: [3.0, 1.0, 0.04], at: [0, 1.2, -1.47], c: 'wood' },                          // pegboard on the back wall
{ s: 'box', d: [0.5, 0.08, 0.03], at: [-0.9, 1.45, -1.435], c: 'iron-dark' },               // rack gun silhouettes
{ s: 'box', d: [0.6, 0.08, 0.03], at: [0.15, 1.5, -1.435], c: 'iron-dark' },
{ s: 'box', d: [0.45, 0.08, 0.03], at: [1.05, 1.4, -1.435], c: 'iron-dark' },
{ s: 'box', d: [0.55, 0.08, 0.03], at: [-0.4, 1.0, -1.435], c: ORANGE },
{ s: 'box', d: [0.4, 0.3, 0.3], at: [-1.5, 0.15, 0.6], c: 'wood' },                         // ammo crates
{ s: 'box', d: [0.34, 0.26, 0.3], at: [1.5, 0.13, 0.9], c: OLIVE_DARK },
```
You may ADD small details (a stool, a till on the counter, a "NO KAZOOS INDOORS" plaque) but only above y = 0.5 on the walls or on top of
the counter, never touching a listed part with a face in the same plane, and never move or resize a listed part.

### 2. Stage props (the back-room display the shop camera looks at), each category `'prop'`, uses `['place']`, with a `footprint`
- `ammu-stage-counter`: a long glass-topped display counter, front toward +z: wooden base box, a glass top case (`alpha: 0.35`), a few tiny
  gun-part shapes inside, an orange trim strip. About 2.4 wide, 0.5 tall, 0.6 deep. `footprint: { r: 1.3, h: 0.5 }`.
- `ammu-stage-pegboard`: a free-standing back wall of pegboard: a wood board ~3 wide, 2 tall, 0.08 deep on two feet, rows of small dark peg
  dots, a few gun-shaped silhouettes and an orange "AMMU-GNATION" bar along the top. `footprint: { r: 1.6, h: 2.1 }`.
- `ammu-stage-turntable`: a round display plinth: a dark cylinder base (radius 0.45, height 0.24), a lighter top disc (radius 0.42, top
  at y = 0.3 exactly), a glowing orange ring (`ring` lying flat, `rot: [90, 0, 0]`, glow) around the top edge. `footprint: { r: 0.5, h: 0.3 }`.
  Its top at y = 0.3 is a contract: the game sets the display gun above it.

### 3. Achievement gear (one per achievement; build them like the matching slot in gta-glaze-gear.ts)
| id | name | slot / uses | look |
|---|---|---|---|
| `ammu-range-earmuffs` | Range Earmuffs | `wear-head`, category `armor` | Two big orange ear cups on a dark olive headband arch. |
| `ammu-dog-tags` | Dog Tags | `wear-neck`, category `trinket` | A thin bead chain loop with two small steel tags, one stamped with a tiny acorn. |
| `ammu-golden-kazoo` | Golden Kazoo | `hold` (+ `grip`), category `trinket` | A gold party kazoo, upright (mouthpiece at the bottom, horn at the top), a little round buzzer bump. |
| `ammu-gun-case` | Gun Case | `wear-back`, category `armor` | A long olive hard case slung on the back, orange latches and a carry handle. |
| `ammu-gilded-pistol` | Gilded Pistol | `hold` + `grip`, category `weapon` | Like `gta-pistol` (copy its shape from gta-guns-air.ts) but gold with a white pearl grip. Uses `['hold']` only. |
| `ammu-spotter-cap` | Spotter's Cap | `wear-head`, category `armor` | A boonie-style olive bush hat with an orange band and a tiny scope lens clipped to the brim. |

## Contract
- Exports `GTA_GUN_STORE: readonly PrefabDef[]` with exactly these 10 ids.
- `gta-ammu-gnation` contains the listed parts unchanged.
- `ammu-stage-turntable`'s top surface is at y = 0.3.
- The achievements worker uses the gear ids above with these slots: head `ammu-range-earmuffs`, neck `ammu-dog-tags`, hand
  `ammu-golden-kazoo`, back `ammu-gun-case`, hand `ammu-gilded-pistol`, head `ammu-spotter-cap`.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no errors in `gta-gun-store.ts`.
- `npm test -w packages/prefabs` passes for every test whose name contains one of your ids (another worker's failures: ignore).
- You have read the file once top to bottom checking each prefab against its description.

## Out of scope
Every other file, in particular `catalog/index.ts`, the other `gta-gun-*` catalog files, `packages/achievements`, anything under `games/`.
