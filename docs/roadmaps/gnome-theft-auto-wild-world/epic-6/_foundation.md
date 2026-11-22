# Epic 6 foundation (done by the planner)

What exists before the issues run, so the workers and later epics know where things are.

## Files

- `games/gnome-theft-auto/src/critters.ts`: the one wildlife runtime (contract in `_runtime.md`): `CRITTER_SPECS`
  (cow, sheep, pig, hen, squirrel, polar-bear, bee), `createCritters(scene, world, deps, lives)`, modes idle / wander
  / flee / chase / down / script, vehicle scare and knock-over, bullet `hitTest`, `knockArea` (for blasts), distance LOD
  (`CRITTERS` in `config.ts`: sim 260, mesh 190, anim 70), pivot animation by name, `openSpot` / `isOpen` /
  `roadDistance`, `critterMesh` (grey box for a missing prefab), `setPlayerHidden` / `isPlayerHidden`.
- `src/critters/{cloverfield,dreyGang,fells,commons}.ts`: one `RegionLife` per region behaviour (issues 6C-6F);
  `src/critters/index.ts` `REGION_LIFE` lists them.
- `src/critters.test.ts`: spawning inside the region and leash, shot -> down -> up and flee, never removed, `onHit`
  override, vehicle scare and knock.
- `src/config.ts` `CRITTERS`: runtime tuning.
- `src/app.ts`: creates the runtime after the ambient gnomes; deps wire `hud.toast`/`callout`, `economy.earn`, a
  `steal` built on `economy.spend`, `player.hurt` (on foot only), `fx`, `play`, and `event(id)` -> `reportNews(id)`
  only when `EVENT_BULLETINS` has that id. `critters.update(ctx)` runs after the atmosphere (it needs `nightFactor`);
  `critters.hitTest` is in the bullet `hitTest` before destructibles.
- `src/police.ts`: `isPlayerHidden()` (giant grass, on foot) stops the cooling check from counting anyone as seeing
  the player and stops officers spraying.
- `packages/prefabs/src/catalog/gta-farm-critters.ts` (6A) and `gta-wild-life.ts` (6B), registered in
  `catalog/index.ts`.
- Lore: entries `sgnowmes`, `drey-gang`, `fells-polar-bears`; `tallgrass-commons` updated; ruling R-049 (animal
  size, never die, every creature wants something, sgnowmes are frost-glazed clay, snowmen rebuilt overnight).

## For Epic 8

- Radio: `CritterEvent` ids (`cow-tipped`, `herd-herded`, `drey-raid`, `drey-mower-stolen`, `drey-scattered`,
  `snowman-smashed`, `bear-shrug`, `hive-knocked`, `swarm-escaped`) already reach `reportNews`; adding an entry with
  that key to `EVENT_BULLETINS` in `radio/content.ts` puts it on air. Nothing else to wire.
- Achievements: hook them in the `event` dep in `app.ts` (`createCritters(..., { event: (id) => ... })`).
- Perf: critters are culled by distance (`CRITTERS` in config.ts); the Commons grass is one instanced group per
  patch, hidden beyond `r + 260`; mown tufts regrow round-robin (200 per frame).
- Online: critters are local per browser. Remote players do not mow other players' grass or scare their herds.
