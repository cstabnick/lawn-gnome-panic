Epic: FX01-B
Depends on: none
Findings: G1#5 (must, D58: "An emissive floor on underside materials, plus tunnel and deck lamps")

## Goal
The Double Pot tunnel roof and every skyway deck (including the Unfinished Span over the Underspan) no longer read as a
black-green lid from below: they use the shared underside material. The Double Pot tunnel is dressed as a set piece:
warm tunnel lamps every 6 m on the slab underside, "DOUBLE POT TUNNEL / HEADROOM 8 M" portal plates at both mouths, a
THORNE logo plate, and a "SALES FLOOR →" sign by the door at (112.4, -84).

## Read first
- `city/megaBlock.ts` (57 lines): `MEGA_BLOCK` (roof slab x 111..129, z -111..-69, top y 9, thickness 1; clearance 8;
  the road runs north-south along x = 120 under it), `buildMegaBlock` (the slab is a plain `MeshStandardMaterial`
  color 0x8d8f93).
- `highways/mesh.ts` lines ~330-350 (`buildSkywayMeshes`: `concrete` 0xb9b2a4 and `timber` 0x6b4f32 are the deck
  `sides` materials: group 1 of the deck geometry, which includes the deck's underside) and ~365-372 (the deck mesh
  `new THREE.Mesh(deckGeometry(...), [style.top, style.sides])`).
- `packages/prefabs/src/catalog/gta-street-kit.ts`: an existing GTA catalog file; look at one prop def with a `glow: true`
  part for the format (search the catalog for `glow: true`). Rules for new prefabs:
  `docs/roadmaps/prefab-library/_common.md`.
- `cull.ts` `buildStaticCells(placements, { lights: false, name })` (how statics are batched).

## Change
- `city/megaBlock.ts`:
  - The slab material becomes `undersideMat(0x8d8f93)` (import from `../undersides`).
  - Tunnel lamps: a row of `tunnel-lamp` prefabs (new, below) hung under the slab along x = 120 (and, if it reads better,
    two rows at x = 116 and 124), every 6 m from z -108 to -72, their top 0.02 m below the slab's underside (y 8 minus
    0.02 minus the prefab's height). Build them with `buildStaticCells(placements, { lights: false, name:
    'double-pot-tunnel-lamps' })` and add to the scene. No real lights (perf).
  - Portal plates: `textPlate('DOUBLE POT TUNNEL\nHEADROOM 8 M', ...)` from `../homes/pieces` on the slab's north and
    south end faces (the slab's end faces are at z = -111 + 0.3 and -69 - 0.3, its body y 8..9): plate 6 x 0.8 m,
    centred x 120, y 8.5, 0.03 m proud of the end face, facing outwards (north face yaw π, south face yaw 0), colours
    `bg: 0x1d2a3a, fg: 0xf2c14e`.
  - A THORNE logo plate on the north portal beside or above it is not possible (the slab is only 1 m thick): put
    `'THORNE'` plates (2.4 x 0.6, `bg: 0x111111, fg: 0xd4af37`) on the tunnel's inner side walls (the west half's east
    facade x = 111 and the east half's west facade x = 129) at z -90, y 5.5, 0.03 m proud, facing into the tunnel.
  - `textPlate('SALES FLOOR →', 111.03, 2.6, -84, Math.PI / 2, { w: 1.6, h: 0.45, bg: 0xf5f0e0, fg: 0x1d2a3a })` by the
    door at (112.4, -84) on the west half's east facade (check: x 111 is that facade; adjust the yaw so the plate faces
    +x, into the tunnel).
  - Keep `buildMegaBlock`'s signature.
- `highways/mesh.ts`: the deck `sides` materials become `undersideMat(0xb9b2a4)` (road) and
  `undersideMat(0x6b4f32, { roughness: 1 })` (site ramps). Leave the column and rail materials as they are.
- `packages/prefabs/src/catalog/gta-street-kit.ts`: add `tunnel-lamp` (category 'prop', uses ['place', 'light'],
  tags incl. 'lamp', 'tunnel', 'light', 'gta'): a 1.2 m long, 0.12 m tall, 0.25 m wide housing (dark grey) with a
  warm `glow: true` diffuser strip (colour a warm yellow) on its underside, mounted from the top (origin at the top
  centre, so the housing hangs down to y -0.12). Write the `about` and five `examine` lines in the catalog's voice
  (gnome-scale yard humour), like its neighbours.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.
- `npm test -w packages/prefabs` passes.
- `npx vitest run src/highways src/city` (inside games/gnome-theft-auto) passes.

## Out of scope
`world.ts`, `towers/**`, `societies/underspan/**`, `undersides.ts`, `homes/pieces.ts`.
