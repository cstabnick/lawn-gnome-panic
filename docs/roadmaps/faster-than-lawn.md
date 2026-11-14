# Roadmap: faster-than-lawn

## Goal

A prototype in `games/faster-than-lawn/`: real-time-with-pause crew and systems tactics, in the genre of spaceship-crew roguelikes, with gnomes riding lawn mowers. The player's mower has rooms (seat, engine, hedge shields, guns, mushroom medbay). Power is split between systems from a reactor; weapons charge and fire at enemy rooms; shields block blaster shots; hits damage systems, hurt gnomes and start fires; gnomes walk between rooms to man, repair and extinguish. Between fights the mower hops across a back-yard map of beacons (fights, text events, a shop) to the Garden Gate boss. Original names and art, all generated in code.

Question it answers: is juggling power, aim and gnomes in a pausable mower fight fun?

Stack: Vite 8.3.8, TypeScript 7.0.2, Phaser 4.2.1, vitest 5.1.0. Dev port 5181.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (written by the planner) | Scaffold, `config.ts`, sim types, ship templates, weapon/event data, run state, read-only queries, a button helper, and stubs for every file epic 2 fills in. Builds. | 0 (planner) |
| 2. Features | Combat rules, enemy AI + map generation, rendering, combat HUD/scene, map/event/shop scenes, title/game-over/audio. Builds and plays end to end. | 6, parallel |
| 3. Playtest fixes | Planner runs it headless, fixes breakage. | planner |

No dependencies inside epic 2. Every issue owns its own files and talks to the others only through the foundation files (read-only in epic 2) and the stub signatures.

Files per issue (no overlaps):

| Issue | Changes |
|---|---|
| 2.1 | src/sim/combat.ts, src/sim/combat.test.ts |
| 2.2 | src/sim/ai.ts, src/sim/sector.ts, src/sim/sector.test.ts |
| 2.3 | src/scenes/BootScene.ts, src/render/combatView.ts |
| 2.4 | src/ui/combatHud.ts, src/scenes/CombatScene.ts |
| 2.5 | src/scenes/MapScene.ts, src/scenes/EventScene.ts, src/scenes/ShopScene.ts |
| 2.6 | src/scenes/TitleScene.ts, src/scenes/GameOverScene.ts, src/audio.ts, README.md |

Checks: `npx tsc --noEmit -p .` (all), `npx vitest run <own test file>` (2.1, 2.2). No servers, no `vite build` until the end-of-epic check.

---

## Shared text pasted into every issue

ENVIRONMENT:
- Repository root: /home/user/lawn-gnome-panic (Linux; node and npm are on PATH). Game folder: games/faster-than-lawn. Run commands from the game folder.
- Dependencies are installed. Do not run npm install or add dependencies.
- Stack: Phaser 4.2.1, TypeScript strict, Vite 8, vitest 5. Import Phaser as `import Phaser from 'phaser';`.
- Five other workers are editing other files in this game right now. Edit ONLY the files under "Change". These are shared and READ-ONLY for you: src/config.ts, src/sim/types.ts, src/sim/queries.ts, src/sim/data.ts, src/sim/ships.ts, src/sim/events.ts, src/run.ts, src/ui/button.ts, src/main.ts.
- Other files may still be stubs while you work; their exported signatures are final. Code against the signatures. Keep the exported signatures of your own files exactly as in the stub.
- Do not run `vite build`, `npm run build` or a dev server. Do not git commit. All graphics/sounds are generated in code; no asset files.

PHASER NOTES (for scene/render issues): Phaser 4 differs from older versions; stick to these calls, which work in 4.2.1:
`this.add.rectangle(x,y,w,h,color,alpha)` (origin is centre; `.setOrigin(0,0)` for top-left), `.setStrokeStyle(width,color,alpha)`, `.setFillStyle(color,alpha)`, `this.add.text(x,y,str,{ color:'#fff', fontSize:'16px', wordWrap:{ width: 600 } })`, `.setText() .setColor() .setOrigin() .setDepth() .setVisible() .setAlpha()`, `this.add.image(x,y,key)`, `.setTint(color) .clearTint() .setScale()`, `this.add.graphics()` with `fillStyle/fillRect/fillCircle/fillEllipse/fillTriangle/lineStyle/strokeRect/strokeEllipse/lineBetween/clear/generateTexture(key,w,h)`, `this.add.container(x,y,[children])`, `obj.setInteractive({ useHandCursor: true })` then `obj.on('pointerdown', (p: Phaser.Input.Pointer) => ...)` / 'pointerup' / 'pointerover' / 'pointerout', `this.tweens.add({ targets, alpha, y, scale, duration, yoyo, repeat, onComplete })`, `this.time.delayedCall(ms, fn)`, `this.cameras.main.shake(ms, intensity)`, `this.input.keyboard!.on('keydown-SPACE', fn)` (also keydown-ESC, keydown-ONE..FOUR), `this.add.particles(0,0,key,{ speed:{min,max}, lifespan, scale:{start,end}, emitting:false })` then `.explode(count,x,y)`, `this.scene.start(key, data)`, `this.scene.restart()`. Do not use pipelines, postFX, preFX, setTintFill or BitmapText. Scenes are restarted, so reset all fields in `create()`.

---

## Epic 2: Features

### 2.1 Combat rules (src/sim/combat.ts)

~~~~text
Epic: 2 Features
Depends on: none

## Environment
<ENVIRONMENT block above>

## Goal
Implement the combat rules in src/sim/combat.ts (pure TypeScript, no Phaser) and cover them with vitest tests in src/sim/combat.test.ts.

