Epic: E14-2 (content on the track registry)
Depends on: none
Worker: haiku-worker

## Environment
Read `docs/roadmaps/gta-batch-3/E14/issues/_env.md` first (worktree, toolchain, rules). You only touch the prefab
package.

## Goal
Eight new scenery prefabs for the Rutbottom Dirt Bowl, Capwood (a forest of giant toadstools) and the Capwood Run
rally, in the empty catalog file `packages/prefabs/src/catalog/gta-dirt-rally.ts` (already registered in `index.ts`).

## Read first
- `docs/roadmaps/prefab-library/_common.md` (prefab rules: parts, sizes in metres, footprint, about/examine)
- `packages/prefabs/src/catalog/gta-race-track.ts` (Speedway props: the same file style; `speedway-tyre-stack`,
  `speedway-gantry` are good models), `packages/prefabs/src/catalog/aether-board.ts` ~54 (`giant-spotted-toadstool`:
  how a domed cap and spots are built), `packages/prefabs/src/types.ts` (`PrefabDef`, part shapes)
- `packages/prefabs/src/catalog/gta-dirt-rally.ts` (the empty file you fill)

## Change
`packages/prefabs/src/catalog/gta-dirt-rally.ts`: `export const GTA_DIRT_RALLY: readonly PrefabDef[] = [ ... ]` with:

| id | name | size / look |
|---|---|---|
| `capwood-toadstool-tall` | Capwood Tall Cap | life-size giant toadstool for gnomes to walk under: pale stem r 0.7, 9 m tall with a skirt ring at 6 m, domed cap r 4.5 in tint (default 0xc8382e), 10-14 white spots, gills ring under the cap (darker). `footprint: { r: 0.8, h: 10 }` (the collider is the stem only). |
| `capwood-toadstool-squat` | Capwood Squat Cap | stem r 0.9, 2.6 m, flat wide cap r 3.2 in tint (default 0xb5652a, a brown bolete), no spots, a few cracks (dark thin boxes on top). `footprint: { r: 1, h: 3.2 }` |
| `capwood-toadstool-cluster` | Capwood Cap Cluster | five small toadstools of mixed heights (0.6-2.2 m) on one mossy mound r 1.6, caps in tint with white spots. `footprint: { r: 1.7, h: 2.4 }` |
| `capwood-puffball` | Capwood Puffball | a round off-white puffball r 1.1 sitting on the ground, with a puff of tan spores (three small translucent-looking tan balls) above a little hole at the top. `footprint: { r: 1.1, h: 2.3 }` |
| `rutbottom-starter-tower` | Starter's Tower | a 6 m timber tower on four legs with cross braces, a 3 m square cabin on top (open front with a rail, corrugated roof), a ladder on the back, a chequered flag on a pole on the roof, a hand-painted board under the cabin (blank face, the game draws text). `footprint: { r: 2.4, h: 8 }` (footprint is always `{ r, h }`). |
| `capwood-start-pavilion` | Rally Start Pavilion | a 6 x 4 m open canvas pavilion on 4 poles (canvas in tint, default 0xf0e6c8, with an orange stripe), a trestle table with a clock (a disc on a box) and a rolled map, two folding chairs. `footprint: { r: 3.6, h: 3.2 }` |
| `capwood-ford-sign` | Ford Sign | a 1.8 m post with a white triangular warning sign (red border) showing a mower in wavy water (simple boxes), a depth gauge post beside it painted with stripes 0-1 m. `footprint: { r: 0.4, h: 2.2 }` |
| `capwood-stage-flag` | Stage Flag | a 3 m flexible-looking pole with a tall feather flag in tint (default 0xff7a00) and a white number-board at the base. `footprint: { r: 0.3, h: 3.2 }` |

Every prefab: `category: 'prop'`, `uses: ['place']`, useful `tags` (include `gta`, `capwood` or `rutbottom`), `about`
starting "Gnome Theft Auto (E14):", five `examine` lines (a description, a saying, a tip, a joke, an odd detail; Capwood
lore: toadstools grow over a buried Tall-One woodpile, Warden Chanterelle Stook fines anyone who bruises a cap, the
fords are Cap-water which never floods an engine; Rutbottom: Marshal Clary Mudguard, "the berm remembers"). Base at
y = 0, front faces +z.

## Contract
The ids above, exactly. The forest, bowl and rally dressing (next epic) place them by id.

## Done when
- `npm test -w packages/prefabs` passes (from the repo root).
- `npx tsc --noEmit -p packages/prefabs` passes (if the package has a tsconfig; otherwise skip).

## Out of scope
Every other file, including `index.ts` (already done), `gta-dirt-rally-gear.ts` (another worker) and `lawn-prix.ts`.
