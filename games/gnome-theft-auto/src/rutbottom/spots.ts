// Fixed places at the Rutbottom Dirt Bowl (E14, site `dirt-track`, x 1000..1400, z -780..-520), shared by the dressing
// (rutbottom/index.ts) and the quests (quests/dirtRaces.ts: givers). The track (raceTrack/defs/rutbottom.ts) runs its
// start/finish straight east along z ~ -543 (barriers at z -533 on the south side) and its west straight north along
// x ~ 1055 (barriers at x ~ 1045 on the west side). World metres, x east, z south; yaw 0 faces +z, PI faces north.

/** Marshal Clary Mudguard's starter's tower, on the south strip opposite the start line, facing the track (north). */
export const STARTER_TOWER = { x: 1124, z: -526, yaw: Math.PI } as const;

/** Where Clary stands to give her race (giver `rutbottom-clary`): at the foot of the tower, west side. */
export const CLARY_SPOT = { x: 1116, z: -525 } as const;

/** The pits and paddock: the west strip between the road gate and the west straight. */
export const PITS = { minX: 1004, maxX: 1036, minZ: -705, maxZ: -585 } as const;

/** Where Two-Ton Teasel waits by his bike in the pits (giver `rutbottom-teasel`). */
export const TEASEL_SPOT = { x: 1024, z: -630 } as const;

/** The gate from the east-band-north road (x = 950) into the pits. */
export const BOWL_GATE = { x: 1000, z: -650 } as const;

/** The gap in the west straight's outside (west, -n) barrier where the pits join the track, as lap distances. */
export const PIT_GAP = { from: 1095, to: 1125 } as const;

/** The grandstand strip along the south side of the start/finish straight. */
export const GRANDSTAND = { minX: 1160, maxX: 1270, minZ: -531, maxZ: -521 } as const;
