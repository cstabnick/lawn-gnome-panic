Epic: 3 (more tricks, pipes, personality; in parallel)
Depends on: none

(First read `docs/roadmaps/aether-board/_env.md`: environment and repo rules.)

## Goal
`src/view/rider.ts`: give the gnome personality, and make grabs and grinds look right. Today the gnome is stiff and its
grabbing hand does not reach the board. After this issue: the hand visibly **holds the board** at the right spot for
each of the 10 grabs (the gnome crouches and reaches, the board tweaks), each of the 9 grinds has its own board angle
and stance, and the gnome is alive: idle bounce and look-around, hat wobble, arm swings into carves, a wind-up crouch
before a pop, a tuck in big air, celebrations on clean landings, wobbly arm-windmills on sketchy ones, a dizzy tumble on
bails, a panicked flail while falling out of the sky.

## Read first
- `games/aether-board/src/view/rider.ts`: the current rider (you own it; keep `RiderView` and
  `createRider(scene, w, camera?)`).
- `games/aether-board/src/config.ts`: `Player` (mode, crouch, grab, grabKind, grabT, grind (kind, t), trick, spin,
  flip, airT, vel, boosting, flow, switchStance, bailT), `GRABS` (hand 'front'/'back', spot 'nose'/'tail'/'toe'/'heel',
  pitch, roll), `GRINDS` (yaw, pitch), `PhysEvent`.
- `games/aether-board/src/physics.ts`: `boardPose(p)`.
- `packages/gnome/src/model.ts` (skim `createGnomeModel`: how `rig`, `arms.left/right` (shoulder pivots) and `legs` are
  built, the hat mesh, head at y 0.8) and `packages/gnome/src/types.ts` lines 125-145 (`GnomeModel`).
- `games/aether-board/src/app.ts`: `rider.update(player, renderPos, dt, inp.steer)` once per frame. You do not get the
  events; detect landings yourself (mode changes from 'air' to 'ground' between frames; `p.vel` and the time in the air
  tell you how big; a bail is mode 'bail'; a sky-fall is a jump in position > 8 m while in the air).

## Change
- `src/view/rider.ts`:
  - **Grabs that connect**: for the held `p.grabKind`, compute the board-space target point: nose (0, 0.03, +0.6),
    tail (0, 0.03, −0.6), toe edge (+0.2 or −0.2 on the side the gnome faces, z 0), heel edge (the other side). Transform
    it to world space through the deck's matrix, then pose the gnome so the chosen hand (front = the hand toward the
    nose, back = toward the tail; work out which model arm that is from the stance) reaches it: crouch the rider pivot
    (0.4-0.65 depending on the spot), bend the rig toward it, and aim the arm with a simple 2-axis look-at from the
    shoulder pivot (rotation.x and rotation.z so the arm's hanging direction (−y in the arm pivot) points at the target).
    Clamp so it never bends unnaturally. The other arm goes out for balance. Ease into the grab over 0.12 s and out
    over 0.15 s. Apply the grab's `pitch` / `roll` board tweak on the board pivot (ease too). Verify by checking the hand
    end of the arm ends within ~0.12 m of the target in a debug assertion you remove afterwards, or by eye in the
    screenshots below.
  - **Grinds**: board yaw/pitch from `GRINDS[p.grind.kind]` (relative to the rail direction = `p.heading`), eased when
    the kind switches. The gnome: arms out, knees bent, a small balance wobble that grows with grind time.
  - **Personality** (all small, layered, time-based with per-rider phase; nothing that fights the physics pose):
    - Ground: a gentle knee bounce with speed, the hat (model.hat if present, else the top child) wobbles with a damped
      spring on bumps and landings, arms swing out on the side of the carve (by steer), occasional look-around (head/rig
      yaw ±0.3 every 4-7 s when cruising slowly), a crouched aero tuck above 35 m/s, a hand-up "woo" when boosting.
    - Pop wind-up: deeper crouch with arms back while `p.crouch` rises.
    - Air: arms out, legs tucked a little in long airs (`airT` > 0.6), slow "swim" of the arms when spinning slowly.
    - Landings: clean (landed and not bail) → a quick squash (rider pivot y −0.15 then back) and, for airs > 0.8 s, a fist
      pump (one arm up for 0.5 s); sketchy (landing impact high: vertical speed before landing < −18 m/s) → arm windmills
      for 0.6 s.
    - Bail: tumble as now, then sit up dazed: the gnome sways in a slow circle until `p.mode` leaves 'bail'.
    - Sky-fall: arms and legs flailing (fast sine on both arms) for the first second after the teleport.
  - Keep the existing shadow, trail, teleport handling, and no per-frame allocations.

## Contract
`RiderView` and `createRider(scene: THREE.Scene, w: World, camera?: THREE.Camera)` unchanged.

## Done when
- `npx tsc --noEmit -p games/aether-board` passes for your file.
- Visual check (only you use this port): `cd games/aether-board && npx vite --port 5203 --strictPort` in the
  background. Playwright (`require('playwright')`; `chromium.launch()`), page `http://localhost:5203/#mute`, wait for
  `window.ab`, click the canvas. For each of 'indy', 'method', 'nosegrab', 'tailgrab', 'stalefish': force a pose with
  `window.ab.player.mode = 'air'; window.ab.player.grab = 1; window.ab.player.grabKind = '<kind>';
  window.ab.player.pos.y += 20; window.ab.player.vel.set(0, 30, 0);` then wait 400 ms and screenshot
  `/tmp/ab-rider/grab-<kind>.png`. The hand meets the board in each. No console errors. Stop the server afterwards.

## Out of scope
Every other file in `games/aether-board/src`.
