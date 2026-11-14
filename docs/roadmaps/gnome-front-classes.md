# Roadmap: gnome-front classes, aim down sights, smarter bots

## Goal

Three additions to `games/gnome-front`:
1. **Classes with their own guns.** Rifleman (Acorn Rifle), Gunner (Seed Sprayer LMG), Sniper (Pea Shooter, scoped, semi-auto), Brawler (Pinecone Blunderbuss shotgun). The player picks on the title screen and while dead; the pick applies at the next respawn.
2. **Aim down sights.** Right mouse (touch: AIM toggle) zooms the camera to the weapon's adsFov, tightens spread, slows walking, centres the gun. The sniper shows a scope overlay.
3. **Better bots.** Squads that share a flag, smarter flag choice, cover when hurt, obstacle avoidance, class-aware fighting ranges, aim that settles over time and leads moving targets, reacting to being shot.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (planner) | WEAPONS, CLASSES, weaponOf, Soldier.classId/nextClassId/ads/adsT, InputState.aim/firePressed, 'gun' damage cause with weapon on kill/shot events, class speed and adsT easing in soldiers.ts, botAim.ts stub. Builds. | 0 |
| 2. Features | Combat, player ADS + gun models, bot movement brain, bot aim, HUD, touch, audio. Builds and plays. | 7, parallel |
| 3. Playtest fixes | planner | - |

| Issue | Changes |
|---|---|
| 2.1 combat | src/combat.ts |
| 2.2 player ADS and gun models | src/player.ts |
| 2.3 bot brain | src/bots.ts |
| 2.4 bot aim | src/botAim.ts |
| 2.5 HUD | src/ui/hud.ts |
| 2.6 touch | src/ui/touch.ts |
| 2.7 audio | src/audio.ts |

Check for all: `npx tsc --noEmit -p .` from the game folder. No servers, no vite build.

---

## Shared text (applies to every issue)

