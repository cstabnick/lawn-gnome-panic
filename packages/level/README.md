# @lawn/level

Level documents for the 3D games: the JSON file format, ground stamps, brush-edit height deltas and baked walkability
grids. Pure data and maths: no three.js, no DOM, no game code. A game imports what it needs and keeps its own rules in
the `data` block.

## Document layers

A `LevelDoc` (`src/types.ts`) is one level. Each layer is optional in meaning and the game opts into the ones it uses:

- `bounds`: the playable area, `w` by `d` metres, centred on the document's origin.
- `base`: a `GeneratorRef`, a procedural ground by id. The game registers the function; the document stores the id,
  `version`, `seed` and `params`. Bump `version` when the algorithm changes so an old document never silently changes shape.
- `stamps`: parametric ground edits applied to the finished height, in list order. `flatten` blends to a height inside
  `inner` and fades out at `outer`. `gauss` adds a hill (positive `amount`) or a pit (negative).
- `paths`: polylines of kind `road`, `wall` or `fence`, with an optional `width`.
- `props`: prefabs (`@lawn/prefabs` ids) at a position, optionally with a round collider of radius `solidR`.
- `markers`: named points (spawn, portal, flag, tee). `kind` is the game's own word; `data` is the game's own payload.
- `data`: the game's own block. This package does not validate it; the game does.

## Ground order

Ground height is built in this order:

1. The game's base terrain (or the `base` generator, when the document has one).
2. `stamps`, applied in list order.
3. `deltas`, a sparse per-metre offset raster added to the finished height. An empty raster changes nothing.

Walkability is separate: `walk.bake.json` holds one bit per 0.25 m cell saying whether static geometry blocks a walker.
Anything outside every baked tile is "not baked" and the game asks its live function instead.

## Files

`*.level.json`: one `LevelDoc`.

```json
{
  "format": "lawn-level",
  "version": 1,
  "game": "gnomes-of-gnomomia",
  "id": "fescue-east",
  "name": "Fescue East",
  "bounds": { "w": 120, "d": 80 },
  "stamps": [{ "op": "gauss", "x": 12, "z": -4, "sigma": 3, "amount": 1.5 }],
  "paths": [{ "id": "lane", "kind": "road", "points": [[-40, 0], [40, 0]], "width": 4 }],
  "props": [{ "prefab": "garden-bench", "x": 6, "z": 2, "rot": 1.57 }],
  "markers": [{ "id": "spawn", "kind": "spawn", "x": -30, "z": 0 }],
  "data": {}
}
```

`*.deltas.json`: brush edits. Only non-zero chunks are stored. Each chunk is 64 by 64 vertices, base64 of 4096
little-endian Int16 values in centimetres, row-major with z rows. The key is the chunk index, `"ci,cj"`.

```json
{
  "format": "lawn-deltas",
  "version": 1,
  "chunk": 64,
  "unit": 0.01,
  "chunks": { "0,0": "AAAB...base64 of 8192 bytes..." }
}
```

`walk.bake.json`: baked walkability. Each tile is a rectangle of 0.25 m cells, run-length encoded as alternating
runs of 0-bits and 1-bits, starting with 0-bits, each run a little-endian u16. `inputHash` fingerprints everything the
bake depended on.

```json
{
  "format": "lawn-walk",
  "version": 1,
  "cell": 0.25,
  "inputHash": "9f2c1e",
  "tiles": [{ "id": "yard-a", "minX": 0, "minZ": 0, "cols": 400, "rows": 400, "rle": "AAAA..." }]
}
```

## Units and axes

- Metres everywhere. Heights are metres; deltas are stored in centimetres.
- World coordinates: +x is east, +z is south (negative z is north), y is up.
- Zone files are authored zone-local, around 0,0. The game moves them by the zone's origin before use.

## Code

- `math.ts`: `clamp`, `smoothstep`, `mulberry32` (a deterministic PRNG), `distToSeg`, base64 helpers.
- `stamps.ts`: `applyStamps`, `stampBounds`.
- `deltas.ts`: `DeltaGrid` (sparse height raster: `getUnits`, `setUnits`, `sample`, `applyPatch`, `toJSON`,
  `fromJSON`, `bounds`), `PatchBuilder` (merges the dabs of one stroke into one undoable patch).
- `walkgrid.ts`: `bakeTile`, `encodeRle` / `decodeRle`, `WalkGrid` (`setTile`, `deleteTile`, `tilesIn`, `solidAt`,
  `toJSON`, `fromJSON`).
- `types.ts`: the document types.

Tests run with `npm test -w packages/level`.
