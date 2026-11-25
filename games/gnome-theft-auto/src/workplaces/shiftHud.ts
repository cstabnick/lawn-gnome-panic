// E25: the driving-shift HUD shared by the bin round and the fire brigade: a top panel (icon, title, up to 3 lines, a
// meter bar) and one 44 px action button (also the I key, keys.ts KEYS.jobAction, and the pad's right-stick press).
// Plan: docs/roadmaps/gta-batch-3/E25/roadmap.md. STUB: issue 18 fills it in.

export interface ShiftHudView {
  icon: string;
  /** "Bin round: 4 of 9 bins", "Shed fire: Juniper Vance's terrace". */
  title: string;
  /** Up to 3 short lines ("Next bin: 120 m", "Tank 64%"). */
  lines: string[];
  /** Meter caption ("Tank", "Load") and fill 0..1, or null for no meter. */
  meter: { label: string; frac: number } | null;
  /** The action button's label ("Lift bin", "Man the hose", "Tip the load"), or null to hide it. */
  action: string | null;
  /** Accent colour (the panel's left border), e.g. WORK_JOBS.garbage.color. */
  color: string;
}

export interface ShiftHud {
  /** Every frame while the shift runs (null hides the widget). Only touches the DOM when something changed. */
  set(v: ShiftHudView | null): void;
  /** The action button, I key or pad R3 was pressed (once per press, only while the button shows). Returns an unsubscribe. */
  onAction(cb: () => void): () => void;
  dispose(): void;
}

export function createShiftHud(ui: HTMLElement): ShiftHud {
  void ui;
  return { set() {}, onAction: () => () => {}, dispose() {} };
}
