# Level Editor (local tool)

Edit a game's levels in 3D and save straight back into the game's level files. It opens **Gnomes of Gnomomia** (the whole open
world), **Club Gnome** (its four flat maps), **Gnome Front** (the arena), **Gnome Golf** (the island and its nine holes) and **Gnomokemon Snap** (its eight courses, one at a time) and **Pebblecross** (its one town: places, forage patches, buildings and props); pick the game
in the header, or open `?game=gnome-front`, `?game=gnome-golf`, `?game=gnomeokemon&level=lawn`, `?game=pebblecross` or `?game=club-gnome&level=town`. It runs only on your machine: the
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
  lakes, houses, decks, props and stamps (flatten / hill-or-pit). Spawn, shrine, exits and the object and spawn markers
  (`objects`, `spawns`, see [Markers](#markers)) can be moved and edited but not added or deleted: the markers' ids come from the
  packs. Props pick their prefab from a searchable catalog (Browse); an unknown id is flagged and Save refuses it. A house can only be deleted when no later house lacks an `id` (interiors are named by id or position).
- **Road**: choose whether a zone's dirt roads are derived by the game (shrine to every region and exit) or only the ones drawn
  here, and turn the derived roads into editable paths with one click (nothing changes until you edit them). Draw dirt roads as polylines; drag points, Shift+click a segment to add a point, Delete removes one. A road is a
  `paths` entry of kind `road`: drawn, flora keeps off it, coloured as road. It cuts no ridge and is not a pass between zones.
- **Analyze**: walkability overlay (red = blocked, orange = free but not reachable from spawn), a path test between two clicks
  (`findPath3`, the game's own click-to-move), a reachability report from the zone's spawn (regions, exits, house doors, decks),
  the door problems under it (see [Door and exit links](#door-and-exit-links)), and **Re-bake walkability**.

Ctrl+Z / Ctrl+Shift+Z undo and redo, Ctrl+S saves. The header has a **Snap** grid (placing and dragging), shows where the pointer is
(x, z, height, region), and the **View** tab hides buildings, flora, rings and water. Unsaved edits are mirrored to the browser and
offered back after a reload (Discard drops them); leaving the page with unsaved edits asks first. Saves and failures also pop up. "gates open" decides whether quest gates count in reachability.

## Markers

A **marker** is an entry of a zone's `markers` array in its level file: `{ id, kind, x, z, data }`. The `kind` says what it is and
the `id` is the id of an entry in the game's packs, so the pack defines what the thing is and the marker says where it stands.
Gnomomia has two kinds, each with its own collection in Select:

- `object` (collection `objects`): a world object. `data.rot.y` is its yaw and `data.scale` its scale (both editable in the select
  panel), and its position is `x`, `z`.
- `spawn` (collection `spawns`): an enemy spawn group. `data.count` and `data.spread` override the pack's count and spread when they
  are present (the editor falls back to the pack's values otherwise). The spread is drawn as a ring.

Each marker keeps `data.v` at 1. The editor does not add markers: their ids come from the packs, so a new one is written into the
level file by hand (the editor then moves and edits it). Markers are saved sorted by `kind`, then `id`, so a save changes only the
markers you edited.

### Details window

Select an item and its details window (`.le-inspector`) lists what is known about it, read-only. For an object or spawn, a **Pack
definition** section shows the pack's values under a note that they are set in code; each row's tooltip names the pack folder
(`games/gnomes-of-gnomomia/src/data/packs`). Placement values (the marker's own position and overrides) stay in the select panel.
For an exit, a **Destination** section names the zone it goes to, its arrival point, and whether that zone is indoor and known.

## Door and exit links

Each exit of the zone on screen is drawn as a cyan line from the exit to its arrival point, with a pole at the arrival (the lines form
a `door-links` group and follow the rings toggle). An exit whose destination is indoor, or in a zone not loaded in the editor, gets
only an amber pole at the exit; one whose destination zone is unknown gets a red pole. House doors are not drawn this way, because
houses already show. Indoor zones are known to the links even though the editor loads only outdoor zones.

Analyze's reachability report also lists the exits with a problem: an unknown destination zone, or an outdoor destination whose
arrival point cannot be reached from its own spawn. Indoor destinations are not judged that way, and a destination zone that is not
loaded here counts as reachable.

## Checks on save, draft recovery and load errors

- **Save** asks for confirmation when an object or spawn marker has no pack entry, since the game would fail to load. Cancelling
  stops the save and lists the ids. Confirm only if you are about to add them to a pack in another file.
- **Draft recovery** drops the object and spawn markers whose id no longer has a pack entry, and the status line says which. It
  never restores them silently.
- **Load errors**: when the game's content fails to load, the editor shows a red banner with the first ten messages instead of a blank
  page. Fix the content, then restart the editor server: a running server keeps the old modules.

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
npm test -w tools/level-editor      # unit tests (maths, search, draft recovery, the save check, load errors, door links)
npm run e2e -w tools/level-editor   # end to end: real browser, real clicks, saves into a throwaway copy of the level files; covers the object and spawn markers, the details window and the door links
```

The e2e test needs Chrome, Edge or Chromium (`CHROME=/path/to/it` if it is not found). It never touches the repo's data.

## Files

| File | What |
|---|---|
| `src/context.ts` | The contracts every module codes against (`Viewport`, `Tool`, `EditorContext`, `CollectionDef`) |
| `src/state.ts` | The context: undo/redo, dirty tracking, `editZone` / `commitDeltas` |
| `src/main.ts` | The entry page: loads the styles, then `src/editor.ts`; shows the load-error banner (`src/loadError.ts`) if that fails |
| `src/editor.ts` | Builds the editor on the context (formerly `main.ts`) |
| `src/profile.ts` | What Select can place in a Gnomomia zone, with fields and defaults (the `objects` and `spawns` collections) |
| `src/markerCheck.ts`, `src/saveCheck.ts` | Object and spawn markers with no pack entry: the check, and the save confirmation |
| `src/doorLinks.ts` | Where every exit goes (the door-link lines, the Destination section, the Analyze problems) |
| `src/adapters/` | One adapter per game (Gnomomia, Club Gnome) |
| `src/viewport.ts`, `src/objectView.ts`, `src/entityView.ts` | The 3D view; the objects standing in the world (houses, decks, props, flora); the picking rings and outlines |
| `src/tools/*` | The tools |
| `server/` | Dev-server API: validates and writes the level files (only three fixed file kinds) |
| `vitest.config.ts` | Tests use their own config; the dev server needs `--configLoader runner` (set in `npm run dev`) |

## Later

Other games (Gnome Front, Gnome Golf, Club Gnome) are meant to adopt `@lawn/level` one at a time; see
`docs/roadmaps/level-format.md`. Surface paint (the Paint tool) is in; zones cannot be created or resized yet.
