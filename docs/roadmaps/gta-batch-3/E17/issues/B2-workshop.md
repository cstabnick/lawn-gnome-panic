Epic: E17 wave 2 (building the places)
Depends on: wave 1 prefabs (they exist now: check with `getPrefab`)

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (Interiors section, who the Underspanners are).

## Goal
Hogweed's Workshop is a walk-in E05 interior entered from the Underspan: a cluttered, brilliant inventors' workshop
with the Updraft, a contraption that shoots the player up onto the Roost (the scaffold deck outside).

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (`SOCIETY_INTERIORS.workshop`, `UNDERSPAN.workshopDoor`,
  `workshopExit`, `roostArrive`, `roostY`, `WORKSHOP_ROOM`, `SOCIETY_CAST`)
- `games/gnome-theft-auto/src/interiors/types.ts` lines 1-110 (InteriorDef, InteriorKit)
- `games/gnome-theft-auto/src/golf/clubhouse.ts` (a complete defineInterior example with a custom theme, furniture,
  signs and spots: copy the structure)
- `games/gnome-theft-auto/src/societies/underspan/workshop.ts` (yours: the stub)

## Change
- `games/gnome-theft-auto/src/societies/underspan/workshop.ts`: at import time call `defineInterior({ id:
  SOCIETY_INTERIORS.workshop, name: "Hogweed's Workshop", door: UNDERSPAN.workshopDoor, exit: UNDERSPAN.workshopExit,
  size: WORKSHOP_ROOM.size, theme: <custom InteriorTheme: floor oily concrete grey, walls rust-brown corrugated, trim
  galvanised grey, ceiling dark, light warm>, ambience: 'city', prompt: "Enter Hogweed's Workshop", build(kit) {...} })`:
  - `kit.room()`, `kit.door(WORKSHOP_ROOM.door[0], WORKSHOP_ROOM.door[1], WORKSHOP_ROOM.doorYaw)` (west wall, facing east).
  - The Updraft: `kit.put('updraft-lift', ...WORKSHOP_ROOM.updraft, ...)` and the way up:
    `kit.stairsTo(WORKSHOP_ROOM.updraft[0] - 1.6, WORKSHOP_ROOM.updraft[1], { x: UNDERSPAN.roostArrive.x, y: UNDERSPAN.roostY, z: UNDERSPAN.roostArrive.z, yaw: UNDERSPAN.roostArrive.yaw }, 'Ride the Updraft')`.
    A sign by it: "THE UPDRAFT / Mk. 7 (Mk. 1-6: ask Nettle) / KEEP ARMS IN UMBRELLA".
  - Hogweed's bench at `WORKSHOP_ROOM.bench`: `welding-bench`, a `spool-table` with blueprints, a `citation-post`.
  - `dewdrop-cradle` at `WORKSHOP_ROOM.dewdropCradle` (empty; a sign "DEWDROP: PENDING (DO NOT ASK)").
  - Clutter along the walls (only ids that exist, guarded): `underspan-scrap-heap` small (size 2.5), `pedal-generator`, a
    `workshop-hammock` slung in one corner, shelves/crates from the general catalog if they exist (grep
    `packages/prefabs/src/catalog/furniture.ts` and `props.ts` for 'shelf', 'crate', 'toolbox').
  - Posters (kit.sign on the walls, facing into the room): "A RULE IS ONLY A PROTOTYPE NOBODY TESTED", "TODAY'S
    INVENTION: TOMORROW'S CITATION", a chalkboard "THINGS THAT STAYED UP: 1. the Span (barely) 2. Nettle (once)".
  - Two residents: `kit.npc({ id: 'teasel', name: SOCIETY_CAST.teasel, x, z, yaw, look: { hat: 0x3a3a3a, shirt:
    0x6b4a2e, beard: 0x888888, glasses: true }, line: 'Visor stays down. The sparks are part of the design.' })` at the
    bench, and Vetch Cantilever by the chalkboard (line: "I'm drafting the manifesto. It has a footnote longer than the
    Span."). Hogweed himself stands OUTSIDE (another worker), not in here.
  - Ambient: `onEnter()` may `playAt('weld-crackle', ...)` once (import from '../../sound/bus'; world coords via
    `interiorToWorld(id, lx, lz)`), optional.
- `games/gnome-theft-auto/src/societies/underspan/workshop.test.ts` (new): importing the module defines the interior
  (`interiorById(SOCIETY_INTERIORS.workshop)` from '../../interiors' is defined, door at `UNDERSPAN.workshopDoor`);
  building it with the E05 kit (`createKit(placed)` from '../../interiors/kit'; see how `src/interiors/kit.test.ts`
  makes a `PlacedInterior` and calls `def.build(kit)`, and copy that) gives
  a spot whose prompt is 'Ride the Updraft', a door, and at least 8 put objects.

## Contract
Interior id `SOCIETY_INTERIORS.workshop` ('underspan-workshop'); the Updraft spot prompt exactly 'Ride the Updraft'
(it leaves the interior to the Roost at y `UNDERSPAN.roostY`).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/societies/underspan/workshop.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file (the outdoor build, life, config.ts, interiors/*).
