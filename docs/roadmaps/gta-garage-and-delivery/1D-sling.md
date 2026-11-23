Epic: 1 Modules
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn. Game: games/gnome-theft-auto (TypeScript, three.js 0.187, vitest).
In Git Bash, if node is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
Other workers edit OTHER files of this game at the same time. Do not commit, push, stash or switch branches. Do not run
`vite build` or a dev server. `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files that are not yours:
ignore those, fix only errors in your files.
Repo rule: objects come from the prefab library (`buildPrefab` from '@lawn/prefabs'); the rope is an effect and may be a
plain three.js mesh.

## Goal
Fill `games/gnome-theft-auto/src/lockup/sling.ts`: the Sling-Lift, a scripted (not driveable) delivery helicopter.
Pure flight stepping (planSling, startSling, stepSling) and a three.js rig that draws the chopper and its rope
(createSlingRig). The load (a Vehicle) is moved by the caller, not by this module: it hangs at (s.hx, s.loadY, s.hz).

## Read first
- games/gnome-theft-auto/src/lockup/types.ts: `DropSpot`, `SlingPlan`, `SlingState`, `SlingPhase`.
- games/gnome-theft-auto/src/lockup/config.ts: `LOCKUP.sling` (prefab, scale, spawnDist, cruiseHeight, hoverHeight,
  speedIn, speedOut, climbOut, lowerSpeed, ropeMin, releaseS, outboundS).
- games/gnome-theft-auto/src/lockup/sling.ts: the stub (keep every export name and signature).
- games/gnome-theft-auto/src/vehicles.ts lines 62-76 and 559-567: rotor pivot found by `body.getObjectByName('rotor')`,
  spun with `rotor.rotation.y += dt * spin`; tail rotor `getObjectByName('tail-rotor')`, `rotation.x`.

## Change
- games/gnome-theft-auto/src/lockup/sling.ts. Let S = LOCKUP.sling.
  - `planSling(drop, approachYaw)`: `fromX = drop.x - Math.sin(approachYaw) * S.spawnDist`,
    `fromZ = drop.z - Math.cos(approachYaw) * S.spawnDist`, `cruiseY = drop.y + S.cruiseHeight`, `hoverY = drop.y + S.hoverHeight`.
  - `startSling(plan)`: phase 'inbound', t 0, (hx, hy, hz) = (fromX, cruiseY, fromZ), heading =
    `Math.atan2(drop.x - fromX, drop.z - fromZ)`, loadY = cruiseY - S.ropeMin, released false.
  - `stepSling(s, plan, dt)`: s.t += dt, then by phase:
    - 'inbound': move (hx, hz) toward (drop.x, drop.z) at S.speedIn m/s (never overshoot); ease hy toward hoverY
      (`hy += (hoverY - hy) * Math.min(1, 1.5 * dt)` once the horizontal distance is < 40, else toward cruiseY the same
      way). loadY = hy - S.ropeMin. When horizontal distance < 0.3 AND |hy - hoverY| < 0.5: snap hx/hz/hy, phase
      'lowering', t 0.
    - 'lowering': loadY -= S.lowerSpeed * dt; when loadY <= drop.y: loadY = drop.y, released = true, phase 'release',
      t 0, return 'released'.
    - 'release': after S.releaseS seconds: phase 'outbound', t 0.
    - 'outbound': move forward along heading at S.speedOut (hx += sin(heading) * v * dt, hz += cos(heading) * v * dt),
      hy += S.climbOut * dt. After S.outboundS seconds: phase 'done', return 'gone'.
    - 'done': return null.
    Return null otherwise.
  - `createSlingRig(scene)`: `const body = buildPrefab(S.prefab, { scale: S.scale })` (import `buildPrefab` from
    '@lawn/prefabs'), cast shadows on its meshes, inside a `THREE.Group` root added to the scene. A rope: a
    `THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 6), new THREE.MeshStandardMaterial({ color: 0x3a2f22 }))`
    added to the scene (not to root), plus a small hook block `THREE.BoxGeometry(0.3, 0.3, 0.3)` dark grey at its
    bottom. `update(s, dt)`: root.position.set(hx, hy, hz); root.rotation.set(pitch, heading, 0, 'YXZ') with pitch
    0.12 while 'inbound' or 'outbound' (nose down), else 0. Spin `rotor.rotation.y += dt * 30` and
    `tailRotor.rotation.x += dt * 45` (pivots found once with getObjectByName; either may be missing). Rope: visible
    only while !s.released; it spans from y = hy (top) to y = s.loadY + 1.2 (bottom, the load's roof) at (hx, hz):
    `rope.position.set(hx, (top + bottom) / 2, hz); rope.scale.y = Math.max(0.01, top - bottom)`; hook at (hx, bottom, hz).
    `dispose()`: remove root, rope and hook from the scene and dispose the rope/hook geometries and materials.
- games/gnome-theft-auto/src/lockup/sling.test.ts (new): pure tests only (do not call createSlingRig). Drop at
  `{ x: 10, y: 2, z: -5, yaw: 0 }`, approachYaw 0.5: planSling puts from at distance spawnDist; step with dt 1/30 for at most
  60 s collecting events: 'released' happens exactly once, before 'gone'; at 'released' loadY === drop.y and (hx, hz)
  is within 0.5 of the drop; the whole flight finishes within 30 s of simulated time; after 'gone' phase is 'done' and
  stepSling returns null.

## Contract
`planSling(drop: DropSpot, approachYaw: number): SlingPlan`, `startSling(plan: SlingPlan): SlingState`,
`stepSling(s: SlingState, plan: SlingPlan, dt: number): 'released' | 'gone' | null`,
`interface SlingRig { update(s: SlingState, dt: number): void; dispose(): void }`, `createSlingRig(scene: THREE.Scene): SlingRig`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/lockup/sling.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your two files.

## Out of scope
Every other file. Do not add a prefab; do not touch vehicles.ts.
