# Pay 'n' Glaze: vehicle customisation (`@lawn/glaze` + Gnome Theft Auto's shop)

Goal: a customisation system broad enough to grow, adopted by Gnome Theft Auto only. In the Pay 'n' Glaze garage a player can change a vehicle's paint and finish, spray on special decals, swap tyres and rims, set wheel size, camber and ride height (which replaces the old Side-Valve "Ride height" tuning dial), fit new headlights, a spoiler, a seat, a steering wheel, a hood ornament and little extras, and light the underside. The driver's hands now hold the steering wheel and turn with it. Other games must keep working as they are, and a new game must be able to use it in a few lines.

Game: [games/gnome-theft-auto](../../games/gnome-theft-auto/README.md). Package: [packages/glaze](../../packages/glaze/README.md). Source for the nested-pivot idea: issue cstabnick/lawn-gnome-panic#147 (see "Decisions").

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0 (planner, no workers) | The package scaffold, final types, the product catalogue (ids, lore names, prices), stubs with final signatures, `registerPrefab` in `@lawn/prefabs`, the GTA stubs and `Vehicle.look` / `Vehicle.rig`. The game builds. | 0 (written directly) |
| 1: package, prefabs, widgets | `packages/glaze` tests pass; 46 mod prefabs and 5 reward gear prefabs in the library; the shop widgets compile; lore entries and R-052 pass `npm run lore`. | 18 (`epic-1/1A` to `1R`) |
| 2: Gnome Theft Auto adopts it | Vehicles are built with the rig; the shop, panels, store, mounts, camera, net sync, driver hands and achievements work; `npm run build -w games/gnome-theft-auto` passes and the smoke check is clean. | 12 (`epic-2/2A` to `2L`) |
| 3: more parts, nested pivots, suspension, showroom stage | 4 to 5 new products on every shelf and six new shelves (grille, bumper, canopy, mirror, exhaust, horn); nested pivots in `@lawn/prefabs` (#147); a spring-damper body bounce; the shop warps to an off-map stage; two failing gear tests fixed. | 14 (`epic-3/3A` to `3N`) plus the stage, written by the planner |
| 4 (planner) | Visual check at phone and desktop sizes, fixes, the MP4 demo, the PR. | none |

No issue in an epic depends on another in that epic: every cross-file contract was fixed in epic 0 as a stub with its final signature, so each worker owns one file (or one small group).

## Design in one page

- **A `Loadout` is plain data** (`packages/glaze/src/types.ts`): JSON-safe, copyable, comparable, and encoded as a text code under 120 characters (`encodeLoadout`) for saves and the network. The stock loadout is a no-op: the vehicle looks exactly as before.
- **`attachLoadout(body, prefabId, loadout)` returns a `GlazeRig`**: `set`, `apply` (call after `setPrefabDamage`, which rebuilds the body's children), `camberOf`, `seatLift`, `lights`, `grips`, `update`, `dispose`. The body is built white with separable tint parts (`buildGlazeBody`), so repainting and changing finish is a material swap, not a rebuild.
- **The shell:** everything but the four wheel pivots is moved into a `glaze-shell` group; ride height (and the lift from bigger wheels) moves the shell, the rider and the steering wheel but not the wheels. The game also maps ride height to the physics model's centre-of-mass height (`handling.ts comHeightFor`), so a slammed mower really is steadier.
- **Mounts:** where lamps, the spoiler, decals and grips go. `deriveMounts` guesses them for any prefab, `defineMounts` overrides them per prefab, so a new game gets a working shop with no extra data.
- **Steering and hands:** the stock mower wheel is far above and ahead of a seated gnome. A game registers a private *steer variant* of the prefab (`registerSteerVariant`, through the new `registerPrefab` hook, id `<base>+glaze`) that drops the old column and moves the wheel into the gnome's lap, without touching the shared catalogue prefab other games use (Lawn Prix uses the same mower). The rig puts two marker objects under the steering pivot; `reachArm` swings each arm pivot onto its marker (stretching a little), eased in and out, so the hands follow the wheel as it turns.
- **Prefab rule:** every mod is a library prefab (`glaze-<slot>-<id>`), none are hand-built in the game.
- **Online:** a `look` message (the loadout code) is sent when it changes and re-sent to each player who joins; remote vehicles wear it. Only the driver's vehicle is dressed; passengers need nothing.
- **Mobile:** the shop is a bottom sheet in portrait and a side panel in landscape, 44 px targets, safe-area insets, nothing hover-only. The showroom camera orbits the vehicle and the sheet leaves the upper screen free.

## Decisions

- *Ride height replaces the tuning option:* the Side-Valve garage keeps the other ten handling knobs (as "Handling", opened from the shop's last tab); the old "Ride height" knob (centre-of-mass height) is removed from it and is now the Pay 'n' Glaze ride height slider, which moves the body visually and sets that knob.
- *Issue #147 (nested pivots)* is implemented in epic 3: a pivot may be `{ at, parent }`; `buildPrefab` nests the groups, damage `hide`/`morph` reach child groups, and the steer variant keeps a pivot's parent. The suspension uses the rig's body shell (the wheels stay on the ground), so vehicle prefabs can now model spring -> knuckle -> wheel chains in data when a game wants per-wheel travel.
- *Showroom stage:* the shop warps the player to a set built from `glaze-stage-*` prefabs at x = 4000 (far off the 1800 m map) and back; the world sim keeps running around the real position (`simX/simZ` in `app.ts`).
- *Which vehicles:* the nine ground vehicles. Flyers and boats keep the old path (their `rig` is undefined).
- *The owned look follows the model:* a player's work is saved per vehicle model and worn by any vehicle of that model they drive (lore: Pay 'n' Glaze re-stamps the owner's loyalty number, R-052). NPC traffic is never changed by the shop.
- *Online by default:* done (look sync). *Mobile by default:* done. *Party slice:* not added (a customisation shop is not a 20-60 s round); backlog row says later.
- *Achievements:* five, with cosmetic gear rewards (`gta-new-coat`, `gta-slammed`, `gta-camber-gang`, `gta-show-pony`, `gta-full-glaze`).

## What this unlocks

Because every part hangs off named groups, later work can drive them: real suspension travel (the shell already moves), lowrider hops that lift the shell, wheel lean in corners, a gnome that reaches for the horn or the radio dial (`reachArm`), grip points for levers and handlebars in other games, and a loadout that changes with the story (a mayor's limousine, a police livery). Games that want it call `attachLoadout`; games that do not are untouched.

## Issues

Each issue is its own file (the worker reads it, then `_common.md`, `_prefabs.md` or `epic-2/_common2.md`):

- Epic 1: `epic-1/1A-loadout.md`, `1B-mounts.md`, `1C-paint.md`, `1D-decals.md`, `1E-wheels.md`, `1F-lamps.md`, `1G-fittings.md`, `1H-steer.md`, `1I-attach.md`, `1J-grips.md`, `1K-shop-widgets.md`, `1L-prefabs-tyres-rims.md`, `1M-prefabs-steer-lamps.md`, `1N-prefabs-spoilers-seats.md`, `1O-prefabs-ornaments.md`, `1P-prefabs-extras.md`, `1Q-prefabs-gear.md`, `1R-lore.md`.
- Epic 2: `epic-2/2A-vehicles.md`, `2B-mounts.md`, `2C-store-handling.md`, `2D-shop-garages.md`, `2E-panel-paint.md`, `2F-panel-wheels.md`, `2G-panel-lights.md`, `2H-panel-body.md`, `2I-app-camera.md`, `2J-net-look.md`, `2K-driver-hands.md`, `2L-achievements.md`.
