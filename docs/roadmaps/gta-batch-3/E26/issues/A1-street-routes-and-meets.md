Epic: A (foundations) — E26 street racing
Depends on: none
Agent: Sonnet (route design)

(Paste `_env.md` here.)

## Goal
Five street race routes that follow real road centre lines (replacing the placeholder shapes), a test that proves it,
and the real spots for the three street-race meets.

## Read first
- `games/gnome-theft-auto/src/raceTrack/trackDef.ts`: TrackDef fields, createTrack, `relief: 'none'`, gates, gridSlot
  (two columns at lat +-3.2, rows 9 m apart, behind startS()-8), centripetal Catmull-Rom through `control`.
- `games/gnome-theft-auto/src/raceTrack/defs/streets.ts`: the placeholder defs you replace (keep the export names).
- `games/gnome-theft-auto/src/raceTrack/tracks.test.ts`: the rules every track must pass (samples ~1 m apart, gates in
  order, a lap counted, 4 grid slots on the road behind the line, parts of the track never closer than
  2 * barrierOffset + 6 when 90+ samples apart, surface on the centre line).
- `games/gnome-theft-auto/src/config.ts`: `ROAD_LINES` [-180..180 step 60] (Turfton grid roads along x = v and z = v,
  |x|,|z| <= CITY_HALF 215, width 10), `HIGHWAYS` (polylines `{ id, points: [x, z][], width }`), `highways/skyways.ts`
  `SKYWAYS` (turfton-skyway: ground foot (-219,-30), landing (-219,-60), deck along z -60 from x -188 to 360, then
  (400,-46), (480,-46), (535,-46), (550,-31), foot (550,20); width 11).
- `games/gnome-theft-auto/src/streetRace/types.ts` (StreetMeet) and `streetRace/meets.ts` (stub you replace).
- For the world in tests: `buildWorld(new THREE.Scene(), {} as never)` from `src/world.ts` gives `world.roads.nodes`
  (road graph: `{ id, x, z, links: number[], deck?: string }`) and `world.boxes` (`{minX,maxX,minZ,maxZ,h}`); see how
  `src/crowds.test.ts` or `src/traffic.test.ts` build it. `heightAt(x, z)` from `src/terrain.ts`.

Useful highway ids (from HIGHWAYS): ring-ne [300,40]→[40,-330], ring-nw [0,-400]→[-400,0], ring-sw [-320,20]→[-40,320],
ring-se [60,450]→[300,40], west [-180,0]→[-570,-30], east [180,0]→[570,30], north [0,-180]→[-20,-570],
south [0,180]→[40,570], east-band-south [940.44,55.99]→[950,960], south-band-east [0,960]→[950,960],
east-band [870,50]→[924,42], east-outer [570,30]→[870,50], Pardonlin: pl-rue-haute [-1460,-440]→[-1500,436] (width 7),
pl-boulevard / pl-rue-ouest [-1690,-420]→[-1705,380], pl-rue-a [-1578,-300]→[-1455,-300], pl-rue-d
[-1580,250]→[-1466,250], pl-pont-nord [-1578,-300]→[-1760,-300], pl-pont-sud [-1580,250]→[-1765,250], pl-quai-nord,
pl-quai-sud, roundabouts (roundabout/hatwheel at (-1555,-50), roundabout/place-du-pot at (-1500,436),
roundabout/anthill-ring at (940,24)). Print the full point lists yourself in a scratch test when you need them
(delete it afterwards).

