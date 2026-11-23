# Gnome Theft Auto: tuft hunting

Goal: "add hunting to gnome theft auto". Canon (R-021, R-049, new ruling R-141): animals never die or bleed, so a Turfton
hunt is a **tuft hunt**. Shoot a quarry with any gun: it falls over in a puff. Reach it before it gets up and comb a tuft
(sometimes a rare keepsake) from it, if you hold a Tuft License. Sell tufts and keepsakes to Hazel Mattock at the
Tuft & Tally Lodge in Mossy Wood, who also keeps the journal of species taken.

Loop: buy the license at the lodge (120 Acorns) -> find quarry by region (tracks on the ground, calls by ear, a HUD hint
line) -> sneak (walking and standing still are quieter; vehicles and gunshots alarm) -> shoot (rolled hedgehogs and
armadillos bounce shots; ducks and pheasants flush into the air; harvest mice burrow; hares zigzag) -> comb within
the down time -> sell at the lodge -> journal fills; achievements with gear rewards.

Decisions:
- Own small runtime in `src/hunting/` (critters.ts is read-only for this workstream). Data-driven species table
  `src/hunting/species.ts` (`SPECIES`, `HUNT_SPOTS`, `HUNT`, `LODGE`); `hunting.spawn(id, x, z)` and `?hunt=<id>` spawn
  any species by id for the debug trainer.
- Never on a road: spawns need `HUNT.spawnMargin` extra clearance from highways and boxes, movement `HUNT.roadMargin`;
  no open spot means no spawn (no fallback to the raw point). Lodge props are checked against `roadDistance` in a test.
- Save: `gta-hunting-v1` (license, bag, journal, totals) in `GTA_SAVE_KEYS`, cloud merge newer-wins.
- Online: not relayed. Wildlife is local per browser (like `critters.ts`); relaying quarry would need a host-run
  animal sim, which doubles the feature. Each player hunts their own quarry.
- Mobile: comb and the lodge use the existing E / touch interact prompt; the lodge sheet and HUD buttons are 44 px+.
- Party slice: later (a 4-player "first to comb 3 tufts" round could fit once the hunt is proven fun).

Foundation (planner, done): `species.ts`, stubs for every module, `hunting.ts` (the system), app.ts wiring
(create, boxes, hitTest, prompt/interact, update, blips, control hold), save key in `saveIO.ts` + `cloudSave.ts`,
three empty prefab catalog files registered in `packages/prefabs/src/catalog/index.ts`, ruling R-141.

| Epic | Done when | Issues |
| --- | --- | --- |
| 1 Fill the hunt | `npx tsc --noEmit -p games/gnome-theft-auto` clean for `src/hunting/`, hunting tests, prefab and achievement tests, `npm run lore` pass | 11 (1A-1K), all parallel |

## Common to every issue

~~~~text
## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (a git worktree). Git Bash: if node is not
found, `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed. Do NOT run npm install, git commit,
git stash, git checkout, vite build or any dev server. Many other workers edit other files in this repo at the same
time: edit ONLY the files your issue names. `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files that
are not yours (others are mid-edit): ignore those, fix only yours.
Game: games/gnome-theft-auto (three.js 0.187, TypeScript, vitest). 1 world unit = one gnome's height. Yaw: 0 faces +z,
PI/2 faces +x; forward = (sin(yaw), cos(yaw)). The map's north is -z.
Lore rule: animals never die or bleed. A shot knocks one over in a puff; a gnome combs a tuft from it; it gets up and
runs off. Never write "kill", "pelt", "meat", "blood", "carcass" in code text or UI.
The species table, tuning and ids are in games/gnome-theft-auto/src/hunting/species.ts (read it; do not edit it).
Keep every exported name and signature of your stub file exactly as it is (other files already import them).
~~~~

## Issue 1A: quarry simulation

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-hunting.md: read it there.)

## Goal
games/gnome-theft-auto/src/hunting/quarry.ts implements the pure quarry simulation behind its stub signatures, with tests.

## Read first
- games/gnome-theft-auto/src/hunting/quarry.ts: the stub (types Quarry, QuarryEnv, QuarryFrame and 7 functions).
- games/gnome-theft-auto/src/hunting/species.ts: HuntSpecies fields, FleeStyle, HUNT (wary, recombSeconds, simRadius, shotAlert, combRange).
- games/gnome-theft-auto/src/critters.ts lines 330-470 (moveToward, pickGoal, step): copy its movement style.

