# @lawn/glaze

Pay 'n' Glaze as a package: dress any prefab vehicle in a plain-data **`Loadout`** (paint and finish, sprays, tyres, rims, wheel size, camber, ride height, steering wheel, headlights, spoiler, seat, hood ornament, extras, underglow), and make a seated gnome's hands hold the steering wheel. First user: Gnome Theft Auto (`games/gnome-theft-auto`, the Pay 'n' Glaze shop). Nothing else depends on it, and a game that does not call it is unaffected.

It sits between three things that already exist: a prefab (`@lawn/prefabs`: the vehicle's shape), a gnome (`@lawn/gnome`: its arm pivots) and a game (which decides what a player owns and how it is sold).

## Use it in a new game (five lines)

```ts
import { attachLoadout, buildGlazeBody, defaultLoadout, setWheelPose } from '@lawn/glaze';

const body = buildGlazeBody('ride-on-mower', { scale: 1.5 });              // a prefab built white, its tint parts separable
const rig = attachLoadout(body, 'ride-on-mower', defaultLoadout(0xd8342c)); // stock look: nothing changes but the paint
scene.add(body);

rig.set({ ...rig.loadout, finish: 'candy', tyre: 'fat', rim: 'mesh', spoiler: 'picket', rideHeight: -0.6 });  // change anything, any time

// every frame
rig.update(dt);                                                             // underglow pulse, spinning rims
setWheelPose(wheelPivot, spin, steerAngle, rig.camberOf(index));            // spin about the axle, steer, then camber

// when you damage the model: setPrefabDamage(body, level) throws the children away, so dress it again
setPrefabDamage(body, level); rig.apply();
```

No mounts to write: `deriveMounts(body)` guesses lamps, spoiler, decal panels and wheels from the built body (bounding box and the `wheel-0..3` / `steer` pivots). For a good fit, give the prefab hand-tuned mounts once with `defineMounts(prefabId, { ... })` (see `games/gnome-theft-auto/src/glazeMounts.ts`).

## The pieces

| File | What |
|---|---|
| `ids.ts`, `catalog.ts` | Every product (id, lore name, one-line blurb, price in Acorns, prefab id) in one table per shelf. `PRICES` for things that are not products (a repaint, a camber change). |
| `types.ts` | `Loadout` (the data), `VehicleMounts` (where things go), `GlazeRig` (the handle `attachLoadout` returns). |
| `loadout.ts` | `defaultLoadout`, `normalizeLoadout` (clean any input), `encodeLoadout` / `decodeLoadout` (a text code under 120 characters, for saves and the network), `loadoutCostLines` / `loadoutCost`. |
| `attach.ts` | `buildGlazeBody` and `attachLoadout`: the entry point. Wraps the body in a shell so ride height moves the body and not the wheels. |
| `paint.ts` | Seven finishes as shared materials (gloss, matte, metallic, pearl, candy, chameleon view-angle hue shift, primer). |
| `decals.ts` | Ten sprays drawn on a canvas, laid on thin planes over the flanks, hood and tail. |
| `wheels.ts` | New tyres and rims on the wheel pivots, wheel size, `setWheelPose` (spin, steer, camber in the right order, the right sign for both sides). |
| `lamps.ts`, `fittings.ts` | Lamp housings and the beams that switch on at dusk; spoiler, seat cover, ornament, extras, underglow. |
| `steer.ts` | A game-private variant of a prefab with its wheel moved within a gnome's reach (`registerSteerVariant`), wheel styles, and the grip markers. |
| `grips.ts` | `reachArm` / `poseHandsOnGrips`: swing a gnome's rigid arm pivot onto a world point and stretch it a little when the point is further than the arm. |

## Conventions

- Prefab-local units before the root scale, front +z, **+x is the vehicle's left**, rotations in degrees in data.
- The prefab is built at tint `0xffffff` with `separateTint: true` so the rig repaints it by swapping the tinted meshes' materials (no rebuild). Prefab parts you want recoloured use `c: 'tint'`.
- Mod prefabs are `glaze-<slot>-<id>` in `packages/prefabs/src/catalog/gta-glaze-*.ts`, authored for a 1.2-wide vehicle (the rig scales by the vehicle's width) with the origin at the attachment point; tyres and rims are authored with the axle on x, diameter 1, hub at `[0, 0.5, 0]`.
- The stock loadout is a no-op: with default tyres, rim, size and camber the wheels are left exactly as the prefab drew them.

## Add a product

1. Add the id to its list in `ids.ts` (append only: `encodeLoadout` stores list indices, so reordering breaks saved codes).
2. Add its `ModDef` to the shelf in `catalog.ts` (name, blurb, price; `prefab` is `glaze-<slot>-<id>`).
3. Add the prefab in `packages/prefabs/src/catalog/gta-glaze-<slot>.ts` and write its lore line in `docs/lore/entries/apocrypha/pay-n-glaze-*.md`.
4. `npm test -w packages/glaze` (the catalogue test checks the ids, names and prefabs agree) and `npm test -w packages/prefabs`.

## What it unlocks

A `Loadout` is a value you can store, send and animate. Because every part hangs off named groups (`glaze-shell`, the wheel pivots, the grip markers), later work can drive them: suspension that really lowers and raises the shell (a lowrider hop), wheels that steer and lean in corners, a gnome that reaches for the wheel, the horn or the radio dial. `grips.ts` is the first piece of gnome-to-object reaching; it is written to be reused for levers, handlebars and bars to hang on.
