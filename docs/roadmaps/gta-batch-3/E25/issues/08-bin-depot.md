Epic: E25-2 (jobs III, parallel build)
Depends on: none (depot prefabs are made in parallel: guard every one with `getPrefab(id)`)

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. Environmental-storytelling and dressing issue. You may run ONE dev
server on port **5352** only (`cd games/gnome-theft-auto && npx vite --port 5352 --strictPort`, background); stop it after.

## Goal
The Turfton Bin Depot beside the Compost Heap (site `bin-depot`, rect x -264..-216, z -111..-83): a lived-in yard
with the depot shed, Mags Wheelie's office cabin, the lorry bay, a tipping ramp toward the heap, the bin wash, Mags and
a crew gnome doing depot things, signs with jokes, three small stories told with props, and its colliders.

## Read first
- `games/gnome-theft-auto/src/workplaces/garbage/depot.ts`: the stub (`Depot`, `buildDepot`; keep the return shape).
- `games/gnome-theft-auto/src/workplaces/mechanic/lot.ts`: E24's exterior workplace: prefabs on clear ground,
  colliders pushed to `world.boxes`, `registerCull`, `coastSign(text, opts)` from '../../coast/sign' for painted signs.
- `games/gnome-theft-auto/src/workplaces/mechanic/runtime.ts`: a standing NPC gnome (`makeGnome(scene, look)`,
  `randomTownLook()`, `gnomeState(x, y, z, yaw, speed)` from '../../gnomes', updated every frame).
- `games/gnome-theft-auto/src/sites.ts`: `anchorOf('bin-depot', 'gate'|'lorry'|'office'|'tip')`, `siteRect('bin-depot')`.
- `docs/lore/entries/apocrypha/turfton-compost-heap.md` (the heap: steaming mulch, Black Dew stills, Ash-Shovel Ernie).

## Change
- `games/gnome-theft-auto/src/workplaces/garbage/depot.ts`: implement `buildDepot(scene, world)` (idempotent: a module
  `built` cache) and add `export function updateDepot(dt: number): void` (animates the two residents; the runtime calls
  it every frame):
  - Inside `siteRect('bin-depot')` only. Gate on the east side at the `gate` anchor (the yard opens toward +x; keep a
    7 m wide clear drive from the gate to the `lorry` anchor and on to the `tip` anchor so the lorry can drive in, turn
    and reach the tip). `bin-depot-shed` on the north side (bay facing the yard), `bin-depot-office` at the `office`
    anchor, `bin-tipping-ramp` at the `tip` anchor facing the heap (south), a low fence/wall along the west and north
    edges using existing fence prefabs (grep `fence` in packages/prefabs/src/catalog for a panel), `bin-wash-rack`,
    `bin-row-depot`, `bin-bag-pile`, a `bin-round-board` on the office wall.
  - Colliders: a Box (`{ minX, maxX, minZ, maxZ, h }`) for each building and solid prop pushed into `world.boxes`,
    never over the drive. Ground: `heightAt`. Flat things on a draw layer (see _env.md).
  - Residents (built with `makeGnome`): **Mags Wheelie** by the office, hi-vis vest look (yellow shirt, green hat),
    facing the yard, a clipboard if a prefab fits (`clipboard`? grep), idling; a **crew gnome** at the wash rack
    turning slowly side to side "hosing" (no water effect needed). Talk lines are not needed here (the runtime toasts).
  - Signs (`coastSign`, dry jokes): "TURFTON BIN DEPOT - WE TAKE IT AWAY", "BIN DAY IS EVERY DAY", "DAYS WITHOUT A
    SPILL: 0" (on the office), "THE HEAP IS NOT A SLIDE - by order of the HOA", "LIDS DOWN, CHINS UP".
  - Three vignettes (props only, no text): (1) the overflow: a single wheelie bin with its lid jammed open on a
    mountain of bags, a broom leaning on it, abandoned mid-attempt; (2) `lost-property-bin` beside a chair and a
    hand-written "CLAIM BY FRIDAY" board (prop only), a trophy on top; (3) Mags' tea break: a deckchair facing the
    steaming heap, a flask and a mug on an upturned crate, a newspaper.
  - Return the `Depot` spots: `lorry` (the lorry anchor and yaw, adjusted to clear ground), `start` (an on-foot spot
    by the office door, clear), `tip` (the ramp's top, where the lorry stops to tip).
- Check it in the browser: dev server on 5352, then from the repo root
  `node tools/gta-shots.mjs "http://localhost:5352/?offline&no-intro" C:/Users/cpsai/AppData/Local/Temp/e25-depot gate:-205,-89,-1.57 yard:-232,-97,3.14 heap:-250,-70,0`
  and look at the PNGs. The scene must read as a working depot. Note: `buildDepot` only runs once the garbage runtime
  calls it; for your check temporarily call `buildDepot(deps.scene, deps.world)` (and `updateDepot(dt)`) from
  `garbage/runtime.ts`'s stub `update`, and REVERT that file to the stub before you finish.

## Contract
`buildDepot(scene, world): Depot` (shape unchanged), `updateDepot(dt): void`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `depot.ts`.
- Screenshots looked at; `bash tools/smoke.sh "http://localhost:5352/?offline&no-intro&at=-205,-89,-1.57" gta-gnomlet`
  reports no console errors. `garbage/runtime.ts` is back to the stub. Server stopped.

## Out of scope
`garbage/runtime.ts` (except the temporary line), prefab catalogs, `sites.ts` and the level documents, every other file.
