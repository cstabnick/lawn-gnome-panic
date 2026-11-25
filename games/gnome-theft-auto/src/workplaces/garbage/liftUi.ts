// E25 garbage: the lift-arm minigame's on-screen controls (one big hold button, a side-view gauge of the swing and the
// tip zone). Owns a LiftState and steps it (lift.ts). STUB: issue 06 fills it in.
import { createLift, liftResult, stepLift } from './lift';
import type { LiftEvent, LiftResult, LiftState } from './types';

export interface LiftUiOpts {
  heavy: boolean;
  /** Every event as it happens (sounds, toasts). */
  onEvent(e: LiftEvent): void;
  /** The bin is set down: the result. The UI has closed itself. */
  onDone(r: LiftResult): void;
  /** The player left without finishing (the "Leave it" button / Escape). The UI has closed itself. */
  onCancel(): void;
}

export interface LiftUi {
  /** Every frame while open: reads the button and steps the lift. */
  update(dt: number): void;
  /** The live state (bins.ts poses the arm and bin from it). */
  state(): LiftState;
  isOpen(): boolean;
  /** Close at once (no callbacks). */
  close(): void;
}

export function openLiftUi(ui: HTMLElement, opts: LiftUiOpts): LiftUi {
  void ui;
  const s = createLift(opts.heavy);
  let open = true;
  return {
    update(dt) {
      if (!open) return;
      const e = stepLift(s, dt, { press: false, hold: false });
      if (e) opts.onEvent(e);
      if (s.phase === 'done') {
        open = false;
        opts.onDone(liftResult(s));
      }
    },
    state: () => s,
    isOpen: () => open,
    close() { open = false; },
  };
}