## Change
- quarry.ts: fill in the bodies. No THREE, no DOM, no imports besides ./species. Behaviour:
  - createQuarry: as the stub (keep it).
  - stepQuarry(q, f, env):
    - d = distance to (f.playerX, f.playerZ). Always: q.combedT = max(0, q.combedT - dt).
    - If d > HUNT.simRadius: q.speed = 0, return.
    - Active time: species.active 'night' -> while f.night < 0.35 and mode is graze/walk/wary, mode = 'hidden'; when
      night >= 0.35 and mode is 'hidden', mode = 'graze', modeT = 1. 'day' species the same with night > 0.65 hiding.
      While 'hidden': speed 0, awareness 0, do nothing else.
    - Awareness (not in down/hidden/burrowed): hearR = species.hear * f.noise. If d < hearR: awareness += dt * 1.2 *
      (1.3 - d / hearR). If d < species.sight: awareness += dt * 2. Otherwise awareness -= dt * 0.25. If f.shot and
      d < HUNT.shotAlert: awareness = 1. Clamp 0..1.
    - graze: speed 0, modeT -= dt; at <= 0 pick a wander goal (random point within q.leash of home, up to 8 tries
      where env.open(gx, gz, radius) is true; else home) and mode = 'walk'.
    - walk: move toward the goal at species.walk; within 0.6 or stuck (speed < 0.01) -> graze, modeT = 2 + rnd*4.
    - graze/walk with awareness >= HUNT.wary -> 'wary', modeT = 0. wary: speed 0, turn to face the player (at
      species.turn rad/s); awareness < HUNT.wary * 0.5 -> graze.
    - graze/walk/wary with awareness >= 1 -> react by species.style (fromX/fromZ = player position, modeT =
      species.fleeSeconds):
      run -> 'flee' (move to a point 6 units away from `from`, at species.run).
      zigzag -> 'flee', but the away direction is turned by sin(q.zig) * 0.9 rad, q.zig += dt * 5.
      roll -> 'rolled': speed 0, stays put. When modeT ends: awareness = 0.5; if d < species.sight -> flee (run) for
        fleeSeconds, else graze.
      flush -> 'flying': q.lift rises toward species.flyHeight (3 units/s) while moving away at species.run; ignores
        env.open while flying. When modeT ends: lift falls back to 0 (3 units/s) and then graze.
      burrow -> 'burrowed': speed 0, not hittable. When modeT ends: graze, awareness = 0.3.
    - flee: like critters' flee (lean back home when farther than leash * 2 from home). When modeT ends: graze,
      awareness = 0.6 (keep zigzag/flee as 'flee' mode; only the direction differs).
    - down: speed 0, tip rises to 1 (rate dt / 0.35), lift falls (dt * 6, min 0), modeT -= dt. When modeT <= 0: tip
      falls (same rate); when tip reaches 0: awareness = 1, mode = 'flee', modeT = fleeSeconds, from = player.
    - Any mode but down: tip falls toward 0.
    - Movement helper (private): turn toward the target at species.turn * dt, step min(dist, v * dt) along yaw
      (v scaled down by cos of the turn left, min 0.25, like critters). If not flying and !env.open(nx, nz,
      species.radius): do not move, speed = 0. Else move, speed = step / dt, q.moved += step.
    - Always at the end: q.y = env.ground(q.x, q.z) + q.lift.
  - quarryContains(q, x, y, z): false when mode is 'hidden' or 'burrowed'. Else true when horizontal distance <=
    species.radius * species.scale and q.y - 0.2 <= y <= q.y + species.height * species.scale + 0.1.
  - shootQuarry(q, fromX, fromZ, dist): hidden/burrowed -> 'miss'. rolled -> 'bounced' (awareness stays 1).
    Otherwise: mode 'down', modeT = species.downTime, speed 0, from = (fromX, fromZ), lastShotDist = dist,
    awareness = 1; return 'downed'. (Already down: resets modeT and returns 'downed'.)
  - canComb(q, px, pz): mode 'down' and combedT <= 0 and distance <= HUNT.combRange.
  - combQuarry(q, px, pz): combedT = HUNT.recombSeconds, tip = 0, mode = 'flee', modeT = species.fleeSeconds,
    awareness = 1, from = (px, pz).
  - alarmQuarry(q, fromX, fromZ): unless down/hidden/burrowed: awareness = 1 and react as above on the next step
    (set from = (fromX, fromZ)).
