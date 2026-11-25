// The board's combo score: Aether Board's combo (@lawn/trickboard createCombo) fed with the board's events. Pure: no three.js.
import { createCombo, type ComboView, type Combo, type PhysEvent } from '@lawn/trickboard';
import type { BoardState, SkateEvent } from './types';

export interface SkateScore {
  /** Passes the physics events to the combo; 'wall', 'push' and 'fullRail' are not scored. */
  event(ev: SkateEvent, b: BoardState): void;
  tick(dt: number, b: BoardState): void;
  view(): ComboView;
  /** A combo banked since the last call (points and how many trick lines it had), else null. */
  takeBanked(): { points: number; tricks: number } | null;
}

export function createSkateScore(): SkateScore {
  const combo: Combo = createCombo();
  let pending: { points: number; tricks: number } | null = null;

  /** Runs one combo call and notes a bank: a new 'landed' `last`. The lines count is taken before the call, since a bank
   *  clears them. */
  function run(fn: () => void): void {
    const before = combo.view();
    const prevLast = before.last;
    const tricks = before.lines.length;
    fn();
    const now = combo.view();
    if (now.last !== prevLast && now.last && now.last.kind === 'landed') {
      pending = { points: now.last.points, tricks };
    }
  }

  return {
    event(ev, b) {
      // 'wall', 'push' and 'fullRail' are GTA's own events, not trick events: the combo does not score them.
      if (ev.e === 'wall' || ev.e === 'push' || ev.e === 'fullRail') return;
      const phys: PhysEvent = ev;
      run(() => combo.event(phys, { t: b.t, mode: b.mode }));
    },
    tick(dt, b) {
      run(() => combo.tick(dt, { t: b.t, mode: b.mode }));
    },
    view() {
      return combo.view();
    },
    takeBanked() {
      const out = pending;
      pending = null;
      return out;
    },
  };
}
