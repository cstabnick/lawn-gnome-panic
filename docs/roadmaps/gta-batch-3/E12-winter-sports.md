# E12 Winter sports
Wave: 4 · Depends on: E01 (site registry: ski hill slot), E06 (weather and snow) · Kind: Content
Source items:
- L38 make sure we do have polar bears and they are really chill
- L42 add the option to go sledding
- L43 add a ski hill and skiing
- L44 add ice fishing

## Goal
Frostbite Fells becomes the winter playground: confirmed, visibly chill polar bears; a sled you can ride down hills; a ski
hill with a lift or tow and skiing; and ice fishing on the frozen ponds. Snowfall from E06 sets the mood. (L43's ski hill
is a site E01 reserves; the "ocean region with skiing and tubing" in L35 belongs to E11, not here.)

## Scope
In: polar bear audit and extension (L38); sled (L42); ski hill build, lift, skiing, a slalom or timed run (L43); ice
fishing (L44); achievements, a phone/Gnomlet entry if useful, quest hook points (no new story quests: E18/E21 use them).
Out: coast tubing (exists in `src/tubing/`; E11 extends), new weather code (E06), the Fells' story scenes (E20-E21).

## Code pointers (confirmed)
- Polar bears (L38): they already exist. `src/critters.ts` has `CritterKind` `'polar-bear'` (`CRITTER_DEFS` row: `calm: true`,
  `walk 0`, `scareFoot 0`, `scareVehicle 0`, `downTime 0`) and `src/critters/fells.ts` (`fellsLife`): five bears in deck
  chairs on the sun deck at `DECK_CX 330, DECK_CZ -640` (`rt.spawn('polar-bear', x, z, {region, group: 'fells-bears',
  mode: 'script', yaw: 0})`), `BEAR_SHRUGS` toasts, `BEAR_SHRUG_S 1.6`, `BEAR_TOAST_GAP 8`, `BEAR_EVENT_GAP 60`; sunglasses
  joke. `fells.test.ts` asserts "spawns five polar bears". Sound: `sound/watchLife.ts callRange` gives bears 15-30 s calls
  (`'bear'` in `sound/ids.ts`). Prefab `polar-bear` in `packages/prefabs/src/catalog/critters.ts`. So L38 is an audit
  ("make sure we do have"): check they render and sit in the live build, are in the map/legend, cannot be hurt
  (nothing dies, per R-021/R-049 in the file header), the growl is not scary (swap `'bear'` call for a yawn/snore-ish
  sound in `sound/recipes/critters.ts`), then add more of them being chill: one tubing on a pond, one asleep on the ice
  (`landforms/frostbiteFells.ts` paints frozen `pond` features ice), one with a mug at the ski lodge.
- Frozen ponds and ice: `src/landforms/frostbiteFells.ts` (kinds `pond`, `glacier`; numbers in
  `src/data/levels/frostbite-fells.level.json` `data.terrain`), ice paint rule in `src/terrainPaint.ts` (~line 63:
  inside a pond radius is `'ice'`), surface physics `src/surfaces.ts:29 ice: {speedMult .96, accelMult .72, turnMult .85,
  lateralGrip .25}`. A frozen pond is painted ground, NOT water: `waterAt` returns null there, so fishing cannot see it.
- Fishing: `src/fishing/` (`fishing.ts`, `fishHud.ts`, `pick.ts` `fishWeight/weatherAt`, `species.ts` `FISH_SPOTS` +
  species data with `waters: FishWater[]` and `regions`, `waterKind.ts fishWaterAt(x,z)` which returns null unless
  `waterAt` is true, `FishWater = 'loch'|'river'|'canal'|'sea'` in `fishing/types.ts:10`, `sim.ts` bite/fight, `tackle.ts`
  rods and bait, `fishSave.ts` journal in `gta-fishing-v1`, `spotView.ts`, `fishPose.ts`, `shopUi.ts`). Online relays
  rod phases (`online/actSync.ts`, `protocol.ts` ACT.rod; fishing phases appended-only table).
- Ice fishing decision (needs a code path): add `FishWater` `'ice'`, `fishWaterAt` returns `'ice'` on painted ice inside a
  pond (use `surfaceAt(...).kind === 'ice'` plus a pond-membership test from the landform data), a "drill a hole" step
  (hold the action for ~1.5 s with an auger prop, hole mesh as a decal using `flatLayer(material, LAYER.<x>)` per the
  z-fight rule), 3-4 cold-water species in `species.ts` (`waters: ['ice']`, `regions: ['frostbite-fells']`, `times`/
  `weather` multipliers that use E06's `snow`), a small shelter/stool prop. Ice never cracks under the player.
- Vehicles on snow/ice: `src/surfaces.ts`, `driveGrips.ts`, `handling.ts` (grip). Skiing and sledding are on-foot or
  mount-like activities; compare `src/oddRides.ts` and `src/mount.ts` (ride-on mounts: `?mount=push-bike|zero-turn`) and
  the ski/sled reference in `cutscene/scenes/story/ch3b.ts` (the only current mention of sleds/skis, scene text only).
  Slope ground height: `heightAt/normalAt` in `src/terrain.ts`; the north mountain is in `landforms/macro.ts` +
  `src/data/landscape.json`. The site for the ski hill comes from E01's registry (`site` markers read through
  `marker('site', id)` as in `config.ts:74`).
- Boards: `games/aether-board` has hoverboard physics; the standing-board riding of E19's skateboard shares code with a
  sled/ski rider only loosely. Decision: do not extract for this epic; write one `src/winter/slideRider.ts` (slope-driven
  kinematic body: gravity along the slope, edge/steer, brake, jumps off lips) used by both sled and skis, with different
  tuning tables.