- games/gnome-theft-auto/src/hunting/quarry.test.ts (new, vitest): an env with ground 0, open always true, a seeded
  rnd. Test: grazing quarry far away stays calm; a running gnome (noise 1) inside hear range turns it wary then
  fleeing (distance grows); a 'roll' species rolls and shootQuarry returns 'bounced'; a shot downs a 'run' species,
  canComb true within combRange, after downTime + 1 s it is fleeing; combQuarry sets combedT and canComb is false
  after another shot; a 'night' species is hidden at night 0 and quarryContains is false; 'flush' gains lift > 1.

## Done when
- npm test -w games/gnome-theft-auto -- src/hunting/quarry.test.ts passes.
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in src/hunting/quarry.ts or quarry.test.ts.

## Out of scope
Every other file. Do not edit species.ts or hunting.ts.
~~~~

## Issue 1B: tracks and their decals

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-hunting.md: read it there.)

## Goal
Quarry leave footprints that age out, drawn on the ground near the player.

## Read first
- games/gnome-theft-auto/src/hunting/tracks.ts and trackView.ts: the stubs (keep every signature).
- games/gnome-theft-auto/src/hunting/quarry.ts: the Quarry type (x, z, yaw, lift, mode, moved, species).
- games/gnome-theft-auto/src/hunting/species.ts: HuntSpecies.stride, print ('paw' | 'bird' | 'drag'), printColor, radius; HUNT.maxPrints, trackLife, trackRadius.
- packages/depth/README.md (or src/layers.ts): `flatLayer(material, LAYER.decal)` from '@lawn/depth'.

## Change
- tracks.ts:
  - createTracks(max, life): `add` pushes {..., age: 0}; when more than `max`, drop the oldest. `update(dt)` ages all
    and drops those with age > life. `near(x, z, r)` returns prints within r, newest (smallest age) first. `clear`.
  - leavePrints(tracks, q): if q.mode is 'hidden', 'burrowed' or 'flying', or q.lift > 0.05: return (do not reset
    moved). If q.moved >= species.stride: add a print at q's position offset sideways by
    species.radius * 0.35 (left/right alternating per quarry: keep a WeakMap<Quarry, boolean>), yaw = q.yaw,
    species = species.id; q.moved = 0. For print 'drag' use no sideways offset.
- trackView.ts: createTrackView(scene): three THREE.InstancedMesh (one per PrintKind), each with HUNT.maxPrints
  instances, PlaneGeometry laid flat (rotateX(-Math.PI / 2)), MeshBasicMaterial({ color: 0xffffff, transparent: true,
  opacity: 0.75, depthWrite: false }) passed through flatLayer(material, LAYER.decal); per-instance colour with
  setColorAt(i, new THREE.Color(printColor)). Shapes: 'paw' a 0.16 x 0.2 plane; 'bird' 0.18 x 0.18; 'drag' 0.1 x 0.4.
  (A plain rectangle is fine; or draw a small CanvasTexture blob per kind if you like.) frustumCulled = false.
  update(tracks, px, pz, ground): for each print within HUNT.trackRadius of the player, set its matrix: position
  (x, ground(x, z) + 0.03, z), rotation y = yaw, uniform scale 1 - 0.6 * age / HUNT.trackLife; set mesh.count to the
  number used; instanceMatrix.needsUpdate = true (and instanceColor). Look the species up with speciesById(p.species).
  dispose(): remove the meshes from the scene, dispose geometry and material.
- games/gnome-theft-auto/src/hunting/tracks.test.ts (new): add/age/drop, max cap, near() order, leavePrints leaves a
  print after a stride and none while q.mode is 'flying'. Build a Quarry with createQuarry from ./quarry and a fake env
  ({ ground: () => 0, open: () => true, rnd: Math.random }), then set fields by hand.

## Done when
- npm test -w games/gnome-theft-auto -- src/hunting/tracks.test.ts passes.
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in your three files.

## Out of scope
Every other file (quarry.ts belongs to another worker: do not edit it).
~~~~

## Issue 1C: quarry meshes

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-hunting.md: read it there.)

## Goal
games/gnome-theft-auto/src/hunting/quarryView.ts draws every quarry from its simulation state.

## Read first
- games/gnome-theft-auto/src/hunting/quarryView.ts: the stub (keep the signatures).
- games/gnome-theft-auto/src/hunting/quarry.ts: Quarry fields (x, y, z, yaw, speed, mode, tip, lift, awareness, species).
- games/gnome-theft-auto/src/critters.ts: `critterMesh(prefab, scale, tint)` (exported; use it, it falls back to a grey box
  when a prefab id is missing) and the private `pivotsOf` and `draw` functions near the end: copy their animation.
