# Gnome Theft Auto: character pass (lane D)

Goal: characters get in and out of vehicles cleanly in cutscenes, special characters sit right in every seat, guns are
held like guns (on foot and aiming, for the player, online players and cutscene actors), and every wearable and
holdable `@lawn/prefabs` item is equipped correctly.

## What was wrong (planner's diagnosis)

- **Dismounts.** (1) `director.ts` drew a finished exit sequence only while it ran: a mount finishes in about 1 s but an
  `exit` step lasts 2.2 s, so for the rest of the step the actor was drawn back in the seat, then popped out at the end.
  (2) `mount.ts` always started an exit from the driver's seat and ended it at the driver's spot, so passengers
  teleported to the driver's seat and every occupant landed on the same spot (stacked into one gnome). (3) The timeline
  (camera targets, the LOS check) used a different exit spot from mount.ts for closed vehicles, so the actor snapped
  when the step ended. (4) `enter` with `seat: 1..` climbed into the driver's seat and snapped to the passenger seat.
- **Seats.** Pay 'n' Glaze seat covers (hay bale, throne...) are taller than the stock seat, but the rider sat at the
  stock height: Granny sank chest-deep into her hay bale. Cutscene drivers kept their hands on their laps (no grips)
  and kept their held prop (Diggs's rifle through the steering).
- **Guns.** The four GTA gun prefabs had the stock sticking straight up out of the receiver (it was modelled on the
  gun's "top" axis) and the grip in line with the barrel, so the gun stuck out of the fist like a stick; no left hand on
  two-handed guns; the aim ignored pitch; the muzzle point was a hard-coded arm offset; each of weapons.ts, remotes.ts,
  police.ts, quests/cutscene.ts and the cutscene actors placed the held item by hand instead of through the shared
  `buildGear` anchor + prefab `wear` data.
- **Equip audit.** Held items lie along the hand anchor's axis, which trails BACKWARDS at rest; many tools and weapons
  pointed behind the gnome, drinks lay on their side, and five neck items already failed the clearance test.

## Shape

| Epic | Done when | Issues |
| --- | --- | --- |
| 1 Foundations | `npx tsc --noEmit -p games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto`, `npm test -w packages/gnome`, `npm test -w packages/prefabs`, `npm test -w packages/glaze` | 5 (1A guns data, 1B dismount, 1C gun pose, 1D seat covers, 1E hand-item audit) |
| 2 Wiring | build + tests + smoke on 5304, screenshots of `?cutscene=exit-lab`, `seat-lab`, `gun-lab`, `lab/equip.html` | 3 (2A player guns, 2B remote/police guns, 2C cutscene actors) |

The planner wrote the stubs (`src/gunHold.ts`, `src/seatCover.ts`), the dev labs (`src/cutscene/scenes/lab.ts`:
`seat-lab`, `exit-lab`, `gun-lab`) and the equip contact sheet (`games/gnome-theft-auto/lab/equip.html`,
`src/testing/equipSheet.ts`) before Epic 1.

## Epic 1

~~~~text
Epic: 1 Foundations / 1A Gun prefabs and gun mods data
Depends on: none

## Environment
Repo root C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a7749fba4793b7a06 (Git Bash; if node is
missing: export PATH="/c/Program Files/nodejs:$PATH"). Other workers edit other files of games/gnome-theft-auto at the
same time; touch only the files listed under Change. Do not start a dev server. Do not commit.

## Goal
The four GTA guns are modelled like real guns (grip hanging under the receiver, stock behind it, barrel in front),
held forward at rest through the shared hand anchor, with a `support` point for the left hand on two-handed guns, and
every gun mod still mounts in the right place.

## Read first
- packages/prefabs/src/catalog/gta-guns-air.ts: the four entries 'gta-pistol', 'gta-smg', 'gta-shotgun', 'gta-rifle'
- packages/prefabs/src/types.ts: PrefabDef fields `grip`, `wear` ({ at?, rot? (DEGREES), scale? }), `pivots`
- games/gnome-theft-auto/src/gunRig.ts: MOUNTS, mountFor, placeAt, buildModdedGun
- games/gnome-theft-auto/src/gunRig.test.ts

## Change
Gun frame (prefab coordinates, all four guns): +y = toward the muzzle (forward), -z = the gun's TOP, +z = its
UNDERSIDE (grip and magazine hang toward +z), -y = back (the stock). Lowest point stays at y = 0 (the catalog test).

1. packages/prefabs/src/catalog/gta-guns-air.ts: replace the `parts`, `grip` of the four guns with exactly these, and add
   `wear: { rot: [180, 0, 0] }` to all four, plus `pivots: { support: [...] }` on smg, shotgun and rifle. Keep ids, names,
   tags, examine lines. Update each `about` to describe the new layout (barrel along +y, grip hanging toward +z, stock
   toward -y, top is -z). Parts (box d = [x, y, z] size; cyl d = [rTop, rBottom, length along y]):
   gta-pistol: grip [0, 0.04, 0.05]
     { s: 'box', d: [0.05, 0.2, 0.06], at: [0, 0.1, -0.04], c: 'iron-dark' }        // frame and slide
     { s: 'cyl', d: [0.012, 0.012, 0.06], at: [0, 0.23, -0.045], c: 'steel', seg: 8 } // barrel
     { s: 'box', d: [0.045, 0.055, 0.12], at: [0, 0.04, 0.05], c: 'black' }          // grip, hangs below
     { s: 'box', d: [0.01, 0.012, 0.03], at: [0, 0.09, 0.01], c: 'iron-dark' }       // trigger
     { s: 'box', d: [0.012, 0.05, 0.01], at: [0, 0.095, 0.03], c: 'iron-dark' }      // trigger guard
     { s: 'box', d: [0.01, 0.012, 0.012], at: [0, 0.19, -0.074], c: 'iron-dark' }    // front sight
     { s: 'box', d: [0.02, 0.012, 0.012], at: [0, 0.02, -0.074], c: 'iron-dark' }    // rear sight
   gta-smg: grip [0, 0.16, 0.05], pivots { support: [0, 0.29, 0.0] }
     { s: 'box', d: [0.04, 0.12, 0.06], at: [0, 0.06, -0.04], c: 'wood-dark', name: 'stock' }
     { s: 'box', d: [0.06, 0.2, 0.08], at: [0, 0.21, -0.045], c: 'iron-dark' }       // receiver
     { s: 'box', d: [0.045, 0.05, 0.11], at: [0, 0.16, 0.05], c: 'black' }           // grip
     { s: 'box', d: [0.035, 0.04, 0.15], at: [0, 0.25, 0.07], c: 'iron', name: 'mag' }
     { s: 'box', d: [0.01, 0.012, 0.03], at: [0, 0.2, 0.01], c: 'iron-dark' }        // trigger
     { s: 'cyl', d: [0.013, 0.013, 0.14], at: [0, 0.38, -0.05], c: 'steel', seg: 8 } // barrel
     { s: 'cyl', d: [0.02, 0.02, 0.02], at: [0, 0.46, -0.05], c: 'black', seg: 8 }   // muzzle
   gta-shotgun: grip [0, 0.2, 0.045], pivots { support: [0, 0.36, 0.02] }
     { s: 'box', d: [0.05, 0.18, 0.08], at: [0, 0.09, -0.03], c: 'wood', name: 'stock' }
     { s: 'box', d: [0.07, 0.14, 0.09], at: [0, 0.24, -0.045], c: 'iron-dark' }      // receiver
     { s: 'box', d: [0.045, 0.05, 0.1], at: [0, 0.2, 0.04], c: 'wood-dark' }         // grip
     { s: 'box', d: [0.01, 0.012, 0.03], at: [0, 0.235, 0.01], c: 'iron-dark' }      // trigger
     { s: 'cyl', d: [0.02, 0.02, 0.52], at: [0, 0.57, -0.06], c: 'steel', seg: 8 }   // barrel 0.31..0.83
     { s: 'cyl', d: [0.016, 0.016, 0.4], at: [0, 0.51, -0.025], c: 'iron', seg: 8 }  // magazine tube
     { s: 'box', d: [0.05, 0.12, 0.06], at: [0, 0.36, -0.01], c: 'wood', name: 'pump' }
   gta-rifle: grip [0, 0.21, 0.05], pivots { support: [0, 0.34, -0.01] }
     { s: 'box', d: [0.05, 0.18, 0.08], at: [0, 0.09, -0.03], c: 'wood', name: 'stock' }
     { s: 'box', d: [0.07, 0.16, 0.1], at: [0, 0.25, -0.05], c: 'iron-dark' }        // receiver 0.17..0.33
     { s: 'box', d: [0.045, 0.05, 0.11], at: [0, 0.21, 0.045], c: 'wood-dark' }      // grip
     { s: 'box', d: [0.01, 0.012, 0.03], at: [0, 0.245, 0.01], c: 'iron-dark' }      // trigger
     { s: 'box', d: [0.035, 0.05, 0.1], at: [0, 0.29, 0.05], c: 'iron', name: 'mag' }
     { s: 'box', d: [0.055, 0.2, 0.06], at: [0, 0.42, -0.045], c: 'wood' }           // handguard 0.32..0.52
     { s: 'cyl', d: [0.014, 0.014, 0.42], at: [0, 0.72, -0.055], c: 'steel', seg: 8 } // barrel 0.51..0.93
     { s: 'box', d: [0.02, 0.1, 0.03], at: [0, 0.27, -0.11], c: 'iron-dark', name: 'scope-base' }
     { s: 'cyl', d: [0.02, 0.02, 0.16], at: [0, 0.27, -0.13], c: 'iron-dark', seg: 8, name: 'scope' }
     { s: 'cyl', d: [0.018, 0.018, 0.01], at: [0, 0.355, -0.13], c: GLASS_BLUE, glow: true, seg: 8, name: 'scope-lens' }

2. games/gnome-theft-auto/src/gunRig.ts:
   - Add an optional `rot?: [number, number, number]` (DEGREES, x then y then z) to `interface Mount`. In buildModdedGun,
     when the mount has `rot`, set `part.rotation.set(rot[0]*DEG, rot[1]*DEG, rot[2]*DEG)` (DEG = Math.PI / 180) BEFORE
     calling placeAt (placeAt measures the part with Box3.setFromObject, which includes the rotation).
   - Replace the MOUNTS entries of pistol, smg, shotgun, rifle with these (and update the comment above MOUNTS to the
     new frame: barrel +y, top -z, underside +z, back -y):
     pistol: muzzle/barrel { at: [0, 0.26, -0.045], align: { y: 'min' } }, optic { at: [0, 0.1, -0.07], align: { z: 'max' } },
       under { at: [0, 0.16, -0.01], align: { z: 'min' } }, mag { at: [0, 0.04, 0.11], align: { z: 'min' }, rot: [-90, 0, 0] },
       stock { at: [0, 0, -0.04], align: { y: 'max' }, rot: [-90, 0, 0] }, charm { at: [0.0225, 0.04, 0.08], align: { x: 'min' } }
     smg: muzzle/barrel { at: [0, 0.47, -0.05], align: { y: 'min' } }, optic { at: [0, 0.21, -0.085], align: { z: 'max' } },
       under { at: [0, 0.37, -0.037], align: { z: 'min' } }, mag { at: [0, 0.25, -0.005], align: { z: 'min' }, rot: [-90, 0, 0], hides: ['mag'] },
       stock { at: [0, 0.11, -0.045], align: { y: 'max' }, rot: [-90, 0, 0], hides: ['stock'] }, charm { at: [0.0225, 0.16, 0.08], align: { x: 'min' } }
     shotgun: muzzle/barrel { at: [0, 0.83, -0.06], align: { y: 'min' } }, optic { at: [0, 0.24, -0.09], align: { z: 'max' } },
       under { at: [0, 0.6, -0.009], align: { z: 'min' } }, mag { at: [0, 0.27, 0.0], align: { z: 'min' }, rot: [-90, 0, 0] },
       stock { at: [0, 0.17, -0.04], align: { y: 'max' }, rot: [-90, 0, 0], hides: ['stock'] }, charm { at: [0.0225, 0.2, 0.08], align: { x: 'min' } }
     rifle: muzzle/barrel { at: [0, 0.93, -0.055], align: { y: 'min' } },
       optic { at: [0, 0.25, -0.1], align: { z: 'max' }, hides: ['scope', 'scope-lens', 'scope-base'] },
       under { at: [0, 0.45, -0.015], align: { z: 'min' } }, mag { at: [0, 0.29, 0.0], align: { z: 'min' }, rot: [-90, 0, 0], hides: ['mag'] },
       stock { at: [0, 0.17, -0.04], align: { y: 'max' }, rot: [-90, 0, 0], hides: ['stock'] }, charm { at: [0.0225, 0.21, 0.08], align: { x: 'min' } }
   - Record the muzzle on the holder: after the PLACE_ORDER loop, compute the muzzle point in PREFAB coordinates as
     `barrelMuzzle?.at ?? mountFor(gun, 'muzzle', bb).at`; if a 'muzzle' mod was placed, use the top of that placed
     part instead ([mount.at[0], placed.max.y, mount.at[2]] from its placeAt result). Convert to HOLDER-local by adding
     `inner.position` (inner is translated by -grip) and store it as `holder.userData.muzzle = [x, y, z]` (plain numbers).
     (Holder scale from opts.scale does not change userData; callers use holder.localToWorld.)
3. games/gnome-theft-auto/src/gunRig.test.ts: add tests:
   - for each of pistol/smg/shotgun/rifle with no mods, `holder.userData.muzzle` is an array of 3 numbers and its y is
     greater than every other vertex's y minus 0.03 (it is at the front of the gun; measure the holder's Box3 max.y).
   - the rifle with { stock: <the id of the first GUN_MODS entry with slot 'stock' that fits the rifle> }: the
     `mod-stock` node's Box3 (in holder space; holder.updateMatrixWorld(true) then Box3.setFromObject) has max.y below
     the grip (holder-local y < 0.01), i.e. the stock sits behind the hand, not above the gun.
   - the smg with the first 'mag' mod that fits it: the `mod-mag` Box3 min.z >= -0.06 (it hangs below, +z).

## Contract
- Prefab ids unchanged. `support` pivot name exactly 'support' (prefab coordinates). `wear: { rot: [180, 0, 0] }` on all four.
- `holder.userData.muzzle: [number, number, number]` in holder-local coordinates (set by buildModdedGun for every gun kind).
- buildModdedGun's signature is unchanged.

## Done when
- `npm test -w packages/prefabs` passes (catalog rules: lowest point within 0.03 of y 0, grip present, etc.).
- `npx vitest run src/gunRig.test.ts src/gunMods.test.ts` in games/gnome-theft-auto passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.

## Out of scope
gunHold.ts, weapons.ts, remotes.ts, gunStore.ts and every other catalog file (another worker edits other catalog files).
~~~~

~~~~text
Epic: 1 Foundations / 1B Seat-aware mount and dismount in cutscenes
Depends on: none

## Environment
Repo root C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a7749fba4793b7a06 (Git Bash; if node is
missing: export PATH="/c/Program Files/nodejs:$PATH"). Other workers edit other files of games/gnome-theft-auto at the
same time. Do not start a dev server. Do not commit. All paths below are under games/gnome-theft-auto/src.

## Goal
Every occupant of a vehicle gets out from its own seat to its own spot (no stacking, no teleport to the driver's
seat), `enter` climbs into the seat it names, the cutscene timeline and mount.ts agree on that spot, and a finished
exit sequence is never drawn back in the seat.

## Read first
- seats.ts (seatPos), mount.ts (beginMount, standing, doorGround, seatWorld, stepMount, climbSeconds)
- config.ts: MOUNT and MOUNT_STYLES (lines ~225-251); VehicleSpec in types.ts (seat, passengerSeats, radius, openTop,
  doors: { side: 'left'|'right'; pivot; at: [x,y,z] }[], mountStyle)
- cutscene/timeline.ts: compile() cases 'enter' and 'exit' (~line 192), sampleFrame cases 'enter'/'exit' (~line 538)
- cutscene/director.ts: fire() cases 'enter'/'exit' (~line 194) and the actor loop in update() (~line 464)

## Change
Vehicle-local space: +x is the vehicle's LEFT, +z its nose; toWorld(x, z) = (v.x + lx*cos(yaw) + lz*sin(yaw), v.z - lx*sin(yaw) + lz*cos(yaw)).
1. seats.ts: add (pure, import MOUNT and MOUNT_STYLES from './config'):
   ```ts
   /** Closed vehicle: has doors and openTop === false. */
   export function isClosed(spec: VehicleSpec): boolean   // spec.openTop === false && (spec.doors?.length ?? 0) > 0
   /** The side a seat gets out on: 1 = the vehicle's left (+x), -1 = its right. A seat on the centre line (|x| <= 0.05) uses the left. */
   export function exitSide(spec: VehicleSpec, seat: number): 1 | -1
   /** Closed vehicles: index in spec.doors of the first door on exitSide's side ('left' = 1), else 0. Open-top: null. */
   export function exitDoor(spec: VehicleSpec, seat: number): number | null
   /** Where a gnome stands after getting out of `seat`, vehicle-local x/z.
    *  Closed: the door's ground spot: x = side * (|door.at[0]| + MOUNT.standOff), z = door.at[2] (side from door.side).
    *  Open-top: x = exitSide * (spec.radius + 0.8), z = seatPos(spec, seat)[2]. */
   export function exitLocal(spec: VehicleSpec, seat: number): { x: number; z: number }
   /** The climb time: MOUNT_STYLES[style].seconds + max(0, spec.seat[1]) * MOUNT.climbPerHeight, style = spec.mountStyle ?? (isClosed ? 'door' : 'vault'). */
   export function climbSecondsOf(spec: VehicleSpec): number
   /** How long a whole exit sequence takes: closed: doorSeconds + climb + doorSeconds; open-top: climb + MOUNT.settleSeconds. */
   export function exitSeconds(spec: VehicleSpec): number
   ```
2. mount.ts (keep edits minimal; another lane edits the moving-vehicle bail-out elsewhere in this file):
   - `MountSeq` gets `readonly seat: number`.
   - `beginMount(mode, v, from, seat = 0)`: store seat; for 'exit' the door is `doorsOf(v).length ? exitDoor(v.spec, seat) : null`
     (keep `nearestDoor` for enter/yank); `pos` for exit = `seatWorld(v, seat)`.
   - `seatWorld(v: Vehicle, seat = 0)`: use `seatPos(v.spec, seat)` and add `coverLift(v, seat)` (import from './seatCover';
     it is a stub returning 0 now, another worker fills it) to the y: `toWorld(v, s[0], s[1] + (v.rig?.seatLift ?? 0) + coverLift(v, seat), s[2])`.
   - `standing()`, exit without a door: `const e = exitLocal(v.spec, seq.seat); const p = toWorld(v, e.x, 0, e.z); return onGround(p.x, p.z);`
   - every other `seatWorld(v)` call inside stepMount becomes `seatWorld(v, seq.seat)`.
   - `climbSeconds(v)` returns `climbSecondsOf(v.spec)`.
3. cutscene/timeline.ts:
   - compile(): track each actor's seat (`seatOf` map: initial `a.seat ?? 0`; an 'enter' step sets `step.seat ?? 0`). In
     'exit', replace the old radius+0.8 spot with `exitLocal(VEHICLES[kind], seatOf.get(step.who) ?? 0)` turned to world
     with the car mover's pt/yaw (formula above).
   - sampleFrame 'exit': the end spot is the same exitLocal turned to world with the vehicle sample (v.x, v.z, v.yaw),
     y = env.ground(ex, ez). While running, interpolate from the SEAT's world position (seatPos(spec, a.seat) turned to
     world, y = v.y + seat y) to the end spot with `u = clamp01(elapsed / Math.min(ts.dur, exitSeconds(spec)))`, so the
     estimate moves at the real sequence's pace. Keep a.mount / a.seatedIn handling as it is.
   - sampleFrame 'enter': lerp toward the named seat's world position (seat st.seat ?? 0) instead of the vehicle centre.
