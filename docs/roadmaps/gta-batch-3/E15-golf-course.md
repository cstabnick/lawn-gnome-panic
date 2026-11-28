# E15 Golf course
Wave: 5 · Depends on: E01 (golf yard site), E05 (clubhouse interior), E04 (cast) · Kind: Content

Source items:
- L85 "add a golf course. should have a club house interior. player can actually play golf using improted mechanics from gnome golf. will need a lot of new land space. add by breaking through a fence into someone elses yard. with big hedges and tall grass and large plants that line the course. still letp layer drive through it. add some quests and make owenr and pro and groundskeeper fun people with interesting stuff going on."

## Goal
A drivable golf course in a neighbour's yard, entered through a broken fence, lined with huge hedges, tall grass and
oversized plants; a clubhouse with an interior; real golf (swing meter, clubs, lies, wind, strokes, par) using Gnome
Golf's mechanics through a shared package; and three memorable characters (owner, pro, groundskeeper) with quests that
interlock.

## Scope
In:
- Extract Gnome Golf's pure ball and course logic into a package so both games import it; Gnome Golf's build and tests keep passing.
- The yard: a fence with a breakable gap, course ground, 3 to 6 short holes (decision below), tees, greens, flags, hazards (sand, water), cart paths, solid hedge walls and soft tall-grass rough you can still drive through.
- A round mode in GTA: walk or cart to the tee, swing meter, ball flight in the GTA scene, scorecard, par names.
- Clubhouse interior (E05) with owner, pro shop, bar; owner, pro and groundskeeper with 4 to 6 quests; achievements; prefabs.

Out: Gnome Golf's lobby, party slice and level editor; disc golf (`discPhysics.ts`); the Putting-Green Country Club in Patio Heights (existing lore, astroturf, silent carts) is a different place and is untouched.

## Code pointers (confirmed)
Gnome Golf (`games/gnome-golf/src/`), what is pure versus tangled:
- Pure, extractable as is: `course.ts` (177 lines, no three.js): `createCourse(src: CourseSource)` returns `{coastRadius, distToCoast, heightAt, gradientAt, lieAt}`; but a module-level `DEFAULT` course feeds exported singletons `heightAt`, `lieAt`, `gradientAt`, `distToPath`, `holeLength` that every other file imports. `obstacles.ts` (205 lines, no three.js): `collide`, `setCarts`, `CartObstacle`, tree lobes from `trees.ts`; it imports the singleton `heightAt`.
- three.js math only: `physics.ts` (317 lines): `simulateShot(start: THREE.Vector3, shot, lie, wind, pin, opts)`, `launchSpeed`, `estimateCarry`, `powerFor`, `previewShot`, `windVelocity`; calibrated so a full flat shot carries exactly `CLUBS[club].carry`. Replace `Vector3` with `{x,y,z}` in the package.
- Tangled: `config.ts` (625 lines: `CLUBS`, `LIES`, `PHYS`, `HOLES` read from `levelDoc.ts` which touches DOM/level JSON, `GameState`, `Shot`, `ShotResult`, `Wind`, party/cart constants); `round.ts` (782 lines: `newRound`, `startHole`, `takeShot`, `tickRound`, `scoreName`, `seededWind`, `restingSpot`, `playableLie`; imports the default course and `setCarts`); `ball.ts`, `controls.ts`, `hud.ts` (DOM heavy), `world.ts` (scene) stay in the game.
- `src/minigames/golf-hole.ts` + `together.ts` already reuse `round.ts` pieces without the island scene: a model for the seam.
- Package decision: new `packages/golf` (`@lawn/golf`): types and tuning (`CLUBS`, `LIES`, `PHYS`, `Shot`, `ShotResult`, `Wind`, `HoleDef`), `createCourse`, `simulateShot` taking a course instance, `collide` taking an obstacle set, `scoreName`, `seededWind`, `restingSpot`. `games/gnome-golf` re-exports so its imports are unchanged. Its `course.golden.test.ts`, `round.test.ts`, `levelDoc.test.ts` run before and after. If making the course instance-based forces a behaviour change in Gnome Golf, the master plan applies: do not touch it, write GTA golf against the package API only.