- games/gnome-theft-auto/src/hunting/species.ts: HUNT.meshRadius, HUNT.animRadius.

## Change
- quarryView.ts: createQuarryView(scene) keeps a Map<Quarry, { object: THREE.Group; pivots }>.
  update(list, px, pz, dt, time): for each quarry:
  - d > HUNT.meshRadius, or mode 'hidden' or 'burrowed': hide its object if built, continue.
  - Build on first need: critterMesh(species.prefab, species.scale, species.tint); rotation.order 'YXZ'; shadows on
    (castShadow on meshes); scene.add.
  - Position (x, y + tip * radius * 0.35, z); rotation (0, yaw, tip * PI / 2).
  - Right after building, remember base = object.scale.clone() (buildPrefab may already have scaled the root).
    mode 'rolled': object.scale = base * (1.15, 0.6, 1.15) and no leg swing; any other mode: object.scale = base.
  - Within HUNT.animRadius: leg swing, tail wag, wing flap like critters' draw; mode 'wary': head pivot rotation.x = -0.35
    (head up) and no swing; mode 'flying': wings flap fast (sin(time * 40)), legs tucked (rotation.x = 0.8).
  remove(q): take its object out of the scene and the map.
- No test file needed (three.js view); the tsc check is the gate.

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in src/hunting/quarryView.ts.

## Out of scope
Every other file. Do not edit critters.ts.
~~~~

## Issue 1D: hunt save

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-hunting.md: read it there.)

## Goal
games/gnome-theft-auto/src/hunting/huntSave.ts stores the license, the game bag, the journal and lifetime totals.

## Read first
- games/gnome-theft-auto/src/hunting/huntSave.ts: the stub (types and signatures to keep).
- games/gnome-theft-auto/src/hunting/species.ts: SPECIES (tuft and keepsake ids, names, prices, colours), HUNT.bagSize, HUNT.licensePrice.
- games/gnome-theft-auto/src/economy.ts: the load/save style (tolerant parse, try/catch around storage, notifySaveChanged() from '../saveHook' after every write).

## Change
- huntSave.ts:
  - parseHuntSave(raw): tolerant. Anything broken -> emptyHuntSave(). Keep only bag entries whose id is a known item
    (itemInfo not null) with a positive integer count; journal only for known species ids with numeric fields (taken
    >= 0 integer, keepsakes >= 0, first a string, bestShot >= 0); licensed boolean; sold/earned non-negative integers.
  - itemInfo(id): look id up in every species' tuft and keepsake; return { id, name, price, color, kind, species } or null.
  - createHuntStore(storage?): storage default globalThis.localStorage inside try/catch (may be undefined); load with
    parseHuntSave(storage.getItem(HUNT_KEY)); every change writes JSON.stringify(data) to HUNT_KEY then calls
    notifySaveChanged().
    - buyLicense(spend): false if already licensed; if spend(HUNT.licensePrice) is true set licensed and save.
    - bagCount: sum of counts. bagFull: bagCount() >= HUNT.bagSize. bagValue: sum count * price.
    - recordComb(species, keepsake, shotDist, now = new Date()): full bag -> { added: false, firstOfSpecies: false }.
      Else bag[tuft.id] += 1, and if keepsake and the bag still has room bag[keepsake.id] += 1. Journal entry for
      species.id: create { taken: 0, keepsakes: 0, first: now.toISOString().slice(0, 10), bestShot: 0 } if missing
      (that is firstOfSpecies), taken += 1, keepsakes += 1 when a keepsake was added, bestShot = max(bestShot,
      round(shotDist)). Save. Return { added: true, firstOfSpecies }.
    - sellAll: acorns = bagValue(), items = bagCount(); empty the bag; sold += items; earned += acorns; save; return.
    - speciesTaken: journal entries with taken > 0.
    - data(): the live object (read only by callers).
- games/gnome-theft-auto/src/hunting/huntSave.test.ts (new): use a Map-backed fake storage. Test parse of junk, license
  with a spend that fails and one that succeeds, recordComb fills the journal and returns firstOfSpecies once, the bag
  stops at HUNT.bagSize, sellAll totals the prices and empties the bag, save survives a reload (new store, same storage).

## Done when
- npm test -w games/gnome-theft-auto -- src/hunting/huntSave.test.ts passes.
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in your two files.