## Read first
- src/sim/combat.ts: the stub. Keep every exported signature exactly; replace the bodies. createCombat is already final.
- src/sim/types.ts: all state types (ShipState, SystemState, Room, Crew, WeaponState, Projectile, CombatEvent, CombatState).
- src/sim/queries.ts: helpers you must use: effectivePower, freePower, crewInRoom, isManned, shieldMax, evasion, weaponChargeTime, jumpReady.
- src/config.ts: TUNING (all numbers below come from it).
- src/sim/data.ts: WEAPONS (look up a WeaponDef by weapon.defId). src/sim/ships.ts: makePlayerShip, makeEnemyShip for tests.

## Change
- src/sim/combat.ts, implement:
  setSystemPower(ship, id, power): clamp power to 0..(level - damage), and to at most current power + freePower(ship). If the clamped value differs from current, set it and return true; else false.
  toggleWeaponPower(ship, index): w = ship.weapons[index] (return false if missing), def = WEAPONS[w.defId], sys = ship.systems.weapons.
    If w.powered: w.powered = false, w.chargeMs = 0, sys.power -= def.power, return true.
    Else if sys.power + def.power <= sys.level - sys.damage and freePower(ship) >= def.power: w.powered = true, sys.power += def.power, return true. Else false.
  setWeaponTarget(ship, index, roomId): if the weapon exists set its targetRoomId.
  moveCrew(ship, crewId, roomId): find crew (alive) and room; return if either missing, or if the crew is standing (moveMsLeft <= 0) in roomId already.
    from = crew.moveMsLeft > 0 ? crew.fromRoomId : crew.roomId. dist = |rooms[from].x - rooms[roomId].x| + |rooms[from].y - rooms[roomId].y|.
    crew.fromRoomId = from; crew.roomId = roomId; crew.moveMsTotal = Math.max(1, dist) * TUNING.crewMoveMsPerTile; crew.moveMsLeft = crew.moveMsTotal.
  jumpAway(state): if state.outcome === 'ongoing' and jumpReady(state): outcome = 'fled', return true. Else false.
  stepCombat(state, dtMs, rng): return at once if outcome !== 'ongoing'. Never clear state.log (CombatScene does). Order:
   1. state.elapsedMs += dtMs.
   2. For ship of [state.player, state.enemy] (other = the opposite ship):
      a. Walking: for each crew with moveMsLeft > 0: moveMsLeft = max(0, moveMsLeft - dtMs); when it reaches 0 set fromRoomId = roomId.
      b. Damage removes power: for each system except weapons: power = min(power, max(0, level - damage)). Weapons: cap = max(0, level - damage); while (sum of WEAPONS[w.defId].power over powered weapons) > cap, unpower the LAST powered weapon (powered=false, chargeMs=0). Then systems.weapons.power = that sum.
      c. Shields: max = shieldMax(ship). If shieldLayers > max, shieldLayers = max. If shieldLayers < max: shieldChargeMs += dtMs * (isManned(ship,'shields') ? 1.25 : 1); if shieldChargeMs >= TUNING.shieldRechargeMs: shieldLayers += 1, shieldChargeMs = 0. Else shieldChargeMs = 0.
      d. Weapons: for index i, weapon w with def: if !w.powered continue. w.chargeMs = min(w.chargeMs + dtMs, weaponChargeTime(ship, w)). If w.chargeMs >= weaponChargeTime(ship, w) and w.targetRoomId !== null and other.rooms[w.targetRoomId] exists and (def.kind !== 'lobber' or ship.pinecones >= 1): if lobber, ship.pinecones -= 1. For s in 0..def.shots-1 push a Projectile { id: state.nextId++, from: ship.side, defId: def.id, targetRoomId: w.targetRoomId, travelMsTotal: TUNING.projectileTravelMs + s*150, travelMsLeft: same } and log { type:'fired', from: ship.side, defId: def.id, weaponIndex: i, projectileId: id }. Then w.chargeMs = 0.
      e. Fires: for each room with fire > 0: n = crewInRoom(ship, room.id).length; room.fire -= TUNING.fireExtinguishPerCrewPerSec * n * dtMs/1000. Each crew whose roomId === room.id (standing or walking) loses TUNING.fireCrewDps * dtMs/1000 hp. room.fireTickMs += dtMs; if fireTickMs >= TUNING.fireDamageIntervalMs: fireTickMs -= interval and, if room.system, that system's damage = min(level, damage + 1). If room.fire <= 0: fire = 0, fireTickMs = 0.
      f. Repair: for each room with a system whose damage > 0 and room.fire === 0: n = crewInRoom(...).length; if n > 0: room.repairMs += dtMs * n; if repairMs >= TUNING.repairMsPerPoint: damage -= 1, repairMs = 0, log { type:'repaired', side: ship.side, roomId }. If the system's damage is 0, room.repairMs = 0.
      g. Medbay: p = effectivePower(ship.systems.medbay); if p > 0, the medbay room is the room with system 'medbay': each crew standing in it gains TUNING.medbayHealPerSecPerPower * p * dtMs/1000 hp, capped at maxHp.
   3. Projectiles: for each projectile: travelMsLeft -= dtMs. If travelMsLeft <= 0, resolve and remove it. target = projectile.from === 'player' ? state.enemy : state.player; room = target.rooms[targetRoomId]; def = WEAPONS[defId].
      - if rng() < evasion(target): log { type:'miss', target: target.side, roomId }.
      - else if def.kind === 'blaster' and target.shieldLayers > 0: shieldLayers -= 1, shieldChargeMs = 0, log { type:'shieldBlock', ... }.
      - else hit: target.hull = max(0, hull - def.damage); if room.system: system.damage = min(level, damage + def.damage). Every crew with roomId === room.id loses TUNING.crewDamagePerHit * def.damage hp. If room.fire === 0 and rng() < def.fireChance: room.fire = 100, log { type:'fireStarted', side: target.side, roomId }. Log { type:'hit', target: target.side, roomId, damage: def.damage } (log the hit before fireStarted is fine either way).
   4. Deaths: for both ships remove crew with hp <= 0, logging { type:'crewDied', side, crewId, name } for each.
   5. Jump: if isManned(player,'pilot') and effectivePower(player.systems.pilot) >= 1 and effectivePower(player.systems.engines) >= 1: state.jumpChargeMs = min(TUNING.jumpChargeMs, jumpChargeMs + dtMs).
   6. Outcome: if enemy.hull <= 0 or enemy.crew.length === 0 → 'won'; else if player.hull <= 0 or player.crew.length === 0 → 'lost'.
