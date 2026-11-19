Epic: 1 (parallel modules)
Depends on: none

## Environment

- Repo root: `/home/user/lawn-gnome-panic` (Linux). Run commands from there. Dependencies are installed: do not run `npm install`. Do not commit.
- Other workers are building the game `games/gnome-theft-auto` at the same time; they reference the prefab ids below. You touch only the two prefab files named here.
- Read `docs/roadmaps/prefab-library/_common.md` first and follow its Modelling rules, Data rules, Examine voice and Checks (ignore its Environment section: the paths there are an old Windows worktree; use the repo root above). Exception to its "place names" list: these prefabs belong to the parody town of Turfton, so examine lines may also name Turfton, Fort Sandpit, the Hat Watch and the Spade Guard. Gnomes in Turfton ride mowers and know what a mower is; water guns are the only guns, and being soaked is undignified but harmless.

## Goal
A new catalog file `packages/prefabs/src/catalog/gnome-theft-auto.ts` with nine prefabs, registered in the catalog, all passing `npm test -w packages/prefabs`.

## Read first
- `docs/roadmaps/prefab-library/_common.md` (rules).
- `packages/prefabs/src/types.ts` (the format), `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/front-weapons.ts` (held guns: muzzle up +y, `grip` near the bottom).
- `packages/prefabs/src/catalog/lawn-prix.ts` (`ride-on-mower`: wheel pivots `wheel-n`, a `steer` pivot, a `tint` body).
- `packages/prefabs/src/catalog/armor.ts`: `golf-visor` (a `wear-head` item: built around y ≈ 0 with a ring for the head) and `caddie-bag` (a `wear-back` item) — copy how they are positioned.
- `packages/prefabs/src/catalog/index.ts` (how catalog files are registered).

## Change
- New `packages/prefabs/src/catalog/gnome-theft-auto.ts` exporting `export const GNOME_THEFT_AUTO: readonly PrefabDef[] = [...]`, with a header comment "Gnome Theft Auto: water guns, mowers, Fort Sandpit props and achievement gear."
- `packages/prefabs/src/catalog/index.ts`: add `import { GNOME_THEFT_AUTO } from './gnome-theft-auto';` and `...(GNOME_THEFT_AUTO),` at the end of the `CATALOG` array. Nothing else in that file.

The prefabs (ids exactly as written):

1. `squirt-pistol` — Squirt Pistol. category `weapon`, uses `['hold', 'shoot']`, tags include `water gun pistol squirt toy plastic`. About 0.32 tall, standing upright like the front-weapons guns: a grip at the bottom (`grip` set on it), a chunky tinted body (`tint: 0xf08a24` orange), a short barrel pointing UP (+y) with a small nozzle, a translucent blue water tank (`alpha: 0.6`, colour 0x5ec8ff) on the back, a trigger. emoji `['🔫']`.
2. `super-soaker` — Pump Soaker. weapon, `['hold', 'shoot']`. About 0.6 tall, upright, muzzle up: a long tinted body (`tint: 0x3fa34d`), a big round translucent blue tank on top (back side), a yellow pump handle under the barrel, a wide nozzle. `grip` set.
3. `zero-turn-mower` — Zero-Turn Racer. category `prop`, uses `['place', 'sit']`, tags include `mower zero turn racer ride-on`. Faces +z, about 2.0 long, 1.3 wide, 1.1 tall: a low tinted deck (`tint: 0x2f64c9`), two big rear drive wheels (radius 0.32) as pivots `wheel-0` (left, -x) and `wheel-1` (right), two small front caster wheels (radius 0.14) as pivots `wheel-2` and `wheel-3`, a bucket seat whose cushion TOP is at y = 0.5 and centre z = -0.3, two lap bars (thin cylinders) left and right of the seat as pivot group `steer`, an engine block behind the seat, a mowing deck under the middle (dark grey). Pivot coordinates = the part centres (like `ride-on-mower`). Wheels are cylinders lying along x (`rot: [0, 0, 90]`).
4. `whirligig-mower` — The Whirligig. prop, `['place', 'sit']`, tags include `mower flying helicopter rotor whirligig military`. Faces +z, fits in 3 x 3 x 3: an olive (0x556b2f) mower deck body about 1.6 long and 1.1 wide sitting on two landing skids (thin long cylinders along z at y ≈ 0.04, so it stands on the ground), a seat whose top is at y = 0.5 and centre z = -0.2, a small yellow windscreen (alpha 0.5) in front of the seat, a mast rising behind the seat to y ≈ 1.6, and on top a pivot `rotor` (at the mast top) holding three long flat blades (boxes about 1.4 long each, so the span stays under 3) — they look like mower blades turned to the sky; a tail boom out the back (-z) with a small vertical `tail-rotor` pivot (two short blades). A white star decal (a thin box or a 5-segment cone flattened) on each side.
5. `sandbag-wall` — Sandbag Wall. prop, `['place']`, tags `sandbag wall barrier military sand`. A 2.0 wide, 0.6 tall, 0.5 deep stack of 3 rows of pill/box sandbags (tan 0xc8b48a and 0xb59f73 alternating), front +z.
6. `watch-tower` — Watch Tower. prop, `['place']`, tags `tower watchtower lookout military wood`. About 2.6 tall: four wooden legs, a railed platform at y ≈ 1.8, a pitched roof (cone with 4 segments) on top, a ladder on the front. Wood colours from the palette.
7. `rain-hat` — Rain Hat. category `armor`, uses `['wear-head']`, tags `hat rain sou'wester` (tags are single words: `hat rain souwester yellow`). A yellow (0xf2c230) sou'wester: a rounded crown and a wide brim that is longer at the back. Position it like `golf-visor` (same height range and ring size so it sits on the gnome's head).
8. `flight-goggles` — Flight Goggles. armor, `['wear-head']`, tags `goggles flight pilot strap`. A brown leather strap ring (like the `golf-visor` ring: same radius and height) with two round lenses (alpha 0.6, light blue) on brass rims at the front (+z).
9. `water-tank-pack` — Water Tank Pack. armor, `['wear-back']`, tags `tank backpack water pack`. A translucent blue cylinder tank (alpha 0.6) in a dark frame with two straps, positioned like `caddie-bag`.

Every prefab: `about` (one line), `examine` 5 lines in the voice of `_common.md` (sayings, tips, dry jokes, odd details; no gore, no pop culture references).

## Done when
- `npx tsc --noEmit -p packages/prefabs` has no errors in your files.
- `npm test -w packages/prefabs` passes (fix your parts until every test naming your ids is green).
- `npm test -w packages/gnome` passes (gear clearance; your head/back items must not break it).

## Out of scope
Every other file, including other catalog files and anything under `games/`.
