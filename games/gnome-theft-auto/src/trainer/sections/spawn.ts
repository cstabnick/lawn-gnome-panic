// The Spawn tab of the Save Trainer: one button per spawnable in the registry, grouped, spawning at the crosshair.
// The built-in spawnables (vehicles, boats, aircraft, critters, hunting quarry, gnomes, events) are registered here; other
// systems plug in with registerTrainerSpawnable. Spawning is session-only, so nothing here calls markTrainerModified.
import { FLEET } from '../../fleet';
import { VEHICLES } from '../../config';
import type { VehicleKind } from '../../types';
import { AIR_KINDS } from '../../craft/spawns';
import { CRITTER_SPECS, type CritterKind } from '../../critters';
import { SPECIES } from '../../hunting/species';
import { activeWorldEvents, clearStreetEvents, listWorldEvents, triggerWorldEvent } from '../../events/api';
import { registerTrainerSection, registerTrainerSpawnable, listTrainerSpawnables } from '../registry';
import type { TrainerCtx, TrainerSpawnable, TrainerSpot } from '../types';
import { trainerSpot } from '../aim';
import { button, grid, heading, note, status } from '../ui';
import { buildSpawnExtras } from './spawnExtras';

const DETAILS_OVER = 12;

/** Vehicle kinds that have their own group (boats, aircraft) or never spawn from here. */
const NOT_IN_VEHICLES: ReadonlySet<string> = new Set(['tessie', 'taxi']);

function spawnVehicle(id: string, verb: string): (at: TrainerSpot, ctx: TrainerCtx) => string {
  return (at, ctx) => {
    const v = ctx.fleet.spawn(id, at.x, at.z, at.yaw);
    if (!v) throw new Error('Unknown vehicle ' + id);
    return `${v.spec.name} ${verb}`;
  };
}

function kindLabel(kind: string): string {
  const s = kind.replace(/-/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function registerBuiltIns(): void {
  // Vehicles: fleet variants first, then the plain kinds (a kind whose id is a fleet id keeps the fleet label).
  const fleetIds = new Set<string>();
  for (const entry of FLEET) {
    fleetIds.add(entry.id);
    registerTrainerSpawnable('Vehicles', entry.id, entry.name, spawnVehicle(entry.id, 'parked at the crosshair'));
  }
  for (const kind of Object.keys(VEHICLES) as VehicleKind[]) {
    const spec = VEHICLES[kind];
    if (spec.boat || spec.air || NOT_IN_VEHICLES.has(kind) || fleetIds.has(kind)) continue;
    registerTrainerSpawnable('Vehicles', kind, spec.name, spawnVehicle(kind, 'parked at the crosshair'));
  }

  // Boats.
  for (const kind of Object.keys(VEHICLES) as VehicleKind[]) {
    const spec = VEHICLES[kind];
    if (!spec.boat || kind === 'tessie') continue;
    registerTrainerSpawnable(
      'Boats',
      kind,
      spec.name,
      spawnVehicle(kind, 'placed at the crosshair (boats need water: aim at a river or the loch)'),
    );
  }

  // Aircraft.
  for (const kind of AIR_KINDS) {
    registerTrainerSpawnable('Aircraft', kind, VEHICLES[kind].name, spawnVehicle(kind, 'set down at the crosshair'));
  }

  // Critters.
  for (const kind of Object.keys(CRITTER_SPECS) as CritterKind[]) {
    registerTrainerSpawnable('Critters', kind, kindLabel(kind), (at, ctx) => {
      ctx.critters.spawn(kind, at.x, at.z, { yaw: at.yaw });
      return `${kindLabel(kind)} spawned at the crosshair`;
    });
  }

  // Hunting quarry.
  for (const s of SPECIES) {
    registerTrainerSpawnable('Hunting quarry', s.id, s.name, (at, ctx) => {
      if (!ctx.hunting.spawn(s.id, at.x, at.z)) {
        throw new Error(`No open ${s.name} ground near here (it lives in its own region).`);
      }
      return `${s.name} spawned at the crosshair`;
    });
  }

  // Gnomes.
  registerTrainerSpawnable('Gnomes', 'townsgnome', 'Townsgnome', (at, ctx) => {
    ctx.npcs.spawnFleeing(at.x, at.z, ctx.player.x, ctx.player.z, null);
    return 'Townsgnome spawned at the crosshair';
  });
  const squads: [string, 'hoa' | 'porcelain' | 'spade'][] = [
    ['HOA Enforcers', 'hoa'],
    ['Porcelain Guards', 'porcelain'],
    ['Spade Guards', 'spade'],
  ];
  for (const [label, kind] of squads) {
    registerTrainerSpawnable('Gnomes', `squad-${kind}`, label, (at, ctx) => {
      ctx.watch.spawnSquad(kind, [[at.x, at.z], [at.x + 1.6, at.z], [at.x, at.z + 1.6]]);
      return `${label} spawned at the crosshair`;
    });
  }

  // Events.
  for (const ev of listWorldEvents()) {
    registerTrainerSpawnable('Events', ev.id, ev.title, () => {
      if (!triggerWorldEvent(ev.id)) {
        throw new Error('Could not start it (already running, or the game is not ready)');
      }
      return `${ev.title} started`;
    });
  }
}

function spawnButton(item: TrainerSpawnable, st: ReturnType<typeof status>, ctx: TrainerCtx): HTMLButtonElement {
  return button(item.label, () => {
    const at = trainerSpot(ctx);
    try {
      const msg = item.spawn(at, ctx);
      st.set(msg || 'Spawned ' + item.label);
    } catch (e) {
      st.set(e instanceof Error ? e.message : String(e), true);
    }
  });
}

export function registerSpawnSection(): void {
  registerBuiltIns();
  registerTrainerSection({
    id: 'spawn',
    label: 'Spawn',
    order: 30,
    build(el, ctx) {
      const st = status();
      el.append(st.el, note('Spawns where the camera looks (the crosshair), or 7 m ahead. Spawned things are not saved.'));

      // Read at build time, so plug-ins registered later show up.
      for (const { group, items } of listTrainerSpawnables()) {
        if (items.length > DETAILS_OVER) {
          const details = document.createElement('details');
          const summary = document.createElement('summary');
          summary.style.minHeight = '44px';
          summary.append(heading(`${group} (${items.length})`));
          details.append(summary, grid(...items.map((item) => spawnButton(item, st, ctx))));
          el.append(details);
        } else {
          el.append(heading(group), grid(...items.map((item) => spawnButton(item, st, ctx))));
        }
      }

      el.append(heading('Running events'));
      const running = activeWorldEvents();
      el.append(note(running.length ? running.map((r) => r.title).join(', ') : 'None'));
      el.append(
        button('Clear street events', () => {
          clearStreetEvents();
          st.set('Street events cleared.');
        }),
      );

      const extras = document.createElement('div');
      el.append(extras);
      buildSpawnExtras(extras, ctx);
    },
  });
}
