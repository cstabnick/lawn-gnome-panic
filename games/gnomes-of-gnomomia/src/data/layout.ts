// The open world's layout: where each zone's centre sits in world coordinates. Negative z is north.
// Zone files stay authored around (0, 0); content.ts moves every position in a zone (and everything placed in it)
// by its origin, so the game itself only ever sees world positions.
//
//   x:  -340      -160  -80  0  40    120    280
//        |  Verge (-20,-1020) z -1160..-880      |
//        | Rockery (-180,-760)       Hedgewood (160,-680)
//        | Cloverfield (-210,-490)  Keep (0,-440)
//        |                    Thatchford (0,-240)
//        |                    Mossbottom (0,0)
//
// Outdoor rects never overlap; gaps between them are the Wilds (a ridge you cannot cross except on a road).
// Indoor zones (instances) are parked at z = WORLD.instanceZ, far outside the view distance of the overworld.
import { WORLD, type ZoneId } from '../config';

export const ORIGINS: Record<ZoneId, { x: number; z: number }> = {
  mossbottom: { x: 0, z: 0 },
  thatchford: { x: 0, z: -240 },
  keep: { x: 0, z: -440 },
  cloverfield: { x: -210, z: -490 },
  hedgewood: { x: 160, z: -680 },
  rockery: { x: -180, z: -760 },
  verge: { x: -20, z: -1020 },
  deeps: { x: 0, z: WORLD.instanceZ },
};