## Out of scope
Every other file (saveIO.ts and cloudSave.ts already list the key; do not edit them).
~~~~

## Issue 1E: the lodge in the world

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-hunting.md: read it there.)

## Goal
The Tuft & Tally Lodge stands in Mossy Wood at LODGE (species.ts) with Hazel Mattock at her counter, off every road.

## Read first
- games/gnome-theft-auto/src/hunting/lodge.ts: the stub (LodgeWorld; keep the signatures).
- games/gnome-theft-auto/src/hunting/species.ts: LODGE (x -548, z -52, yaw 0, scale 4, keeper, blip colour).
- games/gnome-theft-auto/src/gunStore.ts lines 1-110: how a prefab building, its collision boxes and a counter point are placed.
- games/gnome-theft-auto/src/gnomes.ts: makeGnome(scene, look), gnomeState(x, y, z, yaw, speed); and how
  games/gnome-theft-auto/src/ambientGnomes.ts calls model.update(...) each frame for an idle gnome.
- games/gnome-theft-auto/src/critters.ts: exported critterMesh(prefab, scale) (grey-box fallback when a prefab id is
  missing) and roadDistance(x, z) (distance to the nearest highway centre line).

## Change
- lodge.ts: createLodge(scene):
  - Cabin: critterMesh('log-cabin', LODGE.scale) at (LODGE.x, heightAt(LODGE.x, LODGE.z), LODGE.z) (heightAt from
    '../terrain'), rotation.y = LODGE.yaw; its front faces +z. Collision box: x +-4.7, z +-3.4 around LODGE, h 6.
  - Counter: critterMesh('counter', 1.4) 3.5 units in front of the cabin (z + 3.4 + 2), plus its own box (about 2.4 x 0.8, h 1.2).
    Hazel stands behind it (between the counter and the cabin, z + 4.6, facing +z). `counter` (the player's spot) is
    1.8 units in front of the counter. nearCounter: within 3 units of that spot.
  - Sign: critterMesh('tuft-lodge-sign', 1.5) at the cabin's front-left corner (x - 5.5, z + 3.8).
  - Two drying racks: critterMesh('tuft-drying-rack', 1.4) at the cabin's two sides (x +- 7, z + 1), each with a small box.
  - Hazel: makeGnome(scene, look) with a fixed look (hat 0x3f6b2e moss green, shirt 0x6b4a2e, pants 0x4b3a2a,
    skin 0xe0ac69, boots 0x222222, beard null, hair { color: 0xc0c0c0, style: 'pigtails' }, freckles true, dress false,
    glasses true, bowlCut null) at her spot; update(dt, px, pz) turns her toward the player within 12 units, else
    faces +z, and calls model.update with gnomeState(..., speed 0) like ambientGnomes.
  - Every placed thing's (x, z) must have roadDistance(x, z) > 10 and be in region 'mossy-wood' (regionAt from
    '../levels'). Export `LODGE_PROPS: readonly { id: string; x: number; z: number }[]` (computed at module load from
    LODGE: cabin, counter, hazel, sign, rack-l, rack-r) so a test can check them; build from that list.
  - blip: as the stub ({ kind: 'shop', label: 'Tuft & Tally Lodge' }).
- games/gnome-theft-auto/src/hunting/lodge.test.ts (new): every LODGE_PROPS entry has roadDistance > 10 and
  regionAt(x, z) === 'mossy-wood'. Import only lodge.ts, critters.ts and levels.ts (no scene needed).

## Done when
- npm test -w games/gnome-theft-auto -- src/hunting/lodge.test.ts passes.
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in your files.

## Out of scope
Every other file. The prefabs 'tuft-lodge-sign' and 'tuft-drying-rack' are being added by another worker right now; do
not add them; critterMesh shows a grey box until they exist.
~~~~

## Issue 1F: lodge sheet and hunt HUD

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-hunting.md: read it there.)

## Goal
The lodge sheet (license, bag, sell, journal) and the small hunt HUD, both DOM, phone-friendly.

## Read first
- games/gnome-theft-auto/src/hunting/lodgeUi.ts and huntHud.ts: the stubs (keep the signatures).
- games/gnome-theft-auto/src/hunting/huntSave.ts: HuntStore (data(), licensed, buyLicense, bagCount, bagValue, sellAll)
  and itemInfo(id) -> { name, price, color, kind, species }.
- games/gnome-theft-auto/src/hunting/species.ts: SPECIES (name, region, hint, blurb, tuft, keepsake, legendary), HUNT, LODGE.
- games/gnome-theft-auto/src/gunShop.ts: how an existing sheet is built, styled and closed (copy its approach).

