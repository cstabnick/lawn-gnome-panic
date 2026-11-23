# Gnome Theft Auto: fishing

Goal: "also add fishing". Canon (R-021, R-049, new ruling R-146): fish are never hurt. A Turfton rod ends in a
**nibble-clip** (a bent pin with no point): the fish bites and holds on, the gnome lands it, measures it, writes a
**catch card** and lets it go. Wenna Gudgeon at **The Bent Pin** (bait & tackle on the canal's south bank by Old Brick
wharf, x -110, z 252) sells rods and bait and buys catch cards; she also runs the **Bent Pin Derby** (3 minutes, land
150 cm of fish).

Loop: buy a rod (Twig 20 Acorns .. Moonline 1200) -> by any water on foot, or in a stopped boat, rod out (X / pad B /
the fishing button) -> hold to charge, release to cast where the camera looks (only onto water) -> the bobber floats;
nibbles, then a bite (bobber dips, sound, phone vibrate / pad rumble) -> press to hook -> hold to reel, let go when the
tension bar runs high (snap = the clip pops off), keep some tension or it slips -> landed: measured, carded, journal
filled (silhouettes until caught, sizes, records), let go -> sell cards at The Bent Pin. Bait changes who bites and how
fast; rods cast further, hold harder and unlock the big fish. Hot spots (subtle bubbles) bite faster and rarer; three
mythic fish live at one spot each.

Decisions:
- Own module `src/fishing/` (fishing.ts is the system; data in types.ts, species.ts, tackle.ts). 24 species (21 + 3
  mythic) across Loch Moss, the rivers, the canal and the Puddle Sea, weighted by water, region, time of day, "weather"
  (derived: Frostbite snow, loch dawn mist; Turfton has no weather system), bait, rod tier and hot spot.
- Controls: keyboard X toggles, Z next bait, hold the game's fire (mouse / F) or Space to cast/hook/reel, Esc stops.
  Gamepad B toggles, A or RT holds, LB next bait. Touch: the fishing button, a big hold button, a bait chip, a stop
  button (all 44 px+). Haptics: navigator.vibrate and the pad's rumble. Camera still turns to aim.
- Pose: the animation library's `fish-cast`, `fish-reel`, `fish-catch` rows by id (animById + applyPose; anim/ is
  call-only); the selected rod prefab held in the right hand, gun put away like for an emote.
- Performance: nothing heavy while not fishing (a 4 Hz water probe, the keeper turning within 40 units, hot-spot
  markers only near a spot at 10 Hz). One bobber, one line (fixed 12-point buffer), one ripple, at most ONE fish mesh
  (the landed one, prefab built once per species and cached), shared materials, no per-frame allocation.
- Save: `gta-fishing-v1` in GTA_SAVE_KEYS, cloud merge newer-wins (one current state, like hunting).
- Online: not relayed. Like the other wildlife (hunting, birding), fishing is local to each browser; relaying bobbers
  and fish would need a host-run fish sim for a solo hobby. Other players see your gnome, not your line.
- Party slice: later (a 4-player "biggest fish in 60 s" round could fit once the reel feel is proven).
- Debug trainer: `registerTrainerSpawnable('Fish', id, ...)` per species (bites now while the bobber waits, else lands
  it into the journal) and a 'Fishing' tab (every rod and bait, land every species), registered in fishing.ts. Also
  `__gta.fishing` under ?debug: `biteNow(id)`, `catchById(id, size)`, `grantAll()`, `species`, `stats()`.

Foundation (planner, done): types.ts, species.ts, tackle.ts, waterKind.ts, fishing.ts (the system), stubs for every
other module, five empty prefab catalog files registered in packages/prefabs/src/catalog/index.ts, ruling R-146.
Hot-file edits (all additive): app.ts (create, boxes, input hold, gun/emote hand-off, pose, prompt/interact, update,
facing, blips, isOpen in the blocked lists, __gta.fishing), keys.ts (`fish: 'KeyX'`, `fishBait: 'KeyZ'`), saveIO.ts,
cloudSave.ts, saveIO.test.ts fixture, packages/prefabs catalog index, docs/lore/rulings.md (R-146).

Trainer registration snippet (from docs/roadmaps/gta-save-trainer.md "Extension points", applied in fishing.ts):

```ts
import { registerTrainerSection, registerTrainerSpawnable } from '../trainer/registry';
for (const fish of FISH_SPECIES) {
  registerTrainerSpawnable('Fish', fish.id, fish.name, () =>
    api.biteNow(fish.id) ? `${fish.name} bites` : (api.catchById(fish.id), markTrainerModified('fishing'), `${fish.name} landed`));
}
registerTrainerSection({ id: 'fishing', label: 'Fishing', order: 46, build(el) { /* every rod and bait; land every species */ } });
```

| Epic | Done when | Issues |
| --- | --- | --- |
| 1 Fill the fishing | `npx tsc --noEmit -p games/gnome-theft-auto` clean, `npm test -w games/gnome-theft-auto`, prefab and achievement tests, `npm run lore` pass | 16 (1A-1P), all parallel |

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
Lore rule: fish are never hurt. A rod ends in a "nibble-clip" (a bent pin with no point); a landed fish is measured,
carded and let go. Never write "kill", "gut", "fillet", "cook", "eat", "hook through", "blood" in code text or UI. Bait is
dough, cheese rind, acorn crumb, sock-fluff flies and lures (no worms, no live bait).
Data and tuning live in games/gnome-theft-auto/src/fishing/types.ts (types, FISH tuning, FIGHT, SHOP,
FISH_ACHIEVEMENTS, FISH_SOUND_IDS), species.ts (FISH_SPECIES, FISH_SPOTS, fishById, catchValue) and tackle.ts (RODS,
BAITS, rodById, baitById). Read them; do not edit them.
Performance matters (the game has frame-rate problems): no allocation in per-frame code (reuse vectors/objects), share
geometries and materials, do nothing per frame when there is nothing to do.
Keep every exported name and signature of your stub file exactly as it is (fishing.ts already imports them).
~~~~

## Issue 1A: line simulation

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-fishing.md: read it there.)

## Goal
games/gnome-theft-auto/src/fishing/sim.ts implements the pure fishing line simulation behind its stub, with tests.

## Read first
- games/gnome-theft-auto/src/fishing/sim.ts: the stub (createFishingState, stepFishing, resetFishing, forceBite).
- games/gnome-theft-auto/src/fishing/types.ts: FishingState (every field is commented), SimInput, SimEnv, FishEvent,
  FISH, FIGHT, RodDef.