4. cutscene/director.ts:
   - fire 'enter': `beginMount('enter', vr.v, {x,y,z}, st.seat ?? 0)`; fire 'exit': `beginMount('exit', vr.v, {x,y,z}, from.seat)`.
   - actor loop: right after the `if (m && !m.done) {...; continue; }` block add
     `if (m && m.done && s.mount) continue; // the sequence finished before its step: hold its last pose (never back in the seat)`
     so it runs BEFORE the `if (s.seatedIn)` branch. Remove the now-redundant later `if (s.mount) continue;` only if it
     is unreachable; otherwise keep it.
5. Tests:
   - seats.test.ts: exitLocal for the 'lowrider' (VEHICLES from config) seats 0..3 gives four spots at least 0.5 apart;
     seats with x < -0.05 get out on the right (x < 0); 'ride-on' seats 0 and 1 differ in z; 'hoa-van' seat 0 equals
     the left door's ground spot; exitSeconds > 0 for every VEHICLES entry.
   - mount.test.ts: a parked ride-on (build the Vehicle the same way existing tests in mount.test.ts do), exit seat 1:
     the first frame's pose is at seatWorld(v, 1) (not seat 0) and the last frame (step until done with dt 1/60) stands
     at toWorld(v, exitLocal(spec, 1).x, 0, exitLocal(spec, 1).z) within 0.01 in x and z.
   - cutscene/timeline.test.ts: a script with a 'ride-on' at [0, 0] yaw 0 and actors a (seat 0) and b (seat 1) seated,
     steps `[{ do: 'exit', who: 'a', async: true }, { do: 'exit', who: 'b' }]`: after the steps, the sampled positions
     of a and b differ by >= 0.5 m and each equals its exitLocal spot in world. Use the same env helper the existing
     timeline tests use.

