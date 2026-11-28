Epic: B (building) — E26 street racing
Depends on: epic A (meets.ts and cast.ts hold real data)
Agent: haiku-worker

(Paste `_env.md` here.)

## Goal
`buildMeet(scene, world, meet, cast, deps)` puts one street-race meet into the world from data: vignette props,
signs, the organiser, bookie, flag-dropper, residents and crowd as ambient gnomes, a few lights and props that say
"street race", and ambient sound; it returns an Area (update + map blip).

## Read first
- `games/gnome-theft-auto/src/streetRace/meetScene.ts` (stub, keep the signature), `streetRace/types.ts`
  (StreetMeet, MeetCast, MeetVignette, MeetPerson).
- `games/gnome-theft-auto/src/rutbottom/index.ts`: the pattern — `buildStaticCells(placed, { lights: false, name })`
  from `../cull` for static prefabs (`StaticPrefabPlacement`: id, x, y, z, yaw, scale), colliders pushed to
  `world.boxes` (`{ minX, maxX, minZ, maxZ, h }` with h = ground + height), `buildSignText(signs)` from
  `../pardonlin/town`, `createAmbientGnomes(scene, defs)` from `../ambientGnomes` (`.update(dt, px, pz)`), `playAt`
  from `../sound` (`playAt('crowd-murmur', { x, z }, { maxDist, gain })`), `heightAt` from `../terrain`.
- `games/gnome-theft-auto/src/rutbottom/plan.ts`: how signs (`buildSignText` input shape) and residents are written.
- `games/gnome-theft-auto/src/ambientGnomes.ts`: `AmbientGnomeDef` (id, name, x, z, yaw, look, bubble, idle?).

## Change (only `src/streetRace/meetScene.ts` and a new `src/streetRace/meetScene.test.ts`)
- Static props (one `buildStaticCells` call, name `meet-<id>`): every vignette's props at anchor + offset rotated by
  the anchor's yaw (local +z = facing: world = (x + dx*cos(yaw) + dz*sin(yaw), z - dx*sin(yaw) + dz*cos(yaw))), y =
  heightAt; plus dressing: 4 `site-cone` along the flagger's kerb line, a `tyre-pile` stack beside the bookie,
  and for meets with `night: true` 4 lamp props (grep `packages/prefabs/src/catalog` for a street lamp or lantern id
  that exists, e.g. search 'lamp') around the area edge. Every prop id must exist (`getPrefab(id)` from
  `@lawn/prefabs`; skip and `console.warn` an unknown id rather than throw).
- Colliders: for vignette props with a footprint wider than 0.8 m (measure with `new THREE.Box3().setFromObject(
  buildPrefab(id, { scale }))`), push a box collider of that footprint (no two colliders sharing a face: shrink each
  by 0.05 m).
- Signs: one per `meet.signs` spot with `cast.signs[i]` text (match buildSignText's input), facing the anchor's yaw.
- People: ambient gnomes for organiser (`meet.organiser`, id = cast.organiser.id), bookie, flagger, residents (zip
  `meet.residents` with `cast.residents`; bubble = their bubble), and crowd (each `meet.crowd` spot, look =
  `cast.crowdLooks[i % n]`, name 'Spectator', bubble from a short list of cheers you write, idle 'look-around' or
  another idle id that exists in `src/anim/types.ts`). For a `night` meet by day show only organiser, bookie, flagger,
  residents and a third of the crowd: build two ambient-gnome groups (always, crowd-night) and update the night group
  only when `night > 0.5` — if the ambient-gnome API cannot hide a group, keep all visible (note it).
- `update(dt, px, pz, night)`: update gnome groups; within 70 m of the centre play 'crowd-murmur' every ~2.5 s
  (gain 0.6, 1.1 at night for a night meet) and an engine rev now and then if a rev sound id exists (grep the sound
  module for ids; use only existing ones).
- `blips()`: `[{ x: centre.x, z: centre.z, color: '#ff3d7f', kind: 'speedway', label: meet.name }]`.
- `meetScene.test.ts`: build every meet from `MEETS` + `MEET_CAST` into a `new THREE.Scene()` with a minimal world
  `{ boxes: [] }` (cast as World) and AreaDeps no-ops; assert the scene got children, boxes were added, and no
  collider box contains a person's spot.

## Contract
`buildMeet(scene, world, meet, cast, deps): Area` (unchanged). Area from `../dirtCountry/types`.

## Done when
- `npx vitest run src/streetRace/meetScene.test.ts` passes; `npx tsc --noEmit -p .` passes.

## Out of scope
meets.ts, cast.ts, index.ts, any prefab catalog file.