- src/sim/combat.test.ts (new): vitest (`import { describe, it, expect } from 'vitest'`). Build ships with makePlayerShip() / makeEnemyShip(1, () => 0.5) and createCombat. Use a fixed rng like `() => 0.99` (never dodges, never fires) or `() => 0` (always dodges if evasion > 0). Tests, at least:
  1. setSystemPower clamps to free reactor power and to level - damage.
  2. toggleWeaponPower powers then unpowers and updates systems.weapons.power.
  3. moveCrew: crew walks for crewMoveMsPerTile * dist ms and then stands in the new room (fromRoomId === roomId).
  4. A powered, targeted weapon fires after its charge time and spawns `shots` projectiles; a lobber consumes a pinecone.
  5. A blaster hit on a ship with shieldLayers > 0 removes a layer instead of hull; with 0 layers it removes hull and damages the room's system.
  6. Damage beyond capacity removes power (step b).
  7. A standing crew repairs 1 damage in repairMsPerPoint ms.
  8. Enemy hull reaching 0 gives outcome 'won'; stepCombat does nothing afterwards.
  9. jumpAway returns false before jumpChargeMs and true after enough steps with a manned seat.
  To isolate a test, set fields directly (e.g. enemy.shieldLayers = 0, systems.shields.power = 0, enemy evasion off by moving the enemy pilot crew out: set crew.roomId to a non-pilot room).

## Contract
Exported signatures stay exactly as in the stub:
createCombat(player, enemy): CombatState
setSystemPower(ship: ShipState, id: Exclude<SystemId,'weapons'>, power: number): boolean
toggleWeaponPower(ship: ShipState, index: number): boolean
setWeaponTarget(ship: ShipState, index: number, roomId: number | null): void
moveCrew(ship: ShipState, crewId: number, roomId: number): void
jumpAway(state: CombatState): boolean
stepCombat(state: CombatState, dtMs: number, rng: () => number = Math.random): void

## Done when
- `npx vitest run src/sim/combat.test.ts` passes (run from games/faster-than-lawn).
- `npx tsc --noEmit -p .` reports no errors in src/sim/combat.ts or src/sim/combat.test.ts (errors in other workers' files mid-edit: report, do not fix).

## Out of scope
Every file except src/sim/combat.ts and src/sim/combat.test.ts. No Phaser imports.
~~~~

### 2.2 Enemy AI and sector map (src/sim/ai.ts, src/sim/sector.ts)

~~~~text
Epic: 2 Features
Depends on: none

## Environment
<ENVIRONMENT block above>

## Goal
The enemy mower plays by itself (power, crew jobs, aiming), and generateSector builds a random back-yard map of beacons. Both pure TypeScript, no Phaser.

## Read first
- src/sim/ai.ts and src/sim/sector.ts: stubs. Keep exported names and signatures exactly; replace bodies.
- src/sim/types.ts: CombatState, ShipState, Room, Crew, SectorMap, Beacon, BeaconKind.
- src/sim/combat.ts: commands to CALL (do not edit; another worker is implementing their bodies right now): setSystemPower(ship, id, power): boolean (clamps power itself), toggleWeaponPower(ship, index): boolean, setWeaponTarget(ship, index, roomId|null), moveCrew(ship, crewId, roomId).
- src/sim/queries.ts: aliveCrew, roomIdOfSystem. src/sim/events.ts: EVENTS (ids). src/config.ts: TUNING.aiRetargetMs.

## Change
- src/sim/ai.ts, stepEnemyAI(state, brain, dtMs, rng):
  - Return at once if state.outcome !== 'ongoing'. ship = state.enemy.
  - brain.thinkMs -= dtMs. If <= 0: brain.thinkMs = 1000, then:
    Power: for id of ['pilot','shields','engines','medbay']: if ship.systems[id].level > 0, setSystemPower(ship, id, ship.systems[id].level). Then for each weapon index i with !powered: toggleWeaponPower(ship, i).
    Crew jobs: build an ordered list of job room ids (no duplicates):
      1) every room with fire > 0;
      2) the room of each system with damage > 0, in order weapons, shields, pilot, engines, medbay;
      3) manning: rooms of pilot, weapons, shields, engines (skip any system with level 0 or missing room).
    Wounded first: each alive crew with hp < 0.35 * maxHp, if a medbay room exists with systems.medbay.level > 0 and that room's fire === 0, is sent there (moveCrew) and is not used for jobs.
    Then for each job in order, take the nearest unassigned crew (Manhattan distance between the top-left of their roomId room and the job room) and, if crew.roomId !== job, moveCrew(ship, crew.id, job). Stop when crew run out. Leftover crew stay.
  - brain.retargetMs -= dtMs. If <= 0: brain.retargetMs = TUNING.aiRetargetMs; for each weapon index i: pick a player room among state.player.rooms with system !== null, weights: weapons 3, shields 3, others 1, using rng; setWeaponTarget(ship, i, room.id).
