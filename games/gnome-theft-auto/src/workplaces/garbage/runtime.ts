// E25 garbage job runtime: start a round at the depot, drive the Bin Lorry to each bin, lift it, tip the load at the
// heap, get paid.
import { boxesBlocked } from '../../lockup/safeSpot';
import { addInteractSpot } from '../../interactables';
import { WORK_ACHIEVEMENTS, WORK_JOBS, SPILL_FINE } from '../../jobs/workDefs';
import { play2d } from '../../sound/bus';
import { heightAt, waterAt } from '../../terrain';
import type { Blip, Vehicle } from '../../types';
import { createVehicle, removeVehicle } from '../../vehicles';
import { finishShift, workLevel } from '../shift';
import { createShiftHud } from '../shiftHud';
import { registerJobs3Sounds } from '../sounds3';
import type { WorkDeps, WorkJobRuntime, WorkWaypoint } from '../types';
import { createBinView } from './bins';
import { buildDepot, updateDepot, type Depot } from './depot';
import { openLiftUi, type LiftUi } from './liftUi';
import { makeRound } from './round';
import { GARBAGE, GARBAGE_START_EVENT, LIFT } from './types';
import type { BinRound, BinStop, LiftEvent, LiftResult } from './types';

const MAGS_LINES = [
  'Every bin. Lids down. If it spills, the HOA bills.',
  'Mind the kerb. The kerb has feelings, and a lawyer.',
  'Lift with the arm, not your back. You are a gnome. You have no back.',
  'A tidy round is a quiet round. Quiet is what we sell.',
  'The bins are not full of treasure. Stop checking.',
  'Eight bins, no spills, and I will pretend to smile.',
];
const LORRY_LEAVE_DIST = 30;

type Action = 'lift' | 'tip' | null;

