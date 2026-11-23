Epic: 1 (the @lawn/glaze package, its prefabs, the shop widgets)
Depends on: none

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` first (working directory, toolchain, rules, how to report). You own only the files below.

## Goal
Arm reach: aim a gnome's rigid arm pivot at a world point (a steering-wheel grip), stretching it a little when the point is further than the arm, and leave it alone when the point is out of reach. This is the "hands link to the wheel" maths; the game wiring is another issue.

## Read first
- `packages/glaze/src/grips.ts`: the stub (`ARM_LENGTH`, `ArmReach`, `ReachOptions`, `reachArm`, `releaseArm`, `poseHandsOnGrips`; keep the signatures; `poseHandsOnGrips` and `releaseArm` are already written: keep them unless your change needs it).
- `packages/gnome/src/model.ts` lines 139-153: `makeArm` (pivot at the shoulder `(+-0.27, 0.62, 0)` inside `rig`; a 0.3-long box hangs along -y; the hand ball is at y = -0.32) and 378-386 (sitting pose sets `arm.rotation.x`). The arm hangs along its local **-y**.

## Change
- `packages/glaze/src/grips.ts`: implement `reachArm(arm, target, opts)`:
  1. `const parent = arm.parent`; if there is none, return `{ reached: false, stretch: 1 }`. `parent.updateWorldMatrix(true, false)`.
  2. `local = parent.worldToLocal(target.clone())` (the target in the parent's space). `d = local - arm.position` (the arm pivot's own `position` is in the parent's space). `L = d.length()`; if `L < 1e-6` return not reached.
  3. `maxStretch = opts.maxStretch ?? 1.45`. If `L > ARM_LENGTH * maxStretch`, return `{ reached: false, stretch: 1 }` WITHOUT touching the arm.
  4. `stretch = clamp(L / ARM_LENGTH, 0.75, maxStretch)`. `arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.clone().divideScalar(L))` (this overwrites whatever the gnome model set this frame, which is what we want). `arm.scale.set(1 / Math.sqrt(stretch), stretch, 1 / Math.sqrt(stretch))` (the arm gets longer, a little thinner). Return `{ reached: true, stretch }`.
  5. The parent's scale (the gnome rig squashes a little) is handled by `worldToLocal`; do not special-case it. Use one module-level scratch `Vector3` per temporary (this runs every frame, twice per gnome): no allocation inside the function except what `setFromUnitVectors` needs.
- `packages/glaze/src/grips.test.ts` (new): build a parent `Group` (identity), an arm `Group` at `(0.27, 0.62, 0)` added to it; target `(0.27, 0.62 - 0.32, 0.0)` (straight below): `reached` true, `stretch` about 1, the arm's `quaternion` is about identity; target in front `(0.27, 0.62, 0.32)`: the hand point `arm.localToWorld(new Vector3(0, -ARM_LENGTH * stretch, 0))` (after `updateMatrixWorld(true)`) lands on the target within 1e-4; same for 20 random targets inside reach (seeded); a target 3 units away: `reached` false and the arm's quaternion and scale are unchanged; the stretch for a target 1.3 x ARM_LENGTH away is 1.3 and the hand lands on it; with the parent rotated 90 degrees about y and scaled `(1.1, 0.9, 1.1)` the hand still lands on the world target within 1e-3; `poseHandsOnGrips` with two grip `Object3D`s (placed in the world with `position.set` and added to a parent group) poses both arms and, when the left grip is out of reach, resets that arm's scale to 1 and reports `left.reached === false` while the right is posed; `releaseArm` sets the scale back to `(1, 1, 1)`.

## Contract
`ARM_LENGTH = 0.32`; `reachArm(arm: THREE.Object3D, target: THREE.Vector3, opts?: ReachOptions): ArmReach`; `releaseArm(arm: THREE.Object3D): void`; `poseHandsOnGrips(arms, grips, opts?): { left: ArmReach; right: ArmReach }`; `ArmReach = { reached: boolean; stretch: number }`. As stubbed.

## Done when
- `npx tsc --noEmit -p packages/glaze` has no error in `grips.ts` / `grips.test.ts`.
- `npx vitest run packages/glaze/src/grips.test.ts` passes.

## Out of scope
Every other file, including `packages/gnome` (do not edit the gnome model).
