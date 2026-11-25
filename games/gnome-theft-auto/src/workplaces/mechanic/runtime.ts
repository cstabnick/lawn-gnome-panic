// E24 mechanic job runtime: take a work order at the Pay 'n' Glaze board, meet the client at their car, glaze it in the
// shop's client mode, hand back the keys, get rated and paid. The client leaves with the car.
import type * as THREE from 'three';
import type { GnomeModel } from '@lawn/gnome';
import { defaultLoadout, normalizeLoadout, type Loadout } from '@lawn/glaze';
import { VEHICLES } from '../../config';
import { clearClientOrder, setClientOrder } from '../../glazeClient';
import { gnomeState, makeGnome, randomTownLook } from '../../gnomes';
import { addInteractSpot } from '../../interactables';
import { WORK_ACHIEVEMENTS, WORK_JOBS } from '../../jobs/workDefs';
import { play2d } from '../../sound/bus';
import { heightAt } from '../../terrain';
import type { Blip, Vehicle } from '../../types';
import { createVehicle, removeVehicle, setVehicleLook } from '../../vehicles';
import { finishShift, workLevel } from '../shift';
import { registerWorkSounds } from '../sounds';
import type { WorkDeps, WorkJobRuntime } from '../types';
import { showBriefCard } from './briefCard';
import { pickBrief, scoreBrief } from './briefs';
import { buildClientLot, type ClientLot } from './lot';
import type { Brief } from './types';

const DULL_TINT = 0x9a9a8f;
const LEAVE_S = 4;
const FAR_FROM_PLAYER = 60;
const FAR_FROM_LOT = 300;
const ABANDON_S = 20;

interface Order {
  brief: Brief;
  car: Vehicle;
  start: Loadout;
  gnome: GnomeModel;
  gx: number;
  gz: number;
  gyaw: number;
  /** Seconds since hand-back, or null while the job is open. */
  leaving: number | null;
  /** Seconds the player has been away from the lot and out of the car. */
  away: number;
}