## Change
- lodgeUi.ts createLodgeUi(ui, deps):
  - Append ONE container div to `ui` (never restyle or hide `ui`). Inject one <style id="gta-hunt-style"> once.
    Sheet: fixed, centred, width min(560px, calc(100vw - 32px)), max-height calc(100vh - 32px -
    env(safe-area-inset-top) - env(safe-area-inset-bottom)), overflow auto, pointer-events auto, z-index above the HUD,
    woody palette (dark brown panel, cream text, moss-green accent). Every button min 44 x 44 px.
  - Header: LODGE.name, keeper line "Hazel Mattock: <short line>", a close button (X). Escape closes (keydown listener,
    only while open). Tabs: Lodge | Journal.
  - Lodge tab: license row (if licensed "Tuft License: yours", else button "Buy Tuft License (120 Acorns)" disabled when
    !atLodge or acorns() < HUNT.licensePrice; on click deps.store.buyLicense(deps.spend) then deps.onLicensed(),
    re-render). Bag: one row per item in store.data().bag with prefabIconElement(kind === 'tuft' ? 'tuft-bundle' :
    'keepsake-bundle', kind === 'tuft' ? '🪶' : '✨', 32, info.color) from '@lawn/prefabs', name, xN, value. Empty bag:
    "Your game bag is empty." Footer "Sell all for N Acorns" (disabled when empty or !atLodge): const r =
    store.sellAll(); deps.earn(r.acorns, 'Tuft & Tally Lodge'); deps.onSold(r.items, r.acorns); re-render. When !atLodge
    show "Buy and sell at the lodge in Mossy Wood."
  - Journal tab: "N of 8 species" then a card per SPECIES: taken -> name, region name (region id with dashes as spaces,
    capitalised), blurb, "Combed xN, keepsakes xK, first YYYY-MM-DD, best shot N m"; not taken -> "???" name for a
    legendary, else the name greyed, plus the hint. Hazel's keeper lines: pick from 3 plain lines about combing, never
    about harming.
  - open(tab, atLodge) renders and shows; close hides; isOpen; refresh re-renders when open.
  - deps.play('shutter') on buy, nothing else needed (hunting.ts plays the sell sound).
- huntHud.ts createHuntHud(ui, onJournal): one container appended to `ui`, positioned left side, below the top-left
  quest panel (top: calc(env(safe-area-inset-top) + 210px); left: calc(env(safe-area-inset-left) + 12px)),
  pointer-events none except its button. Content: a pill "🎒 bag/bagSize" (or "No license" when !licensed and bag 0),
  a 44 x 44 px journal button "📓" (pointer-events auto, calls onJournal), and a hint line under it (hidden when null).
  update(s) shows/hides by s.visible and fills text only when it changed. setHidden(h) hides all while true.
- No test file required (DOM); tsc is the gate.

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in your two files.
- The sheet fits a 390 x 844 phone viewport (width rule above) and every control is at least 44 px.

## Out of scope
Every other file; hud.ts and app.ts are not yours.
~~~~

## Issue 1G: hunt sounds

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-hunting.md: read it there.)

## Goal
games/gnome-theft-auto/src/hunting/sounds.ts registers a procedural recipe for every HUNT_SOUND_IDS id.

## Read first
- games/gnome-theft-auto/src/hunting/sounds.ts: the stub (HUNT_SOUND_IDS, registerHuntSounds).
- games/gnome-theft-auto/src/sound/bus.ts: registerSound(id, recipe), hasSound(id).
- games/gnome-theft-auto/src/sound/ids.ts: Recipe = (c: AudioContext, out: AudioNode, t: number, info: SoundInfo) =>
  duration seconds; info.param 0.5 calm .. 1 alarmed, info.rand 0..1.
- games/gnome-theft-auto/src/sound/synth.ts and sound/recipes/critters.ts: burst, env, noise, tone, voiced and how the
  farm animals are made (copy the style: soft, cartoonish, garden-scale).

