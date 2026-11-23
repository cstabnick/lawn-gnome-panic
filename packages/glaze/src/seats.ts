// Seat covers: how high each cover's sitting surface is above the cover's own origin, in prefab units. Read from the parts of
// the glaze-seat-<id> prefabs (@lawn/prefabs, gta-glaze-seats.ts). The surface is the top of the seat pad a rider rests on:
// parts in the centre footprint only (|x| <= 0.2, |z| <= 0.2), never the backrest, and never decorations on top of the pad
// (bobbles, spots, horns, studs, the bucket's bolsters, the throne's arms). A raised part that is itself the seat (the bean
// bag's bag, the springer's pan, the barrel's lid) counts as the surface.
import type { SeatId } from './types';

export const SEAT_CUSHION: Readonly<Record<SeatId, number>> = {
  // Quilted patches on the cushion (box top 0.07 + patch 0.01).
  bench: 0.08,
  // Black bucket pad (box top 0.08). The red piping sits on the side bolsters, outside the footprint.
  bucket: 0.08,
  // Leather pad (box top 0.08). The pommel is a horn at the front and the spots are flush with the pad.
  saddle: 0.08,
  // The bag: ellipsoid centre 0.105 + radius 0.3 * 0.35. The backrest hump at z -0.15 is excluded.
  beanbag: 0.21,
  // Velvet cushion (box top 0.10). The arms and gold studs are at |x| 0.25, outside the footprint; the back is excluded.
  throne: 0.10,
  // The iron pan: cylinder centre 0.14 + height 0.04 / 2.
  springer: 0.16,
  // The woolly dome: ellipsoid centre 0.143 + radius 0.26 * 0.55. The bobble is a decoration.
  cosy: 0.29,
  // The cap: ellipsoid centre 0.27 + radius 0.25 * 0.35. The white spots are decorations.
  toadstool: 0.36,
  // The red lid: cylinder centre 0.33 + height 0.06 / 2.
  barrel: 0.36,
  // The gold rim: cup top 0.20 + the rim tube 0.012. The blue bands are below it.
  teacup: 0.21,
  // The twine band on the bale: box top 0.20 + the band's 0.02 (the bale itself tops out at 0.20).
  hay: 0.22,
};
