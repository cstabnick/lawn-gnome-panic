Epic: E25-2 (jobs III, parallel build)
Depends on: none (fire prefabs are made in parallel: guard every one with `getPrefab(id)`)

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. Environmental-storytelling and dressing issue. You may run ONE dev
server on port **5354** only (`cd games/gnome-theft-auto && npx vite --port 5354 --strictPort`, background); stop it after.

## Goal
Turfton Fire Station No. 1 ("the Damp House") on the Mossy Wood edge (site `fire-station`, rect x -273..-217,
z 121..149): the engine house with its bays opening east onto the apron, the bell post, a hose tower, a yard hydrant,
Chief Hydra Pumpwell and a firefighter doing station things, signs with jokes, three small stories, colliders.

## Read first
- `games/gnome-theft-auto/src/workplaces/firefighter/station.ts`: the stub (`Station`, `cityHydrants`, `buildStation`;
  keep the return shape).
- `games/gnome-theft-auto/src/workplaces/mechanic/lot.ts`: E24's exterior workplace (prefabs on clear ground,
  colliders into `world.boxes`, `registerCull`, `coastSign(text, opts)` from '../../coast/sign').
- `games/gnome-theft-auto/src/workplaces/mechanic/runtime.ts`: NPC gnomes (`makeGnome`, `randomTownLook`,
  `gnomeState` from '../../gnomes').
- `games/gnome-theft-auto/src/sites.ts`: `anchorOf('fire-station', 'apron'|'engine'|'door'|'yard')`, `siteRect`.
- Run once: `cd games/gnome-theft-auto && PROBE="-245,135" PROBE_R=40 PROBE_S=2 npx vitest run src/quests/stages.probe.test.ts`
  (ASCII map of roads '=' around the site) to see where the road is that the apron must meet.

## Change
- `games/gnome-theft-auto/src/workplaces/firefighter/station.ts`: implement `buildStation(scene, world)` (idempotent)
  and add `export function updateStation(dt: number): void` (animates the residents; the runtime calls it each frame):
  - `fire-station-house` rotated so its bays open east (+x) toward the `apron` anchor; the `engine` anchor is the
    middle of a bay just inside/at the door, facing east; the apron (a flat concrete pad, `flatLayer` LAYER.area,
    lifted 0.012 m) runs from the bays to the east edge and toward the nearest road; keep a 7 m clear lane from the
    bay to the site edge (no props, no colliders).
  - `fire-bell-post` by the side door (the `door` anchor area): `bell` spot = on foot in front of it.
  - `fire-hose-drying-tower`, `fire-boot-rack`, `kerb-hydrant` in the yard (return it in `hydrants`), a
    `fire-callbox` at the front, `fire-practice-shed` at the `yard` anchor.
  - Colliders for the house walls (not the bay openings: give the house its walls as separate thin Boxes around the
    bays so the engine can drive in and out) and solid props.
  - Residents: **Chief Hydra Pumpwell** (brass helmet look if a hat colour fits: red coat, gold hat; standing by the
    bell, arms behind back), a firefighter polishing the bell / sitting on the boot rack bench.
  - Signs (`coastSign`): "TURFTON FIRE STATION No. 1", "WET IS BEST", "DAYS SINCE LAST BARBECUE: 0",
    "KEEP CLEAR - ENGINE EXITS (SOMETIMES IN A HURRY)", "NO SMOKING. NOT EVEN A LITTLE.".
  - Three vignettes (props only): (1) the practice shed, scorched and patched, with a bucket chain of three buckets
    leading to it and one bucket knocked over; (2) the station kitchen table outside: `fire-chili-pot` steaming on its
    stove, five bowls, one chair pulled out in a hurry; (3) the cat's corner: a saucer of milk, a tiny blanket on a
    crate, and a "MISSING: ASPHALT (AGAIN)" notice (sign) on the tower.
  - Return `{ engine, bell, hydrants }`.
- Check it in the browser: temporarily call `buildStation(deps.scene, deps.world)` and `updateStation(dt)` from
  `firefighter/runtime.ts`'s stub `update` (first frame), dev server on 5354, then from the repo root
  `node tools/gta-shots.mjs "http://localhost:5354/?offline&no-intro" C:/Users/cpsai/AppData/Local/Temp/e25-station apron:-205,135,-1.57 yard:-262,150,3.14 bell:-235,115,0`
  and look at the PNGs. **Revert `firefighter/runtime.ts` to the stub** before you finish.

## Contract
`buildStation(scene, world): Station`, `cityHydrants()`, `updateStation(dt)`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `station.ts`.
- Screenshots looked at; `bash tools/smoke.sh "http://localhost:5354/?offline&no-intro&at=-205,135,-1.57" gta-gnomlet`
  reports no console errors; runtime.ts back to the stub; server stopped.

## Out of scope
`firefighter/runtime.ts` (except the temporary lines), prefab catalogs, `sites.ts`, level documents, every other file.
