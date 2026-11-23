Epic: 2 Parts
Depends on: none

## Environment
Read `docs/roadmaps/gta-race-track/_env.md` first.

## Goal
`createCrowd(scene, decks)` in `games/gnome-theft-auto/src/raceTrack/crowd.ts` fills grandstand decks with hundreds of
small cheering spectator gnomes, cheap enough for a phone: a few `THREE.InstancedMesh`es, animated only when the player
is near.

Why not prefabs: spectators are characters (a crowd effect), which the prefab rule leaves to the game; full
`@lawn/gnome` models would cost hundreds of draw calls.

## Read first
- `games/gnome-theft-auto/src/raceTrack/crowd.ts` (the stub; keep its exports)
- `games/gnome-theft-auto/src/raceTrack/track.ts`, search `interface Deck` (x, z = centre, y = surface height
  (absolute), yaw = the way the crowd faces, w = width across that facing, d = depth front to back)

## Change
`games/gnome-theft-auto/src/raceTrack/crowd.ts`:
- Fill each deck with a grid of spectators: rows 1.1 m apart front to back, 0.85 m apart across, a 0.3 m margin from
  the deck edges; jitter each by up to 0.12 m; skip ~12% at random (seeded PRNG, e.g. mulberry32 from a fixed seed, so
  the crowd is the same every load). Cap at 900 spectators in total (thin rows evenly if over).
- Each spectator is a tiny low-poly gnome about 0.9 m tall, made of three InstancedMeshes sharing instance matrices:
  body (a `CylinderGeometry(0.16, 0.26, 0.5, 6)` shirt), head (`IcosahedronGeometry(0.15, 0)` skin), hat
  (`ConeGeometry(0.17, 0.4, 6)`). Per-instance colour with `setColorAt`: shirt from a palette of 8 bright colours, hat
  mostly red 0xd8342c with some yellow 0xffd21f (Dandelion Fizz fans) and orange 0xff7a00 (Razor-Back fans), skin from
  3 tones. `MeshLambertMaterial({ vertexColors: false })` with instanceColor. One more InstancedMesh for raised arms is
  optional (two thin boxes per spectator) — skip it if it costs much.
- Facing: every spectator faces the deck's yaw.
- `update(dt, px, pz, excitement)`: if the player is more than 220 m from the decks' bounding centre, do nothing (set
  each mesh `.visible = false` beyond 450 m). Otherwise animate: each spectator bobs (jump height
  `0.05 + 0.25 * excitement` m) and sways, with its own phase; a wave ("Mexican wave") runs along each deck when
  excitement > 0.5. Update the instance matrices and `instanceMatrix.needsUpdate = true` at most 30 times a second.
- `castShadow = false`, `receiveShadow = false`, `frustumCulled` default (set a bounding sphere that covers all decks:
  call `computeBoundingSphere()` after filling the matrices).
- Add `games/gnome-theft-auto/src/raceTrack/crowd.test.ts`: two decks (one 20 x 4, one 10 x 6, at different yaws),
  assert the scene got 3 (or 4) InstancedMeshes whose `count` equals the number of spectators (between 60 and 200 for
  these decks), the same count on a second build (seeded), and `update` with the player far away leaves the matrices
  unchanged.

## Contract
`export interface Crowd { update(dt, px, pz, excitement): void }`, `export function createCrowd(scene, decks): Crowd`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files
- `npx vitest run src/raceTrack/crowd.test.ts` (from `games/gnome-theft-auto`) passes

## Out of scope
Every other file.
