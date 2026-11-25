# E15 contracts: Hedgeworth Links

What E15 gives later epics (E18 activities, E20/E21 story quests #29 m29-the-kicked-board, #47 m47-hedgeworth-links,
#48 m48-the-groundskeepers-secret, #52 m52-the-test-cut, E22 lore). Code under `games/gnome-theft-auto/src/golf/` and
`packages/golf/`. World: +x east, +z south; yaw 0 faces +z.

## `@lawn/golf` (packages/golf)

Pure, no three.js, no DOM. Gnome Golf and Gnome Theft Auto both import it.

```ts
import { simulateShot, previewShot, swingTap, swingStep, scoreName, seededWindFrom, restingSpot, seaMowerCatch,
  featureLie, createCourse, distToPath, holeLength, estimateCarry, powerFor, CLUBS, CLUB_ORDER, LIES, PHYS, SWING,
  type CourseEnv, type HoleDef, type ShotResult, type Lie, type ClubId, type Shot, type Wind } from '@lawn/golf';

simulateShot(env: CourseEnv, start: Vec3, shot: Shot, lie: Lie, wind: Wind, pin: {x,z}, opts?): ShotResult
// CourseEnv = { heightAt(x,z), gradientAt(x,z), lieAt(x,z), collide?(p, v, r) } in yards on your own frame.
```

A new course is a `CourseEnv` (see `games/gnome-theft-auto/src/golf/course.ts` for a flat yard with tilted greens and
`featureLie` for the lies). Size rules and API: `packages/golf/README.md`.

## Places (`golf/types.ts`)

| What | Where | Notes |
|---|---|---|
| Hedgeworth Links | E01 site `golf-yard`, `YARD` x -1360..-1000, z 410..830 | flat ground ~y -2.25; board fence 2.6 m, 1 m inside |
| The Kicked Board | `KICKED_BOARD` (-1001, 640) | site anchor `breach` (moved from (-895, 640)); breaks for a vehicle >= 5 m/s or a kick; saved |
| The Members' Gate | `MEMBERS_GATE` (-1001, 500) | site anchor `approach` (-1000, 500); always locked |
| Clubhouse | `CLUBHOUSE` (-1060, 446), door (-1060, 455) south | interior `hedgeworth-clubhouse` (22 x 14), Peony's home |
| Basil's cottage | `PRO_COTTAGE` (-1100, 444) | by the first tee, Basil's home |
| Thrift's shed | `SHED` (-1048, 605), door west | by the "ninth" green, Thrift's home, a mole tunnel mouth |
| Cart shelter, 2 golf carts | `CART_SHELTER`, `CART_SPOTS` | carts are ordinary `golf-cart` vehicles |
| Holes | `HOLES` (index 0..3, card numbers 1, 2, 3, 9) | tee, path, green (tilted), pin, bunkers, ponds; par 16 |
| People | `PEOPLE_SPOTS` peony / basil / thrift | quest givers `peony`, `basil`, `thrift`; CAST keys and intro cards |
| Lost balls, molehills | `LOST_BALLS` (8), `MOLEHILLS` (4) | picked / patted with E; saved |

`inPlay(x, z, margin)` says whether a point is on a tee, fairway, green, hazard or cart path (keep scenery off).

## Hooks for story quests

```ts
import { golfApi } from '../golf/runtime';
golfApi()?.startRound(hole = 0): string | null   // ball on that tee, player beside it; null = started, else why not
golfApi()?.breakBoard(); golfApi()?.boardBroken(); golfApi()?.inRound(); golfApi()?.quitRound()
golfApi()?.onHole((e: { hole, strokes, par }) => ...): () => void   // e.g. m47 "beat Basil at a hole": strokes < par + 1
```

- The planned objective kind `golf-hole` (E04) = a `probe` objective on the golf save (`city/probes.ts`):
  `golf-board-broken` (0/1), `golf-holes-played`, `golf-par-holes`, `golf-rounds`, `golf-balls-found`,
  `golf-molehills`. m29 "find the loose board and go through": `probe golf-board-broken absolute 1`. m47 "beat Basil at a
  hole": `probe golf-par-holes count 1` (or `onHole` for a stricter rule). The quest sim solves all six through the save.
- Side quests: `sq-hedgeworth-lost-balls`, `sq-hedgeworth-pro-lesson`, `sq-hedgeworth-ninth-green`,
  `sq-hedgeworth-members-cup` (`quests/golfQuests.ts`), unlocked after existing story quests for now: E20/E21 move them
  to the schedule's rows (#29, #49, #50, #52). `sq-hedgeworth-reseed` (#56) needs E21's W14 mown scar: not built.
- W14 (world change after #50-#52): "one dead-straight mown scar across the course, ending at the broken hedge": E21
  can draw it over the course with a `LAYER.decal` strip and mow the tall grass along it (flora).

## Save, achievements, app, map

- `gta-golf-v1` (`golf/save.ts`, in `GTA_SAVE_KEYS` and cloud MERGES with `mergeGolfSave`).
- Achievements: `gta-kicked-board` (back: kicked-board-plank), `gta-hedgeworth-card` (neck: scorecard-lanyard),
  `gta-hedgeworth-ace` (head: argyle-tam), `gta-birdie-birdie` (hand: driver-cane), `gta-through-the-hedge`
  (back: golf-bag-pack), `gta-groundskeepers-secret` (4 molehills; head: hosepipe-cap).
- Gnomlet app `hedgeworth`. Map place kind `golf`. Dev: `?golf=1..4` starts a round on that hole.
- Sounds: `golf-tock`, `golf-putt`, `golf-cup`, `golf-splash-reed`, `board-crack`, `hedge-rustle`, `sprinkler-hiss`.

## Online

Rounds, strokes and the board are local (per save). Others see the golfer standing and the carts as relayed vehicles.
A shared ball (other players' shots in flight) is deferred.

## Lore

R-189 (gnome yards), R-190 (four holes numbered 1, 2, 3 and 9), R-191 (the Kicked Board, the Members' Gate, the pond
mower); entries `hosepipe-pond`, `the-members-gate`, `gnome-yard`; Hedgeworth's entries updated as built.
