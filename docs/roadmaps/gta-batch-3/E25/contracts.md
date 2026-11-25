# E25 contracts: jobs III (bin crew, fire brigade, Gnomazon) and the fire system

What E25 gives later epics. Paths under `games/gnome-theft-auto/src/`. World: +x east, +z south; yaw 0 faces +z.

## The fire system (`fire/`): light a fire anywhere, put it out with water

Pure simulation in `fire/sim.ts` (no three.js; any client can run it), the look in `fire/view.ts`, types and tuning in
`fire/types.ts` (`FIRE`).

```ts
import { createFireField, ignite, douse, stepFires, burningCount, nearestBurning, clearFires, fuelPoint } from '../fire/sim';
import { createFireView } from '../fire/view';

const field = createFireField();
const view = createFireView(scene, fx);                       // fx: the game's Fx (WorkDeps.fx, app.ts `fx`)
ignite(field, x, y, z, { r: 0.8, kind: 'bbq', fuel: 120, group: 'story-ch3' });  // y = base of the flames
const fuel = [fuelPoint(x2, 0.3, z2, 0.5, 'generic', 60, 'story-ch3')];          // catches if a hot fire stays near
// every frame:
const events = stepFires(field, dt, fuel);                    // 'ignite' | 'spread' | 'out' | 'burnt' | 'gone'
view.update(dt, field, camX, camZ);                           // flames, puffs, 2 lights, smoke, scorch discs
// water (a hose, a bucket, rain): heat removed > 0 means it hit something burning
if (douse(field, landX, landZ, 1.6, litres) > 0) view.steam(landX, landY, landZ);
burningCount(field, 'story-ch3');  clearFires(field, 'story-ch3');  view.dispose();
```

- A fire grows toward heat 1 (`FIRE.growPerS`, slower when wet), burns its fuel (`fuel` seconds at full heat) and ends
  'burnt'; water takes heat off (`FIRE.douseHeatPerLitre`) and at `FIRE.outHeat` it is 'out'; both smoke for
  `FIRE.smokeS` then go ('gone'). Fuel points catch after `FIRE.spreadAfterS` s near a fire at heat >= `FIRE.spreadHeat`.
- Groups (`group`) let one owner count and clear its own fires. At most `FIRE.maxFires` per field.
- Cost: instanced flames (cap 160), two point lights, a 40-sprite smoke pool; fires past 220 m are not drawn.
- Scorch discs use `flatLayer(..., LAYER.marking)` (no z-fighting).
- `?firedemo` lights a bin, shed, barbecue and toadstool fire ahead of the player; `?firedemo=douse` puts them out.
- Online: the field is local state. E25's fires are per player (no protocol); an epic that wants shared fires gives
  the field an owner on the online hub and relays `ignite`/`douse` calls, not the field.

## Workplace framework additions

- `WorkJobId` adds `'garbage' | 'firefighter' | 'gnomazon'` (`jobs/types.ts`); `WORK_JOBS`, `WORK_PAY`,
  `WORK_ACHIEVEMENTS`, `SPILL_FINE`, `RESCUE_PAY`, `QUOTA_BONUS` in `jobs/workDefs.ts`; counters `WorkStats.bins,
  neatBins, spills, fires, calls, rescues, parcels, rightSized`; quest-facing `JobStats.bins, fires, rescues, packed`
  and `workLevels.<job>`. The Jobs app lists the three jobs automatically.
- `WorkDeps.fx`, `WorkDeps.seatPlayer(v)`; `WorkJobRuntime.waypoint?()` and `Workplaces.waypoint()`: app.ts routes the
  HUD to it after the vehicle jobs and before quests. The workplace showroom now also hides the touch driving controls.
- `workplaces/shiftHud.ts createShiftHud(ui)`: a driving-shift panel with one 44 px action button (I key, pad R3).
- `workplaces/sounds3.ts`: 21 synthesized ids (`bin-*`, `fire-bell`, `hose-spray`,
  `tape-screech`, `kippy-chime`, ...).

## Vehicles

- `bin-lorry` (Bin Lorry, prefab `gta-bin-lorry`): pivot `arm` on the kerb (-x) side, claw at local [0, -0.5, 0],
  `rotation.z = 2.4 * tilt` lifts over the hopper; pivot `lid`.
- `fire-engine` (Watering-Can Pumper, `gta-fire-engine`): pivots `nozzle` (points +z) and `ladder` (lies along +z;
  the job raises it with rotation.x and stretches it with scale.z).
- Both relayed online like any vehicle (`VEHICLE_CODES` appended); never in traffic or dealers.
- `sound/watchVehicles.ts SIREN_VEHICLES: Set<number>`: add a vehicle id to give it a siren loop.

## Places

| Site | Where | What |
|---|---|---|
| `bin-depot` | (-240, -97), by the Compost Heap | Turfton Bin Depot (`garbage/depot.ts`): shed, office, tipping ramp, Mags Wheelie |
| `fire-station` | (-245, 135), Mossy Wood edge | Fire Station No. 1 (`firefighter/station.ts`): engine house, bell, Chief Hydra Pumpwell |
| `gnomazon-fc` | (255, 92), Dust Flats (natural ground, `flat: false`) | Gnomazon FC-1 (`gnomazon/warehouse.ts`), interior `gnomazon-floor` |

Dev hooks: `?binround` (`=lift`), `?firecall` (`=hose`), `?gnomazonshift`.

## Lore

Entries `turfton-bin-depot`, `mags-wheelie`, `bin-lorry`, `fire-station-no-1`, `hydra-pumpwell`,
`watering-can-pumper`, `gnomazon`, `gnomazon-fc-1`, `kpi-9`; rulings R-199 (bins and the Heap), R-200 (the fire
brigade), R-201 (Gnomazon). Renumber at merge if another epic took these numbers.