## Contract
- seats.ts exports exactly the six functions above. mount.ts: `beginMount(mode, v, from, seat = 0)`, `seatWorld(v, seat = 0)`.
- seatCover.ts exports `coverLift(v: Vehicle, seat: number): number` (do not edit that file).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
- In games/gnome-theft-auto: `npx vitest run src/seats.test.ts src/mount.test.ts src/cutscene/timeline.test.ts` passes.
- `npm test -w games/gnome-theft-auto` passes. If a scene in src/cutscene/scenes fails the line-of-sight check ONLY
  because an exit spot moved (the report names an `exit` step), list the scene ids in your report; do not edit scenes.

## Out of scope
seatCover.ts, gunHold.ts, cutscene/actors.ts, cutscene/sceneVehicles.ts, vehicles.ts, player.ts, app.ts.
~~~~

~~~~text
Epic: 1 Foundations / 1C One gun pose for every gnome (gunHold.ts)
Depends on: none

## Environment
Repo root C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a7749fba4793b7a06 (Git Bash; if node is
missing: export PATH="/c/Program Files/nodejs:$PATH"). Other workers edit other files at the same time (one of them is
changing the gun prefabs in packages/prefabs/src/catalog/gta-guns-air.ts to add a `support` pivot and a `wear`). Do not
start a dev server. Do not commit.

