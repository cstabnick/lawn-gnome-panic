// What a walker in town is not meant to reach. src/townPaths.test.ts flood-fills every town from its centre and checks
// that everything it cannot reach is listed here, and that nothing listed here is reachable after all (a stale entry
// fails too). Keep both lists short: an entry is only for something a building, fence, wall or water is meant to keep
// out. Anything else that is cut off is a gap to fix in the zone's level data.
//
// Most road entries come from how roads are drawn: outside an authored zone, terrainCore draws a straight road from the
// shrine to every region, exit and doormat, so a road can run under a building that stands between the shrine and the
// place it leads to. The walker goes round the building; only the stretch under its walls is out of reach.

export interface TownBlock { town: string; waypoint: string; reason: string }

/** Waypoints (townWaypoints ids) a walker can't reach on purpose: a building, fence, wall or water is meant to be in the way. */
export const TOWN_BLOCKS: readonly TownBlock[] = [
  {
    town: 'sodbury',
    waypoint: 'path:road-granary-crows-perch:0',
    reason: 'The road to Crow\'s Perch starts in the middle of the Granary, a building you enter by its door.',
  },
];

/** Road samples inside a town that are allowed to be blocked, as { town, x, z, r, reason } circles (world coords). */
export interface TownRoadBlock { town: string; x: number; z: number; r: number; reason: string }

export const TOWN_ROAD_BLOCKS: readonly TownRoadBlock[] = [
  { town: 'mossbottom', x: 0, z: -18, r: 3.9, reason: 'Elder Fernwick\'s House stands on the edge of the straight roads from the well to Grubthorn\'s Burrow and Thatchford, so walkers pass beside it.' },

  { town: 'thatchford', x: 4, z: -210, r: 9, reason: 'The road south to Mossbottom is drawn straight through a pool of the Hose, which walkers go round.' },
  { town: 'thatchford', x: -2, z: -265, r: 9, reason: 'The roads north to the Keep and to a cottage by the mill are drawn through a pool of the Hose, which walkers go round.' },
  { town: 'thatchford', x: -10, z: -226, r: 4.8, reason: 'The Tipsy Toadstool stands between the fountain and the cottage behind it, so the road to that cottage runs under the inn.' },
  { town: 'thatchford', x: -4, z: -224, r: 3, reason: 'The Wickerwell cottage stands across the straight road from the fountain to the cottage behind it.' },
  { town: 'thatchford', x: 10, z: -257, r: 4.8, reason: 'The Guildhall stands between the fountain and the cottage behind it, so the road to that cottage runs under the hall.' },

  { town: 'pedestal-ward', x: -4.7, z: -432.4, r: 3, reason: 'The Trowelby cottage in the ring round the square stands across the roads to the Archive.' },
  { town: 'pedestal-ward', x: 0, z: -403, r: 3.4, reason: 'The Cobbleton hall in the ring round the square stands across the road south to Thatchford.' },

  { town: 'sodbury', x: -200, z: -506, r: 4.8, reason: 'The Granary is a building: the road from the pump ends at its middle and the road to Crow\'s Perch starts there.' },
  { town: 'sodbury', x: -222.7, z: -499.7, r: 3.2, reason: 'The Pegsworth cottage in the ring round the pump stands across the roads to Honeydew Ranch and the farms beyond, and its door faces away from the pump.' },
  { town: 'sodbury', x: -229.9, z: -478.5, r: 3.2, reason: 'The Rakeford cottage stands across the road from the pump to Pettigrew Ranch.' },
  { town: 'sodbury', x: -197.3, z: -480.3, r: 3.2, reason: 'The Bootlace cottage\'s door faces away from the pump, so the road to it is drawn through the cottage.' },
  { town: 'sodbury', x: -217.3, z: -504.2, r: 3.2, reason: 'The Sodsmith cottage\'s door faces away from the pump, so the road to it is drawn through the cottage.' },

  { town: 'clippings', x: 208.2, z: -651.3, r: 3.5, reason: 'The Bootlace workshop in the ring round the sawpit stands across the roads south-east to Barkhollow.' },
  { town: 'clippings', x: 186.7, z: -635.7, r: 3.5, reason: 'The Clodhurst workshop in the ring round the sawpit stands across the road west to the Keep.' },

  { town: 'flintdelve', x: -165.6, z: -733.1, r: 3.2, reason: 'The Spadeley hall in the ring round the forge stands across the road to Mudtooth Deeps.' },
  { town: 'flintdelve', x: -194.4, z: -733.1, r: 3.2, reason: 'The Thimblewood hall in the ring round the forge stands across the road to the Raft Dock.' },

  { town: 'last-tuft', x: -20, z: -954, r: 3, reason: 'The Quartermaster\'s Tent in the ring round the banner stands across the road south to the Battlefield, the Fence Line and the Shed.' },
  { town: 'last-tuft', x: -10.1, z: -930.1, r: 3, reason: 'The Seedpot tent in the ring round the banner stands across the road to Hedgewood, and its door faces away from the banner.' },
  { town: 'last-tuft', x: -29.9, z: -949.9, r: 3, reason: 'The Even Cut Chapel\'s door faces away from the banner, so the road to it is drawn through the chapel tent.' },
  { town: 'last-tuft', x: -10.1, z: -949.9, r: 3, reason: 'The Hoeland tent in the ring round the banner stands across the road to the stone houses at the Level.' },
];
