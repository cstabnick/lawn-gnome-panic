Epic: 2 Parts
Depends on: none

## Environment
Read `docs/roadmaps/gta-race-track/_env.md` first.

## Goal
Pay 'n' Glaze works at two stations, Turfton's and the new one at the Lost & Found Speedway's pit lane, through ONE
shared bay module (no copied code). Plus two phone fixes in the shop: on a 390x844 phone the showroom camera frames big
vehicles (the snail-coach) too close, and the radio's "Now playing" line overlaps the shop panel.

## Read first
- `games/gnome-theft-auto/src/garages.ts` (all; `nearGlazeBay`, the `glazeFab` button, the T key, `prompt()`)
- `games/gnome-theft-auto/src/world.ts` lines 255-266 (`tryInstantiate`) and 880-895 (Turfton's Pay 'n' Glaze
  building and its two side-wall colliders)
- `games/gnome-theft-auto/src/config.ts` lines 120-135 (`PAY_N_GLAZE`)
- `games/gnome-theft-auto/src/raceTrack/track.ts`, search `SPEEDWAY_GLAZE`
- `games/gnome-theft-auto/src/camera.ts` lines 55-100 and 205-290 (`ShowroomTarget`, `stepShowroom`,
  `applyShowroomOffset`)
- `games/gnome-theft-auto/src/app.ts`, search `showroom: (v) =>` (the garages' showroom callback, about 10 lines)
- `games/gnome-theft-auto/src/radio/player.ts` lines 37-60 (the `Radio` interface) and 200-240 (`render()`, the
  'Now playing' line)

## Change
1. New `games/gnome-theft-auto/src/glazeBay.ts`:
   ```ts
   import type * as THREE from 'three';
   export interface GlazeBay { id: 'turfton' | 'speedway'; name: string; x: number; z: number; radius: number }
   /** Every Pay 'n' Glaze bay: Turfton's (PAY_N_GLAZE.bay) and the Speedway's (SPEEDWAY_GLAZE.bay). */
   export const GLAZE_BAYS: readonly GlazeBay[];
   /** The bay within (its radius + extra) of (x, z), or null. */
   export function glazeBayNear(x: number, z: number, extra?: number): GlazeBay | null;
   /** The two side-wall colliders of a drive-through Pay 'n' Glaze building (prefab gta-pay-n-glaze, open along z). */
   export function glazeShopColliders(building: THREE.Object3D): Box[];
   ```
   `glazeShopColliders` is the code now inline in world.ts (Box3.setFromObject, wallW = min(3.2, width * 0.25), two
   boxes, h = bb.max.y), moved, not copied.
2. `world.ts`: add `export` to `function tryInstantiate` (no other change to it), and replace the inline wall code of
   the Pay 'n' Glaze block with `if (g) boxes.push(...glazeShopColliders(g));` (keep `g.updateMatrixWorld(true)` inside
   glazeShopColliders). The world must come out identical: `npx vitest run src/layout.golden.test.ts` is expected to
   fail ONLY on the desert scatter near (741, -467) that the planner changed on purpose; compare the failure list
   before and after your change (run it once before you edit) and make sure your change adds no new difference.
3. `garages.ts`: `nearGlazeBay` uses `glazeBayNear` for every check (the fab button, T key, on-foot prompt), so both
   bays open the shop. The on-foot prompt names the bay (`${bay.name} (drive a mower in)`). Remove the now-unused
   PAY_N_GLAZE import if nothing else uses it.
4. Showroom framing: in `app.ts`'s showroom callback, pass a radius measured from the vehicle's model instead of
   `v.spec.radius`: `new THREE.Box3().setFromObject(v.object)`, radius = half the box's largest horizontal side, at
   least `v.spec.radius` (THREE is already imported in app.ts). In `camera.ts` `stepShowroom`, make the distance fit
   that radius on screen: with the vertical fov and the aspect, the distance at which a sphere of `radius * 1.15` fits
   the visible picture (on a portrait phone the shop sheet covers the bottom ~45%, so fit into the upper part: use the
   smaller of the vertical fit with 0.55 of the height and the horizontal fit with the full width); never closer than
   today's `Math.max(SHOWROOM_DIST_MIN, radius * SHOWROOM_DIST_PER_RADIUS)` on desktop. `t.distance`, when given, still
   wins. Check with the snail-coach (radius 2.5, a long body) and a push-bike.
5. Radio over the shop: add `setShopOpen(open: boolean): void` to the `Radio` interface and implementation in
   `radio/player.ts`: while open the radio's root element is hidden (render() keeps its other rules otherwise). In
   app.ts's showroom callback call `radio.setShopOpen(!!v)`. (`radio` is created before the garages in app.ts? If not,
   call it through a small `let` or move nothing: check the order and use optional chaining if `radio` is declared
   later; do not reorder app.ts.)
6. Add `games/gnome-theft-auto/src/glazeBay.test.ts`: `glazeBayNear` finds Turfton's bay at PAY_N_GLAZE.bay, the
   Speedway's at SPEEDWAY_GLAZE.bay, null at (0, 0)... (pick a point far from both), and `extra` widens the reach.

## Contract
`glazeBay.ts` exports exactly as above. `tryInstantiate` exported from world.ts with its current signature
`(scene, id, how: { scale: number } | { footprint: number }, cx, cz, yaw, tint?) => THREE.Group | null`.
`Radio.setShopOpen(open: boolean): void`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files
- `npx vitest run src/glazeBay.test.ts src/glazeStore.test.ts src/vehicles.glaze.test.ts` passes
- the golden test shows no difference beyond the ones it showed before your change (see 2)

## Out of scope
Every other file. In app.ts touch only the showroom callback lines. The Speedway's building itself is placed by
another issue (trackDressing.ts) with your `tryInstantiate` + `glazeShopColliders`.