- src/sim/sector.ts, generateSector(rng): SECTOR_COLUMNS = 7 stays.
  - Column 0: one beacon { kind:'start', x: 90, y: 360, visited: true }.
  - Columns 1..5: 2 or 3 beacons each (rng < 0.5 ? 2 : 3). x = 90 + column * (1100 / 6) + jitter in [-20, 20]. y: spread evenly between 150 and 590 (for n beacons, y = 150 + (k + 0.5) * 440 / n) + jitter in [-30, 30].
    kind by weight: fight 45, event 30, shop 15, empty 10. If no beacon in columns 2..4 is a shop afterwards, make a random beacon of column 3 a shop. Event beacons get eventId = a random EVENTS[i].id.
  - Column 6: one beacon { kind:'exit', x: 1190, y: 360 }.
  - ids are creation order, so beacons[i].id === i; exitId = id of the exit.
  - Links: start links to every column-1 beacon. Each beacon in columns 1..4 links to the nearest-by-y beacon in the next column, plus the second-nearest with probability 0.5. Then every beacon in columns 2..5 with no incoming link gets one from the nearest-by-y beacon in the previous column. Every column-5 beacon links to the exit. No duplicate links.
  - visited false everywhere except start.
- src/sim/sector.test.ts (new, vitest): with a seeded rng (e.g. mulberry32 written in the test), for 50 seeds: beacons[i].id === i; beacons[0].kind === 'start'; exactly one 'exit' whose id is exitId; every link goes from column c to c+1; every non-start beacon has an incoming link; the exit is reachable from the start by following links; at least one shop.

## Contract
export interface EnemyBrain { retargetMs: number; thinkMs: number }   (unchanged)
export function createEnemyBrain(): EnemyBrain                       (unchanged)
export function stepEnemyAI(state: CombatState, brain: EnemyBrain, dtMs: number, rng: () => number = Math.random): void
export const SECTOR_COLUMNS = 7
export function generateSector(rng: () => number = Math.random): SectorMap

## Done when
- `npx vitest run src/sim/sector.test.ts` passes.
- `npx tsc --noEmit -p .` shows no errors in src/sim/ai.ts, src/sim/sector.ts or src/sim/sector.test.ts.

## Out of scope
src/sim/combat.ts (another worker owns it) and every other file not listed in Change.
~~~~

### 2.3 Textures and combat rendering (BootScene, src/render/combatView.ts)

~~~~text
Epic: 2 Features
Depends on: none

## Environment
<ENVIRONMENT block above>
<PHASER NOTES block above>

## Goal
BootScene generates every texture in TEX, and CombatView draws the fight: a striped lawn, both mowers with their rooms, gnome crew, fires, shields, projectiles and hit effects, and reports clicks on rooms and crew.

