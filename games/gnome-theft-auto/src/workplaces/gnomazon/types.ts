// E25 Gnomazon job (Fulfilment Centre FC-1): shared contracts for orders.ts, packUi.ts, warehouse.ts and runtime.ts.
// Pure types and tuning. Plan: docs/roadmaps/gta-batch-3/E25/roadmap.md.

export type BoxSize = 'S' | 'M' | 'L';
export const BOX_SIZES: readonly BoxSize[] = ['S', 'M', 'L'];
/** Volume each box holds. The right box is the SMALLEST one whose capacity >= the order's total item size. */
export const BOX_CAP: Record<BoxSize, number> = { S: 3, M: 6, L: 10 };

export interface StockItem {
  id: string;
  name: string;
  /** A @lawn/prefabs id for the icon (prefabIconElement), with `emoji` as the fallback. */
  prefab: string;
  emoji: string;
  /** Volume units 1..5. */
  size: number;
}

export interface Order {
  id: number;
  /** StockItem ids, 1..3 of them (repeats allowed). */
  items: string[];
  /** The address the parcel goes to ("12 Fern Row, Turfton"). */
  dest: string;
  /** Three labels shown to pick from, in shown order: `dest` and two decoys. */
  labels: string[];
  /** The right-sized box. */
  box: BoxSize;
}

/** What the player did with one order. */
export interface PackedParcel {
  order: Order;
  /** StockItem ids put in the box, in pick order. */
  picked: string[];
  box: BoxSize;
  taped: boolean;
  label: string;
  /** Seconds from the order arriving to Send. */
  seconds: number;
}

export interface ParcelScore {
  stars: 1 | 2 | 3 | 4 | 5;
  rightItems: boolean;
  rightBox: boolean;
  rightLabel: boolean;
  taped: boolean;
  /** Kippy's one-line reaction. */
  line: string;
}

export interface ShiftResult {
  parcels: ParcelScore[];
  quota: number;
  /** The player clocked out early. */
  quit: boolean;
  /** The player stood idle >= GNOMAZON.idleS with the station open (Time Off Task). */
  idle: boolean;
}

/** Tuning (tweak here). */
export const GNOMAZON = {
  /** Shift length, seconds. */
  shiftS: 150,
  /** Quota: quotaBase + quotaPerLevel * (level - 1). */
  quotaBase: 7,
  quotaPerLevel: 1,
  /** A parcel sent within this many seconds counts as fast (stars). */
  fastS: 12,
  /** No input for this long while the station is open: Kippy notices (Time Off Task). */
  idleS: 20,
} as const;

/** The packing interior (defined by warehouse.ts). */
export const GNOMAZON_FLOOR_ID = 'gnomazon-floor';
/** Window event the packing station spot dispatches; gnomazon/runtime.ts listens. */
export const GNOMAZON_START_EVENT = 'gta:gnomazon-clock-in';

export interface PackSession {
  update(dt: number): void;
  isOpen(): boolean;
  /** Close at once (no onEnd). */
  close(): void;
}

export interface PackOpts {
  level: number;
  /** Level title ("Associate II"). */
  title: string;
  seed: number;
  quota: number;
  shiftS: number;
  /** Show one Kippy line (the runtime toasts and plays the chime). */
  kippy(line: string): void;
  /** A parcel was sent (sounds). */
  onParcel?(s: ParcelScore): void;
  /** The shift is over (time up or clocked out). The UI has closed itself. */
  onEnd(r: ShiftResult): void;
}