## Change
- sim.ts: no THREE, no DOM, imports only from ./types (and ./species in the test). No allocation in stepFishing.
  Helper rand(a, b) = a + env.rnd() * (b - a). On every phase change set s.t = 0; stepFishing first does s.t += dt.
  - idle: dip = 0. If inp.pressed: phase 'charge', charge = 0. Return null.
  - charge: charge = min(1, charge + dt / FISH.chargeTime). When inp.released or !inp.hold: cast:
    d = FISH.minCast + charge * (env.rod.castRange - FISH.minCast); yaw = env.origin.yaw. Try d, d - 0.5, d - 1, ...
    down to 1.5: tx = origin.x + sin(yaw) * d, tz = origin.z + cos(yaw) * d, w = env.water(tx, tz); first non-null wins.
    None: phase 'idle', return 'dry'. Found: from = origin (x, y, z), to = (tx, tz), surface = w, bob = from,
    phase 'flight', return 'cast'.
  - flight: k = min(1, t / FISH.flightTime). bobX/Z lerp from -> to; bobY = lerp(fromY, surface, k) + FISH.arc * 4 * k *
    (1 - k). At k >= 1: bob = (toX, surface, toZ), phase 'wait', biteIn = env.biteDelay(), nibbleT = 0, dip = 0; return 'plop'.
  - wait: dip = max(0, dip - dt * 3). If inp.pressed: phase 'idle', return 'early'. biteIn -= dt. While
    0 < biteIn < FISH.nibbleLead: nibbleT -= dt; when nibbleT <= 0: nibbleT = rand(0.4, 0.7), dip = 0.35, return 'nibble'.
    When biteIn <= 0: r = env.pick(); null -> biteIn = env.biteDelay(), return null. Else fish = r.fish, size = r.size,
    phase 'bite', window = FISH.biteWindow * (1.15 - 0.1 * fish.difficulty), dip = 1; return 'bite'.
  - bite: dip = 1; window -= dt. If inp.pressed: phase 'reel'; line = startLine = max(FISH.landDist + 0.5,
    hypot(bobX - origin.x, bobZ - origin.z)); tension = FISH.hookTension; pull = FISH.restPull; stamina = 1; slackT = 0;
    burstT = 0; pullT = rand(...FIGHT[fish.fight].every); return 'hooked'. If window <= 0: phase 'wait', fish = null,
    size = 0, dip = 0, biteIn = env.biteDelay(); return 'missed'.
  - reel (fish is set): f = FIGHT[fish.fight]; sizeFrac = clamp01((size - fish.size[0]) / (fish.size[1] - fish.size[0]));
    power = min(1, f.strength * (0.7 + 0.15 * fish.difficulty) * (0.8 + 0.4 * sizeFrac)). let ev = null.
    Bursts: if burstT > 0: burstT -= dt, pull = power * max(0.3, stamina); when burstT <= 0: burstT = 0, pullT =
    rand(...f.every). Else: pullT -= dt, pull += (FISH.restPull - pull) * min(1, dt * 4); when pullT <= 0: burstT =
    rand(...f.burst), ev = 'burst'.
    If inp.hold: tension += dt * FISH.tensionRise * (0.4 + pull * 1.6) / env.rod.strength; line -= dt *
    env.rod.reelSpeed * (1 - pull * 0.7); stamina -= dt * FISH.tire * (0.5 + pull) / f.stamina.
    Else: tension -= dt * FISH.tensionFall; line += dt * pull * FISH.runSpeed * f.run; stamina -= dt * FISH.tire * 0.3 / f.stamina.
    stamina = clamp01. If tension >= 1: tension = 1, phase 'lost', fish = null, return 'snapped'. tension = max(0, tension).
    slackT: tension < FISH.slackBelow ? slackT + dt : 0; slackT >= FISH.slackLimit -> phase 'lost', fish = null, return 'slipped'.
    line > env.rod.castRange * FISH.maxLineMul -> phase 'lost', fish = null, return 'slipped'.
    line <= FISH.landDist -> phase 'landed' (keep fish and size), return 'landed'.
    Bobber: dx = bobX - origin.x, dz = bobZ - origin.z, d = hypot || 1; bobX = origin.x + dx / d * line, bobZ likewise,
    bobY = surface; wobble = sin(s.t * 9) * 0.4 * pull. Return ev.
  - landed, lost: nothing (t keeps counting). Return null.
  - resetFishing(s): phase 'idle', t 0, charge 0, fish null, size 0, dip 0, tension 0, pull 0, line 0, startLine 0,
    burstT 0, slackT 0, wobble 0.
  - forceBite(s, fish, size): only in 'wait' (else false): fish, size, phase 'bite', t 0, window = 2 * FISH.biteWindow,
    dip 1; true.
- games/gnome-theft-auto/src/fishing/sim.test.ts (new, vitest): env = { rod: RODS[0] from ./tackle, bait: BAITS[0],
  origin: { x: 0, y: 1.4, z: 0, yaw: 0 }, water: () => 0, biteDelay: () => 2, pick: () => ({ fish, size }), rnd: a
  seeded LCG }. Use fishById('fish-gudgeon') (easy) and fishById('fish-old-mossjaw') (hard) from ./species. Step at
  dt = 1/60 with an input object you mutate. Tests:
  1. press, hold 0.6 s, release: 'cast' then 'plop' within 1 s; the bobber is about minCast + charge*(range-minCast) away along +z.
  2. water: () => null: release gives 'dry' and phase 'idle'.
  3. waiting: 'nibble' events come before 'bite'; pressing during wait gives 'early'.
  4. no press after a bite: 'missed' and phase 'wait'.
  5. gudgeon hooked, a "player" that holds while tension < 0.7 and lets go above it: 'landed' within 40 s simulated.
  6. gudgeon hooked, never holding: 'slipped'. Old Mossjaw hooked with rod RODS[0], always holding: 'snapped'.
  7. forceBite only in wait.

## Done when
- npm test -w games/gnome-theft-auto -- src/fishing/sim.test.ts passes.
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in src/fishing/sim.ts or sim.test.ts.

## Out of scope
Every other file. Do not edit types.ts, species.ts, tackle.ts or fishing.ts.
~~~~

## Issue 1B: who bites

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-fishing.md: read it there.)

## Goal
games/gnome-theft-auto/src/fishing/pick.ts picks the biting species, its size and the wait, with tests that also check
the species table and hot spots.

## Read first
- games/gnome-theft-auto/src/fishing/pick.ts: the stub (PickCtx, weatherAt, fishWeight, pickFish, rollSize, biteDelay, spotAt).
- games/gnome-theft-auto/src/fishing/types.ts: FishSpecies, BaitDef, FishSpot, RARITY_WEIGHT, FISH.
- games/gnome-theft-auto/src/fishing/species.ts and tackle.ts: the tables.
- games/gnome-theft-auto/src/fishing/waterKind.ts: fishWaterAt(x, z) (for the hot-spot test).

## Change
- pick.ts (pure; no allocation in fishWeight/pickFish):
  - weatherAt: 'frostbite-fells' -> 'snow'; 'loch-moss' at 'Dawn' or 'Morning' -> 'mist'; else 'clear'.
  - fishWeight(s, c): 0 when c.water is not in s.waters; when s.regions is set and does not include c.region; when
    c.rodTier < s.minRod; when s.spot is set and c.spot?.id !== s.spot. Else w = RARITY_WEIGHT[s.rarity] *
    (s.times?.[c.time] ?? 1) * (s.weather?.[c.weather] ?? 1) * (s.baits?.[c.bait.id] ?? 1); for rarity 'rare' or
    'mythic' also * c.bait.rareBonus and, when c.spot is not null, * FISH.hotspotRare.
  - pickFish(c, rnd, list): sum the weights, r = rnd() * sum, walk the list again; null when sum <= 0.
  - rollSize(s, rnd): Math.round(s.size[0] + (s.size[1] - s.size[0]) * Math.pow(rnd(), 1.6)).
  - biteDelay(bait, hotspot, rnd): (FISH.biteMin + rnd() * (FISH.biteMax - FISH.biteMin)) * bait.biteSpeed *
    (hotspot ? FISH.hotspotBite : 1).
  - spotAt(x, z): the first FISH_SPOTS entry within FISH.spotRadius (hypot), else null.