ENVIRONMENT:
- Repository root: /home/user/lawn-gnome-panic (Linux; node and npm on PATH). Game folder: games/gnome-front. Run commands from the game folder.
- Dependencies are installed. Do not run npm install or add dependencies. three.js 0.187.0 (`import * as THREE from 'three'`). TypeScript strict.
- Six other workers are editing other files in games/gnome-front at the same time. Change only the files your issue lists. Read-only for everyone: src/config.ts, src/main.ts, src/soldiers.ts, src/input.ts, src/terrain.ts, src/vehicles.ts, src/conquest.ts, src/world.ts, src/models/*.
- Keep every exported signature of your own file unchanged (you may add non-exported helpers). Other files' exported signatures will not change; call them as written.
- Do not run `vite build` / `npm run build`, do not start a dev server, do not git commit.
- `npx tsc --noEmit -p .` may show errors in files other workers are editing. Fix errors in your files only; report others.

CONVENTIONS:
- A gnome is 1.4 units tall; y up; ground height heightAt(x, z) from src/terrain.ts.
- Yaw 0 faces +z. Forward = (sin yaw, 0, cos yaw). Right = (-cos yaw, 0, sin yaw). Increasing yaw turns LEFT.
- Look direction: (sin yaw * cos pitch, sin pitch, cos yaw * cos pitch); pitch + is up. Camera: rotation.order 'YXZ', camera.rotation.set(pitch, yaw + Math.PI, 0).
- Eye = s.pos + (0, TUNING.eyeHeight, 0). s.pos is the feet.
- Frame order (main.ts): touch.update, player.update(input, dt), updateBots, updateVehicles, updateSoldiers, updateCombat, updateConquest, then hud.update(dt, input) and audio.update(dt) every frame, then input.endFrame() (clears every *Pressed flag and mouse deltas).

WHAT THE FOUNDATION ALREADY DOES (do not redo):
- src/config.ts: `WEAPONS: Record<WeaponId, WeaponDef>`, `CLASSES: Record<ClassId, ClassDef>`, `CLASS_ORDER` (rifleman, gunner, sniper, brawler), `weaponOf(s: Soldier): WeaponDef`. WeaponDef fields: id, name, damage (per pellet), pellets, headshotMult, fireIntervalS, auto, magSize, reserveAmmo, reloadS, hipSpreadRad, adsSpreadRad, moveSpreadMult, range, falloffStart, falloffEnd, minDamageMult, vehicleDamageMult, recoilPitch, adsFov, adsMoveMult, scope, tracerColor, botRange [min, max]. ClassDef: id, name, blurb, weapon, grenades, speedMult. TUNING.hipFov = 75, TUNING.adsTimeS.
- Soldier has `classId` (this life), `nextClassId` (applied by respawnSoldier), `ads` (wish to aim, set by whoever controls the soldier each frame), `adsT` (0..1, eased by updateSoldiers; forced to 0 while sprinting, reloading or dead).
- moveSoldier already applies the class speedMult and slows by adsMoveMult * adsT.
- InputState has `aim` (right mouse held) and `firePressed` (left mouse went down this frame).
- DamageCause is 'gun' | 'grenade' | 'roadkill' | 'wreck'. `damageSoldier(game, victim, amount, attacker, cause, headshot, weapon: WeaponId | null = null)`. Events: `{ type: 'shot'; shooter; weapon: WeaponId; from; to }` (one per pellet) and `{ type: 'kill'; killer; victim; cause; weapon: WeaponId | null; headshot }`.
- Respawn refills ammo/reserve from the class weapon and grenades from the class.

SIGNATURES YOU MAY CALL:
```ts
// src/soldiers.ts
export function moveSoldier(game: Game, s: Soldier, wishX: number, wishZ: number, sprint: boolean, jump: boolean, dt: number): void;
export function damageSoldier(game: Game, victim: Soldier, amount: number, attacker: Soldier | null, cause: DamageCause, headshot: boolean, weapon?: WeaponId | null): void;
// src/combat.ts
/** Fires one shot of the soldier's weapon if it can (alive, fireT <= 0, ammo > 0, not reloading). Returns true if fired. Does not check auto vs semi-auto: callers do. */
export function tryFire(game: Game, s: Soldier, origin: THREE.Vector3, dir: THREE.Vector3): boolean;
export function startReload(game: Game, s: Soldier): void;
export function throwGrenade(game: Game, s: Soldier, origin: THREE.Vector3, dir: THREE.Vector3): boolean;
export function raycastWorld(game: Game, origin: THREE.Vector3, dir: THREE.Vector3, maxDist: number): number;
export function lineOfSight(game: Game, a: THREE.Vector3, b: THREE.Vector3): boolean;
// src/vehicles.ts
export function nearestEnterable(game: Game, s: Soldier): Vehicle | null;
export function enterVehicle(game: Game, s: Soldier, v: Vehicle): void;
export function exitVehicle(game: Game, s: Soldier): void;
export function driveVehicle(v: Vehicle, ctl: VehicleControl): void; // call every frame while driving
export function damageVehicle(game: Game, v: Vehicle, amount: number, by: Soldier | null): void;
// src/botAim.ts
export interface BotCombatInfo { target: Soldier | null; targetDist: number; threat: { x: number; z: number } | null; underFire: boolean }
export function botCombat(game: Game, s: Soldier, dt: number): BotCombatInfo;
export function resetBotCombat(s: Soldier): void;
// src/conquest.ts
export function spawnPoints(game: Game, team: Team): { x: number; z: number; yaw: number }[];
```

---

## Epic 2 issues

~~~~text
Issue 2.1: combat (weapon-aware shooting)
Epic: 2
Depends on: none

## Environment
Shared text above.

## Goal
tryFire uses the soldier's class weapon: pellets, hip/ADS/moving spread, damage falloff with distance, headshots, vehicle damage, per-weapon tracer colour. Reloads use the weapon's numbers.

## Read first
- src/config.ts: WeaponDef, WEAPONS, weaponOf, TUNING, GameEvent ('shot' has weapon)
- src/combat.ts: the current file (keep every exported signature; the foundation already swapped RIFLE for weaponOf(s) minimally)

## Change
- src/combat.ts, tryFire(game, s, origin, dir):
  - w = weaponOf(s). Return false unless s.alive, s.fireT <= 0, s.reloadT <= 0, s.ammo > 0. s.fireT = w.fireIntervalS; s.ammo -= 1 (one round per trigger pull, also for the shotgun).
  - Spread = lerp(w.hipSpreadRad, w.adsSpreadRad, s.adsT). Multiply by w.moveSpreadMult if on foot and horizontal speed > 1, by 2 more if s.sprinting, by 1.5 if s.vehicle, by 1.5 if !s.grounded.
  - For each of w.pellets: perturb dir within the spread cone (uniform in the disc), find the closest hit within w.range exactly as now (world, soldier cylinders, vehicle spheres; ignore s and s.vehicle). Emit { type: 'shot', shooter: s, weapon: w.id, from: origin, to: hit point } per pellet.
  - Damage per pellet hit on a soldier: w.damage * falloff(distance) * (headshot ? w.headshotMult : 1), where falloff is 1 up to w.falloffStart, linear to w.minDamageMult at w.falloffEnd, w.minDamageMult beyond. Sum the pellet damage per victim and call damageSoldier once per victim per shot: damageSoldier(game, victim, total, s, 'gun', anyHeadshot, w.id). Vehicles: sum w.damage * falloff * w.vehicleDamageMult per vehicle, one damageVehicle call each.
  - If s.ammo is now 0, startReload. Return true.
- startReload: uses weaponOf(s).magSize and reloadS (already partly done; keep the 'reload' event).
- Reload completion in updateCombat: refill to weaponOf(s).magSize from reserve.
- Tracers: colour from WEAPONS[e.weapon].tracerColor. Sniper tracers (w.id === 'peaShooter') last 0.25 s and are drawn as a thin bright line; shotgun tracers last 0.05 s.
- Keep grenades, raycastWorld, lineOfSight, explosions as they are.

## Contract
Exported signatures unchanged. The shot event carries weapon. damageSoldier gets cause 'gun' and the weapon id.

## Done when
- `npx tsc --noEmit -p .` shows no errors in src/combat.ts.

## Out of scope
Every other file.
~~~~

~~~~text
Issue 2.2: player aim down sights and gun models
Epic: 2
Depends on: none

## Environment
Shared text above.

## Goal
The player aims down sights with right mouse (or the touch AIM toggle): the camera zooms to the weapon's adsFov, look sensitivity scales with zoom, the gun moves to the centre (scoped guns hide). Semi-auto guns fire once per click. Each class has its own first-person gun model, and recoil depends on the weapon.

## Read first
- src/config.ts: WeaponDef, WEAPONS, weaponOf, CLASSES, TUNING (hipFov, adsTimeS, mouseSens), InputState (aim, fire, firePressed)
- src/player.ts: the current controller (keep `PlayerController` and `createPlayerController(game)`)

## Change
- src/player.ts:
  - Each frame set p.ads = input.aim && p.alive && !p.vehicle && !(input.sprint && input.forward). (updateSoldiers eases p.adsT and zeroes it while sprinting or reloading.)
  - Camera FOV: fov = lerp(TUNING.hipFov, weaponOf(p).adsFov, p.adsT) on foot; TUNING.hipFov in a vehicle or dead. Only call camera.updateProjectionMatrix() when fov changes by more than 0.01.
  - Look sensitivity: multiply TUNING.mouseSens by (camera.fov / TUNING.hipFov).
  - Firing on foot and in a vehicle: w = weaponOf(p); shoot when (w.auto ? input.fire : input.firePressed). On a successful tryFire: p.pitch += w.recoilPitch * (1 - 0.5 * p.adsT) plus a random yaw kick of +-w.recoilPitch * 0.3; gun model kick back.
  - Gun models: build four THREE.Groups once, one per WeaponId, all children of game.camera, only the current weapon's visible (switch when p.classId changes). Same material rules as the existing rifle (depthTest false, renderOrder 10), group scale 0.4. Simple boxes and cylinders:
    - acornRifle: the existing rifle.
    - seedSprayer: chunky green 0x3f7d3a body, a long barrel, a round seed drum (yellow 0xd9c24a cylinder) underneath.
    - peaShooter: long thin barrel (twice the rifle's), a scope tube on top (dark cylinder with a light-blue 0x9fd8ff lens disc at the back), a green pea at the muzzle.
    - blunderbuss: short wooden stock and a wide flared barrel (cylinder whose front radius is twice its back), a pinecone at the muzzle.
  - Hip position stays RIFLE_BASE (0.14, -0.13, -0.32). ADS position (0, -0.075, -0.28): lerp with p.adsT. For scope weapons, hide the gun once p.adsT > 0.85 (the HUD draws the scope).
  - Remove the rifle-only bob while aiming (scale bob by 1 - p.adsT).

## Contract
`PlayerController.update(input, dt)` and `createPlayerController(game)` unchanged. Do not change p.model visibility or p.adsT (soldiers.ts owns those).

## Done when
- `npx tsc --noEmit -p .` shows no errors in src/player.ts.

## Out of scope
Every other file (input.ts already provides aim and firePressed).
~~~~

~~~~text
Issue 2.3: bot brain (squads, flags, cover, movement, vehicles)
Epic: 2
Depends on: none

## Environment
Shared text above.

## Goal
Rewrite src/bots.ts so bots move like a team: squads that pick flags together, smarter flag choice, falling back to cover when hurt, steering around obstacles, keeping the right distance for their weapon, picking a class when they die, and driving vehicles as now. Aiming and shooting move to src/botAim.ts (another worker): call botCombat each frame and act on its result.

## Read first
- src/config.ts: Soldier, FlagState, Game, TUNING (captureRadius, botVehicleChance), CLASS_ORDER, CLASSES, weaponOf (WeaponDef.botRange), Obstacle
- src/bots.ts: the current file. Keep its vehicle driving logic (steering, stuck reverse, exit at goal, Combine circling) and the stuck detection; replace the rest. Keep `export function updateBots(game: Game, dt: number): void`.
- src/botAim.ts: the stub with BotCombatInfo (do not edit it)

## Change
- src/bots.ts:
  - Remove all target picking, aiming, firing, reloading and grenade code from bots.ts. For every alive bot each frame, first call `const info = botCombat(game, s, dt)`. While info.target is non-null botCombat owns s.yaw / s.pitch / s.ads; bots.ts must not set them then. With no target, bots.ts sets s.yaw towards its movement direction (turn at up to 6 rad/s) and s.pitch = 0, s.ads = false.
  - On a 'spawn' event for a bot: reset its brain and call resetBotCombat(s). On a 'kill' event whose victim is a bot: set victim.nextClassId by weighted random: rifleman 35, gunner 25, sniper 15, brawler 25, but never let a team have more than 3 bots whose nextClassId is 'sniper' (count the team).
  - Squads: squad index = Math.floor(index of the bot among its team's bots / 4). The squad leader is the alive member with the lowest id. Only the leader chooses the goal (every 2 s, or at once when the goal flag becomes owned by the team and nothing threatens it); members copy the leader's goal. Members move to a formation point: leader position + offset (slot k of the squad: 4 units behind and (k - 1.5) * 4 units to the side, in the leader's yaw frame); when within 3 units of it, match the leader's movement. If the leader is more than 60 units away, members head for the goal directly.
  - Flag scoring for leaders (pick the lowest score): distance / 10; -6 if owned by the enemy; -3 if neutral; +8 if owned by us and not being captured (progress moving our way or 0), but -8 if owned by us and the enemy is capturing it (defend); +4 for each other squad of our team already targeting that flag (spread out). Add a random 0..2 per evaluation so squads differ.
  - At the goal: wander inside captureRadius * 0.7 (new random point every 3 s) instead of standing still.
  - Range keeping with a target (info.target non-null): [minR, maxR] = weaponOf(s).botRange. If info.targetDist > maxR, advance towards the target; if < minR, back away; otherwise strafe (switch direction every 1-2.5 s) and drift towards the goal at 0.3. Snipers (classId 'sniper') with no target hold position at the edge of the goal flag (captureRadius + 12 units back towards their own HQ BASES[team]) instead of entering it, unless they are the only alive squad member.
  - Cover: when info.underFire and s.hp < 45, or when reloading (s.reloadT > 0) with a target closer than 25: pick the nearest obstacle within 25 units whose far side from the threat (info.threat, else the target) is reachable: cover point = obstacle centre + (unit vector from threat to obstacle) * (o.r + 0.9). Run there (sprint), then stay crouched in place (no movement) until s.hp >= 85 or 6 s pass, then resume. If no cover is in range, retreat away from the threat towards the nearest owned spawn point (spawnPoints).
  - Obstacle avoidance (steering): before moveSoldier, look 4 units ahead along the wish direction; for each obstacle whose circle (o.r + TUNING.soldierRadius + 0.3) that segment crosses, rotate the wish 35 degrees away from it (towards the side the obstacle centre is not on). Try up to 3 rotations. Keep the existing stuck detection and unstick (random sidestep plus jump) as the fallback.
  - Reaction: if info.threat is set and there is no target, turn to face the threat (so botCombat can find the shooter).
  - Vehicles: keep taking empty vehicles at spawn with TUNING.botVehicleChance when the goal is more than 40 units away, and the existing driving code. In addition: the driver steers away from teammates on foot within 6 units ahead (do not run them over), and a mower driver hops off when its vehicle's hp < 25% of maxHp.
  - Sprint when there is no target and the destination is more than 20 units away.
  - Call moveSoldier(game, s, wishX, wishZ, sprint, jump, dt) once per on-foot bot per frame.

## Contract
`export function updateBots(game: Game, dt: number): void`. botCombat and resetBotCombat from './botAim' as in the shared signatures.

## Done when
- `npx tsc --noEmit -p .` shows no errors in src/bots.ts.

## Out of scope
src/botAim.ts and every other file.
~~~~

~~~~text
Issue 2.4: bot aim (targeting, aiming, firing)
Epic: 2
Depends on: none

## Environment
Shared text above.

## Goal
Fill in src/botAim.ts: bots pick sensible targets, aim like people (react, settle, lead, miss more at range and while moving), aim down sights, fire in bursts or single shots suited to their weapon, reload and throw grenades.

## Read first
- src/botAim.ts: the stub (keep BotCombatInfo, botCombat and resetBotCombat exactly)
- src/config.ts: Soldier, Game, GameEvent, TUNING (botViewRange, botReactionS, eyeHeight, soldierHeight), WeaponDef, weaponOf, GRENADE
- src/combat.ts: only the exported signatures of tryFire, startReload, throwGrenade, lineOfSight (another worker is editing its body)

## Change
- src/botAim.ts. Keep per-bot memory in a Map<number, Mem> by soldier id. Subscribe once (first botCombat call for a game; keep a module variable for the subscribed game) to game.on:
  - 'hit' where the victim is a bot and the shooter an enemy: mem.lastHurtT = game.time, mem.threat = shooter position (x, z), mem.threatT = game.time, mem.attacker = shooter.
  - 'shot' by an enemy whose `to` or `from` is within 6 units of a bot (on the segment, use the point of the segment closest to the bot): that bot's mem.threat = shooter position, mem.threatT = game.time.
- botCombat(game, s, dt):
  - Think every 0.2 s (stagger with a random initial offset): candidates = alive enemies within TUNING.botViewRange (x1.4 for snipers) with lineOfSight from the bot's eye to the enemy's chest (pos + 0.9 up), that are inside a 120 degree cone of s.yaw, or within 12 units, or are mem.attacker. Score = distance - 25 if it is mem.attacker - 10 if it is within weaponOf(s).botRange - 15 if it is driving a vehicle and s.grenades > 0 and within 25 units. Keep the current target unless a new one scores 10 better (no flicker). When the target changes, mem.seenT = 0 and mem.aimErr = a random offset of size 0.25 rad (yaw) and 0.12 rad (pitch).
  - With a target: mem.seenT += dt. Aim point = target chest (pos + 0.9) for most bots; snipers aim at the head (pos + 1.2) 50% of the time per target. Lead: add target.vel * (distance / 250) (hitscan has no travel, this simulates human tracking lag in reverse: keep it small).
    - Settling error: mem.aimErr decays towards 0 by factor exp(-dt * 2.2) while tracking the same target; add noise each shot proportional to: 0.004 + 0.0006 * distance, x1.8 if the bot is moving faster than 2, x1.5 if the target moves faster than 4, x0.5 when s.adsT > 0.8.
    - Turn s.yaw and s.pitch towards (aim point direction + mem.aimErr) at up to 5 rad/s (wrap angles to -PI..PI).
    - s.ads = !s.vehicle && distance > 15 (shotgun bots: never; snipers: always when they have a target).
    - Fire when mem.seenT > TUNING.botReactionS * (0.7 + Math.random() * 0.6) (re-roll per target) and the angle between the current look and the aim direction < 0.06 rad + 0.6 / max(distance, 1): auto weapons fire in bursts (burst length 0.25 s at > 40 units, 0.6 s at < 15, else 0.4; pause 0.3 to 0.6 s); semi-auto weapons fire when ready with an extra random 0.15-0.4 s delay between shots (sniper 0.5-1.2 s). Call tryFire(game, s, eye, lookDir). Eye = s.pos + (0, TUNING.eyeHeight, 0).
    - Grenades: if s.grenades > 0, not in a vehicle, target 10-28 units away, and (target is in a vehicle, or 2+ enemies within 6 units of the target, or the target has not been hit for 3 s): chance 0.25 per second to throwGrenade(game, s, eye, dir to target with +0.3 to y, normalised).
  - No target: s.ads = false. If s.ammo < 50% of magSize and s.reloadT <= 0 and nobody was seen for 2 s, startReload. Leave s.yaw / s.pitch alone.
  - Return { target, targetDist (horizontal), threat: mem.threat if game.time - mem.threatT < 4 else null, underFire: game.time - mem.lastHurtT < 2 }.
  - Works for drivers too (s.vehicle): same targeting and firing, no ads, no grenades.
- resetBotCombat(s): delete the memory for s.id.

## Contract
As in the stub, verbatim.

## Done when
- `npx tsc --noEmit -p .` shows no errors in src/botAim.ts.

## Out of scope
src/bots.ts (another worker) and every other file.
~~~~

~~~~text
Issue 2.5: HUD (class picker, scope, weapon info)
Epic: 2
Depends on: none

## Environment
Shared text above. Repo rule: root is the shared #ui element; never restyle or hide #ui itself. #ui has pointer-events: none: set pointer-events: auto on anything clickable.

## Goal
The HUD lets the player choose a class (title screen and death screen), shows the current weapon, draws a scope overlay for scoped weapons and a smaller crosshair while aiming, and names weapons in the kill feed.

## Read first
- src/config.ts: CLASSES, CLASS_ORDER, WEAPONS, weaponOf, ClassId, Soldier (classId, nextClassId, adsT), GameEvent ('kill' has weapon), TUNING
- src/ui/hud.ts: the current file (keep Overlay, Hud and createHud(root, game, onPlay) exactly; DOM ids gf-hud, gf-title, gf-play must stay)

## Change
- src/ui/hud.ts:
  - Class picker component (a function that builds a row of 4 cards, used twice: on the title overlay above the PLAY button, and on the death screen). Card: number key (1-4), class name, weapon name, blurb, three small stat bars from the weapon (damage = damage * pellets / 120, rate = 0.11 / fireIntervalS clamped to 1, range = falloffEnd / 120 clamped to 1), pinecone count. The card for game.player.nextClassId is highlighted (yellow border). Clicking a card (pointer-events auto) or pressing Digit1..Digit4 (window keydown, any time) sets game.player.nextClassId = CLASS_ORDER[k]. The death screen adds "Deploying as <name> in N". Under the title's picker: "Your class applies the next time you spawn." only while the match is running (paused overlay).
  - The first time PLAY is pressed in a match the player is alive with the default class. Make PLAY also respawn-free: if the player's chosen nextClassId differs from classId and the match has not started yet (game.time === 0), set game.player.classId = game.player.nextClassId and refill: ammo = weapon.magSize, reserve = weapon.reserveAmmo, grenades = CLASSES[id].grenades, before calling onPlay.
  - Compact layout on short screens (existing @media (max-height:500px) block): cards shrink to 4 in one row with smaller text.
  - Bottom right: weapon name above the ammo count (weaponOf(p).name).
  - Aiming: crosshair gap shrinks with p.adsT (lerp to 2 px) and the crosshair fades to a single dot when p.adsT > 0.9 for non-scope weapons. Scope weapons: when p.adsT > 0.85 show a full-screen scope overlay (a div with a radial-gradient: transparent circle of radius 42vmin, black outside, plus thin black crosshair lines across the circle and a red centre dot); hide the normal crosshair.
  - Kill feed and death screen verbs: cause 'gun' uses the weapon: acornRifle "acorned", seedSprayer "seeded", peaShooter "pea-sniped", blunderbuss "blunderbussed"; keep grenade "pineconed", roadkill "mowed down", wreck "wrecked".
  - Scoreboard rows show the class name after the gnome's name, in a dim colour.

## Contract
createHud signature and the Overlay type unchanged.

## Done when
- `npx tsc --noEmit -p .` shows no errors in src/ui/hud.ts.

## Out of scope
Every other file.
~~~~

~~~~text
Issue 2.6: touch controls for aiming and semi-auto
Epic: 2
Depends on: none

## Environment
Shared text above. Repo rule: never restyle or hide #ui itself.

## Goal
Touch players can aim down sights with an AIM toggle button, and semi-auto guns fire on each FIRE tap.

## Read first
- src/ui/touch.ts: the current touch controls (keep TouchControls and createTouchControls(root, input) exactly)
- src/config.ts: InputState (aim, fire, firePressed)

## Change
- src/ui/touch.ts:
  - FIRE: on pointer down also set input.state.firePressed = true (the existing fire = true on down / false on up stays).
  - New AIM button (60 px, class gft-aim, label "AIM", blue-grey) placed at bottom 290px, right 30px (above RELOAD). Tap toggles input.state.aim; while aim is on the button stays highlighted (class gft-latched: yellow border). setVisible(false) turns aim off.
  - Look drag sensitivity: multiply the existing look gain by 0.45 while input.state.aim is true (the player code also scales by FOV; this keeps fine aim on a phone).
  - Keep every existing button position.

## Contract
Unchanged exports.

## Done when
- `npx tsc --noEmit -p .` shows no errors in src/ui/touch.ts.

## Out of scope
Every other file.
~~~~

~~~~text
Issue 2.7: audio per weapon
Epic: 2
Depends on: none

## Environment
Shared text above.

## Goal
Each weapon sounds different, and a shotgun blast plays once per trigger pull, not once per pellet.

## Read first
- src/audio.ts: the current file (keep GameAudio and initAudio(game) exactly)
- src/config.ts: GameEvent ('shot' has weapon; one event per pellet), WeaponId

## Change
- src/audio.ts, in the 'shot' handler:
  - Play at most one sound per shooter per 40 ms (pellets of one blast arrive in the same frame). Keep the existing 30 ms global limit for non-player shots.
  - acornRifle: the existing sound.
  - seedSprayer: shorter (0.04 s) and lower (bandpass 1100 Hz) noise burst plus a 120 -> 50 Hz thump at 0.8 volume.
  - peaShooter: a sharp crack (0.12 s noise through a highpass at 2500 Hz) plus a 900 -> 120 Hz sine snap and a quiet 0.4 s low tail (80 -> 40 Hz).
  - blunderbuss: a big boom: 0.25 s noise through a lowpass sweeping 2500 -> 300 Hz plus a 90 -> 35 Hz sine at full volume.
- In the 'kill' handler, keep the player's kill ding; on a headshot kill by the player add a third higher note (1760 Hz).

## Contract
Unchanged exports.

## Done when
- `npx tsc --noEmit -p .` shows no errors in src/audio.ts.

## Out of scope
Every other file.
~~~~

---

## Result

- Epic 1 by the planner; epic 2: 7 issues in parallel, no dependencies.
- Planner fixes after epic 2: the bot flag scoring treated every owned flag as "being captured" (progress sign test), so squads camped their own flags and fighting stopped after ~90 s; now a flag is under attack only when not fully held and enemies stand on it. Lowered the aimed gun so the rifle's acorn and the sprayer's drum do not cover the crosshair. Touch help mentions AIM.
- Checks: build passes; a fast-forwarded match ran to a game over (about 150 kills in 5 minutes, flags trading hands, grenades); ADS screenshots for all four classes (FOV 52 / 58 / 16 scoped / 64); class picker on title and death screens; emulated phone with the AIM button; no page errors.
