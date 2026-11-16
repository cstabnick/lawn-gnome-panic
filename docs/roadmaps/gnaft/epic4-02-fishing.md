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
Floating junk that comes close can be grabbed by hand with E (from the raft or while swimming), junk drifting under the raft rides visibly over the grass, planks and seven fun pieces of junk float by with their own models, and every catch goes through one rules function.

## Read first
- games/gnaft/src/fishing.ts: the current fishing system (you extend it; keep the hook, line, charge bar, splash rings, bottles)
- games/gnaft/src/config.ts: `GRAB`, `FUN`, `FUN_IDS`, `FunId`, `DebrisDef` (new optional `fun`), `DEBRIS`, `ITEMS`, `ItemId` (new 'plank', 'duck', 'statue'), `GameState.canGrab`, `PlayerState.swimming`, `KEYS.interact`, `RAFT_TOP`, `TILE_SIZE`
- games/gnaft/src/rules.ts: `collectDebris`, `tileAt`

## Change
- games/gnaft/src/fishing.ts:
  1. **One collect path.** Replace the inline collect code in the hook's "collect or snap" block (`revealIsland` / `addItem` / `notify` / `s.stats.caught++`) with `collectDebris(s, d.def)` (it adds items, counts the catch and pushes the toast). Sound after it: `sfx(d.def.bottle ? 'bottle' : d.def.fun === 'duck' ? 'quack' : 'catch')`. Use the same for grabbing.
  2. **Grab by hand.** Every frame: if `s.mode === 'play'`, find the nearest debris that is not snagged whose xz distance to `s.player.position` is `<= GRAB.reach`. Set `s.canGrab = target !== null` (set it false in every other mode). If there is a target and `input.pressed(KEYS.interact)`: `collectDebris`, the sound above, `spawnRing` at it, remove its mesh and splice it out. Works on the raft and while swimming.
     - Prompt: your own `<div id="rg-grab">` appended to `ctx.ui`, centred near the bottom (`position:absolute;left:50%;bottom:120px;transform:translateX(-50%)`), white bold text with a dark translucent background and padding, shown only with a target: `E — grab <name>` where name is `'Message in a bottle'` for bottles, `FUN[def.fun].name` for fun junk, else `ITEMS[def.item].name`.
     - The target pulses: scale `1 + 0.15 * Math.sin(t * 8)` (reset to 1 for the rest).
  3. **No fishing while swimming.** In 'idle', start charging only if `!s.player.swimming`. If the gnome is swimming while the hook is out, release snagged debris and go back to 'idle'.
  4. **Junk over the raft.** In the debris pose step, if `tileAt(s, d.pos.x, d.pos.z)` is a tile, set `d.pos.y = RAFT_TOP + 0.03` (no bob) so junk slides visibly across the grass instead of hiding under it.
  5. **New models** (three.js primitives, `castShadow = true`, roughly 0.3–0.9 m across, built once per kind and cloned like the existing templates):
     - `buildTemplate` must handle every `ItemId`: add 'plank' (a flat board 0.9 x 0.06 x 0.22, colour 0xb07a45, with two thin darker grain strips 0x8a5a2e on top), 'duck' and 'statue' (reuse the fun builders below).
     - Fun junk, keyed `'fun:' + id` in `templates`, chosen in `templateFor` when `def.fun` is set. Build each from its `FUN[id].look` description:
       - boot: brown (0x5b3a1e) box foot + taller box shaft, lying on its side, a thin light lace strip.
       - duck: yellow (0xffd23f) sphere body scaled flatter, smaller sphere head, orange (0xff8c1a) cone beak, two tiny black eye spheres.
       - chest: brown box (0.6 x 0.35 x 0.4) with a half-cylinder lid, gold (0xf2c230, metalness 0.6) bands and lock; add a blinking glint named `'sparkle'` like the bottle so it is noticed.
       - statue: small garden gnome: blue body cylinder, skin sphere head, white cone beard, red cone hat; lying on its back (rotate so it floats face up).
       - barrel: brown cylinder lying on its side with two dark grey torus hoops.
       - beachball: sphere radius 0.3 made of 4 coloured segments (red, white, blue, yellow) — e.g. 4 `SphereGeometry(0.3, 16, 12, phiStart, Math.PI/2)` pieces; it bobs 0.1 m higher than other debris.
       - toilet: white torus seat (radius 0.22) lying flat and a white flattened box lid standing up at its back.

## Contract
`export function createFishing(ctx: Ctx): System` (unchanged signature). `state.canGrab` is read by mowing.ts (it skips the hand cut on E while true).
Rule you call (already implemented, do not edit rules.ts):
```ts
/** Adds the junk's items (bottle: reveals an island; fun: FUN[fun].loot), increments stats.caught, pushes the toast, returns its text. */
collectDebris(s: GameState, def: DebrisDef): string
```

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/fishing.ts`.
- `grep -n "addItem\|revealIsland" games/gnaft/src/fishing.ts` finds no calls (collection only via `collectDebris`).

## Out of scope
rules.ts, config.ts, player.ts, building.ts, mowing.ts, hud.ts, every other file.
