// Which pad a game should read. Browsers hide some pads (see steam.ts) and a game that only accepts
// mapping === 'standard' silently ignores every other one, so selection lives here once.
import { steamPad } from './steam';

/** The slice of the Gamepad API the games read. A real `Gamepad` is assignable to it. */
export interface PadLike {
  readonly id: string;
  /** 'standard' = the W3C layout (A=0 B=1 X=2 Y=3 LB=4 RB=5 LT=6 RT=7 ... d-pad 12-15, axes 0-3 = sticks). */
  readonly mapping: string;
  readonly connected: boolean;
  readonly timestamp: number;
  readonly axes: readonly number[];
  readonly buttons: readonly { readonly pressed: boolean; readonly value: number }[];
}

/**
 * Every usable pad, best first: standard mapping before any other, and within each group the most recently
 * updated first (so a phantom pad that never moves does not beat the one in the player's hands).
 * A non-standard pad is best effort: games keep reading axes 0-3 and buttons 0-3 from it.
 * The Steam Controller read over WebHID is included, already in the standard layout.
 */
export function getPads(): PadLike[] {
  const found: PadLike[] = [];
  if (typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function') {
    for (const p of navigator.getGamepads()) if (p && p.connected) found.push(p);
  }
  const steam = steamPad();
  if (steam) found.push(steam);
  return rankPads(found);
}

export function rankPads(pads: readonly PadLike[]): PadLike[] {
  const std = (p: PadLike): number => (p.mapping === 'standard' ? 0 : 1);
  return pads.filter((p) => p.connected).sort((a, b) => std(a) - std(b) || b.timestamp - a.timestamp);
}

/** The pad to read this frame, or null with none. */
export function firstPad(): PadLike | null {
  return getPads()[0] ?? null;
}
