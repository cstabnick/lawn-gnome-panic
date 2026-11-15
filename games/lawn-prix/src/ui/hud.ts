// STUB (Epic 2 fills this in): race HUD (lap, place, time, speed, drift charge), countdown, results.
import type { VehicleId } from '../config';

export interface HudInfo {
  lap: number;        // current lap, 1..laps
  laps: number;
  place: number;      // 0 = 1st
  count: number;      // karts in the race
  time: number;       // race time, s
  speed: number;      // m/s
  charge01: number;   // drift charge 0..1 (1 = boost ready)
  boosting: boolean;
}

export interface ResultRow {
  place: number;      // 0 = 1st
  name: string;
  vehicle: VehicleId;
  color: number;
  time: number | null; // null = did not finish
  me: boolean;
}

export interface Hud {
  update(info: HudInfo): void;
  /** 3, 2, 1, 'GO', or null to hide. */
  countdown(v: number | 'GO' | null): void;
  /** Big centre text for a moment ('LAP 2', 'FINAL LAP', 'FINISH!'). */
  flash(text: string): void;
  /** Results table with a Race Again button (onAgain fires once) and a Garage button (onGarage). */
  showResults(rows: readonly ResultRow[], onAgain: () => void, onGarage: () => void): void;
  dispose(): void;
}

export function createHud(ui: HTMLElement): Hud {
  const box = document.createElement('div');
  box.id = 'lp-hud';
  ui.appendChild(box);
  return {
    update(i) { box.textContent = `Lap ${i.lap}/${i.laps}  ${i.place + 1}/${i.count}`; },
    countdown() {},
    flash() {},
    showResults(_rows, onAgain) { onAgain(); },
    dispose() { box.remove(); },
  };
}
