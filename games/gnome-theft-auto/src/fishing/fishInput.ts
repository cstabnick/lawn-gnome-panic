// Fishing input: the keyboard (KEYS.fish toggles, KEYS.fishBait cycles bait, Space holds, Esc stops) and the gamepad
// (B toggles, A or RT holds, LB cycles bait), plus the HUD's touch buttons feeding the same intents, and haptics (phone
// vibrate, gamepad rumble). Nothing here allocates per frame: the intent object and the buzz patterns are reused.

import { KEYS, isTyping } from '../keys';

export interface FishIntent {
  /** Toggle fishing on or off (edge). */
  toggle: boolean;
  /** The cast / hook / reel button is held. */
  hold: boolean;
  /** Next bait (edge). */
  bait: boolean;
  /** Stop fishing (edge: Esc). */
  close: boolean;
}

export type BuzzKind = 'bite' | 'burst' | 'land' | 'snap';

export interface FishInput {
  /** This frame's intents (edges are cleared by the read). Returns the same object every call (no allocation). */
  read(active: boolean): FishIntent;
  /** HUD hold button down/up (pointer events). */
  setHudHold(down: boolean): void;
  /** HUD buttons (taps). */
  hudToggle(): void;
  hudBait(): void;
  hudClose(): void;
  /** Haptics: navigator.vibrate on phones, the gamepad's rumble when it has one. Never throws. */
  buzz(kind: BuzzKind): void;
  dispose(): void;
}

/** Standard gamepad button indices. */
const PAD_A = 0;
const PAD_B = 1;
const PAD_LB = 4;
const PAD_RT = 7;
const RT_HOLD = 0.3;

/** Vibrate patterns (ms), built once. */
const BUZZ: Record<BuzzKind, number | number[]> = {
  bite: [60, 40, 60],
  burst: 30,
  land: [40, 30, 90],
  snap: 120,
};

function sumMs(p: number | number[]): number {
  if (typeof p === 'number') return p;
  let total = 0;
  for (let i = 0; i < p.length; i++) total += p[i];
  return total;
}

const BUZZ_MS: Record<BuzzKind, number> = {
  bite: sumMs(BUZZ.bite),
  burst: sumMs(BUZZ.burst),
  land: sumMs(BUZZ.land),
  snap: sumMs(BUZZ.snap),
};

/** The subset of the Gamepad haptics API we use (typed loosely: not every lib.dom has it). */
interface RumbleActuator {
  playEffect?: (
    type: string,
    params: { duration: number; strongMagnitude: number; weakMagnitude: number },
  ) => unknown;
}

/** The first connected gamepad (standard mapping), or null. Same approach as birding/scope.ts. */
function firstPad(): Gamepad | null {
  if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return null;
  const pads = navigator.getGamepads();
  for (let i = 0; i < pads.length; i++) {
    const p = pads[i];
    if (p && p.connected) return p;
  }
  return null;
}

export function createFishInput(): FishInput {
  const intent: FishIntent = { toggle: false, hold: false, bait: false, close: false };

  // Edges waiting for the next read.
  let toggleEdge = false;
  let baitEdge = false;
  let closeEdge = false;

  // Held inputs.
  let kbHold = false;
  let hudHold = false;
  let padHold = false;

  // Gamepad edge state.
  let padPrevB = false;
  let padPrevLB = false;

  let active = false;

  const hasWindow = typeof window !== 'undefined' && typeof window.addEventListener === 'function';

  const onKeyDown = (e: KeyboardEvent): void => {
    if (isTyping(e)) return;
    if (e.code === KEYS.jump) {
      if (active) e.preventDefault();
      kbHold = true;
      return;
    }
    if (e.code === KEYS.fish) {
      if (!e.repeat) toggleEdge = true;
      return;
    }
    if (e.code === KEYS.fishBait) {
      if (!e.repeat) baitEdge = true;
      return;
    }
    if (e.code === KEYS.close) closeEdge = true;
  };

  const onKeyUp = (e: KeyboardEvent): void => {
    if (e.code === KEYS.jump) kbHold = false;
  };

  const onBlur = (): void => {
    kbHold = false;
    hudHold = false;
  };

  if (hasWindow) {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
  }

  /** Reads the pad: B and LB are edges (always, so a toggle works while the rod is away), A or RT is a held state. */
  const pollPad = (): void => {
    const pad = firstPad();
    if (!pad) {
      padPrevB = false;
      padPrevLB = false;
      padHold = false;
      return;
    }
    const b = pad.buttons;
    const bNow = !!b[PAD_B]?.pressed;
    const lbNow = !!b[PAD_LB]?.pressed;
    if (bNow && !padPrevB) toggleEdge = true;
    if (lbNow && !padPrevLB) baitEdge = true;
    padPrevB = bNow;
    padPrevLB = lbNow;
    padHold = !!b[PAD_A]?.pressed || (b[PAD_RT]?.value ?? 0) > RT_HOLD;
  };

  return {
    read(act: boolean): FishIntent {
      active = act;
      pollPad();
      intent.toggle = toggleEdge;
      intent.bait = baitEdge;
      intent.close = closeEdge;
      toggleEdge = false;
      baitEdge = false;
      closeEdge = false;
      if (!act) {
        kbHold = false;
        hudHold = false;
      }
      intent.hold = act && (kbHold || padHold || hudHold);
      return intent;
    },

    setHudHold(down: boolean): void {
      hudHold = down;
    },

    hudToggle(): void {
      toggleEdge = true;
    },

    hudBait(): void {
      baitEdge = true;
    },

    hudClose(): void {
      closeEdge = true;
    },

    buzz(kind: BuzzKind): void {
      try {
        if (typeof navigator !== 'undefined') navigator.vibrate?.(BUZZ[kind]);
      } catch {
        /* no vibration on this device */
      }
      try {
        const pad = firstPad();
        const actuator = (pad as unknown as { vibrationActuator?: RumbleActuator } | null)?.vibrationActuator;
        const result = actuator?.playEffect?.('dual-rumble', {
          duration: BUZZ_MS[kind],
          strongMagnitude: kind === 'snap' ? 0.9 : 0.5,
          weakMagnitude: 0.6,
        });
        if (result && typeof (result as Promise<unknown>).catch === 'function') {
          (result as Promise<unknown>).catch(() => {});
        }
      } catch {
        /* the pad has no rumble */
      }
    },

    dispose(): void {
      if (hasWindow) {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('blur', onBlur);
      }
      kbHold = false;
      hudHold = false;
      padHold = false;
    },
  };
}
