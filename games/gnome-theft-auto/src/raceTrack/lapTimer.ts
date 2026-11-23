// Free-roam lap timing at the Speedway: drive any ground vehicle over the start line and the lap clock runs; pass every
// checkpoint in order and cross the line again for a lap time. Best laps are saved per vehicle model and overall.
import type { Vehicle, VehicleKind } from '../types';
import { raceActive } from './state';
import { GateTracker, TRACK, locate } from './track';

export const LAP_SAVE_KEY = 'gta-speedway-laps-v1';

export interface LapInfo {
  /** The lap's time, seconds. */
  time: number;
  kind: VehicleKind;
  /** True when it beat this vehicle model's saved best. */
  personalBest: boolean;
  /** Best lap of any vehicle, seconds (after this lap). */
  overallBest: number;
}

export interface LapTimer {
  /** Per frame, with the vehicle the player drives (null on foot). Stands down while a race runs (state.ts raceActive()). */
  update(dt: number, v: Vehicle | null): void;
  /** Saved best lap for a vehicle model, or overall when no kind is given; null if none. */
  best(kind?: VehicleKind): number | null;
}

interface BestLap { time: number; splits: number[] }
interface LapSave { best: Partial<Record<VehicleKind, BestLap>> }

/** Farther than this from the centre line counts as off the track (m). */
const FAR = 60;
/** A car that stays that far off for this long (s) has its lap dropped quietly. */
const OFF_FOR = 20;
/** How far from the centre line the track is still searched for the car (m). */
const REACH = 80;
const SPLIT_FLASH = 2.5;
const LAP_FLASH = 4;

const CSS = `
#gta-lap-timer {
  position: fixed;
  top: calc(env(safe-area-inset-top) + 100px);
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font: 600 14px/1.2 ui-monospace, Consolas, monospace;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  z-index: 50;
}
#gta-lap-timer[data-tone="good"] { color: #7dff8a; }
#gta-lap-timer[data-tone="bad"] { color: #ff7b7b; }
@media (max-width: 700px) { #gta-lap-timer { top: calc(env(safe-area-inset-top) + 240px); } }
`;

let cssAdded = false;

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage ?? undefined;
  } catch {
    return undefined;
  }
}

function readSave(): LapSave {
  const best: LapSave['best'] = {};
  try {
    const raw = storage()?.getItem(LAP_SAVE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      const bestRaw = (parsed as { best?: unknown } | null)?.best;
      if (bestRaw && typeof bestRaw === 'object') {
        for (const [kind, entry] of Object.entries(bestRaw as Record<string, unknown>)) {
          const e = entry as { time?: unknown; splits?: unknown } | null;
          if (e && typeof e.time === 'number' && Array.isArray(e.splits)) {
            best[kind as VehicleKind] = {
              time: e.time,
              splits: e.splits.filter((n): n is number => typeof n === 'number'),
            };
          }
        }
      }
    }
  } catch {
    /* unreadable save: start fresh */
  }
  return { best };
}

function writeSave(save: LapSave): void {
  try {
    storage()?.setItem(LAP_SAVE_KEY, JSON.stringify(save));
  } catch {
    /* no storage: the bests still count for this session */
  }
}

/** m:ss.t */
function fmtClock(t: number): string {
  const tenths = Math.floor(t * 10);
  const m = Math.floor(tenths / 600);
  const rem = tenths % 600;
  return `${m}:${String(Math.floor(rem / 10)).padStart(2, '0')}.${rem % 10}`;
}

export function createLapTimer(ui: HTMLElement, onLap: (info: LapInfo) => void): LapTimer {
  const data = readSave();
  const tracker = new GateTracker();
  let vehicleId = -1;
  let hint = -1;
  let offFor = 0;
  let elapsed = 0;
  let split: number[] = [];
  let msg = '';
  let msgTone = '';
  let msgUntil = 0;

  if (!cssAdded) {
    const style = document.createElement('style');
    style.id = 'gta-lap-timer-css';
    style.textContent = CSS;
    (document.head ?? ui).appendChild(style);
    cssAdded = true;
  }
  const panel = document.createElement('div');
  panel.id = 'gta-lap-timer';
  panel.style.display = 'none';
  ui.appendChild(panel);

  const best = (kind?: VehicleKind): number | null => {
    if (kind) return data.best[kind]?.time ?? null;
    let lowest: number | null = null;
    for (const entry of Object.values(data.best)) {
      if (entry && (lowest === null || entry.time < lowest)) lowest = entry.time;
    }
    return lowest;
  };

  const hide = (): void => {
    panel.style.display = 'none';
  };

  const render = (): void => {
    if (tracker.next < 0) {
      hide();
      return;
    }
    const [text, tone] = elapsed < msgUntil ? [msg, msgTone] : [`LAP ${fmtClock(tracker.lapTime)}`, ''];
    panel.textContent = text;
    panel.setAttribute('data-tone', tone);
    panel.style.display = 'block';
  };

  /** Drop the lap in progress without a word. */
  const stand = (): void => {
    tracker.reset();
    split = [];
    hint = -1;
    offFor = 0;
    msgUntil = 0;
    hide();
  };

  return {
    update(dt, v) {
      elapsed += dt;
      if (!v || raceActive() || v.spec.flies || v.spec.boat) {
        stand();
        return;
      }
      if (v.id !== vehicleId) {
        stand();
        vehicleId = v.id;
      }
      const spot = locate(v.x, v.z, REACH, hint);
      hint = spot ? spot.i : -1;
      offFor = !spot || spot.dist > FAR ? offFor + dt : 0;
      if (offFor > OFF_FOR) {
        stand();
        return;
      }

      const ev = tracker.update(dt, v.x, v.z);
      if (ev === 'start') {
        split = [];
        msgUntil = 0;
      } else if (ev === 'gate') {
        split.push(tracker.lapTime);
        const ref = data.best[v.kind]?.splits[tracker.passed - 1];
        msg = `CP ${tracker.passed}/${TRACK.gates}  ${fmtClock(tracker.lapTime)}`;
        msgTone = ref === undefined ? '' : tracker.lapTime < ref ? 'good' : 'bad';
        msgUntil = elapsed + SPLIT_FLASH;
      } else if (ev === 'lap') {
        // Read the time before anything else: the tracker keeps it until its next update.
        const time = tracker.lapTime;
        // GateTracker does not zero lapTime after a lap; restart its clock now so the next lap counts from here.
        tracker.begin();
        const kind = v.kind;
        const prior = data.best[kind]?.time;
        const personalBest = prior === undefined || time < prior;
        if (personalBest) {
          data.best[kind] = { time, splits: split.slice() };
          writeSave(data);
        }
        split = [];
        const own = data.best[kind]?.time ?? time;
        const overall = best() ?? time;
        onLap({ time, kind, personalBest, overallBest: overall });
        msg = `LAP ${time.toFixed(2)}  (BEST ${own.toFixed(2)})`;
        msgTone = personalBest ? 'good' : '';
        msgUntil = elapsed + LAP_FLASH;
      }
      render();
    },
    best,
  };
}
