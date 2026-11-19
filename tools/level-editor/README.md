# Level Editor (local tool)

Edit a game's levels in 3D and save straight back into the game's level files. It opens **Gnomes of Gnomomia** (the whole open
world), **Club Gnome** (its four flat maps), **Gnome Front** (the arena) and **Gnome Golf** (the island and its nine holes); pick the game
in the header, or open `?game=gnome-front`, `?game=gnome-golf` or `?game=club-gnome&level=town`. It runs only on your machine: the
Vite dev server also writes files. It is not part of the arcade site, and (like the prefab editor) it is a desktop dev tool, so
the mobile and online rules do not apply to it.

```
npm run level-editor           # http://localhost:5393
```

The editor imports the game's own terrain code through the `@gnomomia` alias (`games/gnomes-of-gnomomia/src`), so the ground,
roads, colliders and walkability you see are the ones the game computes. Objects are drawn on that live terrain, so they follow
brush edits: houses, decks with ramps, walls and shrines mirror the game's shapes, props use the real prefabs, and flora (trees,
rocks, hedges) is a simple stand-in for the game's meshes. Coloured rings and outlines on top are for picking.

## Tools

- **View**: left-drag orbits, right-drag pans, wheel zooms. Pick a zone in the header.
- **Paint** (Gnomomia): lay dirt, sand, mud, stone or moss on the ground, or erase it (Shift-drag). Painted ground is coloured in
  the game and keeps trees and rocks off it. Saved in `world.paint.json`.
- **Brush**: Raise, Lower, Smooth, Flatten, Noise (roughens; radius and strength sliders; Shift inverts raise/lower; `[` `]` change the radius;
  Alt-click sets the flatten height). One undo step per stroke. Edits go into a sparse 1 m height raster (`world.deltas.json`)
  added on top of the game's own ground.
- **Select**: place (Add + click), pick, drag, edit fields of, duplicate (Ctrl+D), nudge (arrows), rotate (Q / E) and delete regions,
  lakes, houses, decks, props and stamps (flatten / hill-or-pit). Spawn, shrine and exits can be moved and edited but not
  added or deleted. Props pick their prefab from a searchable catalog (Browse); an unknown id is flagged and Save refuses it. A house can only be deleted when no later house lacks an `id` (interiors are named by id or position).
- **Road**: choose whether a zone's dirt roads are derived by the game (shrine to every region and exit) or only the ones drawn
  here, and turn the derived roads into editable paths with one click (nothing changes until you edit them). Draw dirt roads as polylines; drag points, Shift+click a segment to add a point, Delete removes one. A road is a
  `paths` entry of kind `road`: drawn, flora keeps off it, coloured as road. It cuts no ridge and is not a pass between zones.
- **Analyze**: walkability overlay (red = blocked, orange = free but not reachable from spawn), a path test between two clicks
  (`findPath3`, the game's own click-to-move), a reachability report from the zone's spawn (regions, exits, house doors, decks),
  and **Re-bake walkability**.

Ctrl+Z / Ctrl+Shift+Z undo and redo, Ctrl+S saves. The header has a **Snap** grid (placing and dragging), shows where the pointer is
(x, z, height, region), and the **View** tab hides buildings, flora, rings and water. Unsaved edits are mirrored to the browser and
offered back after a reload (Discard drops them); leaving the page with unsaved edits asks first. Saves and failures also pop up. "gates open" decides whether quest gates count in reachability.

## Games

Everything specific to a game lives in one `GameAdapter` (`src/adapters/`): which tools it shows, what Select can place, which fields
undo and draft recovery copy, how a level becomes a document, how the 3D objects are drawn, and the checks that must pass before a
save. Gnomomia has the full set. **Club Gnome** has View and Select: props (with the prefab picker), buildings, blockers, portals,
game spots, seats, signs and floor patches, drawn the way the game draws them, with checks that every portal goes to a real map, every
spot opens a real game, every door link exists and every id is unique. Each Club Gnome map is its own coordinate space, so one is
loaded per page. **Gnome Front**: drag the flags and bases (a flag's landmarks follow it), place and edit mounds, vehicle slots and landmarks, and edit the
rules for the scattered cover in the **Cover** tab (counts, sizes, what each blocks, what it keeps clear of, a seed to Re-roll). The 3D view
runs the game's own builders on your edits, so the cover rearranges as it would in the game. **Gnome Golf**: move tees, greens (radius and
tilt), pins, fairway corners, bunkers and ponds; set par and fairway width per hole; the **Island** tab edits the coastline and ground. The
ground is coloured by the game's own lie function (fairway, rough, green, fringe, sand, water). Adding a game means writing one adapter.

## Saving, and the walk bake

**Save** writes only what changed: `<game>/src/data/levels/<level>.level.json` for each edited level, `world.deltas.json` after brush
strokes and `world.paint.json` after paint strokes.

Walkability is pre-baked (`walk.bake.json`, one tile per outdoor zone, 0.25 m cells, static blockers only: water, houses, trees,
walls, ramps). Any edit makes the bake stale, and `npm run build -w games/gnomes-of-gnomomia` fails on a stale bake. After
saving, use **Analyze > Re-bake walkability and save** (or `npm run bake-walk -w games/gnomes-of-gnomomia`) and commit the result.
Quest gates and props added at run time are always checked live.

## Tests

```
npm test -w tools/level-editor      # unit tests (maths, search, draft recovery, the save handler)
npm run e2e -w tools/level-editor   # end to end: real browser, real clicks, saves into a throwaway copy of the level files
```

The e2e test needs Chrome, Edge or Chromium (`CHROME=/path/to/it` if it is not found). It never touches the repo's data.

## Files

| File | What |
|---|---|
| `src/context.ts` | The contracts every module codes against (`Viewport`, `Tool`, `EditorContext`, `CollectionDef`) |
| `src/state.ts` | The context: undo/redo, dirty tracking, `editZone` / `commitDeltas` |
| `src/profile.ts` | What Select can place in a Gnomomia zone, with fields and defaults |
| `src/adapters/` | One adapter per game (Gnomomia, Club Gnome) |
| `src/viewport.ts`, `src/objectView.ts`, `src/entityView.ts` | The 3D view; the objects standing in the world (houses, decks, props, flora); the picking rings and outlines |
| `src/tools/*` | The tools |
| `server/` | Dev-server API: validates and writes the level files (only three fixed file kinds) |
| `vitest.config.ts` | Tests use their own config; the dev server needs `--configLoader runner` (set in `npm run dev`) |

## Later

Other games (Gnome Front, Gnome Golf, Club Gnome) are meant to adopt `@lawn/level` one at a time; see
`docs/roadmaps/level-format.md`. Surface paint (a ground colour layer) is not built yet.
