# E05 Interiors and rooftops: roadmap

Brief: [../E05-interiors-and-rooftops.md](../E05-interiors-and-rooftops.md). Contract for later epics:
[contracts.md](contracts.md). Owned items: L36 (interiors), L75 (land on buildings and run around).

Goal: one generic walk-in interior system (door prompt that works on touch, fade, furnished room from prefabs,
leave), four showcase interiors, walkable roofs on every downtown tower and the Double Pot slab, copter landing on
them, a quest `interior:` gate, and the decisions later epics need (large cells, online, save, police).

## Shape

| Epic | What | Done when | Issues |
|---|---|---|---|
| E05-1 Foundation (planner) | types, registry + pocket allocator, rooftop registry + grid queries, stubs; hot-file edits: `collide.ts` clampToWorld exemption, `terrain.ts` heightAt/waterAt/groundAt, `craft/aircraft.ts` floorUnder, `interactables.ts` (`y`, remover), `app.ts` wiring + touch action label for every E prompt | `tsc --noEmit` | 0 (planner) |
| E05-2 Engine pieces + showcase | 2A kit, 2B runtime (Sonnet), 2C rooftop build, 2D roof life, 2E achievements + reward prefabs, 2F quest interior gate (Sonnet), 2G tests, 2H lore, 3A Bodega, 3B Mulch Club lobby, 3C Flat 3B, 3D Double Pot sales floor + lift | build, tests, prefab/achievement tests, lore | 12 |
| E05-3 Checks (planner) | app wiring of the Double Pot roof, smoke, zfight, phone viewport, screenshot pass, contracts doc, AGENT_INDEX | all checks | 0 (planner) |

The showcase issues (3A-3D) run in the same wave as the kit: each owns one file and codes against the `InteriorKit`
interface fixed in `src/interiors/types.ts`, so nothing waits.

Every issue is in full in [issues/](issues/) (`2A-kit.md` ... `3D-double-pot.md`; the showcase issues share
`3-showcase-common.md`).

## Files per issue (no collisions)

2A `interiors/kit.ts`, `kit.test.ts` · 2B `interiors/runtime.ts`, `runtime.test.ts` · 2C `interiors/rooftopsBuild.ts`,
`rooftopsBuild.test.ts` · 2D `interiors/roofLife.ts`, `roofLife.test.ts` · 2E `packages/achievements/src/catalog.ts`,
`packages/prefabs/src/catalog/cosmetics-head-b.ts`, `cosmetics-back.ts` · 2F `quests/types.ts`, `quests/quests.ts`,
`quests/objectivesCity.ts`, `quests/journal.ts` (if needed), `questSim/checks.ts`, one quest test · 2G
`interiors/interiors.test.ts` · 2H `docs/lore/**` · 3A-3D one `interiors/showcase/*.ts` each.

## Decisions (taken here, binding for later epics)

- Rooms are built on entry and disposed on leaving (E10's request); their colliders are pushed into `world.boxes` once
  and stay (far off the map, never in the way; the collide grid is rebuilt by array length, so boxes are never removed).
- No new three.js lights inside (a new light recompiles every material): the runtime re-tints the scene hemisphere to
  the room theme and caps the sun while inside. Windows glow by night factor.
- Online: a player inside an interior is relayed standing at the building's exit (`interiors.home()` feeds `simX/simZ`
  into `net.setPose` and the HUD); `POS_BOUND` is not raised. No shared rooms yet.
- While inside, the world (traffic, gnomes, Hat Watch, atmosphere, minimap) runs round the door, like the Pay 'n' Glaze
  stage; quests get the real position so interior gates work.
- Doors stay shut while wanted (heat >= 1) and never take vehicles, so police never need to follow into a pocket.
  Weapons are not holstered (relaxed from the brief; E18 may add it).
- Large underground cells (E17 mole halls) are supported: any room up to 600 x 600 m gets a large pocket automatically.
- Save/resume: there is no position save in the game today; `currentInterior()` is the hook if E07 adds one (place the
  player at the interior's `exit` on load).
- Rooftops with a box under them (towers) are `solid: true` and only feed aircraft floors; box-less roofs (the Double
  Pot slab) feed `groundAt`, but only for a known height, so a car in the tunnel is never lifted onto the slab.