- games/gnome-theft-auto/src/fishing/pick.test.ts (new):
  - species ids unique, at least 20 non-mythic and 3 mythic; every prefab starts with 'fish-'; size[0] < size[1];
    every key of s.baits is a BAITS id; every s.spot is a FISH_SPOTS id; every minRod is a RODS tier.
  - every species can bite somewhere: for each s, a ctx with water s.waters[0], region (s.regions?.[0] ?? a region that
    has that water: loch 'loch-moss', river 'mossy-wood', canal 'cloverfield-farms', sea 'cloverfield-farms'), time
    'Neon Night' and 'Noon' (either > 0), weather 'clear', bait moon-jig, rodTier 3, spot = spotById(s.spot) or null:
    fishWeight > 0.
  - mythic weight is 0 without its spot and with rodTier < minRod.
  - pickFish with a seeded rnd over 2000 picks in canal at Noon with dough: commons outnumber rares.
  - rollSize stays inside the range; biteDelay with hotspot is shorter than without for the same rnd sequence.
  - every FISH_SPOTS spot: fishWaterAt(spot.x, spot.z) === spot.water (this builds the terrain: first call can take
    several seconds; vitest's timeout is already 30 s).

## Done when
- npm test -w games/gnome-theft-auto -- src/fishing/pick.test.ts passes.
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in your two files.

## Out of scope
Every other file. If a species-table check fails, report it (do not edit species.ts).
~~~~

## Issue 1C: fishing save

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-fishing.md: read it there.)

## Goal
games/gnome-theft-auto/src/fishing/fishSave.ts stores rods, bait, the journal, catch cards and totals in localStorage
key 'gta-fishing-v1', with tests.

## Read first
- games/gnome-theft-auto/src/fishing/fishSave.ts: the stub (every type and the FishStore interface are documented).
- games/gnome-theft-auto/src/hunting/huntSave.ts: the pattern to copy (parse tolerant of junk, write + notifySaveChanged).
- games/gnome-theft-auto/src/fishing/tackle.ts (RODS, BAITS, rodById, baitById, DEFAULT_BAIT) and species.ts (fishById,
  catchValue), types.ts (FISH.cardCap).

## Change
- fishSave.ts:
  - parseFishSave(raw): JSON.parse in try; anything not an object -> emptyFishSave(). Keep only known rod ids, rod must
    be owned (else first owned or ''), baits: known non-dough ids with finite integer counts >= 0, bait: a known id
    (else 'dough'), journal: known species ids with numeric caught/best and string first, cards: known ids with numeric
    size (at most FISH.cardCap), numeric totals (else 0).
  - createFishStore(storage = localStorage when it exists, else an in-memory Map store): load with parseFishSave;
    save() = storage.setItem(FISH_SAVE_KEY, JSON.stringify(d)) in try, then notifySaveChanged() from '../saveHook'.
    Every method as documented in the FishStore interface. Notes:
    - baitCount('dough') = Infinity; a lure (consumed false, e.g. glitter-spinner) counts 1 once bought and buyBait
      returns false when already owned; consumed baits add bait.pack per purchase.
    - bait(): the selected bait if count > 0, else dough (and select dough).
    - cycleBait(): next in BAITS order with count > 0 (dough always counts), wrapping; save.
    - useBait(): only consumed baits decrease; at 0 select 'dough'.
    - recordCatch: date default new Date().toISOString().slice(0, 10). first = no entry before; record = size > old best
      (true on first too); card = cards.length < FISH.cardCap (then push { id, size }); caught + 1. Save.
    - sellCards(): acorns = sum of catchValue(fishById(id), size); count = cards.length; cards = []; sold += count,
      earned += acorns; save; return { count, acorns }.
    - grantAll(): rods = every RODS id (keep the selected one, else select 'twig'), every consumed bait +20, every lure 1.
- games/gnome-theft-auto/src/fishing/fishSave.test.ts (new, with an in-memory storage object): empty start (no rod,
  dough selected, Infinity dough); buyRod with a failing and a succeeding spend; buying the same rod twice fails;
  buyBait cheese-rind adds 10, useBait decrements and falls back to dough at 0; glitter-spinner is never used up;
  cycleBait wraps; recordCatch first/record flags and the card cap; sellCards totals match catchValue and empty the
  cards; a store re-created from the same storage reads everything back; parseFishSave survives 'nonsense', '[]',
  unknown ids.

## Done when
- npm test -w games/gnome-theft-auto -- src/fishing/fishSave.test.ts passes, and src/saveIO.test.ts still passes.
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in your two files.

## Out of scope
Every other file (saveIO.ts and cloudSave.ts already list the key).
~~~~

## Issue 1D: The Bent Pin in the world

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-fishing.md: read it there.)

## Goal
games/gnome-theft-auto/src/fishing/shop.ts places The Bent Pin bait & tackle shack on the canal's south bank: shack,
sign, rod rack, bait cooler, counter and Wenna Gudgeon, with collision boxes and a placement test.

## Read first
- games/gnome-theft-auto/src/fishing/shop.ts: the stub (ShopWorld, PlacedProp, SHOP_PROPS, createShop).
- games/gnome-theft-auto/src/hunting/lodge.ts and lodge.test.ts: copy this pattern closely (critterMesh, makeGnome,
  gnomeState, boxAt, LODGE_PROPS, the turning keeper).
- games/gnome-theft-auto/src/fishing/types.ts: SHOP (x -110, z 252, yaw PI: the shack's front faces -z, toward the canal).

## Change
- shop.ts: SHOP_PROPS (world x, z; the front is -z, so "in front" means smaller z):
  shack at (SHOP.x, SHOP.z); counter at (SHOP.x, SHOP.z - 4.2); wenna at (SHOP.x, SHOP.z - 3.3) (behind the counter);
  sign at (SHOP.x + 4.5, SHOP.z - 4); rack at (SHOP.x - 4.2, SHOP.z - 2.5); cooler at (SHOP.x + 3.2, SHOP.z - 2).
  The player's spot (counter) = (SHOP.x, SHOP.z - 6).
  createShop(scene): critterMesh('bent-pin-shack', 1) at the shack with rotation.y = SHOP.yaw; critterMesh('counter',
  1.4) at the counter rotated SHOP.yaw; critterMesh('bent-pin-sign', 1.3); critterMesh('fish-rod-rack', 1.2);
  critterMesh('bait-cooler', 1.1) (critterMesh(prefab, scale) from '../critters' falls back to a grey box while those
  prefabs are being made by another worker). Each at heightAt(x, z) from '../terrain'. Wenna: makeGnome(scene, WENNA_LOOK)
  with a look like Hazel's (hat 0x2f6f8f, shirt 0xe8d36a (oilskin yellow), pants 0x3b4a5a, skin 0xd9a066, boots
  0x222222, beard null, hair { color: 0x8a5a2b, style: 'pigtails' }, freckles false, dress false, glasses false, bowlCut null).
  Boxes: shack boxAt(SHOP.x, SHOP.z, 3.2, 2.6, 3.5, y0); counter 1.2 x 0.4 half sizes, 1.2 tall; rack, cooler 0.4 x 0.4.
  update(dt, px, pz): return at once when hypot(px - wenna.x, pz - wenna.z) > 40 (no work far away); else turn toward
  the player within 12 units like Hazel (resting yaw SHOP.yaw) and call the model update.
  blip: { x: SHOP.x, z: SHOP.z, color: SHOP.blip, kind: 'shop', label: SHOP.name }.
