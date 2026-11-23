// Piece actions: using doors, ladders, chests, beds, workbenches and fire rings. Each built piece gets a context
// interactable (E on desktop, ACT on touch), rebuilt whenever the base changes.
import type { Bus } from '../game/bus';
import type { Interact, Interactable } from '../game/interact';
import type { CampSystem, Clock, HatlessSystem, InventorySystem, PlayerState } from '../game/types';
import type { ItemStack } from '../sim/types';
import type { BaseSystem } from './system';
import type { BaseView } from './view';
import type { ChestUi } from './chestUi';
import { BED, FIRE_RING, LADDER_PULL_SECONDS, SAW_PLANKS } from './config';
import { cellCenter, edgeCenter } from './grid';
import type { PieceState } from './types';

export interface PieceActionDeps { base: BaseSystem; view: BaseView; interact: Interact; inv: InventorySystem; bus: Bus; clock: Clock; camp: CampSystem; hatless: HatlessSystem; getPlayer: () => PlayerState; chest: ChestUi }
export interface PieceActions { update(dt: number): void; sleeping(): boolean }

interface BedRun { kind: 'sleep' | 'rest'; startHours: number }

export function createPieceActions(deps: PieceActionDeps): PieceActions {
  const { base, view, interact, inv, bus, clock, camp, hatless, getPlayer, chest } = deps;
  let removers: Array<() => void> = [];
  let bedRun: BedRun | null = null;

  const piece = (id: string): PieceState | undefined => base.state()?.pieces.find((p) => p.id === id);
  const plot = () => base.state()?.plot ?? null;
  const hint = (text: string): void => bus.emit('hint', { text });

  function addInteractable(i: Interactable): void {
    removers.push(interact.add(i));
  }

  function doorLabel(id: string): string | null {
    const door = piece(id);
    const s = base.state();
    if (!door || !s) return null;
    if (s.pieces.some((p) => p.kind === 'barricade' && p.overDoor && p.slot === door.slot)) return 'Barricaded';
    if (door.open) return 'Close the door';
    if (door.locked) return inv.countTag('KEY') > 0 ? 'Unlock and open' : 'Locked';
    return 'Open the door';
  }

  function doorAct(id: string): void {
    const door = piece(id);
    const s = base.state();
    if (!door || !s) return;
    if (s.pieces.some((p) => p.kind === 'barricade' && p.overDoor && p.slot === door.slot)) {
      hint('Take the barricade down first.');
      return;
    }
    if (door.open) {
      if (!base.setDoor(id, { open: false })) return;
      if (door.hasLock && inv.countTag('KEY') > 0) {
        base.setDoor(id, { locked: true });
        hint('You lock it behind you.');
      }
      return;
    }
    if (door.locked) {
      if (inv.countTag('KEY') > 0) {
        base.setDoor(id, { locked: false });
        base.setDoor(id, { open: true });
      } else {
        hint('You need the key.');
      }
      return;
    }
    base.setDoor(id, { open: true });
  }

  function bedLabel(): string | null {
    if (bedRun || camp.sleeping()) return null;
    if (clock.night) {
      const pos = getPlayer().pos;
      return base.sealedAt(pos) && hatless.nearCount(pos, BED.hatlessRadius) === 0 ? 'Sleep until dawn' : 'Not safe to sleep here';
    }
    return 'Rest a while';
  }

  function bedAct(): void {
    if (bedRun || camp.sleeping()) return;
    if (clock.night) {
      const pos = getPlayer().pos;
      if (base.sealedAt(pos) && hatless.nearCount(pos, BED.hatlessRadius) === 0) {
        bedRun = { kind: 'sleep', startHours: clock.sunHours };
        clock.setRate(BED.sleepRate);
      } else {
        hint('Wall yourself in first, and make sure nothing is close.');
      }
      return;
    }
    bedRun = { kind: 'rest', startHours: clock.sunHours };
    clock.setRate(BED.restRate);
  }

  function endBedRun(): void {
    bedRun = null;
    clock.setRate(1);
  }

  function sawLabel(): string {
    return inv.countTag(SAW_PLANKS.input.tag) > 0 && inv.countTag(SAW_PLANKS.tool) > 0
      ? 'Saw a log into planks'
      : 'Workbench (needs a timber log and a saw)';
  }

  function sawAct(): void {
    if (inv.countTag(SAW_PLANKS.input.tag) > 0 && inv.countTag(SAW_PLANKS.tool) > 0) {
      const started = base.startWork('Sawing planks', SAW_PLANKS.seconds, () => {
        if (!inv.consumeTag(SAW_PLANKS.input.tag, SAW_PLANKS.input.count)) return;
        const left = inv.add({ def: SAW_PLANKS.out, count: SAW_PLANKS.outCount, condition: 1 });
        if (left) hint('No room for the planks.');
      });
      if (!started) hint('You are already busy.');
      return;
    }
    hint('You need a timber log and a saw.');
  }

  function fireLabel(x: number, z: number): string | null {
    const p = plot();
    if (!p) return null;
    if (camp.nearFire({ x, y: p.y, z })) return null;
    return inv.countTag('TINDER') > 0 && inv.countTag('FUEL') > 0 && inv.countTag('FIRESTARTER') > 0
      ? 'Light a fire in the ring'
      : null;
  }

  function fireAct(x: number, z: number): void {
    const p = plot();
    if (!p) return;
    const started = base.startWork('Lighting a fire', FIRE_RING.seconds, () => {
      if (inv.countTag('TINDER') < 1 || inv.countTag('FUEL') < 1) return;
      inv.consumeTag('TINDER', 1);
      inv.consumeTag('FUEL', 1);
      camp.placeFire(x, p.y, z, FIRE_RING.burnHours);
    });
    if (!started) hint('You are already busy.');
  }

  function rebuild(): void {
    for (const remove of removers) remove();
    removers = [];
    const s = base.state();
    if (!s) return;
    const p = s.plot;
    for (const pc of s.pieces) {
      const id = pc.id;
      if (pc.kind === 'door') {
        const c = edgeCenter(p, pc.slot);
        addInteractable({
          id, x: c.x, y: p.y + 1, z: c.z, radius: 2.4,
          label: () => doorLabel(id),
          act: () => doorAct(id),
        });
      } else if (pc.kind === 'ladder') {
        const c = edgeCenter(p, pc.slot);
        addInteractable({
          id, x: c.x, y: p.y + 3.2, z: c.z, radius: 2,
          label: () => { const l = piece(id); return l ? (l.up ? 'Let the ladder down' : 'Pull up the ladder') : null; },
          act: () => {
            const l = piece(id);
            if (!l) return;
            base.startWork('Moving the ladder', LADDER_PULL_SECONDS, () => {
              const cur = piece(id);
              if (cur) base.setLadderUp(id, !cur.up);
            });
          },
        });
      } else if (pc.kind === 'chest') {
        const c = cellCenter(p, pc.slot);
        addInteractable({
          id, x: c.x, y: p.y, z: c.z, radius: 2,
          label: () => (piece(id) ? 'Open the chest' : null),
          act: () => chest.open('Storage chest', () => (piece(id)?.items ?? []) as ItemStack[], () => base.touch()),
        });
      } else if (pc.kind === 'bed') {
        const c = cellCenter(p, pc.slot);
        addInteractable({
          id, x: c.x, y: p.y, z: c.z, radius: 2,
          label: bedLabel,
          act: bedAct,
        });
      } else if (pc.kind === 'workbench') {
        const c = cellCenter(p, pc.slot);
        addInteractable({
          id, x: c.x, y: p.y, z: c.z, radius: 2,
          label: () => (piece(id) ? sawLabel() : null),
          act: () => { if (piece(id)) sawAct(); },
        });
      } else if (pc.kind === 'fire-ring') {
        const c = cellCenter(p, pc.slot);
        addInteractable({
          id, x: c.x, y: p.y, z: c.z, radius: 2.2,
          label: () => (piece(id) ? fireLabel(c.x, c.z) : null),
          act: () => { if (piece(id)) fireAct(c.x, c.z); },
        });
      }
    }
  }

  base.onChange(rebuild);
  rebuild();

  bus.on('player-hit', () => {
    if (!bedRun) return;
    endBedRun();
    hint('You wake to scratching.');
  });

  return {
    update(dt: number): void {
      void dt;
      const s = base.state();
      if (s) {
        for (const pc of s.pieces) {
          if (pc.kind !== 'fire-ring') continue;
          const c = cellCenter(s.plot, pc.slot);
          view.setLit(pc.id, camp.nearFire({ x: c.x, y: s.plot.y, z: c.z }));
        }
      }
      if (bedRun?.kind === 'sleep' && !clock.night) {
        const hours = clock.sunHours - bedRun.startHours;
        endBedRun();
        const doors = s?.pieces.filter((p) => p.kind === 'door') ?? [];
        const pos = getPlayer().pos;
        bus.emit('base-slept', {
          hours,
          sealed: base.sealedAt(pos),
          locked: doors.length > 0 && doors.every((d) => !d.open && d.locked),
        });
      } else if (bedRun?.kind === 'rest' && clock.sunHours - bedRun.startHours >= BED.restSunHours) {
        endBedRun();
      }
    },
    sleeping: () => bedRun?.kind === 'sleep',
  };
}