GTA side (`games/gnome-theft-auto/src/`):
- Ground: `terrain.ts` (`heightAt`, `setTerrainOptions`), `landforms/` (`index.ts`, `tallgrassCommons.ts`, `types.ts`) and `data/world.layout.json` `regions` (each has `id`, `origin`). The golf yard is an E01 region. The package gets a source adapter over GTA `heightAt` so the ball rests on the terrain you drive on.
- Scenery: prefabs `hedgerow`, `hedge-arch`, `hedge-hopper`, `golf-flagstick`, `tee-marker`, `golf-ball`, `golf-tee`, `golf-cart`, `golf-visor`, `golf-bucket-hat` exist (`packages/prefabs/src/catalog/golf.ts`, `gnome-golf-props.ts`). Laying out a dressed area: `parks/kit.ts` (`put`, `perimeter`, `patch`, `dressAt`) and `flora/kinds.ts`.
- Vehicle: `config.ts` kind `'golf-cart'` (Putting-Green Cart, ~line 380) and `fleet.ts`. Hedge colliders via `collide.ts` (`pushOutOfBoxes`); breakable fence via `destructibles.ts` and `debris.ts`.
- Runtime: a new `src/golf/` (runtime, view, hud) installed from `app.ts` like `installTubing` (~line 869). Quests: `quests/sideQuests.ts`, `quests/types.ts` (add an objective kind such as `golf-hole`). Cast: `npcs.ts`, `vibeNpcs.ts`, `city/cityCast.ts`.
- Joke to reuse: `round.ts` `seaMowerCatch` / `SEA_MOWER_CHANCE` for the water hazard.

## Contracts this epic provides
- `@lawn/golf` package with a README (API and size rules) and `npm test -w packages/golf`.
- Exported golf course data (tee and pin positions, yard bounds, clubhouse door) for E18 and E21.
- A `golf-hole` objective kind any quest can use; the pro, owner and groundskeeper as reusable cast.

## Contracts this epic consumes
- E01: `golf-yard` site (large footprint, fence line with the gap location, cart-path approach from a road).
- E05: enter/leave interior API for the clubhouse; fallback is a counter prompt at the door.
- E04: names, motives and secrets of owner, pro, groundskeeper, and whose yard it is.
- E08 (if merged): shop and inventory hooks for clubs, balls, snacks.

## Online / mobile / achievements / prefabs / lore notes
- Online (`docs/roadmaps/gta-online-sync.md`): rounds are single-player scoring. Others see the golfer's pose and the ball as a short-lived entity through `online/replicate.ts` keyframes; strokes are not synced. Say so in the PR.
- Mobile: tap-hold-release swing (Gnome Golf's meter), club and aim buttons >= 44 px, safe-area insets, no keyboard-only controls.
- Achievements: hole in one, birdie streak, cart through the hedge, groundskeeper's secret; cosmetic `head` rewards (visor and bucket hat prefabs exist).
- Prefabs: new broken-fence panel, sprinkler head, clubhouse furniture, trophy cabinet, giant plants; reuse the rest. `flatLayer` for greens and paths; `npm run zfight -- <url>`.
- Lore: `npm run lore -- find golf` hits the Putting-Green Country Club (Vesper Thorne), Gnome Golf's island and the Yard setting. Add a settings row and entries for the course, owner, pro, groundskeeper.

## Risks and open questions (decision taken)
- Package extraction disturbing Gnome Golf. Decision: extract only the pure modules above, keep UI, level doc and party slice in the game, and compare the golden test before and after.
- Land. Decision: 3 to 6 short holes (par 3 and 4) on a loop; the full nine is deferred.
- Hedges blocking cars. Decision: hedge walls are solid, tall grass and large plants are soft (slow and rustle, no stop), cart paths are clear.
- Name clash with Vesper's club. Decision: the new course is the neighbour's separate links (name from E04); Vesper may cameo as a rival.

## Done when
- `npm run build -w games/gnome-golf`, `npm test -w games/gnome-golf`, `npm test -w packages/golf`, `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto`, `npm test -w packages/prefabs`, `npm test -w packages/achievements`, `npm run lore`.
- Tests: the same fixed shot gives the same result in both games; GTA lie lookup on the yard; quest defs; hole data.
- Dev server: `bash tools/smoke.sh <url> <dom-marker>...`, `npm run zfight -- <url>`; manual: drive through the fence gap and play a hole at 390x844.