- games/gnome-theft-auto/src/fishing/shop.test.ts (new): SHOP_PROPS ids are exactly ['shack', 'counter', 'wenna',
  'sign', 'rack', 'cooler']; each is off every road (roadDistance from '../critters' > 10), on dry land (waterAt from
  '../terrain' is null) and in 'cloverfield-farms' (regionAt from '../levels').

## Done when
- npm test -w games/gnome-theft-auto -- src/fishing/shop.test.ts passes.
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in your two files.

## Out of scope
Every other file. The prefabs are made by another worker right now: do not create them.
~~~~

## Issue 1E: The Bent Pin sheet and the fishing journal

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-fishing.md: read it there.)

## Goal
games/gnome-theft-auto/src/fishing/shopUi.ts: the DOM sheet with a Shop tab (rods, bait, sell catch cards, the derby)
and a Journal tab (every species; a silhouette until landed). Phone-friendly.

## Read first
- games/gnome-theft-auto/src/fishing/shopUi.ts: the stub (ShopUiDeps, ShopUi, createShopUi).
- games/gnome-theft-auto/src/fishing/fishSave.ts: FishStore and FishSaveData (journal, cards, rods, baits). Another
  worker is implementing it right now: call only the interface.
- games/gnome-theft-auto/src/fishing/tackle.ts (RODS, BAITS), species.ts (FISH_SPECIES, catchValue), types.ts (SHOP, FISH).
- games/gnome-theft-auto/src/hunting/lodgeUi.ts: copy its structure and styling approach (one container, one style tag,
  tabs, Escape to close, 44 px buttons).

## Change
- shopUi.ts createShopUi(ui, deps):
  - Append ONE container div to `ui` (never restyle or hide `ui`). Inject one <style id="gta-fish-style"> once. Sheet:
    fixed, centred, width min(560px, calc(100vw - 32px)), max-height calc(100vh - 32px - env(safe-area-inset-top) -
    env(safe-area-inset-bottom)), overflow auto, pointer-events auto, z-index like the lodge sheet; canal palette
    (deep teal panel 0x173a40-ish, cream text, oilskin-yellow accent). Every button min 44 x 44 px.
  - Header: SHOP.name, "Wenna Gudgeon: <line>" (pick from 3 lines about clips, cards and letting fish go), close
    button, Escape closes (keydown listener only while open). Tabs: Shop | Journal.
  - Shop tab (when atCounter false: every buy/sell/derby button disabled and a note "Buy and sell at The Bent Pin, on
    the canal by Old Brick wharf."):
    - Rods: a row per RODS entry: prefabIconElement(rod.prefab, '🎣', 32) from '@lawn/prefabs', name, blurb, cast range,
      then "Owned" + "Use" button (store.selectRod) / "Using" / "Buy (price)" (store.buyRod(id, (n) =>
      deps.spend(n, rod.name)), then deps.onBought(rod.name)); disabled when acorns() < price.
    - Bait: a row per BAITS entry except dough (dough row says "Free with every rod"): icon prefabIconElement(b.prefab,
      b.emoji, 32), name, blurb, "You have N" (lures: "Owned"), "Buy N for P" (store.buyBait(id, (n) =>
      deps.spend(n, b.name)), deps.onBought(b.name)), and "Use" (store.selectBait).
    - Catch cards: "N cards (cap FISH.cardCap), worth A Acorns" (sum of catchValue) and "Sell all" -> const r =
      store.sellCards(); deps.earn(r.acorns, SHOP.name); deps.onSold(r.count, r.acorns). Disabled when no cards.
    - Derby: deps.derbyText() when running; else "The Bent Pin Derby: land FISH.derbyTarget cm of fish in 3 minutes.
      Entry FISH.derbyFee, prize FISH.derbyPrize." and an "Enter" button -> deps.startDerby(); then close the sheet.
      Show "Best: store.data().derbyBest cm" when > 0.
    - deps.play('shutter') on a purchase. Re-render after every action.
  - Journal tab: "N of 24 species" (store.speciesCaught() of FISH_SPECIES.length), "Landed: data.caught". A grid of
    cards (2 columns on a phone, 3 above 520 px) per FISH_SPECIES: icon prefabIconElement(s.prefab, '🐟', 40).
    Caught: name, rarity, waters joined, blurb, "Landed xN · best B cm · first YYYY-MM-DD". Not caught: the icon with
    CSS filter: brightness(0) opacity(0.45) (a silhouette), name "???", rarity and waters only (mythic: waters "???").
  - open(tab, atCounter) renders and shows; close hides; isOpen; refresh re-renders when open.
- No test file required (DOM); tsc is the gate.

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in shopUi.ts.
- The sheet fits a 390 x 844 phone viewport (width rule above) and every control is at least 44 px.

## Out of scope
Every other file; hud.ts and app.ts are not yours.
~~~~

## Issue 1F: fishing input and HUD

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-fishing.md: read it there.)

## Goal
games/gnome-theft-auto/src/fishing/fishInput.ts (keyboard, gamepad, touch intents, haptics) and fishHud.ts (the fishing
button, hold button, bars, bait chip, stop, hint). Every action works by mouse+keyboard, touch and gamepad.

## Read first
- games/gnome-theft-auto/src/fishing/fishInput.ts and fishHud.ts: the stubs (keep every exported name and signature).
- games/gnome-theft-auto/src/keys.ts: KEYS.fish ('KeyX'), KEYS.fishBait ('KeyZ'), KEYS.jump ('Space'), KEYS.close
  ('Escape'). keys.test.ts fails if a module compares e.code to a literal not in this table: always compare with
  `e.code === KEYS.fish` etc. (never a string literal).
- games/gnome-theft-auto/src/birding/scope.ts lines 1-60 and its update(): how it reads the gamepad (navigator.getGamepads,
  edge detection, PAD indices) and listens for keys without allocating.
- games/gnome-theft-auto/src/hunting/huntHud.ts: a small HUD module appended to `ui`.
- games/gnome-theft-auto/src/fishing/types.ts: FishPhase.

## Change
- fishInput.ts createFishInput():
  - window keydown/keyup listeners (added once; removed in dispose). Ignore events whose target is an input, textarea or
    select. KEYS.fish down (not repeat) -> toggle edge. KEYS.fishBait -> bait edge. KEYS.close -> close edge.
    KEYS.jump held -> kbHold (only counts while `active` in read; call e.preventDefault() for Space only while active).
  - Gamepad (polled in read, first connected pad, standard mapping): B (1) edge -> toggle; LB (4) edge -> bait; A (0)
    held or RT (7) value > 0.3 -> hold (only while active). Keep the previous button states in plain booleans.
  - HUD: setHudHold(down) sets hudHold; hudToggle/hudBait/hudClose set the edges.
  - read(active): fills the one reused FishIntent: toggle/bait/close = the edges (then cleared), hold = active &&
    (kbHold || padHold || hudHold). When !active also clear kbHold and hudHold.
  - buzz(kind): ms = { bite: [60, 40, 60], burst: 30, land: [40, 30, 90], snap: 120 }[kind]; try navigator.vibrate?.(ms);
    and the first pad's vibrationActuator?.playEffect?.('dual-rumble', { duration: sum of ms, strongMagnitude: kind ===
    'snap' ? 0.9 : 0.5, weakMagnitude: 0.6 }) in try/catch (it returns a promise: add .catch(() => {})).