## Change
- `src/raceTrack/defs/streets.ts`: replace the five placeholder defs (keep export names KERB_ROW_CIRCUIT,
  SKYWAY_SPRINT, RING_ROAD_RUN, PARDONLIN_BOUCLE, SALTBUCKET_DASH, ids and names) with routes over real roads.
  Every def: `relief: 'none'`, `surface: 'asphalt'`, `jumps: []`, no lift/bank/whoops/fords, `shoulder: 0`, `fade: 0`,
  `width` = the road's width (10, or 7 in Pardonlin), `barrierOffset` = width / 2 + 1, gates 8..12.
  - kerb-row-circuit: a downtown Turfton circuit of 1.0..1.6 km on the grid roads, with at least 6 corners and one
    chicane-like double turn; start/finish on a long straight. Ease each 90° corner with control points ~8 m before
    and after the crossing so the line stays inside the junction.
  - skyway-sprint: point to point, ~0.8..1.1 km: start on the ground road at the Skyway's west foot (grid on flat
    ground road behind the line), climb the ramp at (-219,-30)→(-219,-60), run east along the deck, finish on the deck
    or at the east foot (550,20). Mind that the corner at (-219,-60)→(-188,-60) is sharp (ease it).
  - ring-road-run: a circuit of 1.8..2.6 km mostly on the ring-* highways (lore: the Carburettors' illicit time trial
    on the Ring Road), closing the loop with the shortest connecting roads; start/finish within ~350 m of the Skyway's
    west foot if the roads allow it, else wherever the ring is straightest.
  - pardonlin-boucle: a Pardonlin town circuit of 1.2..1.8 km (e.g. Rue Haute, a bridge, the Boulevard, another
    bridge back), width 7.
  - saltbucket-dash: point to point 1.5..2.2 km from near the anthill roundabout's south side down east-band-south and
    west along south-band-east (do not drive through a roundabout ring; start south of it).
  Routes must not cross themselves in a way that breaks the "never closer" rule; an open route may not loop back.
- `src/raceTrack/streetTracks.test.ts` (new): builds the world once (`buildWorld`), and for every id in
  `STREET_TRACK_IDS` checks: every 4th sample is within `width / 2 + 1.5` m of a road-graph segment (a link between two
  `world.roads.nodes`; a deck link counts for the Skyway), and the 4 grid slots are on a road too. Report the worst
  sample (id, s, distance) in the failure message. Also checks track length is in the ranges above.
- `src/streetRace/meets.ts`: replace the stub with real spots (keep `MEETS` and `meetOfTrack` exports and the
  StreetMeet shape):
  - `skyway-foot` "The Skyway Foot": open ground or a lot beside the road near the Skyway's west foot (-219,-30), on the
    west side of Turfton, `night: true`, tracks ['kerb-row-circuit', 'skyway-sprint', 'ring-road-run'] — tracks[0]'s
    grid should be close (< 250 m) if possible, else reorder so tracks[0] is the closest grid. Do NOT use the area
    under the Unfinished Span (x ~610): another epic builds there.
  - `pardonlin` (name it after the square or quay it sits on), tracks ['pardonlin-boucle'].
  - `saltbucket` (a roadside lay-by on the band road, name it), tracks ['saltbucket-dash'].
  Each meet: `area` (hw, hd 14..30 m) wholly off every road (no road-graph segment within road half width + 2 of any
  point of it), clear of `world.boxes` at spots; organiser, bookie (3..6 m apart), flagger beside tracks[0]'s grid
  slot 0 (off the road edge, 1.5 m beyond the kerb, facing the cars), crowd 8 spots along the kerb near the grid facing
  the road, residents 2 spots, vignettes 3 spots (each with ~4 m clear around it), signs 4 spots (facing the road),
  all inside `area` except flagger and crowd (which stand along the grid's kerb).
- `src/streetRace/meets.test.ts` (new): for each meet: every spot is clear of world.boxes (point test with 0.6 m
  margin), not on a road (distance to every road segment > its half width + 0.5), not in water (`waterAt` from
  `src/terrain.ts` returns null or a depth < 0.05), and tracks[0]'s grid slot 0 is within 60 m of the flagger.

## Contract
TrackDef / StreetMeet as in `streetRace/types.ts` and `raceTrack/trackDef.ts` (do not change them). Ids:
`kerb-row-circuit`, `skyway-sprint`, `ring-road-run`, `pardonlin-boucle`, `saltbucket-dash`; meets `skyway-foot`,
`pardonlin`, `saltbucket`.

## Done when
- `npx vitest run src/raceTrack/tracks.test.ts src/raceTrack/streetTracks.test.ts src/streetRace/meets.test.ts src/capwood`
  passes (from games/gnome-theft-auto).
- `npx tsc --noEmit -p .` passes.
- Report: each route's length, gate count, start position, and each meet's centre.

## Out of scope
`tracks.ts` (already registers the five ids), `trackDef.ts`, everything under `quests/`, `streetRace/` files other
than meets.ts / meets.test.ts.
