# Level Editor (local tool)

Edit Gnomes of Gnomomia's world in 3D and save straight back into the game's level files. It runs only on your machine: the
Vite dev server also writes files. It is not part of the arcade site, and (like the prefab editor) it is a desktop dev tool, so
the mobile and online rules do not apply to it.

```
npm run level-editor           # http://localhost:5393
```

The editor imports the game's own terrain code through the `@gnomomia` alias (`games/gnomes-of-gnomomia/src`), so the ground,
roads, colliders and walkability you see are the ones the game computes. It does NOT draw the game's meshes: houses, props and
flora are simple rings, boxes and lines.

## Tools

- **View**: left-drag orbits, right-drag pans, wheel zooms. Pick a zone in the header.
- **Brush**: Raise, Lower, Smooth, Flatten (radius and strength sliders; Shift inverts raise/lower; `[` `]` change the radius;
  Alt-click sets the flatten height). One undo step per stroke. Edits go into a sparse 1 m height raster (`world.deltas.json`)
  added on top of the game's own ground.
- **Select**: place (Add + click), pick, drag, edit fields of, and delete regions, lakes, houses, decks, props and stamps
  (flatten / hill-or-pit). A house can only be deleted when no later house lacks an `id` (interiors are named by id or position).
- **Road**: draw dirt roads as polylines; drag points, Shift+click a segment to add a point, Delete removes one. A road is a
  `paths` entry of kind `road`: drawn, flora keeps off it, coloured as road. It cuts no ridge and is not a pass between zones.
- **Analyze**: walkability overlay (red = blocked, orange = free but not reachable from spawn), a path test between two clicks
  (`findPath3`, the game's own click-to-move), a reachability report from the zone's spawn (regions, exits, house doors, decks),
  and **Re-bake walkability**.

Ctrl+Z / Ctrl+Shift+Z undo and redo, Ctrl+S saves. "gates open" decides whether quest gates count in reachability.

## Saving, and the walk bake

**Save** writes only what changed: `games/gnomes-of-gnomomia/src/data/levels/<zone>.level.json` for each edited zone and
`world.deltas.json` after brush strokes.

Walkability is pre-baked (`walk.bake.json`, one tile per outdoor zone, 0.25 m cells, static blockers only: water, houses, trees,
walls, ramps). Any edit makes the bake stale, and `npm run build -w games/gnomes-of-gnomomia` fails on a stale bake. After
saving, use **Analyze > Re-bake walkability and save** (or `npm run bake-walk -w games/gnomes-of-gnomomia`) and commit the result.
Quest gates and props added at run time are always checked live.

## Files

| File | What |
|---|---|
| `src/context.ts` | The contracts every module codes against (`Viewport`, `Tool`, `EditorContext`, `CollectionDef`) |
| `src/state.ts` | The context: undo/redo, dirty tracking, `editZone` / `commitDeltas` |
| `src/profile.ts` | What Select can place in a Gnomomia zone, with fields and defaults |
| `src/viewport.ts`, `src/entityView.ts` | The 3D view, and the drawing of a zone's layers |
| `src/tools/*` | The tools |
| `server/` | Dev-server API: validates and writes the level files (only three fixed file kinds) |
| `vitest.config.ts` | Tests use their own config; the dev server needs `--configLoader runner` (set in `npm run dev`) |

## Later

Other games (Gnome Front, Gnome Golf, Club Gnome) are meant to adopt `@lawn/level` one at a time; see
`docs/roadmaps/level-format.md`. Surface paint (a ground colour layer) is not built yet.