- fishHud.ts createFishHud(ui, input, onJournal): ONE container appended to `ui` (never restyle `ui`), pointer-events
  none except the buttons, z-index 40, system-ui font, every button >= 44 x 44 px with touch-action: manipulation.
  - Idle toggle (shown when s.canFish && !s.fishing): a 56 px round button "🎣" with a small "X" key label, fixed at
    right: calc(env(safe-area-inset-right) + 12px); top: 45%. pointerdown -> input.hudToggle(). A 44 px "📓" journal
    button under it calls onJournal (shown whenever the toggle or the fishing UI is shown).
  - While s.fishing:
    - The hold button: 96 px round, fixed right: calc(env(safe-area-inset-right) + 24px); bottom:
      calc(env(safe-area-inset-bottom) + 140px), z-index 45 (above the game's touch buttons), text = s.label; it pulses
      (CSS animation) when s.phase === 'bite'. pointerdown -> input.setHudHold(true) + setPointerCapture;
      pointerup/pointercancel/lostpointercapture -> setHudHold(false). preventDefault on pointerdown.
    - A stop button "✕" (44 px) above the hold button -> input.hudClose(); a bait chip (44 px tall pill:
      prefabIconElement(s.baitPrefab, s.baitEmoji, 24) from '@lawn/prefabs' + name + "xN" when baitCount not null) ->
      input.hudBait(). Rebuild the chip's icon only when baitPrefab changes.
    - Bars, centred at bottom: calc(env(safe-area-inset-bottom) + 96px), width min(320px, 70vw): during 'charge' a
      charge bar (s.charge); during 'reel' a tension bar (green < 0.6, amber < 0.85, red above; a marker shows the
      safe band) and a thinner progress bar (s.progress) under it.
    - Key help line under the bars, small: "Hold Space / click / A to cast & reel · Z / LB bait · X / B put away".
  - A hint line (s.hint) and the derby line (s.derby) centred near the top: top: calc(env(safe-area-inset-top) + 64px).
  - update(s): write the DOM only when a value changed (cache last values; widths via style.transform scaleX on the
    bar fill to avoid layout). setHidden(h) hides the container. dispose removes it.
- No test file required (DOM); tsc and the keys test are the gate.

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in your two files.
- npm test -w games/gnome-theft-auto -- src/keys.test.ts passes.
- At a 390 x 844 viewport the hold button, stop, bait chip and bars do not overlap each other (check the numbers).

## Out of scope
Every other file, including keys.ts, input.ts, gamepad.ts and app.ts.
~~~~

## Issue 1G: bobber, line, ripple and the landed fish

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-fishing.md: read it there.)

## Goal
games/gnome-theft-auto/src/fishing/fishView.ts draws the bobber, the line, the ripple under the bobber, splash rings and
the one landed fish, cheaply.

## Read first
- games/gnome-theft-auto/src/fishing/fishView.ts: the stub (FishView, createFishView).
- games/gnome-theft-auto/src/fishing/types.ts: FishingState (phase, bobX/Y/Z, dip, wobble, surface, tension).
- games/gnome-theft-auto/src/critters.ts: exported critterMesh(prefab, scale) (grey-box fallback for a missing prefab id).
- packages/depth/src/layers.ts: flatLayer(material, LAYER.decal) from '@lawn/depth' for anything flat on the water.

## Change
- fishView.ts createFishView(scene): everything built once up front, hidden (visible = false) until used.
  - Bobber: critterMesh('fish-bobber', 1) (the prefab is ~0.12 tall, made by another worker now). Position
    (bobX, bobY - 0.06 * dip - (phase 'bite' ? 0.08 : 0) + 0.02 * sin(time * 3) when phase is 'wait', bobZ + wobble
    sideways); visible while show and phase is not 'idle' or 'charge'.
  - Line: THREE.Line with a BufferGeometry of 12 points (Float32Array, setDrawRange unchanged), LineBasicMaterial({
    color: 0xf2f2e8, transparent: true, opacity: 0.8 }), frustumCulled = false. Points from the tip (tipX, tipY, tipZ) to
    the bobber with a sag: y -= sag * 4 * k * (1 - k), sag = 0.6 * (1 - tension) while 'wait'/'bite'/'reel'
    (taut when tension is high), 0.1 during 'flight'. Mark position.needsUpdate. Visible while show and phase is
    'flight', 'wait', 'bite', 'reel' or 'landed'.
  - Ripple: one flat ring (RingGeometry(0.18, 0.24, 24) rotated flat, MeshBasicMaterial white, transparent, depthWrite
    false, through flatLayer(material, LAYER.decal)) at (bobX, surface + 0.01, bobZ) while 'wait'/'bite'/'reel'; scale
    loops 1 -> 2.2 every 1.2 s with opacity fading; while 'bite' or right after a 'nibble' dip (dip > 0.2) it is bigger.
  - Splash rings: a pool of 4 rings (same geometry; each its own material clone on the same layer); splash(x, y, z,
    big) takes the oldest, grows over 0.6 s (big: to 3x and 0.9 s) and fades; animated in update().
  - showCatch(prefab, x, y, z, yaw, length): one fish shown at a time. Keep a Map<string, THREE.Group> of built fish
    (critterMesh(prefab, 1); the prefab is 1 unit long, nose toward +z); hide the previous one; scale = length;
    position, rotation.y = yaw, a little sway (rotation.z = 0.15 * sin(time * 6)) applied in update(). null hides it.
    At most 6 cached; drop (dispose geometry is shared by prefabs: just remove from scene) the oldest above that.
  - update(s, tipX, tipY, tipZ, show, time, dt): when show is false, hide all and return (but keep animating splash
    rings already playing). No allocation (reuse module-level scratch numbers and vectors).
  - dispose(): remove everything from the scene, dispose the line geometry and your materials.
- No test file required (three.js view); tsc is the gate.

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in src/fishing/fishView.ts.

## Out of scope
Every other file (spotView.ts belongs to another worker).
~~~~

## Issue 1H: hot-spot markers

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-fishing.md: read it there.)

## Goal
games/gnome-theft-auto/src/fishing/spotView.ts marks each hot spot subtly (a few rising bubbles and a faint pulsing
ring on the water), drawn only near the player, cheaply.

## Read first
- games/gnome-theft-auto/src/fishing/spotView.ts: the stub.
- games/gnome-theft-auto/src/fishing/species.ts: FISH_SPOTS; types.ts: FISH.spotRadius, spotShowRange, maxSpotsShown.
- games/gnome-theft-auto/src/fishing/waterKind.ts: waterSurface(x, z).
- packages/depth/src/layers.ts: flatLayer(material, LAYER.decal) from '@lawn/depth'.