## Read first
- src/render/combatView.ts: the stub. Keep the class name, public fields and method signatures exactly.
- src/scenes/BootScene.ts: stub; keep `this.scene.start(SCENES.title)` at the end of create().
- src/config.ts: TEX (keys and sizes), COLORS, LAYOUT (tile 64, playerOrigin, enemyOrigin), GAME_WIDTH/HEIGHT.
- src/sim/types.ts: CombatState, ShipState, Room, Crew, Projectile, CombatEvent, SYSTEM_LABELS.
- src/sim/queries.ts: effectivePower, shieldMax. src/sim/data.ts: WEAPONS (def.kind of a projectile's defId).

## Change
- src/scenes/BootScene.ts create(): one Graphics `g`, for each texture `g.clear()`, draw, `g.generateTexture(key, w, h)`; destroy g; start title.
  gnome 24x32: red cone hat (fillTriangle 12,0 22,14 2,14, color 0xd32f2f), skin face circle (12,17 r5, 0xffccbc), white beard (fillTriangle 5,18 19,18 12,30, 0xffffff), blue body rect behind beard (4,20,16,10, 0x1565c0), black eyes 2px.
  gnomeEnemy 24x32: same shape, hat 0x1e88e5 and body 0x6a1b9a.
  clipping 12x6: green rounded bar 0x8bc34a. pinecone 12x14: brown ellipse 0x795548 with darker stripes 0x4e342e. fire 20x20: orange teardrop (circle 10,13 r7 0xff7043 + triangle 3,12 17,12 10,0) with a yellow inner circle 0xffeb3b r3. spark 6x6 white square. beacon 28x28 white filled circle r13 with a 2px darker ring (0xbbbbbb).
- src/render/combatView.ts, class CombatView:
  constructor(scene, state): draw the background lawn (rect 0,0,GAME_WIDTH,GAME_HEIGHT COLORS.lawnDark, plus vertical stripes 80px wide every 160px in COLORS.lawnLight alpha 0.5, depth -10). Then build each ship once: origin = side === 'player' ? LAYOUT.playerOrigin : LAYOUT.enemyOrigin; tile = LAYOUT.tile.
    Mower body: rectangle covering the rooms' bounding box padded 24px, color hullPlayer / hullEnemy, depth -5. Four black wheels (circle r 22, 0x212121) at the body's bottom corners and top corners (centred on the corners). A grey blade deck (0x9e9e9e) strip 16px tall under the body. Ship name text 18px centred 40px above the body.
    Rooms: per room a rectangle at (origin.x + room.x*tile, origin.y + room.y*tile) size (room.w*tile, room.h*tile), origin (0,0), fill COLORS.room, stroke 2 COLORS.roomStroke. Label text 11px top-left (SYSTEM_LABELS[room.system] or '' for null). Status text 12px bottom-left showing `${effectivePower}/${level}` for its system (red COLORS.danger when damage > 0). A red overlay rect (COLORS.damage alpha 0.25) visible when its system has damage > 0. A fire image (TEX.fire) at the room centre, visible when room.fire > 0, scale 0.8 + room.fire/100, with a looping yoyo scale tween for flicker.
    Rooms are interactive: on 'pointerdown' call this.onRoomClicked(side, room.id). On 'pointerover' set stroke COLORS.roomHover when side === 'player' or (side === 'enemy' and targeting is on); 'pointerout' restores COLORS.roomStroke.
    Shield: an ellipse (graphics) around the body, padded 30px, stroke COLORS.shield, line width 2 + 2*layers, alpha 0.3 + 0.15*layers; hidden when shieldLayers is 0. Redraw only when layers change.
  roomCenter(side, roomId): pixel centre of that room.
  update(state): every frame:
    - Room status texts, damage overlays, fire visibility, shield.
    - Crew: keep a Map<crewId, {sprite, hpBar, ring}> per side. Create an image (TEX.gnome for player, TEX.gnomeEnemy for enemy) for new crew; destroy entries whose crew is gone. Sprites are interactive: pointerdown → this.onCrewClicked(side, crew.id). Sprites have depth 5, above rooms (depth 0); Phaser's input is topOnly by default, so a click on a gnome reaches only the gnome, not the room under it.
      Position: standing → room centre + offset by slot: slot k of n standing crew in that room, x offset = (k - (n-1)/2) * 22, y offset 6. Walking → lerp between roomCenter(fromRoomId) and roomCenter(roomId) by t = 1 - moveMsLeft / moveMsTotal.
      HP bar: 24x4 rect above the head, green 0x76ff03 width proportional to hp/maxHp (red 0xff1744 below 35%). Selected ring: ellipse stroke COLORS.roomSelected under the selected player gnome.
    - Projectiles: Map<projectileId, image>. New ones: image TEX.clipping (blaster) or TEX.pinecone (lobber). Start = centre of the shooter's 'weapons' room (room with system 'weapons'), end = roomCenter(target side, targetRoomId). t = 1 - travelMsLeft/travelMsTotal. Position lerp; lobber adds y -= Math.sin(t*Math.PI)*140; blaster rotation = angle start→end. Destroy images whose projectile is gone from state.projectiles.
    - Effects from state.log (do NOT clear the log): 'hit' → spark particles explode(12) at room centre, floating text `-${damage}` (red), camera shake(150, 0.006) if target is 'player'. 'miss' → floating text 'MISS' (white). 'shieldBlock' → floating text 'BLOCKED' (COLORS.shield as '#4fc3f7') at the room centre, and briefly flash the shield ellipse alpha. 'crewDied' → floating text `${name} is compost!` at the ship centre. 'repaired' → floating text '+1' green at room centre.
      Floating text: 16px bold, depth 20, tween y -= 30 and alpha → 0 over 900 ms, then destroy.
  setSelectedCrew(id): remember it; update() draws the ring.
  setTargeting(active): remember it (used by hover); when active, also set enemy room strokes to COLORS.roomHover alpha 0.5 as a hint; when inactive restore.

## Contract
TEX keys/sizes from config.ts. CombatView public API (unchanged from the stub):
  onRoomClicked: (side: Side, roomId: number) => void
  onCrewClicked: (side: Side, crewId: number) => void
  constructor(scene: Phaser.Scene, state: CombatState)
  update(state: CombatState): void      // called every frame, also while paused; must not mutate state
  setSelectedCrew(crewId: number | null): void
  setTargeting(active: boolean): void
  roomCenter(side: Side, roomId: number): { x: number; y: number }
CombatView draws only in the area y < 470 (the HUD owns y >= 470). Depths: background -10, body -5, rooms 0, crew 5, projectiles 10, floating text 20.

## Done when
- `npx tsc --noEmit -p .` shows no errors in src/scenes/BootScene.ts or src/render/combatView.ts.

## Out of scope
src/scenes/CombatScene.ts and src/ui/combatHud.ts (another worker creates the CombatView there), all src/sim files, every other file.
~~~~

### 2.4 Combat HUD and CombatScene (src/ui/combatHud.ts, src/scenes/CombatScene.ts)

~~~~text
Epic: 2 Features
Depends on: none

## Environment
<ENVIRONMENT block above>
<PHASER NOTES block above>

## Goal
A playable combat scene: it creates the fight, runs the sim and enemy AI each frame with SPACE to pause, lets the player route power, power/aim weapons, select and move gnomes and jump away, shows a HUD, and ends the fight with rewards.

## Read first
- src/scenes/CombatScene.ts and src/ui/combatHud.ts: stubs (replace combatHud.ts entirely).
- src/config.ts: SCENES, COLORS, TUNING, CombatSceneData, GameOverData, GAME_WIDTH/HEIGHT.
- src/sim/combat.ts: createCombat, setSystemPower, toggleWeaponPower, setWeaponTarget, moveCrew, jumpAway, stepCombat (another worker is implementing the bodies right now; signatures are final).
- src/sim/ai.ts: createEnemyBrain, stepEnemyAI (signatures final). src/render/combatView.ts: CombatView (signatures final; another worker implements it).
- src/sim/queries.ts: effectivePower, freePower, powerUsed, evasion, shieldMax, weaponChargeTime, jumpReady. src/sim/ships.ts: makeEnemyShip(tier, rng, isBoss), cleanUpAfterCombat. src/sim/data.ts: WEAPONS. src/sim/types.ts: SYSTEM_LABELS, SystemId.
- src/run.ts: getRun(scene) → RunState { ship, scrap, sector, beaconId, jumps }. src/ui/button.ts: makeButton(scene, x, y, w, h, text, onClick, fontSize?) → { container, label, setEnabled, setText }. src/audio.ts: playSfx(name).

## Change
- src/ui/combatHud.ts: export exactly:
    export interface HudCallbacks {
      onSystemPower(id: Exclude<SystemId, 'weapons'>, delta: 1 | -1): void;
      onWeaponToggle(index: number): void;
      onWeaponAim(index: number): void;
      onCrewSelect(crewId: number): void;
      onJump(): void;
    }
    export interface HudView { paused: boolean; aimingWeapon: number | null; selectedCrewId: number | null }
    export class CombatHud { constructor(scene: Phaser.Scene, state: CombatState, cb: HudCallbacks); update(state: CombatState, view: HudView): void }
  Layout (1280x720; the HUD owns y >= 470 plus the two top corners; depth 30):
    - Bottom panel: rect 0,470 to 1280,720, color 0x000000 alpha 0.75.
    - Help line at (640, 482) centred, 13px, COLORS.textDim: 'Click a gnome, then a room to move it.  AIM a weapon, then click an enemy room.  SPACE pauses.'
    - Top-left at (20,14): player ship name, hull bar 300x18 (green fill proportional, text 'HULL h/max'), line 'Hedge x/y   Dodge z%   Scrap s   Pinecones p' (scrap from getRun(scene).scrap, the rest from state.player via shieldLayers/shieldMax/evasion).
    - Top-right, right-aligned at x 1260: enemy name, enemy hull bar 300x18, line 'Hedge x/y   Dodge z%'.
    - Reactor at (20, 500): 'REACTOR free/total' 16px.
    - System columns for pilot, engines, shields, medbay (skip level 0), 90px apart from x=20: label (SYSTEM_LABELS) at y=525, buttons '-' and '+' (makeButton 36x24) at y=552 calling onSystemPower(id, -1 / 1), bars below: for bar b in 0..level-1 a 60x10 rect stacked upward from y=700 with 14px pitch; colour: b < effectivePower → COLORS.power; b >= level - damage → COLORS.damage; else COLORS.powerOff.
    - Weapons: cards 170x150 starting x=420, y=505, 180px apart (max 4): weapon name (WEAPONS[defId].name) 14px, a 150x12 charge bar (chargeMs / weaponChargeTime), status line ('OFF' | 'CHARGING' | 'READY' | 'TARGET: <label of target room or ROOM n>'; lobbers add ' (pinecone)'), buttons 'PWR' (onWeaponToggle) and `AIM [${i+1}]` (onWeaponAim). The card border is COLORS.roomHover when view.aimingWeapon === i, COLORS.power when powered, grey otherwise. Also show '+N power' cost line.
    - Crew list at x=1000, y=500, 32px rows: name + 80x8 hp bar; each row clickable → onCrewSelect(id); highlight the selected row with COLORS.roomSelected. Rows must follow crew being added/removed (rebuild when the crew id list changes).
    - Jump button makeButton at (1215, 680) 110x50 'JUMP' (onJump), enabled only when jumpReady(state); above it text 'Jump n%' (jumpChargeMs / TUNING.jumpChargeMs).
    - Paused banner at (640, 445) 28px COLORS.accent 'PAUSED - SPACE to resume', visible when view.paused.
    Update texts and bar fills in update(); create objects once in the constructor (rebuild only crew rows).
- src/scenes/CombatScene.ts:
  - init(data: CombatSceneData): store it (default { tier: 1, isBoss: false }).
  - create(): reset every field. run = getRun(this); enemy = makeEnemyShip(data.tier, Math.random, data.isBoss); state = createCombat(run.ship, enemy); brain = createEnemyBrain(); view = new CombatView(this, state); hud = new CombatHud(this, state, callbacks); paused = false; aimingWeapon = null; selectedCrewId = run.ship.crew[0]?.id ?? null; ended = false.
    Callbacks: onSystemPower → setSystemPower(state.player, id, current power + delta), playSfx('click'). onWeaponToggle → toggleWeaponPower(state.player, i). onWeaponAim → aimingWeapon = i; view.setTargeting(true). onCrewSelect → select (view.setSelectedCrew). onJump → if jumpAway(state) the outcome handling below runs.
    view.onCrewClicked = (side, id) → if side === 'player' select it.
    view.onRoomClicked = (side, roomId) → if aimingWeapon !== null and side === 'enemy': setWeaponTarget(state.player, aimingWeapon, roomId); aimingWeapon = null; view.setTargeting(false); playSfx('click'). Else if side === 'player' and selectedCrewId !== null: moveCrew(state.player, selectedCrewId, roomId); playSfx('click').
    Keys: SPACE toggles paused. ONE..FOUR → aim weapon 0..3 if it exists. ESC → cancel aiming (view.setTargeting(false)).
  - update(_t, delta): if !paused && !ended: dt = Math.min(delta, 100); stepEnemyAI(state, brain, dt); stepCombat(state, dt). Sounds from state.log: at most one of each per frame: 'fired' → 'fire', 'hit' → 'hit', 'shieldBlock' → 'shieldBlock', 'miss' → 'miss'. If the selected crew died, select the first alive crew. Then view.update(state); hud.update(state, { paused, aimingWeapon, selectedCrewId }); then state.log.length = 0. If state.outcome !== 'ongoing' and !ended → endCombat().
  - endCombat(): ended = true.
    'won': reward = TUNING.scrapPerWinBase + TUNING.scrapPerWinPerTier * tier + Math.floor(Math.random()*10); run.scrap += reward; cleanUpAfterCombat(run.ship); playSfx('win'); show a centred panel (rect 520x200 at 640,260, depth 40) with 'ENEMY MOWER MULCHED!' and `+${reward} scrap` and a makeButton 'Continue' → if isBoss: this.scene.start(SCENES.gameOver, { victory: true, jumps: run.jumps, scrap: run.scrap } satisfies GameOverData) else this.scene.start(SCENES.map).
    'fled': cleanUpAfterCombat(run.ship); playSfx('jump'); panel 'You mowed away!' + Continue → SCENES.map.
    'lost': playSfx('lose'); this.time.delayedCall(1500, () => this.scene.start(SCENES.gameOver, { victory: false, jumps: run.jumps, scrap: run.scrap })).

## Contract
Scene key SCENES.combat ('Combat'), class CombatScene, init(data: CombatSceneData). state.player IS run.ship (same object), so damage persists across fights. CombatScene empties state.log after view.update. The CombatHud exports above.

## Done when
- `npx tsc --noEmit -p .` shows no errors in src/ui/combatHud.ts or src/scenes/CombatScene.ts.

## Out of scope
src/render/combatView.ts, src/sim/*, every other scene and file.
~~~~

### 2.5 Map, event and shop scenes

~~~~text
Epic: 2 Features
Depends on: none

## Environment
<ENVIRONMENT block above>
<PHASER NOTES block above>

## Goal
The between-fight game: a back-yard map of beacons to hop across, text events with choices, and a shop.

## Read first
- src/scenes/MapScene.ts, EventScene.ts, ShopScene.ts: stubs (class names and scene keys are final).
- src/run.ts: getRun(scene), currentBeacon(run), beaconTier(beacon), RunState { ship, scrap, sector, beaconId, jumps }.
- src/sim/types.ts: Beacon, SectorMap, ShipState, WeaponState. src/sim/events.ts: EVENTS, getEvent, EventOutcome. src/sim/data.ts: WEAPONS, SHOP_WEAPON_IDS, GNOME_NAMES. src/sim/ships.ts: makeCrew(name, roomId).
- src/config.ts: SCENES, TEX (beacon texture is generated by another worker in BootScene; use TEX.beacon), COLORS, TUNING (shop* costs), CombatSceneData, EventSceneData, GameOverData. src/ui/button.ts: makeButton. src/audio.ts: playSfx.

## Change
- src/scenes/MapScene.ts:
  - create(): run = getRun(this). If run.ship.hull <= 0 or run.ship.crew.length === 0 → scene.start(SCENES.gameOver, { victory: false, jumps: run.jumps, scrap: run.scrap }) and return.
  - Background: COLORS.lawnDark full-screen rect plus a few lighter stripes. Title 'THE BACK YARD - reach the Garden Gate' at (640, 30). Status line at (640, 64): 'Hull h/max   Scrap s   Pinecones p   Gnomes n   Jumps j'.
  - Links: one Graphics, lineStyle(3, 0xffffff, 0.25), lineBetween each beacon and each of its links.
  - Beacons: image TEX.beacon at (b.x, b.y), tint by kind: start 0xffffff, fight 0xff5252, event 0xffd54f, shop 0x4fc3f7, empty 0xcfd8dc, exit 0xffab00 (scale 1.4); visited beacons tinted 0x777777 instead. Label 12px under each: fight 'FIGHT', event '?', shop 'SHOP', empty '', exit 'GARDEN GATE', start 'START'.
  - Current beacon: a red ring (graphics strokeCircle r 22, 0xff5252, width 3) and the text 'YOU' above it.
  - Reachable = currentBeacon(run).links. Reachable beacons pulse (tween scale yoyo repeat -1) and are interactive; others are not.
  - Clicking reachable beacon b: run.beaconId = b.id; run.jumps += 1; const firstVisit = !b.visited; b.visited = true; playSfx('jump'). Then by kind:
    fight → scene.start(SCENES.combat, { tier: beaconTier(b), isBoss: false } satisfies CombatSceneData)
    exit → scene.start(SCENES.combat, { tier: 5, isBoss: true })
    event → scene.start(SCENES.event, { eventId: b.eventId ?? EVENTS[0].id } satisfies EventSceneData)
    shop → scene.start(SCENES.shop)
    empty/start → run.scrap += 3 (only if firstVisit); scene.restart().
  - If the current beacon is a shop, a makeButton 'Visit shop' at (640, 680) → SCENES.shop.
  - Legend bottom-left 12px: 'red FIGHT  yellow EVENT  blue SHOP  orange GATE (boss)'.
- src/scenes/EventScene.ts:
  - init(data: EventSceneData) stores eventId. create(): run = getRun(this); ev = getEvent(eventId). Dark panel 900x520 centred. Title 28px COLORS.accent, body text 18px wordWrap 820.
  - One makeButton per choice (820x44, stacked from y=430, 54px apart). A choice is disabled when every outcome has scrap < 0 and run.scrap < -(the smallest such scrap).
  - On choose: pick an outcome by weight with Math.random(). Apply: scrap = max(0, scrap + (o.scrap ?? 0)); ship.hull = clamp(hull + (o.hull ?? 0), 1, maxHull); ship.pinecones = max(0, pinecones + (o.pinecones ?? 0)); o.crew === 1 and crew.length < 6 → push makeCrew(a GNOME_NAMES name not already on the crew, else 'Gnome', 0); o.crew === -1 and crew.length > 1 → pop the last crew.
    Then hide the choice buttons (container.setVisible(false)), show o.text and a summary line of the changes (e.g. '+20 scrap  -3 hull  +1 gnome') in COLORS.accent, and a 'Continue' button: if o.fight → scene.start(SCENES.combat, { tier: beaconTier(currentBeacon(run)), isBoss: false }) else scene.start(SCENES.map). playSfx('click') on choose.
- src/scenes/ShopScene.ts:
  - create(): run = getRun(this), ship = run.ship. Title 'THE POTTING SHED' 36px, line 'Scrap s   Hull h/max   Reactor r   Pinecones p   Gnomes n'.
  - Item rows from y=140, 44px apart: label at x=200, cost text at x=760, makeButton 'Buy' (100x34) at x=900, disabled when run.scrap < cost or the item is unavailable. Buying: run.scrap -= cost, apply, playSfx('buy'), this.scene.restart().
    1. 'Repair 5 hull' cost 5*TUNING.shopHullRepairCost (unavailable if hull === maxHull; repair min(5, missing)).
    2. 'Repair all hull' cost missing*TUNING.shopHullRepairCost (unavailable if missing === 0).
    3. '3 pinecones' cost 3*TUNING.shopPineconeCost.
    4. 'Reactor +1' cost TUNING.shopReactorCost.
    5. For each system id of ['pilot','engines','shields','weapons','medbay']: `Upgrade ${SYSTEM_LABELS[id]} to ${level+1}` cost TUNING.shopSystemUpgradeCost * Math.max(1, level); unavailable at TUNING.shopMaxSystemLevel. Effect: level += 1 (power is not added).
    6. 'Hire a gnome' cost TUNING.shopHireCost, unavailable at 6 crew; makeCrew(unused GNOME_NAMES name, 0).
    7. Two weapons for sale: SHOP_WEAPON_IDS[(run.beaconId * 7) % len] and SHOP_WEAPON_IDS[(run.beaconId * 7 + 1) % len]: label `${def.name} (power ${def.power}, ${def.shots}x${def.damage} dmg${def.kind==='lobber' ? ', uses pinecones' : ''})`, cost def.cost, unavailable when ship.weapons.length >= 4. Effect: push { defId, powered: false, chargeMs: 0, targetRoomId: null }.
    With 12 rows at 44px the list ends near y=650; that is fine.
  - makeButton 'Leave' at (640, 690) → scene.start(SCENES.map).

## Contract
Scene keys SCENES.map/event/shop; EventScene.init(data: EventSceneData); CombatScene receives CombatSceneData; GameOverScene receives GameOverData. All persistent state lives in getRun(this) (mutate it in place).

## Done when
- `npx tsc --noEmit -p .` shows no errors in the three scene files.

## Out of scope
CombatScene, TitleScene, GameOverScene, BootScene, everything under src/sim, src/run.ts and every other file.
~~~~

### 2.6 Title, game over, audio, README

~~~~text
Epic: 2 Features
Depends on: none

## Environment
<ENVIRONMENT block above>
<PHASER NOTES block above>

## Goal
Title and game-over screens with a saved best result, WebAudio sound effects for every SfxName, and a README.

## Read first
- src/scenes/TitleScene.ts, src/scenes/GameOverScene.ts, src/audio.ts: stubs.
- games/sample-dodge/src/audio.ts: a working WebAudio tone() helper to copy and adapt (read only; do not edit sample-dodge).
- src/config.ts: SCENES, TEX (gnome, gnomeEnemy textures are generated in BootScene by another worker), COLORS, SfxName, GameOverData, STORAGE_KEY_BEST, GAME_WIDTH/HEIGHT.
- src/run.ts: resetRun(scene). src/ui/button.ts: makeButton.

## Change
- src/audio.ts: export function playSfx(name: SfxName): void, all in try/catch so audio never throws. One short tone recipe per name: click (short 600 Hz square blip), fire (900→300 Hz square 0.12 s), hit (200→50 Hz sawtooth 0.3 s), shieldBlock (1200→800 Hz sine 0.15 s), miss (400→600 Hz triangle 0.1 s), jump (rising 200→1200 Hz 0.5 s), win (three rising notes via setTimeout), lose (falling 400→60 Hz 0.8 s), buy (two quick high notes).
- src/scenes/TitleScene.ts: background COLORS.lawnDark with lighter mowed stripes; title 'FASTER THAN LAWN' 64px COLORS.accent at (640,170); subtitle 'Gnomes. Mowers. Mayhem.' 24px; three images TEX.gnome scale 3 at y=300 and one TEX.gnomeEnemy facing them (setFlipX(true)) at the right; how-to lines (16px, centred, from y=380): 'Cross the back yard to the Garden Gate and beat the Grand Zero-Turn.', 'Route reactor power, aim your guns at enemy rooms, send gnomes to man, repair and put out fires.', 'SPACE pauses the fight. Pausing is not cheating.'; best line 'Wins w   Best jumps j' from storage; blinking 'Click or press SPACE to mow' at y=600. Start (pointerdown or SPACE, once): playSfx('click'); resetRun(this); this.scene.start(SCENES.map).
- Storage: inside GameOverScene.ts (or a small helper in the same file you export for TitleScene, e.g. `export function loadBest(): { wins: number; bestJumps: number }`), localStorage key STORAGE_KEY_BEST holds JSON { wins, bestJumps }; wrap every access in try/catch and default to { wins: 0, bestJumps: 0 }. TitleScene imports loadBest from './GameOverScene'.
- src/scenes/GameOverScene.ts: init(data: GameOverData) stores it and updates storage once (wins += 1 if victory; bestJumps = max). create(): victory → 'THE GARDEN GATE IS YOURS!' (COLORS.accent) else 'YOUR MOWER IS MULCH' (COLORS.danger), 48px at (640,200); stats 'Jumps j   Scrap s' 24px; best line; after 400 ms accept input: makeButton 'Mow again' at (640, 450) → playSfx('click'); resetRun(this); scene.start(SCENES.map); ESC → SCENES.title.
- games/faster-than-lawn/README.md: replace with: one paragraph describing the game (gnomes crewing lawn mowers in pausable real-time fights; route power, aim, move crew; cross the back-yard map to the Garden Gate boss), controls (click gnome then room; AIM/1-4 then click enemy room; PWR toggles a weapon; +/- routes power; SPACE pause; JUMP when charged), `npm run dev -w games/faster-than-lawn` (port 5181), `npm run build -w games/faster-than-lawn`, `npm test -w games/faster-than-lawn`, and that tuning lives in src/config.ts (TUNING) and content in src/sim/data.ts and src/sim/events.ts.

## Contract
TitleScene key SCENES.title; GameOverScene key SCENES.gameOver with init(data: GameOverData); playSfx(name: SfxName): void.

## Done when
- `npx tsc --noEmit -p .` shows no errors in your three source files.

## Out of scope
Every other scene, src/sim/*, src/run.ts, games/sample-dodge, every other file.
~~~~
