// The Garage tab of the Save Trainer: what is stored in the Lock-Up, hangar and boathouse; add a vehicle; remove; free delivery.
import type { StorageKind } from '../../lockup/types';
import { STORAGE_KINDS } from '../../lockup/types';
import { FLEET } from '../../fleet';
import { VEHICLES } from '../../config';
import type { VehicleKind } from '../../types';
import { markTrainerModified } from '../mark';
import { refreshTrainerTab } from '../panel';
import type { TrainerCtx } from '../types';
import { registerTrainerSection } from '../registry';
import { button, confirmButton, heading, note, row, select, status } from '../ui';

/** Kinds the Add menu leaves out: the story vehicles, which the game gives out itself. */
const ADD_EXCLUDED: readonly VehicleKind[] = ['tessie', 'taxi'];

const KIND_HEADINGS: Record<string, string> = {
  ground: 'Lock-Up (cars)',
  air: 'Hangar (aircraft)',
  water: 'Boathouse (boats)',
};

function buildStored(el: HTMLElement, ctx: TrainerCtx, st: ReturnType<typeof status>): void {
  for (const kind of STORAGE_KINDS as readonly StorageKind[]) {
    el.append(heading(KIND_HEADINGS[kind] ?? kind));
    const records = ctx.lockup.list(kind);
    if (records.length === 0) {
      el.append(note('None stored.'));
      continue;
    }
    for (const rec of records) {
      el.append(note(`${rec.name} · ${Math.round(rec.hp * 100)}%`));
      el.append(row(
        null,
        button('Deliver free', () => {
          const err = ctx.lockup.callDelivery(rec.uid, true);
          if (err) st.set(err, true);
          else st.set('Sling-Lift on its way.');
        }),
        confirmButton('Remove', () => {
          ctx.lockup.remove(rec.uid);
          markTrainerModified('lockup remove ' + rec.name);
          refreshTrainerTab();
        }),
      ));
    }
  }
}

function buildAdd(el: HTMLElement, ctx: TrainerCtx, st: ReturnType<typeof status>): void {
  el.append(heading('Add to storage'));
  el.append(note("Puts a full-health one in the right store (Lock-Up, hangar or boathouse) if there is room."));

  const options: { value: string; label: string }[] = [
    ...FLEET.map((f) => ({ value: f.id, label: f.name })),
    ...(Object.keys(VEHICLES) as VehicleKind[])
      .filter((k) => !ADD_EXCLUDED.includes(k))
      .map((k) => ({ value: k, label: VEHICLES[k].name })),
  ];
  const pick = select(options);
  el.append(row(null, pick));
  el.append(row(
    null,
    button('Add', () => {
      const id = pick.value;
      const rec = ctx.lockup.addRecord(id);
      if (!rec) {
        st.set('Full, or that one cannot be stored.', true);
        return;
      }
      markTrainerModified('lockup add ' + id);
      refreshTrainerTab();
    }),
  ));

  el.append(row(
    null,
    button("Store the one I'm in", () => {
      const v = ctx.player.vehicle;
      if (!v) {
        st.set('Get in a vehicle first.', true);
        return;
      }
      const err = ctx.lockup.storeVehicle(v);
      if (err) {
        st.set(err, true);
        return;
      }
      markTrainerModified('lockup store ' + v.kind);
      refreshTrainerTab();
    }),
  ));
}

export function registerGarageSection(): void {
  registerTrainerSection({
    id: 'garage',
    label: 'Garage',
    order: 40,
    build(el, ctx) {
      const st = status();
      el.append(st.el);
      buildStored(el, ctx, st);
      buildAdd(el, ctx, st);
    },
  });
}
