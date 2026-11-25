// Fixed places in Capwood (E14, site `toadstool-forest`, x 100..400, z -1280..-1080), shared by the forest
// (capwood/forest.ts), the Capwood Run (raceTrack/defs/capwoodRun.ts keeps its road at least ROUTE_CLEARANCE from
// each) and the quests (quests/dirtRaces.ts: The Cap Count). World metres, x east, z south; yaw 0 faces +z.

/** Warden Chanterelle Stook's hut in a hollow toadstool stalk; `yaw` is the way her door faces. */
export const WARDEN_HUT = { x: 360, z: -1245, yaw: Math.PI } as const;

/** The Great Ring: a fairy ring of glowing toadstools round a clearing (radius r). Achievement gta-toadstool-trail. */
export const GREAT_RING = { x: 150, z: -1125, r: 14 } as const;

/** The six caps Chanterelle has not yet fined anyone for (The Cap Count): each has a ticket-flag stuck in it. */
export const CAP_COUNT_SPOTS: readonly { x: number; z: number; label: string }[] = [
  { x: 120, z: -1250, label: 'the Leaning Cap' },
  { x: 300, z: -1265, label: 'the Twin Stalks' },
  { x: 200, z: -1090, label: 'the Dewbowl Cap' },
  { x: 380, z: -1110, label: 'the Shelf Stump' },
  { x: 385, z: -1190, label: 'the Puffball Hollow' },
  { x: 130, z: -1180, label: "the Warden's Favourite" },
];

/** The Capwood Run's road keeps at least this far (m, centre line) from the hut, the ring and every cap-count spot. */
export const ROUTE_CLEARANCE = 25;
