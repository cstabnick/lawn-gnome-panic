Epic: E29-B European kit wiring (after E29-A)
Depends on: E29-A (prefabs, `planStreetRow`, sign lines exist)

## Environment
Read the "Environment" section of `docs/roadmaps/gta-batch-3/E29/_common.md` (working directory, node path, do not
commit, other workers edit other files). Game: `games/gnome-theft-auto` (three.js + TypeScript, vitest). Do not start
a dev server (the lead runs smoke and zfight).

## Goal
`?eurokit` shows the whole European kit on clear ground near the start: a packed street, its furniture, a back garden,
the landmarks and the five European rides parked; and a test checks every kit building's built size against the table.

## Read first
- `games/gnome-theft-auto/src/eurokit/showcase.ts` (the stub: keep `EuroShowcaseDeps`, `EuroShowcase`, `buildEuroShowcase`)
- `games/gnome-theft-auto/src/eurokit/catalog.ts` (`EURO_BUILDINGS` sizes and roles, `EURO_FURNITURE`, `EURO_GARDEN`)
- `games/gnome-theft-auto/src/eurokit/street.ts` (`planStreetRow`, `EuroPlacement`, `PARTY_GAP`)
- `packages/prefabs/src/batch.ts` (`buildStaticPrefabs(placements, opts)`, `StaticPrefabPlacement { id, x, y?, z, yaw?, scale?, tint?, trim? }`)
- `games/gnome-theft-auto/src/collide.ts` lines 1-30 (`Box`, `roundBox(cx, cz, r, h)`)

The caller in `app.ts` (already written, do not edit):
```ts
if (startParams.has('eurokit')) {
  const show = buildEuroShowcase({ scene, boxes: world.boxes, heightAt, near: { x: player.x, z: player.z } });
  for (const p of show.parked) vehicles.push(createVehicle(scene, p.kind, p.x, p.z, p.yaw));
  player.respawn(show.stand.x, show.stand.z, show.stand.yaw);
  chase.yaw = show.stand.yaw;
}
```

## Change
- `games/gnome-theft-auto/src/eurokit/showcase.ts`: implement `buildEuroShowcase(deps)`:
  1. **Find a site**: a 100 x 80 m rectangle (axis-aligned, yaw 0) whose ground is level (sample `heightAt` on a 10 m grid:
     max - min under 2.5 m) and that overlaps no box in `deps.boxes`. Search centres on rings around `deps.near` every
     20 m out to 600 m; take the first that fits. If none fits, use `deps.near` offset by (0, -60) anyway.
  2. **Ground**: lay `euro-cobble-tile` on a 2 m grid along the street (a strip 6 m wide, 60 m long, in front of the row) and
     `euro-paving-tile` as the pavement strip (4 m wide) between the row and the cobbles. Tiles sit at `y = heightAt(x, z)`.
     Never lay tiles on top of each other.
  3. **Street row**: `planStreetRow({ x: <site left>, z: <pavement back line>, yaw: 0, length: 60, seed: 29, corner: true })`;
     every placement's `y = heightAt(x, z)` (use the min of the four footprint corners so no corner floats).
  4. **Furniture** along the pavement (2 m in front of the row front line, inside the pavement strip): a `euro-lamp-post`
     every 10 m, `euro-bollard`s between them, two `euro-flower-trough`s, a 3-section `euro-iron-railing` run (sections 2.06 m
     apart so ends never touch), `euro-bike-rack`, `euro-chalkboard-sign` by the bistro or cafe, `euro-poster-board`,
     `euro-street-sign` at the row start; `euro-cafe-table` with two `euro-cafe-chair`s in front of the corner cafe.
     A `euro-fountain` in a small square at the far end, `euro-tabac-kiosk` and `euro-post-booth` beside it.
  5. **Landmarks** on the other side of the street (fronts facing the row, yaw = Math.PI), spaced with 3 m gaps:
     `euro-opera-hall`, `euro-steeple-church`, `euro-market-hall`, `euro-apartment-block`; `euro-canal-boathouse` at the end.
  6. **Back garden** behind the row (beyond its back walls, 4 m clear): every `EURO_GARDEN` id once, laid out as a garden:
     the `euro-ivy-wall` sections as a back wall (3.06 m apart), the `euro-boules-court`, the `euro-vine-pergola` over the
     `euro-bistro-set`, `euro-washing-line`, plants in beds and pots.
  7. **Three story vignettes** with existing pieces (no text): a cafe chair knocked over (`rot: [0, 0, Math.PI / 2]`
     lying on its side, y raised by half its depth so it rests on the ground) beside a table; one boule far off from the
     rest by the washing line; a bike rack with the rack empty but a single `euro-geranium-pot` placed in it like a parked bike.
  8. Build everything static with ONE `buildStaticPrefabs(placements, { name: 'eurokit-showcase' })` call and
     `deps.scene.add(...)`. Pass `tint`/`trim` from the street placements.
  9. **Colliders**: push a `Box` for every building into `deps.boxes` (axis-aligned bounds of its footprint rotated by its
     yaw; `h` = height from the table), and `roundBox(x, z, 0.2, 4)` for lamp posts and the fountain (`r` 2, `h` 1).
  10. **Parked**: the five European rides (`'euro-hatch'`, `'deux-pots'`, `'wespa'`, `'baguette-trike'`, `'crepe-van'`) in a
      line along the cobbles' far kerb, 6 m apart, `yaw: Math.PI / 2` (parallel to the street).
  11. **Stand**: at the start of the street on the cobbles, facing down it (yaw so the camera looks along +x:
      three.js yaw for +x is `Math.PI / 2`).
- `games/gnome-theft-auto/src/eurokit/catalog.test.ts` (new, vitest): for every `EURO_BUILDINGS` entry,
  `buildPrefab(id)` from `@lawn/prefabs` exists; its `THREE.Box3().setFromObject(...)` size: x-extent within 0.1 of
  `[-width/2, width/2]` (a `'corner'` may reach `width/2 + sideApron` on +x), min z >= `-depth/2 - 0.1`, max z <=
  `depth/2 + apron + 0.1`, height within 0.3 of `height`. Every id in `EURO_FURNITURE` and `EURO_GARDEN` exists
  (`getPrefab(id)` defined).

## Contract
```ts
export interface EuroShowcaseDeps { scene: THREE.Scene; boxes: Box[]; heightAt(x: number, z: number): number; near: { x: number; z: number } }
export interface EuroShowcase { stand: { x: number; z: number; yaw: number }; parked: { kind: VehicleKind; x: number; z: number; yaw: number }[] }
export function buildEuroShowcase(deps: EuroShowcaseDeps): EuroShowcase;
```
Keep the site-finding as an exported pure helper `findShowcaseSite(boxes, heightAt, near): { x: number; z: number }` and
cover it in `catalog.test.ts` or a `showcase.test.ts` (an empty box list and flat ground returns `near` itself; a box
covering `near` moves the site).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` clean.
- `cd games/gnome-theft-auto && npx vitest run src/eurokit/` passes. If a building's size is outside the table, report
  which (do not edit prefab files).

## Out of scope
`app.ts`, `street.ts`, `signs.ts`, `catalog.ts`, prefab files, every other file.