## Change
- sounds.ts: a private table of Recipes, one per id: hunt-hedgehog (snuffly short noise puffs), hunt-fox (two high
  yips), hunt-badger (low grumble), hunt-armadillo (dry scritch of digging), hunt-hare (two soft thumps), hunt-mallard
  (quack), hunt-mouse (tiny high squeak), hunt-pheasant (creaky two-note "korr-kok" + wing whirr), hunt-comb (a quick
  brushing swish), hunt-bounce (a small metallic ting), hunt-flush (a clatter of wingbeats, ~0.5 s), hunt-sell (a
  wooden till clunk and two coin clinks). Alarmed (param > 0.7) calls are louder/higher. Peaks at most 0.25.
  registerHuntSounds(): once-only guard; registerSound(id, recipe) for each, importing registerSound from
  '../sound/bus'. Must not touch AudioContext at import time.
- games/gnome-theft-auto/src/hunting/sounds.test.ts (new): after registerHuntSounds(), hasSound(id) is true for every
  HUNT_SOUND_IDS id, and a second call does not throw.

## Done when
- npm test -w games/gnome-theft-auto -- src/hunting/sounds.test.ts passes.
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in your files.

## Out of scope
Every other file, including everything under src/sound/.
~~~~

## Issues 1H and 1I: quarry prefabs

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-hunting.md: read it there.)

## Goal
1H: packages/prefabs/src/catalog/gta-hunt-quarry-a.ts holds hunt-hedgehog, hunt-fox, hunt-badger.
1I: packages/prefabs/src/catalog/gta-hunt-quarry-b.ts holds hunt-snow-hare, hunt-mallard, hunt-harvest-mouse, hunt-pheasant.

## Read first
- docs/roadmaps/prefab-library/_common.md: modelling, data and examine-voice rules (ignore its Environment section;
  use the one above).
- packages/prefabs/src/types.ts, packages/prefabs/src/palette.ts.
- packages/prefabs/src/catalog/gta-farm-critters.ts: the cow, sheep, pig and hen: copy their structure exactly,
  including `pivots` and part `group`s.

## Change (only your one file; it exists with an empty array, keep its export name)
Each animal: category 'prop', uses ['place'], tags include the animal noun, 'animal', 'critter', 'quarry', 'gta';
emoji []; 5 examine lines in the farm critters' voice (never killing, skinning or eating; tufts and shed quills are fine).
Pivots (absolute positions, like the farm critters): 'body', 'head', 'tail', and four-legged 'leg-0'..'leg-3' (leg k at
sx, sz = (-1,-1), (-1,1), (1,-1), (1,1), legs 1 and 3 front) or birds 'leg-0', 'leg-1', 'wing-0', 'wing-1'. Every
part belongs to one pivot group. Front faces +z. Lowest point at y = 0. 8 to 25 parts.
Sizes (1 = gnome height; total height x length):
- 1H hunt-hedgehog: 0.45 x 0.7. A dome of brown quills (cones pointing back and up on a squashed ball), pale face, black nose, tiny legs.
- 1H hunt-fox: 0.85 x 1.3. Orange body, white chest and tail tip, black socks, pointed ears, long bushy tail (tail pivot).
- 1H hunt-badger: 0.8 x 1.4. Stocky grey body, black legs, white head with two black stripes, short tail. (The game
  draws it at scale 1.25 as the legendary Old Grizzle; model it at scale 1.)
- 1I hunt-snow-hare: 0.7 x 0.8. White body, long upright ears with black tips (on the head pivot), big back legs.
- 1I hunt-mallard: 0.55 x 0.7. Bird: brown body, green head, yellow beak, white neck ring, orange legs, wing-0/1.
- 1I hunt-harvest-mouse: 0.35 x 0.6 incl. tail. Ginger-orange body, white belly, round ears, long thin tail.
- 1I hunt-pheasant: 0.65 x 1.1 incl. tail. Bird: copper body, dark green head, red face patch, long striped tail (tail pivot), wing-0/1.

## Done when
- npx tsc --noEmit -p packages/prefabs: no errors in your file.
- npm test -w packages/prefabs passes for every test naming your ids.

## Out of scope
Every other file, especially packages/prefabs/src/catalog/index.ts (already imports your file) and the other gta-hunt-* files.
~~~~

## Issue 1J: hunt items, lodge props, gear and achievements

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-hunting.md: read it there.)

## Goal
packages/prefabs/src/catalog/gta-hunt-gear.ts holds the hunt's items, lodge props and reward gear, and
packages/achievements/src/catalog.ts gains the five hunting achievements.

## Read first
- docs/roadmaps/prefab-library/_common.md (rules; ignore its Environment section), packages/prefabs/src/types.ts, palette.ts.
- packages/prefabs/src/catalog/gta-wild-gear.ts: gear prefabs worn on head and neck (note `wear` on the neck one).
- A hand reward with grip: search packages/prefabs/src/catalog/golf.ts for 'golden-putter'; a back item:
  packages/prefabs/src/catalog/cosmetics-back.ts 'rough-satchel'.
