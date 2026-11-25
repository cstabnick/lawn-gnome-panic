Epic: E17 wave 2 (building the places)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (Interiors section).

## Goal
Loamdeep (one large E05 interior, 104 x 90 m, ceiling 4 m) is carved into halls and tunnels: everything in the cell
that is not a hall or a tunnel is packed earth, solid to walk into, but see-through from the follow camera (dollhouse
view, like E05's room walls).

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (`Rect`, `LOAMDEEP.size`, `LOAMDEEP.halls`, `LOAMDEEP.tunnels`)
- `games/gnome-theft-auto/src/societies/loamdeep/interior.ts` (the lead's def: build order room, door, then buildEarth)
- `games/gnome-theft-auto/src/societies/loamdeep/earth.ts` (yours: the stub)
- `games/gnome-theft-auto/src/interiors/kit.ts` lines 60-112 (how the room's walls are made: `frontPlane` planes that
  face INTO the room, so from outside/behind they are culled and the camera sees through; colliders only 2 m tall)

## Change
- `games/gnome-theft-auto/src/societies/loamdeep/earth.ts`: keep both exported signatures.
  - `carveEarth(bounds, open, cell)`: pure. Rasterise `bounds` on a `cell`-metre grid (cell centres); a cell is open
    when its centre lies inside any `open` rect; merge solid cells first into horizontal runs per row, then merge runs
    with identical minX/maxX in consecutive rows into rectangles. Return the solid rectangles (in metres). Deterministic.
  - `buildEarth(kit)`: `open = [...Object.values(LOAMDEEP.halls), ...Object.values(LOAMDEEP.tunnels)]`, `bounds` = the
    room (`-w/2..w/2`, `-d/2..d/2` from `kit.size`), `cell = 1`. For each solid rect:
    - a collider: `const m = kit.block(w, 2, d, cx, cz, { solid: true }); m.visible = false;` (2 m tall like E05's walls);
    - a dark packed-earth top: one horizontal plane at y 0.03 covering the rect, colour 0x3b2a1e,
      `MeshLambertMaterial`, `flatLayer(material, LAYER.marking)` from '@lawn/depth', added to `kit.group`;
    - earth faces: for each edge of the rect that borders open floor (test a point 0.5 m outside the edge midpoint
      against the open rects; for long edges split into 1 m segments and only emit segments that border open floor,
      merging consecutive ones), a vertical plane from y 0 to `kit.size.h` facing OUT of the solid (into the open floor),
      single-sided (`THREE.FrontSide`), colour 0x5a4030 with a slight per-face shade variation (deterministic), added to
      `kit.group`. Facing rule: the plane's normal points into the open side; then the camera standing inside the earth
      behind the player sees through it.
    - Root details: on about one in four earth faces, a thin pale root (a `CylinderGeometry` 0.04 m, colour 0xd8c8a0)
      lying along the face 0.05 m in front of it at a random height (deterministic hash), as architecture. No prefab.
    Share materials and merge geometry where easy (BufferGeometryUtils.mergeGeometries from
    'three/examples/jsm/utils/BufferGeometryUtils.js' if it is already used elsewhere in the game; grep first). Keep the
    whole earth under ~60 draw calls.
- `games/gnome-theft-auto/src/societies/loamdeep/earth.test.ts` (new): `carveEarth` on a 10 x 10 bounds with one open
  2 x 2 hole returns rectangles whose total area is 96 and none overlaps the hole or each other; on the real Loamdeep
  layout (bounds from `LOAMDEEP.size`, open from halls + tunnels, cell 1): no solid rect overlaps any open rect, the
  total open + solid area equals the room area (within 1 m²), every hall's centre and `LOAMDEEP.spots.*` point (all
  `XZ` values, flattening the nested records and arrays) lies in open floor, and the result has fewer than 120 rects.

## Contract
`carveEarth(bounds, open, cell): Rect[]` and `buildEarth(kit): void` (signatures of the stub).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/societies/loamdeep/earth.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file (the halls' furniture, interior.ts, config.ts).
