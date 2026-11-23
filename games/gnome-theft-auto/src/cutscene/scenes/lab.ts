// Dev labs: scenes that stage the cast in their own vehicle seats, get them out, and hold every gun, so seating,
// dismounts and held items can be looked at in one place. ?cutscene=seat-lab, ?cutscene=exit-lab, ?cutscene=gun-lab.
import { VEHICLES } from '../../config';
import { castById } from '../../quests/stages';
import type { PacingWaiver, SceneScript, ScriptActor, ScriptVehicle, Step } from '../script';

/** Labs are dev tools, not story: no hook, still shots held as long as needed to look. */
const LAB_WAIVE: PacingWaiver[] = (['no-hook', 'shot-long', 'dead-shot', 'dead-air', 'scene-long'] as const).map((code) => ({ code, why: 'dev lab, not a story scene' }));

/** Cast members with a ground vehicle of their own (boats and the plane need water or sky). */
const SEATED = ['pip', 'tansy', 'vesper', 'granny', 'juniper', 'reginald', 'diggs', 'loam', 'bodega', 'big-lou', 'brenda', 'clara', 'mossley', 'burt', 'cedric', 'bramble'];
/** Lab row: z of every vehicle, and the open stretch of road it stands on. */
const ROW_Z = -60;
const GAP = 9;

function seatLab(): SceneScript {
  const actors: ScriptActor[] = [];
  const vehicles: ScriptVehicle[] = [];
  const steps: Step[] = [];
  SEATED.forEach((id, i) => {
    const c = castById(id);
    if (!c?.vehicle || !c.preset) return;
    const kind = c.vehicle.kind;
    if (VEHICLES[kind].boat || VEHICLES[kind].flies) return;
    const x = (i % 2 === 0 ? -1 : 1) * 4;
    const z = ROW_Z - Math.floor(i / 2) * GAP;
    vehicles.push({ id: `v-${id}`, kind, at: [x, z], yaw: 0, loadout: c.vehicle.glaze });
    actors.push({ id, preset: c.preset, seatedIn: `v-${id}`, seat: 0, at: [0, 0] });
    // A close side shot from the vehicle's left (+x is its left), at seat height.
    const r = VEHICLES[kind].radius + 1.6;
    steps.push({ do: 'cam', shot: { kind: 'cut', pos: [x + r, 1.4, z + 0.6], look: [x, 0.9, z + VEHICLES[kind].seat[2]] } });
    steps.push({ do: 'title', text: `${id} / ${kind}` });
    steps.push({ do: 'wait', s: 1.5 });
  });
  return { id: 'seat-lab', stage: { kind: 'world' }, world: 'paused', direction: { waive: LAB_WAIVE }, actors, vehicles, steps };
}

export const SEAT_LAB = seatLab();

/** Every occupant of a four-seat lowrider, a two-seat ride-on and the van gets out at once: no stacking, no snapping. */
export const EXIT_LAB: SceneScript = {
  id: 'exit-lab',
  stage: { kind: 'world' },
  world: 'paused',
  title: 'Exit Lab',
  direction: { waive: LAB_WAIVE },
  actors: [
    { id: 'granny', preset: 'granny', seatedIn: 'ride', seat: 0, at: [0, 0] },
    { id: 'pip', preset: 'pip', seatedIn: 'ride', seat: 1, at: [0, 0] },
    { id: 'lou', preset: 'big lou', seatedIn: 'low', seat: 0, at: [0, 0] },
    { id: 'vesper', preset: 'vesper', seatedIn: 'low', seat: 1, at: [0, 0] },
    { id: 'diggs', preset: 'diggs', seatedIn: 'low', seat: 2, at: [0, 0] },
    { id: 'tansy', preset: 'tansy', seatedIn: 'low', seat: 3, at: [0, 0] },
    { id: 'reginald', preset: 'reginald', seatedIn: 'van', seat: 0, at: [0, 0] },
  ],
  vehicles: [
    { id: 'ride', kind: 'ride-on', at: [-6, 0], yaw: 0 },
    { id: 'low', kind: 'lowrider', at: [0, 0], yaw: 0 },
    { id: 'van', kind: 'hoa-van', at: [7, 0], yaw: 0 },
  ],
  steps: [
    { do: 'cam', shot: { kind: 'cut', pos: [0, 4, 8], look: [0, 0.6, 0] } },
    { do: 'wait', s: 1 },
    { do: 'exit', who: 'granny', async: true },
    { do: 'exit', who: 'pip', async: true },
    { do: 'exit', who: 'lou', async: true },
    { do: 'exit', who: 'vesper', async: true },
    { do: 'exit', who: 'diggs', async: true },
    { do: 'exit', who: 'tansy', async: true },
    { do: 'exit', who: 'reginald' },
    { do: 'wait', s: 1.5 },
    // Guns: Diggs (rifle) and Granny (shotgun) raise them; a side view shows grip, both hands and the barrel on the aim.
    { do: 'face', who: 'diggs', yaw: -Math.PI / 2, s: 0.4, async: true },
    { do: 'face', who: 'granny', yaw: -Math.PI / 2, s: 0.4 },
    { do: 'cam', shot: { kind: 'cut', pos: [-2.6, 1.1, 4.2], look: [-2.6, 0.75, 0] } },
    { do: 'gesture', who: 'diggs', name: 'point', s: 3, async: true },
    { do: 'gesture', who: 'granny', name: 'point', s: 3 },
    { do: 'cam', shot: { kind: 'cut', pos: [0, 4, 8], look: [0, 0.6, 0] } },
    { do: 'enter', who: 'pip', vehicle: 'ride', seat: 1, async: true },
    { do: 'enter', who: 'vesper', vehicle: 'low', seat: 1 },
    { do: 'wait', s: 1.5 },
  ],
};

export const GUN_LAB: SceneScript = {
  id: 'gun-lab',
  stage: { kind: 'world' },
  world: 'paused',
  title: 'Gun Lab',
  direction: { waive: LAB_WAIVE },
  actors: [
    { id: 'p', name: 'Pistol', held: 'gta-pistol', at: [-3, 0], yaw: Math.PI / 2 },
    { id: 's', name: 'SMG', held: 'gta-smg', at: [-1, 0], yaw: Math.PI / 2 },
    { id: 'g', name: 'Shotgun', held: 'gta-shotgun', at: [1, 0], yaw: Math.PI / 2 },
    { id: 'r', name: 'Rifle', held: 'gta-rifle', at: [3, 0], yaw: Math.PI / 2 },
  ],
  steps: [
    { do: 'cam', shot: { kind: 'cut', pos: [0, 1.0, 4.5], look: [0, 0.6, 0] } },
    { do: 'wait', s: 2 },
    { do: 'gesture', who: 'p', name: 'point', s: 6, async: true },
    { do: 'gesture', who: 's', name: 'point', s: 6, async: true },
    { do: 'gesture', who: 'g', name: 'point', s: 6, async: true },
    { do: 'gesture', who: 'r', name: 'point', s: 6, async: true },
    { do: 'wait', s: 2 },
    { do: 'cam', shot: { kind: 'cut', pos: [-6, 1.0, 1.5], look: [0, 0.7, 0] } },
    { do: 'wait', s: 3 },
  ],
};

export const LAB_SCENES: Record<string, SceneScript> = { 'seat-lab': SEAT_LAB, 'exit-lab': EXIT_LAB, 'gun-lab': GUN_LAB };