- packages/achievements/README.md and the 'gta-tipping-point' entry in packages/achievements/src/catalog.ts.

## Change
- gta-hunt-gear.ts (exists with an empty array GTA_HUNT_GEAR; keep the name). Prefabs:
  - 'tuft-bundle' (material; uses ['collect', 'craft']): a small tied bunch of fluff/feathers, ~0.15 tall, the fluff is
    'tint' (default tint 0x8a6a4a), string trim.
  - 'keepsake-bundle' (trinket; uses ['collect']): a single special quill/feather tied with a ribbon on a little card,
    ~0.18 tall, quill 'tint' (default 0xc8c8d0), one glow part.
  - 'tuft-lodge-sign' (prop; ['place']): a post with a hanging wooden board and a painted tuft, ~1.1 tall.
  - 'tuft-drying-rack' (prop; ['place']): a wooden A-frame rack with tufts hanging on strings, ~0.9 tall, 1.0 wide.
  - 'lodge-cap' (armor; ['wear-head']): a moss-green felt hunting cap with a short brim and a feather tuft in the band.
  - 'tuft-game-bag' (armor; ['wear-back']): a canvas game bag with a strap and a tuft poking out.
  - 'quill-collar' (trinket; ['wear-neck'], with `wear` like the cowbell): a collar of shed hedgehog quills on a cord.
  - 'grizzle-brush' (tool; ['hold'], grip set): a stubby wooden brush with silver-grey bristles, ~0.3 long.
  Examine lines in the _common.md voice; never about harming animals.
- packages/achievements/src/catalog.ts: append five entries after the other 'gta-' ones (another planner may be
  editing this file too: add yours as one contiguous block, change nothing else):
  - gta-first-tuft "First Tuft": "Comb a tuft from a knocked-over animal with a Tuft License." reward head lodge-cap "Lodge Cap".
  - gta-tuft-trader "Tuft Trader": "Sell 25 tufts and keepsakes at the Tuft & Tally Lodge." target 25, reward back tuft-game-bag "Tuft Game Bag".
  - gta-field-guide "Field Guide": "Comb every species in the hunting journal." reward neck quill-collar "Quill Collar", exclusive true.
  - gta-old-grizzle "Old Grizzle": "Comb a silver bristle from Old Grizzle, the badger of the western tree-line." reward hand grizzle-brush "Grizzle Brush", exclusive true.
  - gta-patient-eye "Patient Eye": "Knock an animal over from 60 metres or more." (no reward)
  All with game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto'.

## Done when
- npm test -w packages/prefabs passes for your ids; npm test -w packages/achievements passes.

## Out of scope
Every other file (catalog/index.ts already imports your file).
~~~~

## Issue 1K: lore entries

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-hunting.md: read it there.)

## Goal
Lore entries for the tuft hunt, per ruling R-141 in docs/lore/rulings.md.

## Read first
- docs/lore/README.md (entry format), docs/lore/rulings.md: R-021, R-049, R-141.
- docs/lore/entries/apocrypha/mossy-wood.md and drey-gang.md: copy the front matter fields and section style.
- games/gnome-theft-auto/src/hunting/species.ts: the species names, hints and blurbs.

## Change
- New docs/lore/entries/apocrypha/tuft-and-tally-lodge.md (kind place): the lodge by the west road in Mossy Wood,
  the Tuft License, what tufts are bought for (hat plumes, cushion stuffing, brush bristles), the eight quarry by
  region, the journal. related: [mossy-wood, hazel-mattock, old-grizzle].
- New docs/lore/entries/apocrypha/hazel-mattock.md (kind person): the lodge-keeper, dry and plain, moss-green cap,
  glasses, grey pigtails; one or two "What gnomes say" lines; she never says kill.
- New docs/lore/entries/apocrypha/old-grizzle.md (kind creature or the kind the README allows for an animal): the old grey
  badger of the far western tree-line, out after dark; the birds-go-quiet question stays in "Loose threads".
- All: tier apocrypha, setting apocrypha, games [gnome-theft-auto], status draft, sources include
  docs/roadmaps/gta-hunting.md and docs/lore/rulings.md#r-141.

## Done when
- npm run lore passes (run it from the repo root).

## Out of scope
Every file outside docs/lore/entries/apocrypha/ (rulings.md already has R-141; do not edit it).
~~~~
