// Sector map generation. Pure, no Phaser.
import { EVENTS } from './events';
import type { Beacon, BeaconKind, SectorMap } from './types';

export const SECTOR_COLUMNS = 7; // column 0 = start, column 6 = exit

const COLUMN_STEP = 1100 / (SECTOR_COLUMNS - 1);
const KIND_WEIGHTS: [BeaconKind, number][] = [
  ['fight', 45],
  ['event', 30],
  ['shop', 15],
  ['empty', 10],
];

function jitter(rng: () => number, amplitude: number): number {
  return (rng() * 2 - 1) * amplitude;
}

function pickKind(rng: () => number): BeaconKind {
  let roll = rng() * 100;
  for (const [kind, weight] of KIND_WEIGHTS) {
    if (roll < weight) return kind;
    roll -= weight;
  }
  return 'empty';
}

/** Build a sector: start beacon (id 0) at column 0, exit at the last column. */
export function generateSector(rng: () => number = Math.random): SectorMap {
  const beacons: Beacon[] = [];
  const add = (column: number, x: number, y: number, kind: BeaconKind, visited = false): Beacon => {
    const beacon: Beacon = { id: beacons.length, column, x, y, kind, links: [], visited };
    beacons.push(beacon);
    return beacon;
  };

  // Column 0: start.
  add(0, 90, 360, 'start', true);

  // Columns 1..5: 2 or 3 beacons each.
  for (let column = 1; column <= SECTOR_COLUMNS - 2; column++) {
    const n = rng() < 0.5 ? 2 : 3;
    for (let k = 0; k < n; k++) {
      const x = 90 + column * COLUMN_STEP + jitter(rng, 20);
      const y = 150 + ((k + 0.5) * 440) / n + jitter(rng, 30);
      add(column, x, y, pickKind(rng));
    }
  }

  // Column 6: exit.
  const exit = add(SECTOR_COLUMNS - 1, 1190, 360, 'exit');

  // Guarantee a shop in the middle columns.
  const hasMidShop = beacons.some((b) => b.column >= 2 && b.column <= 4 && b.kind === 'shop');
  if (!hasMidShop) {
    const column3 = beacons.filter((b) => b.column === 3);
    column3[Math.floor(rng() * column3.length)].kind = 'shop';
  }

  // Event beacons pick a random event (after kinds are final).
  for (const b of beacons) {
    if (b.kind === 'event') {
      b.eventId = EVENTS[Math.floor(rng() * EVENTS.length)].id;
    }
  }

  // Links.
  const byColumn = (c: number): Beacon[] => beacons.filter((b) => b.column === c);
  const link = (from: Beacon, to: Beacon): void => {
    if (!from.links.includes(to.id)) from.links.push(to.id);
  };
  // Candidates sorted by vertical distance from `from` (stable: ties keep list order).
  const byY = (from: Beacon, pool: Beacon[]): Beacon[] =>
    pool.slice().sort((a, b) => Math.abs(a.y - from.y) - Math.abs(b.y - from.y));

  const start = beacons[0];
  for (const b of byColumn(1)) link(start, b);

  for (let c = 1; c <= SECTOR_COLUMNS - 3; c++) {
    const next = byColumn(c + 1);
    for (const b of byColumn(c)) {
      const ranked = byY(b, next);
      link(b, ranked[0]);
      if (ranked.length > 1 && rng() < 0.5) link(b, ranked[1]);
    }
  }

  const hasIncoming = (b: Beacon): boolean => beacons.some((p) => p.links.includes(b.id));
  for (let c = 2; c <= SECTOR_COLUMNS - 2; c++) {
    for (const b of byColumn(c)) {
      if (!hasIncoming(b)) link(byY(b, byColumn(c - 1))[0], b);
    }
  }

  for (const b of byColumn(SECTOR_COLUMNS - 2)) link(b, exit);

  return { beacons, exitId: exit.id };
}
