Epic: 2 Fill the modules
Depends on: none

## Environment
Repository root: /home/user/lawn-gnome-panic (Linux; node and npm are on PATH; `npm install` has been run).
Game: games/giant-pup (Vite + TypeScript + three@0.187.0). A pet-care game: the player is a gnome in a fenced back yard caring for a giant goofy cartoon dog (pet, feed, water, bath, fetch, tricks).
Other workers are editing other files in games/giant-pup at the same moment. Touch only the files this issue names. Do not add npm dependencies. Do not commit.
Repo rules: assets are generated in code only (no downloaded files). Mobile first: anything interactive must work by touch, with 44 px minimum targets and no hover-only UI.
The file you own currently holds a STUB with the final exported signatures. Keep every exported name and signature exactly as written in "Contract" (other files already import them); replace the bodies.

## Goal
`games/giant-pup/src/dog.ts` builds the Giant Goofy Fetch Dog from Gnome Company as a poseable rig and animates it between 13 poses with smooth blending.

## Read first
- games/giant-pup/src/dog.ts: the stub you replace.
- games/gnome-company/src/models.ts lines 341-415 (`kind === 'dog'` branch of the enemy mesh) and 449-455 (its animation): the ORIGINAL dog. Read only; do not edit gnome-company. Reproduce its look exactly (same box/cylinder/sphere sizes, colours 0xd97706 fur and 0x78350f spots/ears, pink tongue 0xf472b6, white goofy eyes with black pupils, black nose), but split into pivot groups so it can pose.

## Change
- games/giant-pup/src/dog.ts only.

Rig structure (all THREE.Group pivots, children of an inner `body` group that is a child of `root`; root itself stays at identity — the caller sets root.position, root.rotation.y and root.scale and animateDog must never write them):
- `body` group: everything. Use body.position.y / body.rotation.x / body.rotation.z / body.rotation.y for whole-body poses (lie lowers it, roll rotates it about z, spin rotates it about y, sit pitches it back).
- `torso` mesh (BoxGeometry 1.3, 1.1, 2.3 at y 1.45).
- `head` pivot at the neck (about (0, 1.9, 1.0)); head box, snout, nose, tongue, eyes and both ears are children of it, positioned so that at rotation 0 they sit exactly where the original has them. Ears are their own pivots (`earL`, `earR`) so they can flop.
- 4 `leg` pivots at the hips/shoulders (y ≈ 1.0, x ±0.45, z ±0.85), each holding a leg cylinder (CylinderGeometry 0.18, 0.16, 1.0) hanging down so its bottom touches y 0. Front legs `legFL`, `legFR`, back `legBL`, `legBR`.
- `tail` pivot at (0, 1.95, -1.15), tail cylinder as in the original.
- `mouth`: an empty Object3D, child of `head`, just in front of the snout and slightly below (about where the tongue is). This is where the ball is carried; it must move with the head.
- Mud: 6-8 small flat dark-brown (0x5b3a1a) ellipsoid/box patches stuck on the torso and legs; `setDirt(level)` shows them progressively (patch i is visible when level > (i+1)/(n+1)). Set `mesh.castShadow = true` on solid meshes.
- `hit`: an array of the torso and head meshes (and the head box) for raycasting.

Poses (`animateDog(rig, pose, t, dt, speed, happy)`). Keep per-rig current values in a WeakMap<DogRig, State> or closure; each frame move every joint toward the pose's target with `cur += (target - cur) * Math.min(1, dt * 10)` so poses blend. Then add the cyclic motion on top:
- `stand`: legs 0, slight breathing bob of torso.
- `walk`: legs swing ±0.5 rad on rotation.x, diagonal pairs in phase (FL with BR), cycle rate = speed * 1.6 rad per unit; small body bob.
- `run`: same gait ±0.9 rad, faster (speed * 1.3), body bob 0.15 and slight forward pitch, ears flop back.
- `sit`: back legs folded forward (rotation.x ≈ -1.2), body pitched back (rotation.x ≈ -0.45) and lowered so the rear rests on the ground, head level/up.
- `lie`: body lowered ~0.8 so the belly is on the ground, all four legs folded flat (front forward, back backward), head low.
- `roll`: lie low, then body.rotation.z goes a full 2π over ~2 s (use t), legs up wiggling. When pose changes away, body.rotation.z must return to 0 (blend from the wrapped angle, not unwind several turns).
- `shake` (shake a paw): sit, and front-right leg raised forward (rotation.x ≈ -1.3) bobbing up and down at 6 Hz.
- `spin`: standing, body.rotation.y goes a full turn per 0.8 s, legs trotting. Return to 0 the same way as roll.
- `eat`: standing, head pitched down hard (rotation.x ≈ 0.9) bobbing at 5 Hz.
- `sleep`: lie, head resting down and to the side, slow breathing (body scale.y 1 ± 0.03 at 0.4 Hz), tail still.
- `beg`: sit, head tilted up and side to side slowly, tongue out (tongue scale.z 1.5), tail wagging fast.
- `shakeoff` (drying off after a bath): standing, body.rotation.z oscillates ±0.35 at 9 Hz, head and ears flapping.
- `tilt` (confused): sit, head.rotation.z ≈ 0.45 held, ears asymmetric, tail slow.
Tail wag in all poses except sleep: tail.rotation.z = sin(t * wag) * 0.55 with wag = 6 + happy * 14 (rad/s); happy is 0..1. Ears: a little secondary flop from body bob.

## Contract
```ts
export type DogPose =
  | 'stand' | 'walk' | 'run' | 'sit' | 'lie' | 'roll' | 'shake' | 'spin' | 'eat' | 'sleep' | 'beg' | 'shakeoff' | 'tilt';
export interface DogRig {
  root: THREE.Group;          // feet at origin, facing +z; caller owns root's transform
  hit: THREE.Object3D[];
  mouth: THREE.Object3D;      // moves with the head
  setDirt(level: number): void; // 0 clean .. 1 filthy
}
export function createDogRig(): DogRig;
export function animateDog(rig: DogRig, pose: DogPose, t: number, dt: number, speed: number, happy: number): void;
```
The dog faces +z (snout at +z, tail at -z), as in the original.

## Done when
- `cd games/giant-pup && npx tsc --noEmit` passes.
- Reading the code: no write to rig.root.position/rotation/scale anywhere in animateDog; every one of the 13 poses has a case; roll and spin return to upright without unwinding.

## Out of scope
Every other file, especially games/giant-pup/src/brain.ts, main.ts, scene.ts, fx.ts, ui.ts, audio.ts, and anything under games/gnome-company.