## Goal
games/gnome-theft-auto/src/gunHold.ts (now a stub with the final exports) poses a gnome holding a gun: the right hand on
the grip in front of the body, the gun pointing along the aim (or lowered when not aiming), the left hand on the
`support` point of two-handed guns, and places held items on the hand through the shared anchor + prefab wear data.

## Read first
- games/gnome-theft-auto/src/gunHold.ts (the stub: keep every exported name and signature)
- packages/gnome/src/gear.ts: anchorMatrix(slot, out), wearMatrix(wear, out) (both exported from '@lawn/gnome')
- packages/gnome/src/model.ts lines 125-160: arms are pivots at (+-0.27, 0.62, 0) in rig space (armL = +0.27 = the
  gnome's LEFT, armR = -0.27 = its RIGHT), each a box hanging along local -y with the hand ball at y = -0.32; the
  gnome faces +z.
- packages/glaze/src/grips.ts: reachArm(arm, worldTarget, { maxStretch }) -> { reached, stretch }, releaseArm(arm)
- packages/prefabs/src/pivots.ts: pivotAt(def); getPrefab(id) from '@lawn/prefabs' (PrefabDef has uses, grip, wear, pivots)

## Change
games/gnome-theft-auto/src/gunHold.ts, implement:
- `export const GUN_POSE` (tunable numbers, rig space: feet y 0, +z forward, +x the gnome's left):
  `{ aimGrip2: [0, 0.56, 0.22], aimGrip1: [-0.2, 0.6, 0.3], lowGrip2: [-0.08, 0.42, 0.2], lowGrip1: [-0.27, 0.34, 0.08],
     lowPitch2: -0.5, lowPitch1: -0.9, pitchLift: 0.25, leftStretch: 1.45 }` (as const, typed Vec3 tuples).
- `isGunPrefab(id)`: getPrefab(id)?.uses includes 'shoot'. `isTwoHanded(id)`: getPrefab(id)?.pivots?.support exists.
- `placeInHand(holder, prefabId, arm)`: like buildGear: `m = anchorMatrix('hand').multiply(wearMatrix(def?.wear))`, keep
  the holder's existing uniform scale s0 = holder.scale.x, decompose m into holder.position/quaternion/scale, then
  multiply scale by s0; store `holder.userData.prefabId = prefabId`, `holder.userData.baseQuat = holder.quaternion.clone()`;
  `arm.add(holder)`; return holder.
- `poseGunArms(model, prefabId, aim, held)`: does nothing when prefabId is null or not a gun. Otherwise:
  1. two = isTwoHanded(id). pitch = aim.aiming ? clamp(aim.pitch, -1.2, 1.2) : (two ? lowPitch2 : lowPitch1).
     grip target (rig space) = aim.aiming ? (two ? aimGrip2 : aimGrip1) : (two ? lowGrip2 : lowGrip1), then
     y += pitchLift * sin(pitch) when aiming.
  2. Right arm, NO stretch: model.rig.updateWorldMatrix(true, true); target world = model.rig.localToWorld(grip);
     in the arm's parent space: local = arm.parent.worldToLocal(target.clone()); dir = (local - arm.position).normalize();
     arm.quaternion.setFromUnitVectors((0, -1, 0), dir); arm.scale.set(1, 1, 1).
  3. If `held`: the gun's wanted orientation in rig space maps prefab +y to fwd = (0, sin(pitch), cos(pitch)) and prefab
     +z to down' = (0, -cos(pitch), sin(pitch)) (so prefab -z, the top, points up), prefab +x to fwd x down' — build it with
     Matrix4.makeBasis(xAxis, fwd, down') and Quaternion.setFromRotationMatrix. World wanted = rigWorldQuat * qRig.
     Set held.quaternion = inverse(armWorldQuat) * wantedWorld (update the arm's world matrix first, read
     arm.getWorldQuaternion). Leave held.position and held.scale alone.
  4. Left arm: if two and held, model.updateMatrixWorld(true); s = pivotAt(def.pivots.support), g = def.grip ?? [0,0,0];
     point = held.localToWorld(new Vector3(s[0]-g[0], s[1]-g[1], s[2]-g[2])); reachArm(model.arms.left, point,
     { maxStretch: GUN_POSE.leftStretch }). Not two-handed: releaseArm(model.arms.left).
  Use module-level scratch objects (it runs every frame for several gnomes; do not allocate per call).
- `clearGunArms(model, held)`: releaseArm both arms; if held?.userData.baseQuat, copy it back into held.quaternion.
- `muzzleWorld(held, out)`: if Array.isArray(held.userData.muzzle) use it (holder-local) via held.localToWorld; else
  compute the holder's local Box3 (traverse meshes) and use (centre x, max.y, centre z) in holder-local; return out.

games/gnome-theft-auto/src/gunHold.test.ts (new, vitest; node env like the game's other tests):
- Build `createGnomeModel(DEFAULT_LOOK)` (DEFAULT_LOOK from './config'), call model.update with an idle state
  ({ position: new Vector3(), velocity: new Vector3(), facing: 0, grounded: true, jumpsUsed: 0, sitting: false }, 1/60).
- Register a fake two-handed gun with `registerPrefab` from '@lawn/prefabs' (id 'test-gun-2h', category 'weapon',
  uses ['hold', 'shoot'], grip [0, 0.1, 0.05], pivots { support: [0, 0.22, 0.0] }, wear { rot: [180, 0, 0] }, one box
  part d [0.05, 0.5, 0.06] at [0, 0.25, -0.03], plus the required fields name/tags/emoji/about/examine: copy the shape of
  an existing catalog entry) and a fake one-handed gun 'test-gun-1h' (no support). Build holders with buildHeld(id).
- Tests: (a) placeInHand puts the holder on the arm with userData.baseQuat set. (b) aiming level (pitch 0) with
  'test-gun-2h': the holder's world +y direction (held.localToWorld of (0,1,0) minus of (0,0,0), normalised) has
  z > 0.95 (points forward). (c) pitch 0.5: its y component is about sin(0.5) (within 0.05). (d) the left hand reached
  the support point: the left arm's hand point (arms.left.localToWorld((0, -0.32, 0))) is within 0.05 of the support
  point in world. (e) not aiming: the gun points forward-down (z > 0.5, y < -0.2). (f) one-handed gun: the left arm
  scale is 1. (g) muzzleWorld with userData.muzzle = [0, 0.4, 0] returns held.localToWorld of it.
- If registerPrefab cannot be used for some reason, build the PrefabDef inline and pass it to buildHeld, and make
  isGunPrefab/isTwoHanded/placeInHand take the def through getPrefab after registering it; do not change the exported signatures.

## Contract (verbatim, keep exactly)
```ts
export interface GunAim { aiming: boolean; pitch: number }
export function isGunPrefab(prefabId: string | null): boolean
export function isTwoHanded(prefabId: string | null): boolean
export function placeInHand(holder: THREE.Object3D, prefabId: string, arm: THREE.Object3D): THREE.Object3D
export function poseGunArms(model: GnomeModel, prefabId: string | null, aim: GunAim, held?: THREE.Object3D | null): void
export function clearGunArms(model: GnomeModel, held?: THREE.Object3D | null): void
export function muzzleWorld(held: THREE.Object3D, out: THREE.Vector3): THREE.Vector3
export const GUN_POSE
```

## Done when
- `npx vitest run src/gunHold.test.ts` (in games/gnome-theft-auto) passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.

## Out of scope
Every other file (weapons.ts, player.ts, remotes.ts, cutscene/*, the prefab catalog): other workers own them.
~~~~

~~~~text
Epic: 1 Foundations / 1D Seat covers lift the rider
Depends on: none

## Environment
Repo root C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a7749fba4793b7a06 (Git Bash; if node is
missing: export PATH="/c/Program Files/nodejs:$PATH"). Other workers edit other files at the same time. Do not start a
dev server. Do not commit.

## Goal
A Pay 'n' Glaze seat cover (hay bale, throne, beanbag...) lifts whoever sits on it, so riders sit ON the cover instead
of sinking into it. Today Granny sits chest-deep in her hay bale.

## Read first
- packages/glaze/src/fittings.ts: buildFittings, `place(prefabId, at, opts)` (holder at `at`, scaled by k), the seat line
  `put(\`glaze-seat-${loadout.seat}\`, P.seat ?? null)`
- packages/glaze/src/attach.ts: attachLoadout, `seatScale`, `get seatLift()`, the GlazeRig object; packages/glaze/src/types.ts (GlazeRig)
- packages/prefabs/src/catalog/gta-glaze-seats.ts: the eleven `glaze-seat-<id>` prefabs (bench, bucket, saddle,
  beanbag, throne, springer, cosy, toadstool, barrel, teacup, hay)
- games/gnome-theft-auto/src/seatCover.ts (stub, final signature), seats.ts (seatPos), vehicles.ts seatWorld (~line 693),
  cutscene/sceneVehicles.ts seatLocal
- packages/gnome/src/model.ts: makeLeg / legs (sitting turns the legs forward at the hips)

## Change
1. packages/glaze: add to the GlazeRig interface (types.ts) and attach.ts:
   `/** The fitted seat cover's sitting surface: top centre in the root's parent space (scaled like seatLift, ride offset NOT included). null without a cover. */ readonly seatCover: [number, number, number] | null;`
   Compute it in apply(): when `current.seat !== 'none'` and the mounts have a `seat` point P:
   `[P[0] * s, (P[1] + SEAT_CUSHION[current.seat] * k) * s, P[2] * s]` where s = root.scale.y (the same value as
   seatScale) and k is the scale buildFittings uses for fittings (read fittings.ts; expose it if needed).
   `SEAT_CUSHION: Readonly<Record<SeatId, number>>` (export it, fittings.ts or a new seats.ts in packages/glaze/src) is
   the height of each cover's SITTING SURFACE (not its backrest) above its own origin, in prefab units, read from the
   parts in gta-glaze-seats.ts: for each seat, the top (at y + d[1]/2 for a box, at y + length/2 for a cyl, at y + d[0]
   for a ball) of the highest part that lies in the seat area (exclude backrests: parts whose z centre is beyond 0.15
   from the middle and taller than they are deep). Write the number with a comment per seat naming the part.
   Add a test in packages/glaze (attach.test.ts or a new file): with seat 'hay' the rig's seatCover y is greater than
   with seat 'bench'; with seat 'none' it is null.
2. games/gnome-theft-auto/src/seatCover.ts: implement
   `coverLift(v, seat)`: 0 when !v.rig?.seatCover or seat !== 0 (covers sit on the driver's seat). Otherwise
   `Math.max(0, cover[1] - (seatPos(v.spec, 0)[1] + RIDER_SEAT_HEIGHT))`, and also 0 when |cover[2] - seat z| > 0.5.
   `export const RIDER_SEAT_HEIGHT` = the height of a sitting gnome's seat of the pants above its feet origin: measure it
   in a test (createGnomeModel(DEFAULT_LOOK), update with sitting: true for 2 s of 1/60 steps; the lowest y of the legs'
   meshes in rig space with the model at the origin) and write the measured value rounded to 0.01.
3. games/gnome-theft-auto/src/vehicles.ts seatWorld: add `coverLift(v, seat)` to the seat y (next to the seatLift term).
   games/gnome-theft-auto/src/cutscene/sceneVehicles.ts seatLocal: add `coverLift(v, seat)` to y the same way.
4. games/gnome-theft-auto/src/seatCover.test.ts: RIDER_SEAT_HEIGHT matches the measurement within 0.02; a 'ride-on'
   created with createVehicle and a loadout with seat 'hay' (look at vehicles.glaze.test.ts for how tests make a glazed
   vehicle) has coverLift(v, 0) > 0 and coverLift(v, 1) === 0; with seat 'none' it is 0.

## Contract
- `coverLift(v: Vehicle, seat: number): number` (unchanged signature). GlazeRig.seatCover as above.
- Do not change GlazeRig.seatLift.

## Done when
- `npm test -w packages/glaze` passes; `npx vitest run src/seatCover.test.ts src/vehicles.glaze.test.ts` in games/gnome-theft-auto passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` passes; `npx tsc --noEmit -p packages/glaze` passes (if that project file exists).

## Out of scope
mount.ts, seats.ts, cutscene/timeline.ts, cutscene/director.ts, cutscene/actors.ts (other workers own them).
~~~~

~~~~text
Epic: 1 Foundations / 1E Hand-held items point the right way (equip audit, hand slot)
Depends on: none

## Environment
Repo root C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a7749fba4793b7a06 (Git Bash; if node is
missing: export PATH="/c/Program Files/nodejs:$PATH"). Other workers edit other files at the same time, including
packages/prefabs/src/catalog/gta-guns-air.ts (do NOT edit that file). Do not start a dev server. Do not commit.

## Goal
Every `@lawn/prefabs` item with 'hold' in `uses`, worn in the gnome's hand through buildGear('hand', id), points
forward or up (never trailing behind the gnome or into the ground), and drinks, lamps and other upright things stand
upright. Fixed only through each prefab's `wear` data, checked by a new test.

## Read first
- packages/gnome/src/gear.ts (buildGear, anchorMatrix, wearMatrix), packages/gnome/src/anatomy.ts EQUIP_ANCHORS.hand
  (at [0, -0.32, 0.02], rot [-90, 0, 0]: at rest it turns an item's +y to point BACKWARDS, -z)
- packages/gnome/src/gear-clearance.test.ts (test style), packages/gnome/src/model.ts (createGnomeModel, arms, rig)
- packages/prefabs/src/types.ts PrefabWear ({ at?, rot? in DEGREES x,y,z, scale? })

## Change
1. packages/gnome/src/hold-pose.test.ts (new). For every prefab in allPrefabs() with uses including 'hold', EXCEPT ids
   starting with 'gta-' that are guns (gta-pistol, gta-smg, gta-shotgun, gta-rifle: another worker fixes those):
   build a gnome `createGnomeModel(look)` with a plain look (copy DEFAULT_LOOK-like fields from model.test.ts),
   `model.update({ position: new Vector3(), velocity: new Vector3(), facing: 0, grounded: true, jumpsUsed: 0, sitting: false }, 1)`,
   then set `model.arms.right.rotation.set(0, 0, 0)` and `model.arms.left.rotation.set(0, 0, 0)` (arms hang), add
   `buildGear('hand', id)` to `model.arms.right`, `model.object.updateMatrixWorld(true)`.
   H = the gear root's world position (the hand). Collect every mesh vertex in world space. F = the vertex farthest
   from H, L = |F - H|.
   - `${id} stays above the ground`: min vertex y >= 0.
   - `${id} does not trail behind`: when L > 0.2, (F - H).z / L >= -0.3.
   - `${id} stands upright` (only items whose tags include one of: 'drink', 'potion', 'cup', 'mug', 'tankard', 'glass',
     'bottle', 'flask', 'lantern', 'candle', 'trophy', 'can', 'jar', 'pot', 'tea'): the gear's world up axis (gear root
     localToWorld (0,1,0) minus localToWorld (0,0,0), normalised; the gear root is the buildGear result's child 0 for
     held items, i.e. the buildHeld holder... simplest: take buildGear's result `g` and use g's quaternion applied to
     (0,1,0), then the arm's world quaternion) has y >= 0.8.
   Print one line per failing item with the numbers (use the expect message).
2. Run it: `npx vitest run src/hold-pose.test.ts` in packages/gnome. For each failing item, edit ITS prefab entry in
   packages/prefabs/src/catalog/<file>.ts (find it with grep "id: '<id>'"), only the `wear` field:
   - trails behind: add 180 to wear.rot[0] (no wear: `wear: { rot: [180, 0, 0] }`) — the item now points forward.
   - not upright: wear.rot = [90, 0, 0] (keep any existing `at`/`scale`).
   - below the ground after that: try wear.rot = [90, 0, 0] (point it up) instead; if a long pole item still fails,
     set wear.scale to 0.8 at most; if it STILL fails, leave it and list it in your report.
   Re-run until every remaining failure is listed in your report. Keep each edit to the `wear` line; keep formatting.
3. Also run `npm test -w packages/prefabs`, `npm test -w packages/gnome` and `npm test -w games/dayg` (dayg holds items
   through buildGear) and fix only failures you caused.

## Contract
Edit only `wear` fields of 'hold' prefabs (no `parts`, no `grip`), plus the new test file.

## Done when
- `npx vitest run src/hold-pose.test.ts` in packages/gnome passes, except items you list as unresolved in your report
  (mark them with `it.skip` and a `// unresolved: <why>` comment so the suite is green).
- `npm test -w packages/prefabs` passes. Report: the list of ids you changed and how, and the unresolved ids with reasons.

## Out of scope
packages/prefabs/src/catalog/gta-guns-air.ts, packages/gnome/src/anatomy.ts (do not change the anchors), any game code.
~~~~

## Epic 2

~~~~text
Epic: 2 Wiring / 2A The player's gun: one pose, real muzzle
Depends on: Epic 1 (done: gunHold.ts and the new gun prefabs exist)

## Environment
Repo root C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a7749fba4793b7a06 (Git Bash; if node is
missing: export PATH="/c/Program Files/nodejs:$PATH"). Other workers edit remotes.ts, police.ts, quests/cutscene.ts and
cutscene/actors.ts at the same time; do not touch those. Do not start a dev server. Do not commit. Paths below are under
games/gnome-theft-auto/src.

## Goal
The local player's held gun goes through the shared hand placement (anchor + prefab wear) and the shared gun pose
(gunHold.ts): lowered at the ready while walking, raised along the camera's aim (pitch included) while aiming or firing,
left hand on two-handed guns; tracers start at the gun's real muzzle.

## Read first
- gunHold.ts: placeInHand(holder, prefabId, arm), poseGunArms(model, prefabId, { aiming, pitch }, held),
  clearGunArms(model, held), muzzleWorld(held, out)
- weapons.ts: attachTo, setVisible, selectGun/setLoadout, rebuildHeld (~line 466) and the `held`/`hand` variables
- types.ts: `interface Weapons` (~line 415)
- app.ts: the gun block that starts with `chase.aimDir(aim);` (~line 1233), `let mount` (~line 527), `deathT`, `aimT`;
  player.updateFoot runs earlier in the frame (~line 1159), so posing after it wins.
- config.ts GUNS (each gun's `prefab`)

## Change
1. types.ts, interface Weapons, add (GnomeModel is already imported as a type there):
   ```ts
   /** Pose the holder's arms and the held gun (gunHold.ts). Call every frame after the player's model update, on foot only. */
   poseArms(model: GnomeModel, aiming: boolean, pitch: number): void;
   /** Put the arms and gun back to the plain hand placement; does something only on the first call after poseArms. */
   relaxArms(model: GnomeModel): void;
   /** The held gun's muzzle in world space into `out`; false (out untouched) when no gun is held. */
   muzzleWorld(out: THREE.Vector3): boolean;
   ```
2. weapons.ts:
   - rebuildHeld(): `held = buildModdedGun(w.gun, loadouts[w.gun]); held.visible = visible; if (hand) placeInHand(held, GUNS[w.gun].prefab, hand);`
     (remove the manual position/rotation lines and their comment).
   - attachTo(h): `hand = h; if (held) placeInHand(held, GUNS[w.gun].prefab, h);`
   - poseArms: `if (!held || !visible) return; poseGunArms(model, GUNS[w.gun].prefab, { aiming, pitch }, held); posed = true;`
   - relaxArms: `if (!posed) return; posed = false; clearGunArms(model, held);`
   - muzzleWorld: `if (!held) return false; gunMuzzle(held, out); return true;` (import gunHold's muzzleWorld as `gunMuzzle`).
3. app.ts, replace `player.muzzle(muzzle);` in the gun block with:
   ```ts
   // The gun pose (gunHold.ts): lowered at the ready on foot, along the camera's aim while aiming or firing.
   const gunOnFoot = !v && !mount && !player.swimming && deathT <= 0;
   if (gunOnFoot) weapons.poseArms(player.model, aimT > 0.05 || !!inp.fire, Math.asin(THREE.MathUtils.clamp(aim.y, -1, 1)));
   else weapons.relaxArms(player.model);
   player.muzzle(muzzle);
   if (gunOnFoot) weapons.muzzleWorld(muzzle);
   ```
   (check the names: `v` is the player's vehicle in that function, `mount` the active mount, `aim` the camera aim
   direction filled by chase.aimDir; adapt if they differ, and confirm `player.model` exists and THREE is imported.)
4. Tests: if an existing test builds a fake Weapons object, add the three new methods to it. Add src/weapons.hold.test.ts:
   createWeapons(new THREE.Scene(), fx) with a fake Fx (see how other tests make one, or a Proxy whose every property is
   a no-op function), attachTo(model.arms.right) of a createGnomeModel(DEFAULT_LOOK) after model.update(idle state
   { position: new Vector3(), velocity: new Vector3(), facing: 0, grounded: true, jumpsUsed: 0, sitting: false }, 1/60);
   then `poseArms(model, true, 0)`: muzzleWorld returns true and the muzzle is in front of the gnome (z > 0.3) at about
   chest height (0.3 < y < 0.9); selectGun('rifle') then poseArms: the left arm's scale.y is not 1 (it reached the
   support point); relaxArms resets it to 1.

## Contract
Weapons interface additions exactly as above. Do not change gunHold.ts.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
- `npx vitest run src/weapons.hold.test.ts src/gunRig.test.ts` passes (in games/gnome-theft-auto).

## Out of scope
player.ts (leave its old arm lines; poseArms runs after them), remotes.ts, police.ts, quests/cutscene.ts, cutscene/*, gunHold.ts.
~~~~

~~~~text
Epic: 2 Wiring / 2B Online players, police and room guards hold guns the same way
Depends on: Epic 1 (done: gunHold.ts and the new gun prefabs exist)

## Environment
Repo root C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a7749fba4793b7a06 (Git Bash; if node is
missing: export PATH="/c/Program Files/nodejs:$PATH"). Other workers edit weapons.ts, types.ts, app.ts and
cutscene/actors.ts at the same time; do not touch those. Do not start a dev server. Do not commit. Paths below are under
games/gnome-theft-auto/src.

## Goal
Other players (online), Hat Watch officers and the room cutscene's guards hold their guns through the shared hand
placement and the shared gun pose, so everyone sees the same grip and aim as the local player.

## Read first
- gunHold.ts: placeInHand(holder, prefabId, arm), poseGunArms(model, prefabId, { aiming, pitch }, held),
  clearGunArms(model, held), muzzleWorld(held, out)
- remotes.ts: Puppet (`held`), holdGun (~line 163), updateDriver (~line 180-247), puppet creation (~line 293)
- police.ts: Unit type, makeUnit (~line 108), the spraying block (~line 339)
- quests/cutscene.ts (~line 166): the guards' pistols
- config.ts GUNS (prefab per gun kind); gunMods.ts decodeGunWire

## Change
1. remotes.ts:
   - Puppet gets `heldPrefab: string | null` and `gunPosed: boolean` (initialise null / false where puppets are created).
   - holdGun: `const kind = d?.gun ?? 'pistol'; const gun = buildModdedGun(kind, d?.loadout ?? {});` then
     `placeInHand(gun, GUNS[kind].prefab, p.model.arms.right); p.held = gun; p.heldPrefab = GUNS[kind].prefab;`
     (remove the manual position/rotation). Where the held gun is removed, also set heldPrefab = null.
   - updateDriver: remove the two `p.model.arms.right.rotation.x = -Math.PI / 2` aiming assignments (the `else if
     (pose.aiming) ...` branch and the `if (onFoot && pose.aiming ...)` line). After the remaining arm poses and BEFORE
     the driving `poseHands` line, add:
     ```ts
     // Guns: the same pose as the local player (gunHold.ts): at the ready on foot, raised while aiming. Pitch is not on the wire.
     const gunPose = onFoot && !pose.chute && !pose.hurt && y <= 2 && !!p.held;
     if (gunPose) { poseGunArms(p.model, p.heldPrefab, { aiming: pose.aiming, pitch: 0 }, p.held); p.gunPosed = true; }
     else if (p.gunPosed) { clearGunArms(p.model, p.held); p.gunPosed = false; }
     ```
2. police.ts:
   - makeUnit: `const held = buildHeld('gta-pistol'); placeInHand(held, 'gta-pistol', npc.model.arms.right);` (remove the
     manual lines and the old comment) and keep it on the unit (add `held: THREE.Object3D` and `aimed: boolean` to the Unit type).
   - spraying: replace `model.arms.right.rotation.x = -Math.PI / 2;` with
     `poseGunArms(model, 'gta-pistol', { aiming: true, pitch: 0 }, u.held); u.aimed = true;` and the muzzle line
     `model.arms.right.localToWorld(muzzleAt.set(0, -0.72, 0.02));` with `muzzleWorld(u.held, muzzleAt);` (keep the
     updateMatrixWorld before it). When not spraying and u.aimed: `clearGunArms(model, u.held); u.aimed = false;`.
3. quests/cutscene.ts guards: `const held = buildHeld('gta-pistol'); placeInHand(held, 'gta-pistol', m.arms.right);` (remove the manual lines).

## Contract
Use gunHold.ts exports as they are; do not change them.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
- `npx vitest run src/net.test.ts` passes, plus any test file whose name contains police or remotes (in games/gnome-theft-auto).

## Out of scope
weapons.ts, types.ts, app.ts, player.ts, cutscene/*, gunHold.ts.
~~~~

~~~~text
Epic: 2 Wiring / 2C Cutscene actors: hands on the wheel, guns held like the player's
Depends on: Epic 1 (done: gunHold.ts, seat-aware director)

## Environment
Repo root C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a7749fba4793b7a06 (Git Bash; if node is
missing: export PATH="/c/Program Files/nodejs:$PATH"). Other workers edit weapons.ts, types.ts, app.ts, remotes.ts,
police.ts and quests/cutscene.ts at the same time; do not touch those. Do not start a dev server. Do not commit. Paths
below are under games/gnome-theft-auto/src.

## Goal
Scripted-scene actors hold their props through the shared hand placement (anchor + prefab wear, so a lantern hangs
upright and a broom points forward), hold guns with the shared gun pose (lowered at the ready, raised on a 'point'
gesture, left hand on two-handed guns), and seated drivers put their hands on the steering grips like the player does
(their held prop is put away while they drive).

## Read first
- cutscene/actors.ts: createStageActor, poseActor, setHeld, drawMountPose
- cutscene/director.ts: the actor loop in update() (~line 464): the seated call
  `poseActor(rec.a, s, dt, c.clock, { object: vr.v.object, local: seatLocal(vr.v, s.seat) })`
- driverHands.ts: poseHands(model, vehicle, seat, dt), clearHands(model)
- gunHold.ts: isGunPrefab(id), poseGunArms(model, id, { aiming, pitch }, held), clearGunArms(model, held)
- packages/gnome/src/gear.ts: buildGear('hand', prefabId) (exported from '@lawn/gnome')

## Change
1. cutscene/actors.ts:
   - setHeld: build with `buildGear('hand', prefab)` (from '@lawn/gnome') instead of buildHeld + the manual
     position/rotation; add it to `a.model.arms.right`. Keep the try/catch (unknown prefab: hold nothing). Add
     `gun: boolean` to StageActor (isGunPrefab(prefab), false when empty) and set it here; initialise it in createStageActor.
   - poseActor's `seat` parameter becomes `seat?: { object: THREE.Object3D; local: Vec3; vehicle?: Vehicle; index?: number }`
     (import type Vehicle from '../types').
   - Seated branch, after `a.model.update(...)`: `const driving = !!seat.vehicle && (seat.index ?? 0) === 0;`
     if driving: `poseHands(a.model, seat.vehicle, 0, dt)` and hide the held prop (`if (a.heldObj) a.heldObj.visible = false`);
     skip the talking-arm and gesture ARM rotations for a driver (keep the rig pitch / bob). Not driving: held prop visible.
   - Standing branch (not seated): `clearHands(a.model)` (cheap; drops a driver's grip blend when it got out without a
     mount), held prop visible. Then, when `a.gun && a.heldObj`:
     - gesture 'point': `poseGunArms(a.model, a.heldId, { aiming: true, pitch: 0 }, a.heldObj)` INSTEAD of the gesture's
       arm rotations (keep its pitch/bob);
     - no gesture (talking or idle): `poseGunArms(a.model, a.heldId, { aiming: false, pitch: 0 }, a.heldObj)` INSTEAD of
       the talking right-arm wave (keep the talking rig bob);
     - any other gesture: `clearGunArms(a.model, a.heldObj)` first, then the gesture's arm rotations as today.
     Actors without a gun keep today's behaviour exactly.
   - drawMountPose: make the held prop visible again and `clearGunArms(a.model, a.heldObj)` before posing (it already calls clearHands).
2. cutscene/director.ts: the seated call passes `{ object: vr.v.object, local: seatLocal(vr.v, s.seat), vehicle: vr.v, index: s.seat }`.
3. cutscene/actors.test.ts: add tests with a StageActor made by createStageActor(new THREE.Group(), { id: 'x', at: [0, 0] },
   castOf-like cast { look: DEFAULT_LOOK-like, hz: 100, held: 'gta-rifle', scale: 1, name: 'X' }): after setHeld the
   actor's `gun` is true; posing a sample with gesture 'point' (build an ActorSample with the fields poseActor reads; see
   script.ts ActorSample) leaves the left arm scale.y != 1 (it reached the rifle's support); setHeld(a, 'broom') gives
   gun false.

## Contract
poseActor(a, s, dt, clock, seat?) with the widened seat object above; StageActor gains `gun: boolean`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
- `npx vitest run src/cutscene/actors.test.ts src/cutscene/timeline.test.ts` passes (in games/gnome-theft-auto).

## Out of scope
timeline.ts, mount.ts, seats.ts, gunHold.ts, driverHands.ts and every non-cutscene file.
~~~~

## After the epics (planner)

- Exits: a centre seat next to a side passenger (the Ride-On) landed on the same spot; `exitLocal` now steps a later
  seat back a pace until it is clear, tested for every open-top vehicle.
- Gun pose tuned from screenshots (`lowGrip2`, `lowPitch2`) so the left hand also reaches the support point lowered;
  `poseGunArms` poses any prefab the caller holds as a gun (GTA's whip and grenade do not 'shoot').
- Equip audit: shields carried on edge at the side, neck tokens rebuilt as a cord round the neck, back packs and
  head items nudged through `wear`, back gear added to the clearance test. Unresolved items:
  `gta-character-pass/equip-audit-unresolved.md`.
- Pacing: two scenes' walks sped up slightly (their exit spots moved), and the three labs waive the story pacing rules.
