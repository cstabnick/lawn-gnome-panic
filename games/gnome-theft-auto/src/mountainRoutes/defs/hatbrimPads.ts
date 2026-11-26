// E33: the pads on the Hatbrim (the Top Hat café terrace and car park at Brim Gap, the lay-by by the High Tarn, the Hatband's
// World's Edge lookout, the Bobble's summit platform and Pate's Bothy terrace). Data only; pads.ts levels them.
// A pad is a level rectangle beside its route: hw across, hd along the yaw direction (yaw 0 = +z, south).
import type { PadDef } from '../types';

export const HATBRIM_PADS: readonly PadDef[] = [
  // The café, a few parked cars and the lookout, on the flat just south of the road at the gap, 28 x 18 m, the long side
  // along the road; the lookout at its south-west edge looks out over Mittenholt and the plain.
  { id: 'cafe-terrace', route: 'brim-gap-road', x: 699, z: -1559, yaw: 1.67, hw: 9, hd: 14, fade: 8, surface: 'asphalt' },
  // A paved lay-by on the east side of the road where it comes down beside the High Tarn.
  { id: 'tarn-layby', route: 'brim-gap-road', x: 895, z: -1625, yaw: -0.12, hw: 3.5, hd: 11, fade: 4, surface: 'asphalt' },
  // The Hatband's lookout niche on the north face, cut into the hill above the track, looking north over the fence.
  { id: 'worlds-edge', route: 'hatband', x: 704, z: -1766, yaw: 0, hw: 6, hd: 4, fade: 4, surface: 'gravel' },
  // The Bobble's top: room for the summit cairn and the Summit Register.
  { id: 'summit-platform', route: 'brim-walk', x: 690, z: -1690, yaw: 0, hw: 4, hd: 4, fade: 4, surface: 'rock' },
  // Pate's Bothy: a small stone hut on a level shelf beside the ridge path, about 8 x 7 m.
  { id: 'bothy-terrace', route: 'brim-walk', x: 702.9, z: -1607.7, yaw: 2.58, hw: 4, hd: 3.5, fade: 4, surface: 'dirt' },
];
