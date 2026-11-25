// E25 firefighter: the hose controls while the player mans the hose: an aim pad, a Spray hold button, a Ladder hold
// button (rescue calls), the tank gauge and "Back to the cab". Keys and pad too. STUB: issue 13 fills it in.

export interface HoseInput {
  /** Aim rates -1..1 (x: turn right +, y: raise +). */
  aimX: number;
  aimY: number;
  spray: boolean;
  /** Raise-ladder button held. */
  ladder: boolean;
  /** "Back to the cab" was pressed (edge; read() clears it). */
  leave: boolean;
}

export interface HoseUi {
  /** This frame's input. */
  read(): HoseInput;
  /** Tank gauge 0..1; refilling shows a "Refilling" label. */
  setTank(frac: number, refilling: boolean): void;
  /** Ladder gauge: extension 0..1 and the target band, or null to hide the Ladder button and gauge. */
  setLadder(ext: number | null, band: [number, number] | null): void;
  /** One line at the top ("2 fires left", "Out of water: find a hydrant"). */
  setHint(text: string): void;
  isOpen(): boolean;
  close(): void;
}

export function openHoseUi(ui: HTMLElement): HoseUi {
  void ui;
  let open = true;
  return {
    read: () => ({ aimX: 0, aimY: 0, spray: false, ladder: false, leave: false }),
    setTank() {},
    setLadder() {},
    setHint() {},
    isOpen: () => open,
    close() { open = false; },
  };
}
