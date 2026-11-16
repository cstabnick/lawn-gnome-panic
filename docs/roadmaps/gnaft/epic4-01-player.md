Epic: 4. Swim, grab, planks and sheds
Depends on: none

## Environment
- Repo: `C:\Users\cpsai\cstabnick\lawn-gnome-panic` (Windows, Git Bash). Game: `games/gnaft` (Vite + TypeScript strict + three@0.187.0). If `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed: do not run `npm install` or add packages.
- **Other workers are editing other files in `games/gnaft/src` at the same time.** Edit ONLY the file(s) listed under Change. Never edit `config.ts`, `rules.ts`, `input.ts`, `main.ts`, `gnome.ts`, `mowerModels.ts` or another system's file unless your Change section lists it. A constant you need that is not in config.ts: declare it as a local `const` at the top of your file.
- Keep every existing exported function name and signature in your file exactly.
- Do not run `vite build`, `npm run dev`, or start any server. Do not `git commit`.
- All art is generated in code from three.js primitives (`MeshStandardMaterial`, `BoxGeometry`, `CylinderGeometry`, `ConeGeometry`, `SphereGeometry`, ...). No external assets. Set `castShadow = true` on solid meshes above the water.
- UI rule: if you create DOM, append your own container to `ctx.ui` (the shared `#ui` element) and style only your own elements inline. Never restyle, hide or clear `#ui` itself. `#ui` has `pointer-events:none`; set `pointer-events:auto` on your own clickable elements only.

## World conventions (read config.ts and rules.ts for the exact types)
- Each system is `createX(ctx: Ctx): System` with `System = { update(dt: number): void }`. `main.ts` calls, every frame and in this order: ocean, daynight, weather, raft, player, mowing, fishing, building, seagull, shark, navigation, minimap, objectives, music, save, hud; then `input.endFrame()`, then renders. `tickWorld` (day time, grass growth with rain/sprinkler multipliers, sea movement, docking) is already called by main before the systems, except in 'title'.
- Other state worth knowing (config.ts `GameState`): `dayTime` (0 sunrise, 0.25 noon, 0.5 sunset, 0.75 midnight), `raining`, `props` (sprinklers/flamingos on tiles), `stats` (cut, caught, tilesLost, gullsScared, sharksBonked), `won`, `time` (seconds played). Helpers in rules.ts: `sunHeight`, `nightAmount`, `edgeTiles`, `removeTile`, `revealIsland`, `raftExtent`, `tileAt`, `propAt`, `canBuild`.
- The raft never moves in the 3D scene: it stays around the origin and the sea moves past it. Raft tile (i, j) has its centre at world `(i * TILE_SIZE, RAFT_TOP, j * TILE_SIZE)`, TILE_SIZE = 2, RAFT_TOP = 0.3. Water surface is y = 0. The raft's velocity through the sea is `raftVelocity(state)` (rules.ts); things floating in the water move at `FISHING.current - raftVelocity`. Islands are drawn at `islandRelPos(state, id)`.
- `state.mode`: `'title' | 'play' | 'build' | 'telescope' | 'craft'`. A system only switches into its own mode from `'play'` and back to `'play'`.
- Player: `state.player.position` (feet, THREE.Vector3), `.velocity`, `.facing` (rotation.y; facing direction is `(Math.sin(facing), 0, Math.cos(facing))`).
- Input (`ctx.input`, src/input.ts): `down(code)`, `pressed(code)`, `mouseDown(0)`, `mousePressed(0)`, `mouseReleased(0)`, `look()` -> `{dx, dy}` pixel deltas (only while pointer-locked), `locked()`, `requestLock()`, `exitLock()`. Key codes are in `KEYS` in config.ts.
- Messages: `notify(state, text)` from rules.ts shows a toast. Sounds: `import { sfx, setEngine, startAudio } from './audio'`; `sfx(name: SfxName)`.
- Type-check: `npx tsc --noEmit -p games/gnaft`. Only errors in YOUR file(s) matter; errors elsewhere may be other workers mid-edit.


## Goal
The gnome can walk off the raft into the sea and swim (drifting with the water), climb back onto the raft or any island, walk across islands (carried along as the island moves past), stand on plank floors and be blocked by plank walls.

## Read first
- games/gnaft/src/player.ts: the current player system (you change its movement part; keep zoom, sprint, puffs, camera, title orbit)
- games/gnaft/src/config.ts: `PlayerState` (new `swimming: boolean`), `SWIM`, `SHED`, `FISHING.current`, `TUNING`, `TOOLS`, `KEYS`
- games/gnaft/src/rules.ts: `surfaceY`, `wallBlocks`, `tileAt`, `islandAt`, `raftVelocity`, `notify`
- games/gnaft/src/audio.ts: only the `sfx(name)` export (names include 'swim' and 'splash')