## Change
- spotView.ts createSpotView(scene):
  - Up front: each spot's surface height = waterSurface(x, z) ?? 0 (cache it; the water level never changes).
  - One InstancedMesh of bubbles: SphereGeometry(0.06, 6, 4), MeshBasicMaterial({ color: 0xe8fbff, transparent: true,
    opacity: 0.7 }), count capacity FISH.maxSpotsShown * 6, frustumCulled = false, visible false.
  - One InstancedMesh of rings: RingGeometry(1.2, 1.35, 32) laid flat (geometry.rotateX(-Math.PI / 2)),
    MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false }) via flatLayer(material,
    LAYER.decal); capacity FISH.maxSpotsShown.
  - update(px, pz, time): accumulate a timer; do work at most every 0.1 s. Every 0.5 s pick the spots within
    FISH.spotShowRange (nearest first, at most FISH.maxSpotsShown) into a fixed array (no allocation: reuse an index
    array and a count). With none: hide both meshes and return. Else for each shown spot: 6 bubbles at stable offsets
    inside 1.5 units (from the spot index and bubble index), rising from surface to surface + 0.35 over a 1.6 s loop
    (phase-shifted), scale shrinking as they rise; one ring at surface + 0.02, scale 0.8 + 0.4 * ((time * 0.5) % 1).
    Set .count and instanceMatrix.needsUpdate. Reuse one Matrix4/Vector3/Quaternion.
  - dispose(): remove and dispose geometries and materials.
- No test file required; tsc is the gate.

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in src/fishing/spotView.ts.

## Out of scope
Every other file.
~~~~

## Issue 1I: fishing pose and the held rod

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-fishing.md: read it there.)

## Goal
games/gnome-theft-auto/src/fishing/fishPose.ts poses the gnome's arms with the animation library's fishing rows and
holds the selected rod, and reports the rod tip's world position.

## Read first
- games/gnome-theft-auto/src/fishing/fishPose.ts: the stub (FishPose, createFishPose).
- games/gnome-theft-auto/src/anim/animator.ts: applyPose(model, parts, pose, w) and resetParts(model, parts) (exported;
  call them, do not edit anim/), and how holdProp puts buildGear('hand', id) on model.arms.right.
- games/gnome-theft-auto/src/anim/index.ts: animById(id). games/gnome-theft-auto/src/anim/hunt.ts lines 60-90: the rows
  'fish-cast' (1.4 s: rod back until 0.5 s, flick by 0.75 s), 'fish-reel' (1.0 s loop), 'fish-catch' (2.0 s).
- packages/gnome/src/gear.ts buildGear and packages/prefabs/src/build.ts buildHeld: buildGear('hand', id) returns the
  holder group; its first child (holder.children[0]) is the prefab itself, positioned so the grip sits at the origin.
- games/gnome-theft-auto/src/fishing/types.ts: RodDef (prefab, tip in prefab coordinates), FishPhase.

## Change
- fishPose.ts createFishPose():
  - setRod(rod): when rod.prefab changes, build buildGear('hand', rod.prefab) from '@lawn/gnome' (try/catch: on failure
    fall back to 'fishing-rod'); add a tip marker Object3D to holder.children[0] at rod.tip. Cache built holders per
    prefab id (Map) so switching back is free. The held holder is added to model.arms.right in apply (once per model).
  - apply(model, phase, phaseT, charge, dt): weight w blends in over 0.2 s (stays 1 while fishing). Pick the row and its
    time: 'idle' -> 'fish-reel' at t = 0 (still); 'charge' -> 'fish-cast' at t = 0.5 * charge; 'flight' -> 'fish-cast'
    at t = 0.5 + min(0.9, phaseT); 'wait' and 'bite' -> 'fish-reel' at t = 0 (bite adds a tiny 0.05 rad shake to armR
    via the pose array before applying... simplest: just use t = 0.05 * sin(phaseT * 40) for 'bite'); 'reel' ->
    'fish-reel' at t = phaseT % 1.0; 'landed' -> 'fish-catch' at t = min(phaseT, 1.9); 'lost' -> 'fish-reel' t = 0.
    applyPose(model, def.parts, def.pose(t), w). Make sure the rod holder is a child of model.arms.right and visible.
    No allocation per frame (def.pose returns a fresh object in the library: that is acceptable, it is the library's).
  - tip(model, out): model.object.updateMatrixWorld is already done by the renderer next frame; call
    marker.updateWorldMatrix(true, false) then marker.getWorldPosition(out). With no marker yet: out = model.object
    position + (0, 1.4, 0).
  - clear(model): resetParts(model, ['armL', 'armR', 'body']), remove the holder from its parent, w = 0.
- No test file required; tsc is the gate.

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in src/fishing/fishPose.ts.

## Out of scope
Every other file. Never edit anything under src/anim/.
~~~~

## Issue 1J: fishing sounds

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-fishing.md: read it there.)

## Goal
games/gnome-theft-auto/src/fishing/sounds.ts registers a procedural recipe for every FISH_SOUND_IDS id.

## Read first
- games/gnome-theft-auto/src/fishing/sounds.ts: the stub; types.ts: FISH_SOUND_IDS.
- games/gnome-theft-auto/src/hunting/sounds.ts and sounds.test.ts: copy this pattern exactly (table of Recipes,
  once-only register, test).
- games/gnome-theft-auto/src/sound/bus.ts: registerSound(id, recipe), hasSound(id); sound/ids.ts: Recipe = (c:
  AudioContext, out: AudioNode, t: number, info: SoundInfo) => duration seconds; sound/synth.ts: noise, env, burst, tone, voiced.

## Change
- sounds.ts: one Recipe per id, soft and cartoonish, peaks at most 0.25:
  fish-cast (a rising whoosh of filtered noise, ~0.35 s, plus a fast reel-click trill), fish-plop (a small hollow "plip":
  a sine dropping from 600 to 250 Hz in 0.1 s plus a short noise splash), fish-nibble (a tiny "blip" at 900 Hz, 0.05 s),
  fish-bite (a deeper double "bloop" 320 then 220 Hz with a splash burst, ~0.3 s), fish-reel (a ratchet: 8 short
  clicks of bandpassed noise over 0.4 s), fish-splash (a noise splash ~0.35 s, louder with info.param), fish-land (a
  cheerful three-note pluck up, ~0.5 s), fish-snap (a twangy "boing": a triangle wave sliding down 700 -> 180 Hz with a
  wobble, ~0.4 s), fish-sell (a till clunk and two coin clinks, like hunt-sell).
  registerFishSounds(): once-only guard; registerSound(id, recipe) for each, importing registerSound from '../sound/bus'.
  Must not touch AudioContext at import time.
- games/gnome-theft-auto/src/fishing/sounds.test.ts (new): after registerFishSounds(), hasSound(id) is true for every
  FISH_SOUND_IDS id, and a second call does not throw.

## Done when
- npm test -w games/gnome-theft-auto -- src/fishing/sounds.test.ts passes.
- npx tsc --noEmit -p games/gnome-theft-auto: no errors in your files.

## Out of scope
Every other file, including everything under src/sound/.
~~~~

## Issues 1K, 1L and 1M: fish prefabs

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-fishing.md: read it there.)

## Goal
1K: packages/prefabs/src/catalog/gta-fish-a.ts (export GTA_FISH_A) holds fish-mossback-trout, fish-stripy-perch,
    fish-glen-char, fish-hedge-pike, fish-ribbon-eel, fish-old-mossjaw, fish-rainbow-flicker, fish-pebble-loach.
1L: packages/prefabs/src/catalog/gta-fish-b.ts (export GTA_FISH_B) holds fish-ravine-grayling, fish-leaping-salmon,
    fish-frostfin, fish-gudgeon, fish-redeye-roach, fish-trolley-carp, fish-doctor-tench, fish-whiskers-mcgill.