export function installGarbage(deps: WorkDeps): WorkJobRuntime {
  registerJobs3Sounds();
  const shiftHud = createShiftHud(deps.ui);
  const binView = createBinView(deps.scene);
  const dev = new URLSearchParams(location.search).get('binround');
  let devT = dev !== null ? 0 : -1;

  let depot: Depot | null = null;
  let removeSpot: (() => void) | null = null;
  let round: BinRound | null = null;
  let lorry: Vehicle | null = null;
  let leftover: Vehicle | null = null;
  let results: LiftResult[] = [];
  let lift: LiftUi | null = null;
  let liftStop: BinStop | null = null;
  let away = 0;
  let lastLine = -1;

  function setSpot(): void {
    if (!depot) return;
    removeSpot?.();
    removeSpot = addInteractSpot({
      x: depot.start.x,
      z: depot.start.z,
      prompt: round ? 'End the round' : 'Start a bin round (bin crew)',
      run: () => {
        if (round) end('Round ended at the depot.');
        else start();
        return true;
      },
    });
  }

  function dropVehicle(v: Vehicle | null): void {
    if (!v) return;
    removeVehicle(deps.scene, v);
    const i = deps.vehicles.indexOf(v);
    if (i >= 0) deps.vehicles.splice(i, 1);
  }

  function start(): void {
    if (!depot || round) return;
    const why = deps.blocked();
    if (why) {
      deps.hud.toast(why);
      return;
    }
    if (leftover) {
      dropVehicle(leftover);
      leftover = null;
    }
    const d = depot;
    const l = createVehicle(deps.scene, 'bin-lorry', d.lorry.x, d.lorry.z, d.lorry.yaw);
    deps.vehicles.push(l);
    deps.seatPlayer(l);
    lorry = l;
    const blocked = boxesBlocked(deps.world.boxes, deps.world.half);
    round = makeRound(deps.world.roads, {
      level: workLevel('garbage'),
      seed: Date.now() & 0xffff,
      from: d.lorry,
      clear: (x, z, r) => !blocked(x, z, r) && !waterAt(x, z),
    });
    results = [];
    away = 0;
    binView.show(round);
    lastLine = (lastLine + 1 + Math.floor(Math.random() * (MAGS_LINES.length - 1))) % MAGS_LINES.length;
    deps.hud.toast(`${round.title}. Mags: "${MAGS_LINES[lastLine]}"`, 6000);
    setSpot();
  }

  function end(note: string | null): void {
    const r = round;
    if (!r) return;
    closeLift();
    round = null;
    const bins = results.length;
    const spills = results.filter((x) => x.spilled).length;
    const neatBins = results.filter((x) => x.neat >= LIFT.neatBar && !x.spilled).length;
    if (note) deps.hud.toast(note, 5000);
    finishShift(deps, 'garbage', {
      units: results.map((x) => ({ stars: x.stars })),
      extra: { bins, neatBins, spills },
      bonus: -SPILL_FINE * spills,
      bonusNote: 'HOA litter citation',
      quote: spills > 0
        ? 'Mags: "Litter. On my kerb. We will discuss this."'
        : bins > 0 ? 'Mags: "Tidy. Do not let it go to your head."' : 'Mags: "Nothing? Bold."',
    });
    if (bins > 0) deps.increment(WORK_ACHIEVEMENTS.binDay, bins);
    if (neatBins > 0) deps.increment(WORK_ACHIEVEMENTS.kerbAppeal, neatBins);
    if (bins >= 8 && spills === 0 && r.stops.every((s) => s.state === 'done')) deps.unlock(WORK_ACHIEVEMENTS.notADrop);
    binView.clear();
    shiftHud.set(null);
    leftover = lorry;
    lorry = null;
    setSpot();
  }

  function closeLift(): void {
    if (!lift) return;
    lift.close();
    lift = null;
    liftStop = null;
    deps.showroom(null);
    binView.pose(null, null, lorry);
  }

  function onLiftEvent(stop: BinStop, e: LiftEvent): void {
    switch (e) {
      case 'grabbed': play2d('bin-arm-hydraulic'); break;
      case 'grab-miss': play2d('bin-clank'); break;
      case 'tipped': play2d('bin-tip'); break;
      case 'spill':
        play2d('bin-spill');
        binView.spill(stop);
        deps.hud.toast(`HOA litter citation (-${SPILL_FINE} 🌰)`);
        break;
      case 'set-down': play2d('bin-set-down'); break;
    }
  }

  function openLift(stop: BinStop): void {
    if (!lorry || lift) return;
    const l = lorry;
    liftStop = stop;
    const yaw = Math.atan2(stop.x - l.x, stop.z - l.z);
    const cx = l.x + (stop.x - l.x) * 0.5;
    const cz = l.z + (stop.z - l.z) * 0.5;
    // Square on to the lorry-bin line, so the lorry and the bin stand side by side with the arm between.
    deps.showroom({ x: cx, y: heightAt(cx, cz) - 0.5, z: cz, radius: 3, distance: 9, fixedYaw: yaw + Math.PI / 2, fixedPitch: 0.3 });
    const leave = (): void => {
      lift = null;
      liftStop = null;
      deps.showroom(null);
      binView.pose(null, null, l);
    };
    lift = openLiftUi(deps.ui, {
      heavy: stop.heavy,
      onEvent: (e) => onLiftEvent(stop, e),
      onDone: (r) => {
        stop.state = r.spilled ? 'spilled' : 'done';
        results.push(r);
        binView.setDown(stop, r.neat);
        leave();
      },
      onCancel: leave,
    });
  }

  function nearFull(): BinStop | null {
    if (!round || !lorry) return null;
    let best: BinStop | null = null;
    let bd: number = GARBAGE.stopRadius;
    for (const s of round.stops) {
      if (s.state !== 'full') continue;
      const d = Math.hypot(s.x - lorry.x, s.z - lorry.z);
      if (d <= bd) {
        bd = d;
        best = s;
      }
    }
    return best;
  }

  function nextBin(): BinStop | null {
    return round?.stops.find((s) => s.state === 'full') ?? null;
  }

  function currentAction(): Action {
    if (!round || !lorry || lift || deps.player.vehicle !== lorry) return null;
    if (Math.abs(lorry.speed) >= GARBAGE.stopSpeed) return null;
    if (nearFull()) return 'lift';
    if (depot && !nextBin() && Math.hypot(lorry.x - depot.tip.x, lorry.z - depot.tip.z) <= GARBAGE.tipRadius) return 'tip';
    return null;
  }

  function runAction(): void {
    const a = currentAction();
    if (a === 'lift') {
      const s = nearFull();
      if (s) openLift(s);
    } else if (a === 'tip') {
      play2d('bin-tip');
      end(null);
    }
  }

  shiftHud.onAction(runAction);
  window.addEventListener(GARBAGE_START_EVENT, () => start());

  function updateHud(action: Action): void {
    if (!round) {
      shiftHud.set(null);
      return;
    }
    const n = round.stops.length;
    const done = round.stops.filter((s) => s.state !== 'full').length;
    const spills = results.filter((r) => r.spilled).length;
    const nb = nextBin();
    const p = deps.player;
    const line = nb
      ? `Next bin: ${nb.street}, ${Math.round(Math.hypot(nb.x - p.x, nb.z - p.z))} m`
      : 'Back to the depot to tip';
    shiftHud.set({
      icon: '🗑️',
      title: `Bin round: ${done} of ${n} bins`,
      lines: [line, `Spills: ${spills}`],
      meter: { label: 'Round', frac: n > 0 ? done / n : 0 },
      action: action === 'lift' ? 'Lift bin' : action === 'tip' ? 'Tip the load' : null,
      color: WORK_JOBS.garbage.color,
    });
  }

  function devStart(): void {
    const d = depot;
    if (!d) return;
    deps.teleport(d.start.x, d.start.z, 0);
    start();
    if (dev !== 'lift' || !round || !lorry) return;
    const s = round.stops[0];
    const l = lorry;
    // The arm is on the lorry's -x side: park with it toward the bin.
    l.x = s.x + Math.sin(s.yaw) * 3.5;
    l.z = s.z + Math.cos(s.yaw) * 3.5;
    l.y = heightAt(l.x, l.z);
    l.yaw = s.yaw - Math.PI / 2;
    l.speed = 0;
    openLift(s);
  }

  return {
    update(dt) {
      if (!depot) {
        depot = buildDepot(deps.scene, deps.world);
        setSpot();
      }
      updateDepot(dt);
      binView.update(dt);
      if (devT >= 0) {
        devT += dt;
        if (devT >= 2) {
          devT = -1;
          devStart();
        }
      }
      if (lift) {
        lift.update(dt);
        // update may close the UI (done / cancel), which clears `lift`.
        const cur = lift as LiftUi | null;
        if (cur && liftStop) binView.pose(liftStop, cur.state(), lorry);
      }
      if (leftover) {
        if (!deps.vehicles.includes(leftover)) leftover = null;
        else if (
          deps.player.vehicle !== leftover &&
          Math.hypot(deps.player.x - leftover.x, deps.player.z - leftover.z) > LORRY_LEAVE_DIST
        ) {
          dropVehicle(leftover);
          leftover = null;
        }
      }
      if (round && lorry && !lift) {
        const p = deps.player;
        if (lorry.exploded || !deps.vehicles.includes(lorry)) {
          end('Mags took the lorry back.');
          return;
        }
        const far = p.vehicle !== lorry && Math.hypot(p.x - lorry.x, p.z - lorry.z) > GARBAGE.abandonDist;
        away = far ? away + dt : 0;
        if (away > GARBAGE.abandonS) {
          end('Mags took the lorry back.');
          return;
        }
      }
      updateHud(currentAction());
    },
    isOpen: () => lift !== null,
    blips() {
      const out: Blip[] = [];
      const color = WORK_JOBS.garbage.color;
      if (depot) out.push({ x: depot.start.x, z: depot.start.z, color, label: '🗑️ Bin Depot (bin crew)', kind: 'shop' });
      if (round) {
        for (const s of round.stops) {
          if (s.state === 'full') out.push({ x: s.x, z: s.z, color, label: s.street });
        }
      }
      return out;
    },
    waypoint(): WorkWaypoint | null {
      if (!round) return null;
      const color = WORK_JOBS.garbage.color;
      const nb = nextBin();
      if (nb) return { x: nb.x, z: nb.z, color, label: nb.street };
      if (depot) return { x: depot.tip.x, z: depot.tip.z, color, label: 'Bin Depot tip' };
      return null;
    },
  };
}