- Jobs/tubing structure as a template for a new activity runtime with phone app + achievements + online adapter:
  `src/tubing/runtime.ts`, `src/jobs/`, `src/hunting/`. Achievements: `src/wildAchievements.ts`, `src/glazeAchievements.ts`.

## Contracts this epic provides
- `src/winter/` (new): `slideRider` (sled and skis), `sled.ts` (rent/pick up a sled at the lodge; also lets traffic-free
  slopes anywhere work: ride any mountain slope with a sled item), `skiHill.ts` (lift/rope tow loop, slalom gates,
  timed run, best times saved), `iceFishing.ts` (hole, shelter, species hook), `lodge.ts` (rental counter, hot cocoa
  consumable if E08's inventory exists).
- Save key `gta-winter-v1` (best times, ice-fishing catches mirrored into `gta-fishing-v1`'s journal) added to
  `GTA_SAVE_KEYS` (`saveIO.ts`) and the cloud list.
- Hook for E18/E21 quests: `winter.api` (`startRun`, `isOnSlope`, `onFinish(cb)`), and map `PlaceKind` `'ski'` + legend row.
- `fishing/types.ts`: `FishWater` gains `'ice'`; `fishing/pick.ts weatherAt` already moves to E06's weather.

## Contracts consumed
- E01: the ski-hill site footprint and slope (a tall enough gradient for a 60-80 s run; if the registry slot is too flat,
  raise it with a landform feature in this epic's own region file), Frostbite Fells region id `frostbite-fells`.
- E06: `getWeather()` and snowfall in the Fells (snow intensity gates the "fresh powder" bonus, fish bite weights).
- E08: inventory/consumables and the rental fee through `economy.ts` spend; if E08 lands later, rent for a flat Acorn fee now.
- E07: Options registry (a "Sled/ski steering: tilt/tap" row only if needed) and the Gnomlet app list (a "Ski runs" app).
- Prefabs: `@lawn/prefabs` (`npm run dev -w games/prefab-gallery`): sled, skis, poles, ski lift chair, tow rope, auger,
  ice shelter, stool, cocoa mug. Add missing ones in `packages/prefabs/src/catalog/` per `docs/roadmaps/prefab-library/_common.md`, `npm test -w packages/prefabs`.

## Online / mobile / achievements / prefabs / lore notes
- Online (`docs/roadmaps/gta-online-sync.md`): sled/ski riders sync as the player's pose plus a mount id on
  `online/actSync.ts` (append a mode), so others see you sliding; runs and times are local. Ice-fishing rod phases
  reuse the existing rod sync with the hole position. Bears are local (like other critters) as `fells.ts` already does.
- Mobile: tilt or two big steer buttons plus brake; the same 44 px target and safe-area rules; one-tap "ride again". No
  hover-only prompts. Check 390x844 and landscape.
- Achievements (`packages/achievements/src/catalog.ts`, each with a cosmetic reward through prefabs): first sled run,
  ski hill best under a time, "Ice Station" (3 ice catches), "Bear Hug" (stand beside every bear at the deck),
  "Black Diamond". Rewards: `head` beanie/ear-flaps, `neck` scarf, `back` skis. `npm test -w packages/achievements`.
- Lore: `npm run lore -- find frost`, `-- find Fells`, `-- find bear`; the Fells are frost glaze and the bears only shrug
  (do not make them speak, nothing hostile). Names for the lodge, hill and runs are new lore: add a settings entry or a
  ruling in `docs/lore/rulings.md`; `npm run lore` must pass. Register the new place in `docs/lore/settings.md` if it is a new setting.
- Not editing other games: skiing/sledding are GTA-only; no extraction required.

## Risks and open questions (decisions taken)
- Slope physics on a chunked heightfield is jittery: sample `heightAt` at three points under the rider, smooth the normal,
  clamp the speed (60 m/s), and never let the rider tunnel by stepping at <= 60 Hz with sub-steps. Reuse the camera rules E02 sets.
- Skiing "feel" can eat the epic. Decision: ski = a gliding on-foot state with carve (lean steering), a brake snowplough and
  one jump ramp; no tricks beyond a spin. Sled = a seat on the same rider with heavier drag and a bump bounce.
- Ice-fishing needs the water check to say "this is water-like". Decision: do not carve water into ponds (would change
  swimming and the water mesh); keep ice as a surface and fake the hole and the fish. Fishing's `FishWater 'ice'` is its own branch.
- Polar bears "really chill": already the case on the deck; the risk is that nobody sees them. Decision: add a map blip
  ("Bear Deck") and a tiny trail sign, and keep the deck as is for the existing `fells.test.ts`.
- Perf: ski hill props are scenery under the culler (`registerScenery`), lift chairs animate with a single instanced mesh.
- If E06 weather slips, ship without snowfall (the Fells are already snowy by paint) and wire it later: do not block.

## Done when
- `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto` (new tests: slideRider on a plane and a
  bump, ice fishing species filtering, `fells.test.ts` bears count, save key round trip), `npm test -w packages/prefabs`,
  `npm test -w packages/achievements`, `npm run lore`.
- With the dev server: `bash tools/smoke.sh <url> <markers>` clean, `npm run zfight -- <url>` clean (the lodge, holes, decals),
  a recorded demo GIF of a sled run, a ski run and a catch through `npm run demo -- <demo.json> --gif`, uploaded with the
  media-upload MCP and linked in the PR.
- AGENT_INDEX.md updated for `src/winter/`.
