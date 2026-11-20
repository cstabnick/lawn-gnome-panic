# Warps and interiors: requirements (not started)

Status: requirements and scope only. Nothing here is implemented. Written so the work can start later with the decisions below
already made, or changed.

## What exists today (checked in the code)

- **Houses are generated interiors.** Each house in a zone file becomes an indoor zone `<zone>/<house id>`
  (games/gnomes-of-gnomomia/src/content.ts, pass 2b). Its room is laid out by `layoutInterior` in
  src/data/interiors.ts (about line 231), seeded from `hashString` of the house id, with a template (cottage, hall, tavern,
  shop, ...). Furniture and bookshelves are generated, not authored; bookshelves and lecterns become objects (`<zone>#shelf<n>`).
- **Doors and exits are two systems.** Houses get a door exit both ways (`doorSpots`, interiors.ts line ~284). Zone exits
  (`ZoneExit` in config.ts) are separate: outdoor exits mark road ends, and exits into or out of an instance are teleports
  (`isTeleportExit`, zones.ts). Teleport exits are checked per frame in `updateZones`.
- **The editor cannot show interiors.** `outdoorZones` is the only set it draws. Houses appear as their outdoor footprint and
  door, not as the room they lead to. Exits appear as rings with their label, but nothing shows the destination.
- **Dev entry point exists.** `?zone=<id>` skips the title screen and drops a character into that zone (main.ts line ~152).
  An editor preview can use it.
- **Prefabs have no warp.** Prefabs carry seat, fire and examine behaviour (`examinablePrefabFromMesh` in input.ts). A prefab
  cannot yet teleport the player or reference a zone.

## Requirements

### R1. See where every door and warp goes
- The editor shows, for every exit and house door, the destination zone name and the arrival point, as a line or arrow from
  the door to the arrival. Drawn with the existing entity overlay (entityView.ts).
- Hovering or selecting a door shows the destination in the details window (the inspector from the last change).
- Unreachable or broken destinations are flagged in the Analyze tab, next to the existing reachability report.

### R2. Warp as a component on a prefab or a placement
- A warp is something that moves the player to another zone and position. It can be attached to a prefab (a door, a portal, a
  hatch), or placed alone.
- It has: target zone, arrival x/z, trigger radius, optional condition (`when`, as quests use), and whether it is one-way.
- Decision needed (see Open questions): reuse `ZoneExit` as it is, or add a marker kind `warp` in the level file (the same
  pattern as objects and spawns). A marker kind keeps the editor and the loader consistent with the rest; `ZoneExit` would
  need its own editor collection.

### R3. Preview a destination
Two options, both wanted, with the cheap one first:
- **Teleport in the editor (zone switch).** Switch the editor to the destination zone when it is outdoors. Works now for
  outdoor destinations. Interiors are indoor zones, which the editor cannot draw yet (see R5).
- **Pop-up preview.** A small floating window (the same pattern as the inspector) with an iframe pointing at the game dev
  server with `?zone=<destination>&x=<x>&z=<z>`, and an "Open in editor" button that switches the editor to that zone. Needs the
  game dev server running. The game's `?zone=` already exists; the arrival position parameters would need adding (small).

### R4. Procedural interiors: parameters, read-only to players
- Each generated interior has its parameters recorded next to the house: template, seed (or the house id it hashes from),
  size, and furniture rules if they are exposed. Recording them is the minimum; they feed the same `layoutInterior` call.
- "Prevent players from editing": decision needed on who is "players" (see Open questions). Minimum: the parameters are read-only
  in the editor and the generated layout is not hand-edited in place. Furniture that is hand-placed later is a separate list.
- The inspector (already built) shows these parameters for a house.

### R5. Editor view of interiors
- A way to see an interior room in the editor: draw `layoutInterior` output for a selected house in a separate view, or
  switch the editor to that indoor zone. The shared layout must be import-safe, like `objectModels.ts`, so the editor can call it.
- Needs `layoutInterior` (and its helpers) to be importable without the game's state. Check imports in interiors.ts first.

### R6. Procedural editor (later, scoped separately)
- Edit a house's template and seed, change room size and furniture density, and regenerate the preview live using the same
  `layoutInterior` as the game. Save writes the parameters only, never the generated result.
- Depends on R4 and R5.

### R7. Prefab component
- A prefab can declare a warp (R2) in its definition. The prefab library rules apply: a new prefab goes through
  `packages/prefabs/src/catalog/` and `npm test -w packages/prefabs`.
- The game-side behaviour (teleport, condition, cooldown) lives in one function that both the prefab and the marker use,
  so there is one warp implementation.

## Non-goals (for now)
- Online play: interiors and warps must keep working with `@lawn/mp`, but multiplayer changes are not in scope here.
- Replacing the game's zone model or the Deeps instance system.
- Mobile layout for the editor (the editor is a desktop tool).

## Open questions (decide before starting)
1. **"Players" in R4.** Does "prevent players from editing" mean level authors (the editor) or people playing the game? The two
   need different answers. My reading is level authors, since the game players cannot edit levels.
2. **Warps: `ZoneExit` or a new marker kind (R2)?** My recommendation: a marker kind `warp`, same pattern as objects and spawns,
   with `ZoneExit` kept for roads and existing house doors until they are migrated.
3. **Pop-up preview (R3): iframe to the game dev server, or a separate in-editor renderer?** The iframe is cheap and shows the
   real game. An in-editor renderer is more work but works without the game server.
4. **How far does the procedural editor go (R6)?** Parameters only, or also furniture rules and per-room overrides?

## Suggested order (when started)
1. R1 (show every door and warp destination in the editor). Read-only, uses what exists.
2. R3 part one (zone switch for outdoor destinations), then the pop-up preview with the iframe.
3. R4 (record and show interior parameters, read-only).
4. R2 and R7 (warp as marker kind, then as a prefab component), once question 2 is settled.
5. R5 (interior view in the editor), then R6 (procedural editor).

## Verification (for each step, when built)
- Build and tests as in the other roadmaps: game build, lint:content, game tests except `src/gear.test.ts`, level and editor tests.
- Editor: smoke check with the dev server, and a manual check of each new view, since the editor has not been checked in a browser
  so far.