1M: packages/prefabs/src/catalog/gta-fish-c.ts (export GTA_FISH_C) holds fish-wellington-bootfish, fish-gilded-koi,
    fish-stripe-mackerel, fish-lopsided-flounder, fish-grumbling-gurnard, fish-silver-bass, fish-puddle-sunfish,
    fish-driftwoods-shark.

## Read first
- docs/roadmaps/prefab-library/_common.md: modelling, data and examine-voice rules (ignore its Environment section;
  use the one above).
- packages/prefabs/src/types.ts, packages/prefabs/src/palette.ts.
- packages/prefabs/src/catalog/dayg-materials.ts: the 'fish' prefab (a scaled ball body, a box tail, an eye): the
  starting shape. packages/prefabs/src/catalog/gta-hunt-quarry-a.ts: an animal entry's full field set.
- games/gnome-theft-auto/src/fishing/species.ts: each species' name, size range and blurb (for looks and examine lines).

## Change (only your one file; it exists with an empty array, keep its export name)
Every fish: category 'prop', uses ['place'], tags include 'fish', the fish's own nouns, 'gta', 'fishing'; emoji [];
`about` one plain sentence of what it looks like; 5 examine lines in the _common.md voice (fish are caught on a pointless
clip, measured, carded and let go; never eaten, cooked or hurt). Shared modelling convention so the game can scale them
by length: the fish is 1.0 unit long along z, nose at z = +0.5, tail tip at z = -0.5, centred on y = 0 (NOT resting on
the ground), x = 0 is the middle. Cheap shared parts: a body 'ball' scaled long ([~0.3, ~0.35, 1] style scale), a tail
(a flattened 'cone' or two thin 'box'es), a dorsal fin (thin 'box' or 'cone'), two pectoral fins (mirror: true), eyes
(small 'ball', mirror: true); seg 6-8; 5 to 14 parts. Use tint/trim for the main colours. Make each recognisable:
- 1K mossback-trout: olive-brown with a mossy green back stripe and dark spots. stripy-perch: green-gold with 5 dark
  vertical bands, red-orange fins, spiky dorsal. glen-char: dark grey-green back, pink-red belly, white fin edges.
  hedge-pike: long and slim (scale x 0.22), duck-bill snout, mottled green-yellow, a toothy grin (small white boxes).
  ribbon-eel: very long and thin (x 0.12, y 0.14) with a ribbon fin along the back, dark brown. old-mossjaw: huge
  heavy carp-like body (x 0.4, y 0.45), dark green with moss tufts (small green balls) on its back and a long whiskery
  jaw; ancient look. rainbow-flicker: silver with a pink-red side stripe and speckles. pebble-loach: small, round grey
  pebble-like body with barbels.
- 1L ravine-grayling: silver-grey with a tall sail-like dorsal fin (purple edge). leaping-salmon: silver with a pink
  flush, hooked jaw. frostfin: pale blue-white with clear icy fins (light blue, transparent-looking colour). gudgeon:
  small brown-speckled with two little barbels. redeye-roach: silver with red fins and big red eyes. trolley-carp:
  bronze mirror carp with a few big shiny scales (flat silver discs) and thick lips. doctor-tench: deep olive-green with
  tiny red eyes, rounded fins and a pair of little round spectacles (thin dark rings in front of the eyes).
  whiskers-mcgill: broad flat catfish head, long body, grey-brown, four long whiskers (thin cylinders) curling like a
  moustache.
- 1M wellington-bootfish: a small orange fish whose back half sits inside a green wellington boot (boot as boxes/cylinder).
  gilded-koi: gold body with white and orange patches, flowing long tail fins, gleaming (use the palette's gold).
  stripe-mackerel: blue-green back with black wavy stripes, silver belly, small finlets. lopsided-flounder: flat oval
  (y 0.08, x 0.5), both eyes on the top side, sandy brown with orange spots. grumbling-gurnard: red-orange, big
  wing-like blue-edged pectoral fins, square grumpy head. silver-bass: bright silver, spiny dorsal, dark gill spot.
  puddle-sunfish: tall round flat disc (y 0.8, z short), tiny tail, grey-silver, round surprised eye.
  driftwoods-shark: big gentle grey shark: pointed snout, tall dorsal fin, crescent tail, pale belly, a friendly
  smile line (no teeth showing).

## Done when
- npx tsc --noEmit -p packages/prefabs: no errors in your file.
- npm test -w packages/prefabs passes (or every failure names only ids that are not yours).

## Out of scope
Every other file, especially packages/prefabs/src/catalog/index.ts (already imports your file) and the other gta-fish-* files.
~~~~

## Issue 1N: tackle prefabs (rods, bobber, baits, catch card)

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-fishing.md: read it there.)

## Goal
packages/prefabs/src/catalog/gta-fish-tackle.ts (export GTA_FISH_TACKLE) holds the three upgrade rods, the bobber, the
six bait icons and the catch card.

## Read first
- docs/roadmaps/prefab-library/_common.md (rules; ignore its Environment section), packages/prefabs/src/types.ts, palette.ts.
- packages/prefabs/src/catalog/tools.ts: the 'fishing-rod' entry (copy its shape: wear rot [180, 0, 0], grip
  [0, 0.07, 0], uses ['hold', 'fish'], category 'tool').
- games/gnome-theft-auto/src/fishing/tackle.ts: RODS and BAITS (names, blurbs, prefab ids, tip positions).

## Change (only your one file; it exists with an empty array)
- Rods (category 'tool', uses ['hold', 'fish'], wear { rot: [180, 0, 0] }, grip [0, 0.07, 0], emoji [], tags 'rod',
  'fishing', 'gta'): the rod runs straight up +y from a handle at y 0..0.14 to the tip at EXACTLY (0, 0.95, 0) (the
  game hangs the line there). A reel on the side near y 0.18. Line not modelled (the game draws it).
  - 'fish-rod-cane' "Split-Cane Rod": honey-coloured cane in two tapered sections with dark wraps, a small wooden reel.
  - 'fish-rod-brass' "Brass-Reel Rod": dark green rod, cork handle, a round brass reel with a little crank.
  - 'fish-rod-moonline' "Moonline Rod": slim silver-white rod, a pale blue glowing tip (an emissive part if the
    palette/types support it, else a pale blue ball), a silver reel with a crescent-moon crank.
- 'fish-bobber' "Bobber" (category 'prop', uses ['place']): a red-over-white float, ~0.12 tall, round body (top half red,
  bottom white) with a short stick on top; origin at its waterline (the middle of the body at y = 0).
- Bait icons (category 'material', uses ['collect'], each ~0.12-0.2 across, lying at y >= 0): 'bait-dough' (a pale
  dough ball), 'bait-cheese-rind' (a yellow wedge with an orange rind edge), 'bait-acorn-crumb' (two acorn crumbs and a
  cap), 'bait-sock-fly' (a fluffy grey-blue tuft with a thread tail, like a fishing fly), 'bait-glitter-spinner' (a
  silver spoon-shaped lure with a gold spinner blade, uses ['collect', 'hold']), 'bait-moon-jig' (a pale glowing round
  jig head with a short skirt).
- 'fish-catch-card' "Catch Card" (category 'document' if types allow it, else 'prop'; uses ['collect']): a small cream
  card with a printed blue fish outline and a ruler edge, ~0.14 x 0.09, lying flat.
