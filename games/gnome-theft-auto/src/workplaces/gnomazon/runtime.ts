// E25 Gnomazon job runtime: clock in at a packing station on the FC-1 floor, pack against the quota, get paid.
import { play2d } from '../../sound/bus';
import { enterInterior } from '../../interiors/runtime';
import { WORK_ACHIEVEMENTS, WORK_JOBS, QUOTA_BONUS, workTitle } from '../../jobs/workDefs';
import { finishShift, workLevel } from '../shift';
import { registerJobs3Sounds } from '../sounds3';
import type { WorkDeps, WorkJobRuntime } from '../types';
import { KIPPY_LINES, quotaFor } from './orders';
import { openPackStation } from './packUi';
import { GNOMAZON, GNOMAZON_FLOOR_ID, GNOMAZON_START_EVENT, type PackSession, type ShiftResult } from './types';
import { buildWarehouseOutside, warehouseDoor } from './warehouse';

const pick = (a: readonly string[]): string => a[Math.floor(Math.random() * a.length)] ?? '';

export function installGnomazon(deps: WorkDeps): WorkJobRuntime {
  registerJobs3Sounds();

  let session: PackSession | null = null;
  let built = false;

  function onEnd(r: ShiftResult): void {
    const n = r.parcels.length;
    const met = n > 0 && n >= r.quota;
    const rightSized = r.parcels.filter((p) => p.rightBox).length;
    if (met) play2d('quota-fanfare');
    finishShift(deps, 'gnomazon', {
      units: r.parcels.map((p) => ({ stars: p.stars })),
      extra: { parcels: n, rightSized },
      bonus: met ? QUOTA_BONUS : 0,
      bonusNote: met ? 'Quota bonus' : undefined,
      quote: 'Kippy: "' + pick(met ? KIPPY_LINES.quota : KIPPY_LINES.end) + '"',
    });
    if (n > 0) deps.increment(WORK_ACHIEVEMENTS.fulfilled, n);
    if (met && rightSized === n) deps.unlock(WORK_ACHIEVEMENTS.beatTheBot);
    if (r.idle) deps.unlock(WORK_ACHIEVEMENTS.timeOffTask);
  }

  function start(): void {
    if (session?.isOpen()) return;
    const reason = deps.blocked();
    if (reason) {
      deps.hud.toast(reason);
      return;
    }
    const level = workLevel('gnomazon');
    session = openPackStation(deps.ui, {
      level,
      title: workTitle('gnomazon', level),
      seed: Date.now() & 0xffff,
      quota: quotaFor(level),
      shiftS: GNOMAZON.shiftS,
      kippy: (l) => {
        deps.hud.toast('Kippy: "' + l + '"', 3500);
        play2d('kippy-chime');
      },
      onParcel: (s) => {
        play2d('tape-screech');
        play2d(s.stars >= 3 ? 'scanner-beep' : 'kippy-error');
        play2d('box-thud');
      },
      onEnd,
    });
  }

  window.addEventListener(GNOMAZON_START_EVENT, start);

  // Dev hook: ?gnomazonshift walks onto the FC-1 floor, then starts a shift (screenshots and smoke tests).
  if (new URLSearchParams(location.search).has('gnomazonshift')) {
    setTimeout(() => {
      enterInterior(GNOMAZON_FLOOR_ID);
      setTimeout(start, 2000);
    }, 1500);
  }

  const def = WORK_JOBS.gnomazon;
  return {
    update(dt) {
      if (!built) {
        built = true;
        buildWarehouseOutside(deps.scene, deps.world);
      }
      if (!session) return;
      session.update(dt);
      if (!session.isOpen()) session = null;
    },
    isOpen: () => !!session?.isOpen(),
    blips() {
      const d = warehouseDoor();
      return [{ x: d.x, z: d.z, color: def.color, label: '📦 Gnomazon FC-1 (associate)', kind: 'shop' }];
    },
  };
}