## Change
- games/gnaft/src/player.ts, inside `update` (the `moving` branch and the gravity/safety code after it):
  1. **Ground height.** Replace every use of `RAFT_TOP` as "the floor" with `surfaceY(s, x, z)` (rules.ts): it returns the height to stand on at (x, z) (RAFT_TOP on grass or island, RAFT_TOP + SHED.FLOOR_THICK on a plank floor) or `null` over open water. Landing from a jump: when falling and `p.position.y <= ground` (ground not null), snap to ground. While grounded and walking, if the ground under the new position differs by less than 0.3 m, set `p.position.y` to it (steps up onto floors).
  2. **Walls.** A walking step on each axis is rejected (velocity on that axis set to 0) when `wallBlocks(s, p.position.x, p.position.z, nx, nz, WALL_MARGIN, p.position.y)` is true, where (nx, nz) is the candidate position on that axis (x step: `(nx, p.position.z)`, z step: `(p.position.x, nz)`). Apply the same check while swimming.
  3. **Walking off the edge.** Steps are no longer rejected because the cell ahead is water (remove the `isWalkable` gate on movement). If after moving the gnome is grounded but `surfaceY` is null under its feet, it starts falling (`grounded = false`). When a falling gnome with no ground under it reaches `y <= SWIM.feetY`, it starts swimming: `swimming = true`, `velocity.y = 0`, `grounded = true`, `jumpsUsed = 0`, `sfx('splash')`.
  4. **Swimming** (`p.swimming === true`, in 'play'/'build'):
     - Move with WASD relative to the camera as now, at `SWIM.speed` (no sprint, no tool speedMult). No jumping.
     - Drift with the water every frame: add `(FISHING.current.x - rv.x) * SWIM.driftMult * dt` and `(FISHING.current.z - rv.z) * SWIM.driftMult * dt` to x/z, where `rv = raftVelocity(s)`.
     - `p.position.y = SWIM.feetY + Math.sin(elapsed * 2) * SWIM.bob`.
     - Climb out: if the movement direction is non-zero and `surfaceY(s, p.position.x + dx * SWIM.climbReach, p.position.z + dz * SWIM.climbReach)` is not null (dx, dz = normalized input direction) and no wall blocks that step, move the gnome to that point, set y to that surface, `swimming = false`, `grounded = true`, `sfx('swim')`. Also climb out if `surfaceY` under the gnome's current position is not null (e.g. an island drifted under it).
     - Rescue: if `Math.hypot(p.position.x, p.position.z) > SWIM.rescueDistance` and there is no ground under the gnome, move it to the centre of the raft tile nearest the origin (`t.i * TILE_SIZE, surfaceY or RAFT_TOP, t.j * TILE_SIZE`), `swimming = false`, `grounded = true`, and `notify(s, 'You grabbed the safety rope and hauled yourself back aboard.')`.
     - Every 0.5 s while swimming and moving, `sfx('swim')`.
  5. **Carried by islands.** When the gnome is not swimming and stands on island ground (`tileAt(s, x, z) === undefined` and `islandAt(s, x, z) !== null`), the island moves through the scene at minus the raft velocity: add `-rv.x * dt`, `-rv.z * dt` to x/z each frame (in every mode except 'title'), so the gnome stays on the island while the raft drifts away.
  6. **Remove** the old "Safety: standing on something that is no longer walkable ... move to the nearest raft tile" block; falling into the water (step 3) replaces it.
  7. No grass puffs while swimming. Apply `RIDING_SEAT_Y` only when not swimming.
  8. `p.swimming` must be false whenever the gnome is on ground; set it only in the places above.

## Contract
`export function createPlayer(ctx: Ctx): System` (unchanged signature). Other systems read `state.player.swimming` (mowing hides the mower, fishing blocks casting while it is true).
Rules you call (already implemented in rules.ts, do not edit it):
```ts
surfaceY(s: GameState, x: number, z: number): number | null
wallBlocks(s: GameState, x: number, z: number, nx: number, nz: number, margin: number, y?: number): boolean
islandAt(s: GameState, x: number, z: number): IslandId | null
tileAt(s: GameState, x: number, z: number): Tile | undefined
raftVelocity(s: GameState): { x: number; z: number }
```

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/player.ts`.
- Reading your code: walking off a raft edge leads to `swimming = true`; swimming toward a tile climbs out; nothing teleports a grounded gnome back to the raft any more except the rescue rule.

## Out of scope
rules.ts, config.ts, fishing.ts, building.ts, mowing.ts, every other file.