export function installMechanic(deps: WorkDeps): WorkJobRuntime {
  registerWorkSounds();
  let lot: ClientLot | null = null;
  let order: Order | null = null;
  let lastId: string | null = null;
  let card: { close(): void; isOpen(): boolean } | null = null;
  let removeSpot: (() => void) | null = null;
  let devT = new URLSearchParams(location.search).has('mechorder') ? 0 : -1;

  /** The board's prompt follows the open order, so the spot is replaced when the order changes. */
  function setSpot(): void {
    if (!lot) return;
    removeSpot?.();
    const o = order;
    removeSpot = addInteractSpot({
      x: lot.board.x,
      z: lot.board.z,
      prompt: o ? `Work order: ${o.brief.client}` : 'Take a work order (mechanic)',
      run: () => {
        take();
        return true;
      },
    });
  }

  function showCard(o: Order): void {
    card = showBriefCard(deps.ui, {
      client: o.brief.client,
      vehicleName: VEHICLES[o.brief.vehicle].name,
      text: o.brief.text,
      wants: o.brief.wants.map((w) => w.says),
      budget: o.brief.budget,
      level: workLevel('mechanic'),
    });
  }

  function dropGnome(o: Order): void {
    o.gnome.object.removeFromParent();
    o.gnome.object.traverse((x) => {
      const g = (x as THREE.Mesh).geometry;
      if (g) g.dispose();
    });
  }

  function clear(o: Order): void {
    clearClientOrder(o.car);
    removeVehicle(deps.scene, o.car);
    const i = deps.vehicles.indexOf(o.car);
    if (i >= 0) deps.vehicles.splice(i, 1);
    dropGnome(o);
    if (order === o) {
      order = null;
      setSpot();
    }
  }

  function finish(o: Order, look: Loadout, partsCost: number): void {
    if (order !== o || o.leaving !== null) return;
    const s = scoreBrief(o.brief, o.start, look, partsCost);
    play2d('mech-air-wrench');
    deps.getOut();
    finishShift(deps, 'mechanic', {
      units: [{ stars: s.stars }],
      extra: { cars: 1, perfectCars: s.stars === 5 ? 1 : 0 },
      quote: `${o.brief.client}: ${s.stars >= 4 ? o.brief.good : s.stars <= 2 ? o.brief.bad : 'It is... a car. Thank you.'}`,
    });
    deps.hud.toast(s.lines.join(' · '), 8000);
    deps.increment(WORK_ACHIEVEMENTS.mechanic);
    if (s.stars === 5) deps.unlock(WORK_ACHIEVEMENTS.nailedBrief);
    if (s.score < 20) deps.unlock(WORK_ACHIEVEMENTS.creativeDifferences);
    clearClientOrder(o.car);
    o.leaving = 0;
  }

  function take(): void {
    if (!lot) return;
    if (order) {
      if (order.leaving === null) showCard(order);
      return;
    }
    const why = deps.blocked();
    if (why) {
      deps.hud.toast(why);
      return;
    }
    const brief = pickBrief(workLevel('mechanic'), Date.now() & 0xffff, lastId);
    if (!brief) {
      deps.hud.toast('No work orders right now.');
      return;
    }
    lastId = brief.id;
    const car = createVehicle(deps.scene, brief.vehicle, lot.car.x, lot.car.z, lot.car.yaw);
    deps.vehicles.push(car);
    const start = normalizeLoadout({ ...defaultLoadout(DULL_TINT), ...brief.start });
    setVehicleLook(car, start);
    const gnome = makeGnome(deps.scene, { ...randomTownLook(), ...brief.look });
    const o: Order = {
      brief, car, start, gnome, gx: lot.client.x, gz: lot.client.z, gyaw: lot.client.yaw, leaving: null, away: 0,
    };
    order = o;
    setSpot();
    showCard(o);
    play2d('mech-keys');
    setClientOrder(car, {
      title: `${brief.client}'s ${VEHICLES[brief.vehicle].name}`,
      brief: brief.text,
      budget: brief.budget,
      start,
      finish: (look, partsCost) => finish(o, look, partsCost),
      cancel: () => {},
    });
  }

  function dropOrder(o: Order): void {
    deps.hud.toast(`${o.brief.client} took their car back.`);
    clear(o);
  }

  return {
    update(dt) {
      if (!lot) {
        lot = buildClientLot(deps.scene, deps.world);
        setSpot();
      }
      if (devT >= 0) {
        devT += dt;
        if (devT >= 2) {
          devT = -1;
          take();
        }
      }
      const o = order;
      if (!o) return;
      const p = deps.player;
      if (o.leaving === null) {
        if (o.car.exploded || !deps.vehicles.includes(o.car)) {
          dropOrder(o);
          return;
        }
        const far = Math.hypot(p.x - lot.board.x, p.z - lot.board.z) > FAR_FROM_LOT;
        o.away = far && p.vehicle !== o.car ? o.away + dt : 0;
        if (o.away > ABANDON_S) {
          dropOrder(o);
          return;
        }
      } else {
        o.leaving += dt;
        o.gx += (o.car.x - o.gx) * Math.min(1, dt * 1.2);
        o.gz += (o.car.z - o.gz) * Math.min(1, dt * 1.2);
        o.gyaw = Math.atan2(o.car.x - o.gx, o.car.z - o.gz);
        const away = Math.hypot(p.x - o.car.x, p.z - o.car.z) > FAR_FROM_PLAYER;
        if (o.leaving >= LEAVE_S || away) {
          clear(o);
          return;
        }
      }
      const y = heightAt(o.gx, o.gz);
      o.gnome.object.position.set(o.gx, y, o.gz);
      o.gnome.update(gnomeState(o.gx, y, o.gz, o.gyaw, o.leaving !== null ? 1.5 : 0), dt);
    },
    isOpen: () => card?.isOpen() ?? false,
    blips() {
      const out: Blip[] = [];
      if (lot) out.push({ x: lot.board.x, z: lot.board.z, color: WORK_JOBS.mechanic.color, label: '🔧 Work orders (mechanic)' });
      if (order && order.leaving === null) out.push({ x: order.car.x, z: order.car.z, color: WORK_JOBS.mechanic.color, label: order.brief.client });
      return out;
    },
  };
}
