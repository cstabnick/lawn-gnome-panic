// The World tab of the Save Trainer: time of day, heat and street events, and teleports. Nothing here is saved.
import type { TimeMode } from '../../atmosphere';
import { activeWorldEvents, clearStreetEvents } from '../../events/api';
import { placeBlips } from '../../mapPois';
import { GIVERS } from '../../quests/defs';
import { trainerSpot } from '../aim';
import type { TrainerCtx } from '../types';
import { registerTrainerSection } from '../registry';
import { button, grid, heading, note, row, status } from '../ui';

const TIME_MODES: readonly { mode: TimeMode; label: string }[] = [
  { mode: 'auto', label: 'Auto' },
  { mode: 'noon', label: 'Noon' },
  { mode: 'golden', label: 'Golden Hour' },
  { mode: 'night', label: 'Neon Night' },
];

function buildTime(el: HTMLElement, ctx: TrainerCtx): void {
  el.append(heading('Time of day'));
  const atmo = ctx.atmosphere;
  if (!atmo) {
    el.append(note('No sky in this build.'));
    return;
  }
  const current = atmo.getMode();
  const buttons: { mode: TimeMode; el: HTMLButtonElement }[] = [];
  for (const { mode, label } of TIME_MODES) {
    const b = button(label, () => {
      atmo.setMode(mode);
      for (const other of buttons) other.el.classList.toggle('on', other.mode === mode);
    });
    b.classList.toggle('on', mode === current);
    buttons.push({ mode, el: b });
  }
  el.append(grid(...buttons.map((x) => x.el)));
}

function buildLaw(el: HTMLElement, ctx: TrainerCtx, st: ReturnType<typeof status>): void {
  el.append(heading('Law and order'));
  el.append(row(
    null,
    button('Clear heat', () => {
      ctx.watch.clear();
      st.set('Heat cleared.');
    }),
    button('Clear street events', () => {
      clearStreetEvents();
      st.set('Street events cleared.');
    }),
  ));
  const events = activeWorldEvents();
  el.append(note(events.length ? events.map((e) => e.title).join(', ') : 'No events running.'));
}

function buildTeleport(el: HTMLElement, ctx: TrainerCtx, st: ReturnType<typeof status>): void {
  el.append(heading('Teleport'));
  const go = (x: number, z: number, label: string): void => {
    ctx.player.respawn(x, z, ctx.player.yaw);
    st.set(`Teleported to ${label}`);
  };
  el.append(row(null, button('To the crosshair', () => {
    const spot = trainerSpot(ctx);
    go(spot.x, spot.z, 'the crosshair');
  })));

  const targets: HTMLButtonElement[] = [
    button('Start', () => go(ctx.world.spawn.x, ctx.world.spawn.z, 'Start')),
  ];
  for (const b of placeBlips()) {
    const label = b.label ?? 'a place';
    targets.push(button(label, () => go(b.x, b.z, label)));
  }
  for (const g of Object.values(GIVERS)) {
    targets.push(button(g.name, () => go(g.x, g.z, g.name), 'Quest giver'));
  }
  el.append(grid(...targets));
}

export function registerWorldSection(): void {
  registerTrainerSection({
    id: 'world',
    label: 'World',
    order: 50,
    build(el, ctx) {
      const st = status();
      el.append(st.el);
      buildTime(el, ctx);
      buildLaw(el, ctx, st);
      buildTeleport(el, ctx, st);
      el.append(note('Weather: Turfton has no weather to set yet.'));
    },
  });
}
