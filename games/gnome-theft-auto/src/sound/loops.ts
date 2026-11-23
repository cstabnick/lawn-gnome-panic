// A fixed pool of positional looping voices (other vehicles' engines, sirens, boat motors, propellers, swarms).
// (Stub: filled in by Epic 2.)

export type LoopKind =
  | 'engine' | 'engine-heavy' | 'boat-motor' | 'propeller'
  | 'siren-police' | 'siren-hoa' | 'siren-ambulance' | 'bees';

export interface LoopSource {
  /** Stable id of the thing making the sound (e.g. `v${vehicle.id}` or `siren${vehicle.id}`). */
  key: string;
  kind: LoopKind;
  x: number;
  z: number;
  /** 0..1 intensity: engine speed01, siren 1, swarm size. */
  level: number;
  /** Audible range in metres (default 70; sirens 160, propeller 220). */
  maxDist?: number;
}

export interface LoopPool {
  /** Every frame: the wanted sources. The nearest audible ones get voices; the rest fade out. */
  update(sources: readonly LoopSource[]): void;
  /** How many voices are audible now. */
  active(): number;
}

export function createLoopPool(size: number): LoopPool {
  void size;
  return { update() {}, active: () => 0 };
}