- 5 examine lines each, in the _common.md voice; nothing about worms, hurting or eating fish.

## Done when
- npx tsc --noEmit -p packages/prefabs: no errors in your file.
- npm test -w packages/prefabs passes (or every failure names only ids that are not yours).

## Out of scope
Every other file (catalog/index.ts already imports your file).
~~~~

## Issue 1O: shop props, reward gear and achievements

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-fishing.md: read it there.)

## Goal
packages/prefabs/src/catalog/gta-fish-gear.ts (export GTA_FISH_GEAR) holds The Bent Pin's props and the five reward
items, and packages/achievements/src/catalog.ts gains the five fishing achievements.

## Read first
- docs/roadmaps/prefab-library/_common.md (rules; ignore its Environment section), packages/prefabs/src/types.ts, palette.ts.
- packages/prefabs/src/catalog/gta-hunt-gear.ts: 'tuft-lodge-sign', 'lodge-cap', 'tuft-game-bag', 'quill-collar' (note
  its `wear`), 'grizzle-brush' (a hand reward with grip): copy these shapes and field sets.
- packages/prefabs/src/catalog/gta-world-green.ts 'log-cabin': a building's scale and parts.
- packages/achievements/README.md and the 'gta-first-tuft' .. 'gta-old-grizzle' entries in packages/achievements/src/catalog.ts;
  packages/achievements/src/achievements.test.ts (SLOT_USE: which `uses` each slot needs; one reward per prefab).

## Change
- gta-fish-gear.ts (exists with an empty array GTA_FISH_GEAR; keep the name). Prefabs (category 'prop', uses
  ['place'] unless said; front faces +z; lowest point y = 0):
  - 'bent-pin-shack': a small weathered clapboard bait & tackle shack, ~3.2 tall, 6.2 wide (x), 5 deep (z): teal
    boards, a sloping tin roof, an open serving window on the front (+z) with a striped awning, a giant bent pin
    (a silver hook-shaped curve of thin boxes, NO point) on the roof as its sign. 15 to 35 parts.
  - 'bent-pin-sign': a post with a hanging board "THE BENT PIN" style (a painted fish and a bent pin), ~1.4 tall.
  - 'fish-rod-rack': an A-frame wooden rack with four rods standing in it, ~1.3 tall.
  - 'bait-cooler': a blue-and-white cool box with a lid, ~0.5 tall, a paper sign on top.
  - 'angler-bucket-hat' (category 'armor', uses ['wear-head']): a floppy khaki bucket hat with two fishing flies on the band.
  - 'wicker-creel' (category 'armor', uses ['wear-back']): a wicker fishing creel basket with a leather strap and lid
    (it carries catch cards, not fish).
  - 'lure-necklace' (category 'trinket', uses ['wear-neck'], `wear` like quill-collar): a cord strung with colourful
    lures and a tiny spinner.
  - 'golden-gudgeon' (category 'trinket', uses ['hold'] plus whatever SLOT_USE.hand requires, grip set): a small gold
    fish trophy on a little wooden plinth, ~0.3 tall.
  - 'derby-boater' (category 'armor', uses ['wear-head']): a straw boater hat with a teal ribbon and a blue rosette.
  Examine lines (5 each) in the _common.md voice; fish are always let go.
- packages/achievements/src/catalog.ts: append ONE contiguous block of five entries after the last 'gta-' entry
  (other planners may be editing this file: add yours, change nothing else). All game: 'gnome-theft-auto',
  gameTitle: 'Gnome Theft Auto':
  - gta-first-bite "First Bite": "Land your first fish (and let it go)." reward head angler-bucket-hat "Angler's Bucket Hat".
  - gta-card-sharp "Card Sharp": "Sell 25 catch cards at The Bent Pin." target 25, reward back wicker-creel "Wicker Creel".
  - gta-every-fin "Every Fin": "Land every species in the fishing journal." reward neck lure-necklace "Lure Necklace", exclusive true.
  - gta-old-mossjaw "Old Mossjaw": "Land Old Mossjaw from the Loch Moss deeps." reward hand golden-gudgeon "Golden Gudgeon", exclusive true.
  - gta-derby-day "Derby Day": "Win the Bent Pin Derby." reward head derby-boater "Derby Boater".

## Done when
- npm test -w packages/prefabs passes for your ids; npm test -w packages/achievements passes.

## Out of scope
Every other file (catalog/index.ts already imports your file).
~~~~

## Issue 1P: lore entries

~~~~text
Epic: 1. Depends on: none.
(Paste the "Common to every issue" block from docs/roadmaps/gta-fishing.md: read it there.)

## Goal
Lore entries for Turfton fishing, per ruling R-146 in docs/lore/rulings.md.

## Read first
- docs/lore/README.md (entry format), docs/lore/rulings.md: R-021, R-049, R-050, R-146.
- docs/lore/entries/apocrypha/southern-drainage-canal.md, driftwood-castaway.md, tessie.md and the hunting entries
  tuft-and-tally-lodge.md and hazel-mattock.md: copy the front matter fields and section style.
- games/gnome-theft-auto/src/fishing/species.ts (names, blurbs, spots) and tackle.ts (rods, baits).

## Change
- New docs/lore/entries/apocrypha/the-bent-pin.md (kind place): bait & tackle shack on the canal's south bank by Old
  Brick wharf; the nibble-clip; rods and baits sold; catch cards bought for the Turfton catch register; the Bent Pin
  Derby; the hot spots by name. related: [southern-drainage-canal, wenna-gudgeon, old-mossjaw].
- New docs/lore/entries/apocrypha/wenna-gudgeon.md (kind person): the keeper, oilskin-yellow coat, auburn pigtails,
  cheerful and exact about centimetres; "What gnomes say" lines; she never says kill, eat or cook.
- New docs/lore/entries/apocrypha/old-mossjaw.md (the kind the README allows for an animal): the ancient mossy fish of
  the Loch Moss deeps, Tessie's neighbour; how big; why nobody has carded it (Loose threads).
- New docs/lore/entries/apocrypha/gilded-koi.md and driftwoods-shark.md (same kind): the Gilded Koi of the canal's lock
  pool (claims to have escaped Baroness Brenda's ornamental pond: a loose thread whether that is true), and the gentle
  shark of the far Puddle Sea that proves Driftwood right; related: [driftwood-castaway, the-puddle-sea].
- All: tier apocrypha, setting apocrypha, games [gnome-theft-auto], status draft, sources include
  docs/roadmaps/gta-fishing.md and docs/lore/rulings.md#r-146.

## Done when
- npm run lore passes (run it from the repo root).

## Out of scope
Every file outside docs/lore/entries/apocrypha/ (rulings.md already has R-146; do not edit it).
~~~~

## Status

Epic 1 done (16 issues, all parallel, no dependencies). Planner fixes after it: the bobber sinks 0.06 (the prefab rests
its base on y = 0; fish prefabs likewise rest their belly on y = 0, which the catalog test requires), and on phones the
hold button sits over the game's Fire button, the stop button over Jump, the bars on the left, no keyboard help line.
Checked in headless Edge (puppeteer, ?debug): rod out on the canal bank, cast, wait, biteNow('fish-gudgeon'), hook, reel,
landed into the journal with a card and the First Bite unlock; a 390 x 844 touch viewport screenshot. Not tried: a real
phone, a real gamepad, fishing from a boat (code path only), the derby end to end.
