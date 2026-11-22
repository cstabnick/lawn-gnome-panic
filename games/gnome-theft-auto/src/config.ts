// Gnome Theft Auto: every tuning number, layout constant and name list. Tweak here, not in gameplay code.
import type { GnomeLook } from '@lawn/gnome';
import type { BiomeId, GunKind, MountStyle, VehicleKind, VehicleSpec } from './types';
import { LAYOUT, REGIONS, REGION_BIOMES, biomeAtPoint, highways, marker, markerNum, regionOf } from './levels';
export type { BiomeId };

// The layout constants below are read from the level documents (src/data/levels), not typed in here.
const grid = REGIONS.turfton.data.grid!;

/** A point on the ground, in world coordinates. */
export interface GroundPoint { readonly x: number; readonly z: number }
/** A ground point with a heading (yaw, radians). */
export interface PlacedPoint extends GroundPoint { readonly yaw: number }
/** An axis-aligned rectangle on the ground. */
export interface GroundRect { readonly minX: number; readonly maxX: number; readonly minZ: number; readonly maxZ: number }
/** A landmark block: its centre and footprint size. */
export interface BlockFootprint extends GroundPoint { readonly footprint: number }

/** A rectangle centred on an area marker, sized by its data.w and data.d. */
function areaRect(id: string): GroundRect {
  const m = marker('area', id);
  const w = markerNum(m, 'w');
  const d = markerNum(m, 'd');
  return { minX: m.x - w / 2, maxX: m.x + w / 2, minZ: m.z - d / 2, maxZ: m.z + d / 2 };
}

export const GAME_ID = 'gnome-theft-auto';

// ---- World layout ------------------------------------------------------------------------------------------------
// Turfton (the city) is a grid in the middle. Six regions fill the rest of the 1800 x 1800 map (four wedges split
// along the diagonals, Loch Moss and Tallgrass Commons in the west corners; borders are polygons in the region
// documents), joined to the city by winding highways. Ground height comes from terrain.ts heightAt(x, z) (flat, y = 0,
// while TERRAIN.amplitude is 0); biomes differ by colour, props, roads and landmarks.
/** Playable area is x, z in [-WORLD_HALF, WORLD_HALF]. */
export const WORLD_HALF = LAYOUT.worldHalf;
/** Turfton is the square |x| <= CITY_HALF and |z| <= CITY_HALF. */
export const CITY_HALF = grid.half;
/** City road centre lines run along x = each value and along z = each value (a grid, 60 apart). */
export const ROAD_LINES: readonly number[] = grid.lines;
export const ROAD_WIDTH = 10;
/** Sidewalk strip on each side of a road, outside the road edge. */
export const SIDEWALK_WIDTH = 2.5;
export const LANE_OFFSET = 2.5;
/** Spacing between the grid roads. */
export const ROAD_PITCH = grid.pitch;

/**
 * city: the grid. desert (east): Fort Sandpit and the airfield. forest (west). tundra (north). farmland (south).
 * loch: Loch Moss (north-west corner). parkland: Tallgrass Commons (south-west corner).
 * Each region document holds its border polygon (data.border); biomeAt looks the point up (levels.ts regionAt).
 */
export const BIOMES: readonly BiomeId[] = REGION_BIOMES;
export const BIOME_NAMES: Record<BiomeId, string> = Object.fromEntries(
  REGION_BIOMES.map((b) => [b, regionOf(b).name]),
) as Record<BiomeId, string>;
/** Which biome (x, z) is in: the region whose border holds the point. */
export function biomeAt(x: number, z: number): BiomeId {
  return biomeAtPoint(x, z);
}
/** Ground colour of each biome (the city is grass between its blocks). */
export const BIOME_GROUND: Record<BiomeId, number> = Object.fromEntries(
  REGION_BIOMES.map((b) => [b, regionOf(b).data.ground]),
) as Record<BiomeId, number>;

/**
 * Highways: polylines of [x, z] points. Drivable road (ROAD_WIDTH wide). A road node sits at every vertex and at least
 * every 40 units along a leg; polylines that share an exact vertex share its node. A highway that starts at a city
 * grid crossing, e.g. [180, 0] or [0, -180], joins the grid there.
 */
export interface Highway { id: string; points: [number, number][] }
export const HIGHWAYS: readonly Highway[] = highways().map((h) => ({ id: h.id, points: h.points }));

/** Fort Sandpit sits in the desert. The gate is a gap in the north wall (z = maxZ), on the fort-gate highway. */
const fort = marker('site', 'fort-sandpit');
const fortW = markerNum(fort, 'w');
const fortD = markerNum(fort, 'd');
export const BASE: {
  readonly minX: number; readonly maxX: number; readonly minZ: number; readonly maxZ: number;
  readonly gateX: number; readonly gateZ: number; readonly gateWidth: number;
  readonly padX: number; readonly padZ: number;
  readonly wallHeight: number;
  readonly guardPosts: readonly GroundPoint[];
} = {
  minX: fort.x - fortW / 2, maxX: fort.x + fortW / 2, minZ: fort.z - fortD / 2, maxZ: fort.z + fortD / 2,
  gateX: fort.x + markerNum(fort, 'gate', 'dx'), gateZ: fort.z + fortD / 2, gateWidth: markerNum(fort, 'gate', 'width'),
  padX: fort.x + markerNum(fort, 'pad', 'dx'), padZ: fort.z + markerNum(fort, 'pad', 'dz'),
  wallHeight: markerNum(fort, 'wallHeight'),
  guardPosts: (fort.data!.guardPosts as { dx: number; dz: number }[]).map((g) => ({ x: fort.x + g.dx, z: fort.z + g.dz })),
};

/** The desert airfield: a runway along +x (plane yaw PI/2 faces +x) and an apron with the planes parked on it. */
const af = marker('site', 'airfield');
export const AIRFIELD: {
  readonly x: number; readonly z: number; readonly yaw: number; readonly length: number; readonly width: number;
  readonly planeSpots: readonly { readonly x: number; readonly z: number; readonly yaw: number; readonly kind: VehicleKind }[];
} = {
  x: af.x, z: af.z, yaw: markerNum(af, 'yaw'), length: markerNum(af, 'length'), width: markerNum(af, 'width'),
  planeSpots: (af.data!.planeSpots as { dx: number; dz: number; yaw: number; kind: string }[]).map((p) => ({
    x: af.x + p.dx, z: af.z + p.dz, yaw: p.yaw, kind: p.kind as VehicleKind,
  })),
};

const spawn = marker('spawn', 'player');
export const SPAWN: PlacedPoint = { x: spawn.x, z: spawn.z, yaw: markerNum(spawn, 'yaw') };
/** The Mulch Club (quest giver) fills the block centred here, door facing +x (towards the road at x = 0). */
const mulch = marker('landmark', 'mulch-club');
export const MULCH_CLUB: BlockFootprint = { x: mulch.x, z: mulch.z, footprint: markerNum(mulch, 'footprint') };
/** The Glaze Clinic Hospital fills the block centred here (door facing -x, towards the road); the player wakes at `respawn`. */
const hospital = marker('landmark', 'hospital');
export const HOSPITAL: BlockFootprint & { readonly respawn: PlacedPoint } = {
  x: hospital.x, z: hospital.z, footprint: markerNum(hospital, 'footprint'),
  respawn: {
    x: hospital.x + markerNum(hospital, 'respawn', 'dx'), z: hospital.z + markerNum(hospital, 'respawn', 'dz'),
    yaw: markerNum(hospital, 'respawn', 'yaw'),
  },
};
/** Named story storefronts and Turfton district landmarks (block-centred, clear of ROAD_LINES and SPAWN). */
const bodega = marker('landmark', 'bodega');
export const BODEGA: BlockFootprint = { x: bodega.x, z: bodega.z, footprint: markerNum(bodega, 'footprint') };
const sideValve = marker('landmark', 'side-valve');
export const SIDE_VALVE: BlockFootprint & { readonly bay: GroundPoint } = {
  x: sideValve.x, z: sideValve.z, footprint: markerNum(sideValve, 'footprint'),
  bay: { x: sideValve.x + markerNum(sideValve, 'bay', 'dx'), z: sideValve.z + markerNum(sideValve, 'bay', 'dz') },
};
const payNGlaze = marker('landmark', 'pay-n-glaze');
export const PAY_N_GLAZE: BlockFootprint & { readonly bay: GroundPoint & { readonly radius: number } } = {
  x: payNGlaze.x, z: payNGlaze.z, footprint: markerNum(payNGlaze, 'footprint'),
  bay: {
    x: payNGlaze.x + markerNum(payNGlaze, 'bay', 'dx'), z: payNGlaze.z + markerNum(payNGlaze, 'bay', 'dz'),
    radius: markerNum(payNGlaze, 'bay', 'radius'),
  },
};
const gnomecino = marker('landmark', 'gnomecino');
export const GNOMECINO: BlockFootprint = { x: gnomecino.x, z: gnomecino.z, footprint: markerNum(gnomecino, 'footprint') };
const thorne = marker('landmark', 'thorne-tower');
export const THORNE_TOWER: BlockFootprint & { readonly height: number } = {
  x: thorne.x, z: thorne.z, footprint: markerNum(thorne, 'footprint'), height: markerNum(thorne, 'height'),
};
const clayMart = marker('landmark', 'clay-mart');
export const CLAY_MART: BlockFootprint = { x: clayMart.x, z: clayMart.z, footprint: markerNum(clayMart, 'footprint') };
const amphitheater = marker('landmark', 'amphitheater');
export const AMPHITHEATER: BlockFootprint = { x: amphitheater.x, z: amphitheater.z, footprint: markerNum(amphitheater, 'footprint') };
/** Rectangles scenery keeps out of, and the Turfton greenhouse strip: centred on their area markers. */
export const PATIO_HEIGHTS: GroundRect = areaRect('patio-heights');
export const GREENHOUSE_STRIP: GroundRect = areaRect('greenhouse-strip');
const gnomaTruck = marker('landmark', 'gnoma-truck');
export const GNOMA_TRUCK: PlacedPoint = { x: gnomaTruck.x, z: gnomaTruck.z, yaw: markerNum(gnomaTruck, 'yaw') };
const culvertDowntown = marker('portal', 'culvert-downtown');
const culvertCanal = marker('portal', 'culvert-canal');
export const CULVERT_PORTALS: { readonly downtown: GroundPoint; readonly canal: GroundPoint } = {
  downtown: { x: culvertDowntown.x, z: culvertDowntown.z },
  canal: { x: culvertCanal.x, z: culvertCanal.z },
};

/** Fog and camera range. Fog hides the far edge of the loaded world; flyers see further. */
export const VIEW = { fogNear: 150, fogFar: 420, cameraFar: 900 } as const;

/**
 * The ground's height (terrain.ts). `amplitude` multiplies the authored relief (region generators, document stamps):
 * 0 = flat everywhere, exactly as before Epic 2; 1 = as authored (shipped since Epic 5 added the region landforms,
 * src/landforms/). Roads, Turfton and the big flat sites are flattened after that, so the city never changes.
 * `?terrain=hill` turns on amplitude 1 plus the test hill for this visit; `?terrain=<number>` sets the amplitude.
 */
export const TERRAIN = {
  amplitude: 1,
  /** Height grid and ground mesh vertex spacing, m. */
  step: 2,
  /** Ground mesh chunk size, m (one mesh per chunk and ground kind; 128 m keeps the ground to about a quarter of the draw calls of 64 m). */
  chunk: 128,
  /** Chunks whose nearest edge is farther than this from the player are hidden (beyond the fog). */
  chunkViewDistance: 560,
  /** A road is flat across within half its width plus `roadShoulder`, then blends back to the land over `roadFade`. */
  roadShoulder: 2, roadFade: 14,
  /** Turfton is flat (height 0) out to CITY_HALF + cityMargin, then blends over cityFade. */
  cityMargin: 8, cityFade: 40,
  /** The fort, the airfield and every `reserve` marker: flat within siteMargin of their rectangle, blend over siteFade. */
  siteMargin: 6, siteFade: 30,
  /** The test hill (Dust Flats, on the east highway): one gauss stamp, only with ?terrain=hill or setTerrainOptions. */
  testHill: { x: 545, z: 30, sigma: 25, amount: 6 },
  // ---- Landforms (Epic 5, src/landforms/) ----
  /** The regional tilt: the garden falls from the house (north, -z) to the Puddle Sea (south): metres per metre of z,
   *  0 across Turfton's band (|z| <= tiltFlatHalf) so the city stays at 0. */
  tiltPerM: 0.004, tiltFlatHalf: 263,
  /** Region relief fades to 0 at every inner region border, over this many metres. */
  reliefBorderFade: 50,
  /** Region relief is 0 within riverClear of a river or canal bank (water path half width), back to full by + riverFade. */
  riverClear: 10, riverFade: 30,
  /** Trails (road paths with an id starting `trail/`): default width, flat across width/2 + 1, blended back over trailFade. */
  trailWidth: 4, trailFade: 6,
  /** Shared paint rule: ground at least this steep (rise over run) is rock; ground within mudReach of a river bank is mud. */
  rockSlope: 0.8, mudReach: 6,
} as const;

/** City buildings: downtown (within DOWNTOWN_RADIUS of the origin) gets towers, the rest bigger garden buildings. */
export const BUILDINGS = {
  downtownRadius: 130,
  towerMinHeight: 24, towerMaxHeight: 78,
  towerMinFootprint: 22, towerMaxFootprint: 36,
  /** Garden-object buildings outside downtown are drawn at this footprint range. */
  gardenMinFootprint: 16, gardenMaxFootprint: 30,
} as const;

// ---- Colours ---------------------------------------------------------------------------------------------------
export const COLORS = {
  sky: 0x8fd0f2,
  grass: 0x5fae4a,
  road: 0x55555b,
  roadLine: 0xf2e7a6,
  sidewalk: 0xc9bfa8,
  sand: 0xe5cf8e,
  baseWall: 0x8a7a55,
} as const;

// ---- Player on foot ---------------------------------------------------------------------------------------------
export const PLAYER = {
  walkSpeed: 6,
  jumpSpeed: 6.5,
  gravity: 20,
  radius: 0.4,
  /** How close (units, centre to centre) a vehicle must be to get in. */
  enterRange: 3.2,
} as const;

/** Getting in, out and yanking a driver out (mount.ts). Times are seconds. Nothing drives until the sequence has finished. */
export const MOUNT = {
  /** The gnome walks to its mount point at this speed, or faster when the vehicle is moving. */
  walkSpeed: 6,
  /** Extra speed over a moving vehicle's, so a gnome can catch up with it. */
  catchUp: 3,
  /** How far the gnome stands off the vehicle's edge when it reaches for the rim or a door. */
  standOff: 0.7,
  reachSeconds: 0.35,
  /** Opening or closing a door. */
  doorSeconds: 0.4,
  /** Yanking: the driver slides out of the seat to the ground. */
  pullSeconds: 0.7,
  /** The climb takes this much longer per unit of seat height (a combine's seat is high). */
  climbPerHeight: 0.08,
  /** Settling into the seat (or onto the ground, on the way out). */
  settleSeconds: 0.25,
  /** Door panels swing this far, radians. */
  doorAngle: 1.3,
} as const;

/** How a gnome climbs: how high it lifts over the rim or through a door, and how long the climb takes (before the seat height). */
export const MOUNT_STYLES: Record<MountStyle, { arc: number; seconds: number }> = {
  vault: { arc: 1.0, seconds: 0.55 },
  hop: { arc: 0.5, seconds: 0.4 },
  clamber: { arc: 1.7, seconds: 0.9 },
  door: { arc: 0.3, seconds: 0.5 },
};

/** Look used when the player never made a gnome in the creator. */
export const DEFAULT_LOOK: GnomeLook = {
  hat: 0xd93636, shirt: 0x2f8a4a, pants: 0x4b3a2a, skin: 0xf1c27d, boots: 0x222222, beard: 0xf4f4f4,
  hair: null, freckles: false, dress: false, glasses: false, bowlCut: null,
};

// ---- Vehicles ---------------------------------------------------------------------------------------------------
// Ground vehicle top speeds and pickup are 25% above the first tuning pass (it felt slow in Casual). One place: arcade, the physics model, traffic, HUD and engine sound all read these.
export const VEHICLES: Record<VehicleKind, VehicleSpec> = {
  'push-bike': {
    kind: 'push-bike', mountStyle: 'hop', name: 'Push-Mower Bike', prefab: 'push-mower-bike', scale: 1.6,
    maxSpeed: 20, accel: 17.5, turnRate: 2.8, radius: 0.9, seat: [0, 0.3, -0.6], flies: false, mass: 1,
    passengerSeats: [[0, 0.3, -1.25]],
  },
  'ride-on': {
    kind: 'ride-on', mountStyle: 'vault', name: 'Ride-On Mower', prefab: 'ride-on-mower', scale: 1.5,
    maxSpeed: 25, accel: 12.5, turnRate: 2.0, radius: 1.4, seat: [0, 0.42, -0.52], flies: false, mass: 2,
    passengerSeats: [[0.55, 0.42, -0.52]],
  },
  'zero-turn': {
    kind: 'zero-turn', mountStyle: 'vault', name: 'Zero-Turn Racer', prefab: 'zero-turn-mower', scale: 1.5,
    maxSpeed: 34, accel: 20, turnRate: 3.4, radius: 1.4, seat: [0, 0.45, -0.45], flies: false, mass: 2,
    passengerSeats: [[-0.55, 0.45, -0.45]],
  },
  'combine': {
    kind: 'combine', mountStyle: 'clamber', name: 'Combine Harvester', prefab: 'combine-harvester', scale: 3,
    maxSpeed: 15, accel: 6.25, turnRate: 1.1, radius: 3.2, seat: [0, 3.4, 0.45], flies: false, mass: 6,
    passengerSeats: [[-1.4, 3.4, 0.45], [1.4, 3.4, 0.45], [0, 3.4, -0.9]],
  },
  'plane': {
    kind: 'plane', mountStyle: 'hop', name: 'Crop Duster', prefab: 'crop-duster', scale: 3.75,
    maxSpeed: 55, accel: 14, turnRate: 1.0, radius: 3, seat: [0, 0.9, 0.2], flies: true, fixedWing: true,
    stallSpeed: 22, ceiling: 300, mass: 5,
    passengerSeats: [[0, 0.9, -0.9]],
  },
  'whirligig': {
    kind: 'whirligig', mountStyle: 'vault', name: 'The Whirligig', prefab: 'whirligig-mower', scale: 1.5,
    maxSpeed: 30, accel: 12, turnRate: 1.9, radius: 1.8, seat: [0, 0.45, -0.3], flies: true, mass: 3,
    passengerSeats: [[0, 0.45, -1.0]],
  },
  'lowrider': {
    kind: 'lowrider', mountStyle: 'hop', name: 'Ride-On Lowrider', prefab: 'ride-on-mower', scale: 1.55,
    maxSpeed: 26, accel: 14, turnRate: 2.3, radius: 1.4, seat: [0, 0.44, -0.52], flies: false, mass: 2.2,
    passengerSeats: [[-0.6, 0.44, -0.52], [0.6, 0.44, -1.1], [-0.6, 0.44, -1.1]],
  },
  'boot-float': {
    kind: 'boot-float', mountStyle: 'clamber', name: "Gnorwin's Boot Float", prefab: 'boot-parade-float', scale: 3.2,
    maxSpeed: 13, accel: 5.5, turnRate: 1.0, radius: 3.8, seat: [0, 1.48, 2.64], flies: false, mass: 10,
    passengerSeats: [[-1.6, 1.48, 2.64], [1.6, 1.48, 2.64], [0, 1.48, 0.9], [0, 1.48, 4.2]],
  },
  'snail-coach': {
    kind: 'snail-coach', mountStyle: 'door', openTop: false, doors: [
      { side: 'right', pivot: 'door-right', at: [-1.22, 1.0, 1.96] },
    ], name: 'Snail-Coach', prefab: 'snail-coach', scale: 2.0,
    maxSpeed: 22, accel: 9.5, turnRate: 1.6, radius: 2.5, seat: [0, 1.04, 1.5], flies: false, mass: 5,
    // No passenger seats yet: the coach is a closed box, so riders inside it cannot be seen.
  },
  'mulch-spreader': {
    kind: 'mulch-spreader', mountStyle: 'vault', name: 'Mulch-Spreader Mower', prefab: 'mulch-spreader-mower', scale: 1.6,
    maxSpeed: 23, accel: 12, turnRate: 2.0, radius: 1.6, seat: [0, 0.9, 0.08], flies: false, mass: 2.6,
    passengerSeats: [[0, 0.9, -0.6]],
  },
  'hoa-van': {
    kind: 'hoa-van', mountStyle: 'door', openTop: false, doors: [
      { side: 'left', pivot: 'door-left', at: [1.04, 0.99, 1.26] },
      { side: 'right', pivot: 'door-right', at: [-1.04, 0.99, 1.26] },
    ], name: 'HOA Code-Enforcement Van', prefab: 'hoa-van', scale: 1.8,
    maxSpeed: 27, accel: 13, turnRate: 1.9, radius: 2.1, seat: [0, 0.94, 0.63], flies: false, mass: 4.5,
    // No passenger seats yet: the van is an enclosed cab, so riders inside it cannot be seen.
  },
  // ---- Boats (Epic 4: boats.ts; prefabs in packages/prefabs/src/catalog/gta-boats.ts, modelled life-size, nose +z) ----
  'walnut-dinghy': {
    kind: 'walnut-dinghy', mountStyle: 'hop', name: 'Walnut Dinghy', prefab: 'walnut-dinghy', scale: 1,
    maxSpeed: 9, accel: 4, turnRate: 1.5, radius: 1.3, seat: [0, 0.3, -0.35], flies: false, mass: 1.5,
    passengerSeats: [[0, 0.3, 0.55]], boat: true, draft: 0.15,
  },
  'gravy-boat': {
    kind: 'gravy-boat', mountStyle: 'hop', name: 'Gravy Boat', prefab: 'gravy-boat', scale: 1,
    maxSpeed: 30, accel: 10, turnRate: 1.8, radius: 1.7, seat: [0, 0.35, -0.5], flies: false, mass: 2,
    passengerSeats: [[0, 0.35, -1.2]], boat: true, draft: 0.12,
  },
  'clog-cruiser': {
    kind: 'clog-cruiser', mountStyle: 'clamber', name: 'Clog Cruiser', prefab: 'clog-cruiser', scale: 1,
    maxSpeed: 18, accel: 6, turnRate: 1.2, radius: 2.4, seat: [0, 0.55, -1.4], flies: false, mass: 4,
    passengerSeats: [[-0.6, 0.55, 0.1], [0.6, 0.55, 0.1], [0, 0.55, 1.0]], boat: true, draft: 0.35,
  },
  'watering-can-steamer': {
    kind: 'watering-can-steamer', mountStyle: 'clamber', name: 'Watering-Can Steamer', prefab: 'watering-can-steamer', scale: 1,
    maxSpeed: 10, accel: 2.5, turnRate: 0.6, radius: 3.8, seat: [0, 0.9, -2.6], flies: false, mass: 9,
    passengerSeats: [[-1.1, 0.9, 0.6], [1.1, 0.9, 0.6], [-1.1, 0.9, 2], [1.1, 0.9, 2]], boat: true, draft: 0.5,
  },
  'hoa-patrol-boat': {
    kind: 'hoa-patrol-boat', mountStyle: 'hop', name: 'HOA Patrol Boat', prefab: 'hoa-patrol-boat', scale: 1,
    maxSpeed: 28, accel: 11, turnRate: 1.9, radius: 1.9, seat: [0, 0.45, -0.6], flies: false, mass: 3,
    passengerSeats: [[0, 0.45, -1.4]], boat: true, draft: 0.25,
  },
  // ---- Tessie (Epic 7): the prefab is 3 long (z -1.5..1.5, head at +z), 2.2 wide, shell top at y 1.0; scale 3 = 9 m. ----
  tessie: {
    kind: 'tessie', mountStyle: 'clamber', name: 'Tessie', prefab: 'tessie', scale: 3,
    maxSpeed: 12, accel: 4, turnRate: 0.9, radius: 4.2, seat: [0, 3.0, -0.6], flies: false, mass: 12,
    passengerSeats: [[-0.9, 2.9, -1.6], [0.9, 2.9, -1.6]], boat: true, draft: 1.2,
  },
};

/**
 * The Tessie side quest (Wild World Epic 7). World coordinates, metres. Loch Moss: centre (-700, -680), half axes
 * 150 x 120, level about -0.65, 5 m deep in the middle. Tessie's island (document feature tessie-island) is dry within
 * about 22 m of its centre, with a shallow shelf to about 28 m. The dock is at (-715, -564) on the south shore.
 */
export const TESSIE = {
  questId: 'sq-tessie',
  giver: 'loch-driftwood',
  /** The pseudo-quest entry in gta-quests-v1 that holds the rolled trigger beat; state 'done' = unlocked. */
  unlockKey: 'tessie-unlock',
  /** `?tessie=now` unlocks the quest at once (dev switch). */
  devParam: 'tessie',
  /** Achievements (packages/achievements catalog.ts). */
  achievements: { rumour: 'gta-tessie-rumour', finish: 'gta-tessie-finish', tabloid: 'gta-tessie-tabloid', secret: 'gta-tessie-secret' },
  /**
   * Turfton FM EVENT_BULLETINS ids: the unlock's breaking news is keyed by its achievement (app.ts reports every
   * achievement id), Tessie surfacing after the quest has its own; the quest's completion news is keyed by questId.
   */
  bulletins: { rumour: 'gta-tessie-rumour', surfaced: 'tessie-surfaced' },
  loch: { x: -700, z: -680 },
  island: { x: -760, z: -720, r: 22 },
  /** On the island's east slope, dry ground: where the egg clutch ends up. */
  nest: { x: -746, z: -713 },
  dock: { x: -715, z: -564 },
  // Step 1: sightings by boat (the sky goes to golden hour while it runs).
  sightings: [[-640, -700], [-700, -760], [-790, -640]] as [number, number][],
  sightingRadius: 12,
  // Step 2: sonar buoys, dropped by boat, unseen by the HOA patrol boat.
  buoys: [[-650, -640], [-760, -650], [-740, -770], [-640, -740]] as [number, number][],
  buoyRadius: 8,
  /** The patrol boat's loop: loopRoute('water/loch-moss', patrolScale, patrolPoints). */
  patrolScale: 0.55, patrolPoints: 8, patrolThrottle: 0.55,
  /** The patrol sees a player in a boat within this range: every buoy dropped so far is fished out. */
  spotRadius: 24,
  // Step 3: escort the egg clutch past the HOA dredger.
  escortRoute: [[-690, -600], [-700, -650], [-725, -688], [-736, -706]] as [number, number][],
  /** Clutch raft speed (m/s); it waits while the player is farther than escortLeash. */
  escortSpeed: 3.2, escortLeash: 30,
  dredgerStart: [-650, -690] as [number, number],
  /** Slower than the clutch: it intercepts the raft's route rather than running it down. */
  dredgerSpeed: 2.4,
  /** Within dredgerPull of the dredger the clutch is drawn toward it at dredgerPullSpeed; within dredgerSwallow it is lost. */
  dredgerPull: 26, dredgerPullSpeed: 1.6, dredgerSwallow: 6,
  /** Ram the dredger this many times (a boat hitting it at ramSpeed or more) to send it off; each ram stuns it stunS. */
  rams: 3, ramSpeed: 5, stunS: 6,
  // Step 4: ride Tessie from the island back to the dock.
  /** Deep water just off the island's east shelf (dry ground ends about 22 m from the centre, deep water starts at 31). */
  rideSpawn: [-727, -716, 0] as [number, number, number],
  rideTo: [-713, -590] as [number, number],
  rideRadius: 10,
  // Step 5: the choice, two rings on the shore by the dock.
  tabloidAt: [-704, -548] as [number, number],
  secretAt: [-742, -552] as [number, number],
  tabloidAcorns: 1500,
  /** Afterwards (tessie.ts): Tessie surfaces now and then while the player is near the loch, and can be ridden. */
  event: { firstDelayS: 45, minGapS: 180, maxGapS: 360, stayS: 90, nearDist: 450, diveAfterLeftS: 20 },
} as const;
/** Body colours a ride-on, push-bike or zero-turn may get (prefab tint). */
export const MOWER_TINTS = [0xd8342c, 0x3fa34d, 0xf2c230, 0x2f64c9, 0xf08a24, 0x8e44ad, 0xeeeeee] as const;
export const FLY = {
  climb: 9,
  /** Default ceiling, above the tallest tower. A spec's own `ceiling` overrides it. */
  ceiling: 100,
  /** Fixed-wing climb rate at full pull, units/s, once at or above stall speed. */
  planeClimb: 14,
  /** Below stall speed in the air a plane sinks at this speed, units/s, and cannot climb. */
  stallSink: 12,
  gravity: 6,
  /** Fraction of horizontal speed kept per second with no throttle. */
  drag: 0.5,
} as const;
/** Ground vehicles keep this fraction of speed per second when coasting. */
export const GROUND_DRAG = 0.35;

// ---- Traffic ----------------------------------------------------------------------------------------------------
export const TRAFFIC = {
  count: 14,
  cruise: 0.55,          // fraction of spec.maxSpeed
  kinds: ['ride-on', 'ride-on', 'ride-on', 'push-bike', 'push-bike', 'zero-turn'] as VehicleKind[],
  despawnDistance: 120,  // npc vehicles farther than this from the player are moved to a road node near the player
  stopDistance: 5,       // brake for a vehicle or the player ahead
  /** Seconds a driver sits behind a blocker before pulling out around it (each driver rolls its own, so a standoff breaks). */
  patience: [1.5, 3.5] as readonly [number, number],
  /** A driver that moved less than stuckDistance in stuckSeconds is wedged: it reverses for reverseSeconds, then tries again. */
  stuckSeconds: 2.5,
  stuckDistance: 1,
  reverseSeconds: 1.4,
  /** A driver wedged this long, and at least this far from the player, is moved to a fresh road spot (never in sight). */
  giveUpSeconds: 14,
  giveUpDistance: 40,
  /** Seconds a driver stays at its destination before setting off for the next errand. */
  dwell: [3.5, 6.0] as readonly [number, number],
} as const;

/**
 * Places the NPC drivers head for. Each is a real landmark; a driver goes to the road node nearest to it, parks a little
 * short of the junction for a few seconds, then picks its next errand. `reason` finishes "I was on my way to ...".
 * `far` places are a long drive on the highways (push-bikes do not go there). `weight` is how often it is picked.
 */
export interface Place { id: string; name: string; reason: string; x: number; z: number; weight: number; far?: boolean }
export const PLACES: readonly Place[] = [
  { id: 'hospital', name: 'Glaze Clinic Hospital', reason: 'to the Glaze Clinic Hospital for a chip repair', x: HOSPITAL.x, z: HOSPITAL.z, weight: 3 },
  { id: 'mulch-club', name: 'Mulch Club', reason: 'to the Mulch Club', x: MULCH_CLUB.x, z: MULCH_CLUB.z, weight: 3 },
  { id: 'park', name: 'Turfton Park', reason: 'to the park for a picnic', x: -30, z: 30, weight: 3 },
  { id: 'downtown', name: 'Downtown', reason: 'downtown for work', x: 0, z: 0, weight: 4 },
  { id: 'high-street', name: 'the east shops', reason: 'to the shops for seed', x: 120, z: 60, weight: 3 },
  { id: 'west-end', name: 'the west end', reason: 'home to the west end', x: -120, z: -120, weight: 3 },
  { id: 'bodega', name: 'Bodega & Sons', reason: 'to Bodega & Sons for a lukewarm Acorn-Cola', x: BODEGA.x, z: BODEGA.z, weight: 2 },
  { id: 'side-valve', name: 'Side-Valve Salvage', reason: 'to Side-Valve Salvage for spare blades', x: SIDE_VALVE.x, z: SIDE_VALVE.z, weight: 2 },
  { id: 'pay-n-glaze', name: "Pay 'n' Glaze", reason: "to Pay 'n' Glaze for a fresh coat", x: PAY_N_GLAZE.x, z: PAY_N_GLAZE.z, weight: 2 },
  { id: 'gnomecino', name: 'The Gnomecino', reason: 'to The Gnomecino to test my luck', x: GNOMECINO.x, z: GNOMECINO.z, weight: 2 },
  { id: 'clay-mart', name: 'Clay-Mart', reason: 'to Clay-Mart for bulk mulch', x: CLAY_MART.x, z: CLAY_MART.z, weight: 2 },
  { id: 'patio-heights', name: 'Patio Heights', reason: 'to Patio Heights to mow a flagstone', x: 150, z: -150, weight: 1 },
  { id: 'fort-sandpit', name: 'Fort Sandpit', reason: 'to Fort Sandpit with a delivery', x: 374, z: 34, weight: 1, far: true },
  { id: 'airfield', name: 'the airfield', reason: 'to the airfield to watch the planes', x: 450, z: -70, weight: 1, far: true },
  { id: 'farms', name: 'Cloverfield Farms', reason: 'to Cloverfield Farms for clover', x: 40, z: 570, weight: 1, far: true },
  { id: 'mossy-wood', name: 'Mossy Wood', reason: 'to Mossy Wood for a walk', x: -570, z: -30, weight: 1, far: true },
  { id: 'fells', name: 'Frostbite Fells', reason: 'to Frostbite Fells to look at the snow', x: -20, z: -570, weight: 1, far: true },
  { id: 'loch-moss', name: 'Loch Moss', reason: 'to Loch Moss to look at the water', x: -720, z: -480, weight: 1, far: true },
  { id: 'tallgrass-commons', name: 'Tallgrass Commons', reason: 'to Tallgrass Commons for a lie-down in the long grass', x: -720, z: 420, weight: 1, far: true },
  { id: 'far-east', name: 'the far Dust Flats', reason: 'out to the far Dust Flats for the quiet', x: 870, z: 50, weight: 1, far: true },
  { id: 'puddle-coast', name: 'the Puddle Sea coast', reason: 'down to the coast to see the Puddle Sea', x: 0, z: 870, weight: 1, far: true },
];

// ---- Pedestrians ------------------------------------------------------------------------------------------------
export const PEDESTRIANS = {
  count: 22,
  walkSpeed: 1.8,
  fleeSpeed: 6.5,
  fleeSeconds: 6,
  /** Pedestrians flee from a player vehicle closer than this that moves faster than 4 units/s. */
  vehicleScare: 6,
  /** Despawn/respawn farther than this from the player. */
  recycleDistance: 90,
} as const;

/** Vehicles at or above this speed (units/s) fling the pedestrians they reach (ragdoll). */
export const RUN_OVER = { minSpeed: 6, reach: 0.9 } as const;

export const NPC_FIRST = [
  'Burdock', 'Sorrel', 'Yarrow', 'Clover', 'Primrose', 'Nettle', 'Hollyhock', 'Chervil', 'Lupin', 'Sedge',
  'Teasel', 'Marjoram', 'Rue', 'Comfrey', 'Lovage', 'Woodruff', 'Campion', 'Vetch', 'Mallow', 'Dill',
] as const;
export const NPC_LAST = [
  'Loamsby', 'Clodbury', 'Spadewell', 'Pebblecup', 'Mudkettle', 'Rakeham', 'Sievewright', 'Kettleby',
  'Gravelbottom', 'Hoesworth', 'Twinebarrow', 'Bucketts', 'Peatley', 'Dibbler',
] as const;
/** What a gnome says when a mower flings it (toasted as `Name: "line"`). Dry, no gore. */
export const RUNOVER_LINES = [
  'I have never been so airborne.',
  'Whoa. Whoa. Whoa.',
  'Mind the hat!',
  'I regret every shortcut.',
  'My boots are somewhere else now.',
  'That was my lane. Mine.',
] as const;

/** What a gnome says when it cracks apart (toasted as `Name: "line"`). Clay, no gore, no pop culture. */
export const CRACK_LINES = [
  'My good glaze!',
  'I was whole. I had plans.',
  'Not the hat. Anything but the hat.',
  'That was a perfectly good beard.',
  'Somebody fetch the glue.',
  'I am only chipped, you know. Mostly.',
  'Mind the pieces.',
  'It is only a flesh wound. I have no flesh.',
] as const;
export const STEAL_LINES = [
  'That is my mower!',
  'I only stopped for seed!',
  'Bring it back with the blades on!',
  'Hands up, I am getting off!',
] as const;

// ---- Guns ---------------------------------------------------------------------------------------------------------
// Real guns: hitscan bullets from the crosshair, magazines and reloads. Hits are cartoon-safe: a shot gnome puts its
// hands up and runs, an officer gives up (same reactions as before); nobody bleeds.
export interface GunSpec {
  kind: GunKind; name: string;
  /** @lawn/prefabs id of the held model (muzzle at +y, grip at the origin; see buildHeld). */
  prefab: string;
  /** Shots per second. */
  rate: number;
  /** Hold to keep firing (true) or one shot per click (false). */
  auto: boolean;
  /** Bullets per shot (shotgun pellets). */
  pellets: number;
  /** Random cone half-angle per bullet, radians. */
  spread: number;
  /** Bullets die after this many units. */
  range: number;
  /** Magazine size, and seconds to reload. */
  mag: number;
  reload: number;
  /** Camera kick per shot, radians of pitch. */
  recoil: number;
}
/** Hit points (0..1) one bullet takes off a vehicle; at 0 it explodes, charred black and burning. The pistol takes 10 shots. */
export const VEHICLE_SHOT_DAMAGE: Record<GunKind, number> = {
  pistol: 0.1,
  smg: 0.07,
  shotgun: 0.025,
  rifle: 0.15,
  'leaf-blower': 0.02,
  'acorn-mortar': 0.35,
  'tow-whip': 0.25,
  'dandelion-grenade': 0,
  'trip-mine': 0.2,
};

export const GUNS: Record<GunKind, GunSpec> = {
  pistol: { kind: 'pistol', name: 'Pistol', prefab: 'gta-pistol', rate: 4, auto: false, pellets: 1, spread: 0.008, range: 140, mag: 12, reload: 1.2, recoil: 0.012 },
  smg: { kind: 'smg', name: 'SMG', prefab: 'gta-smg', rate: 14, auto: true, pellets: 1, spread: 0.03, range: 110, mag: 30, reload: 1.6, recoil: 0.006 },
  shotgun: { kind: 'shotgun', name: 'Shotgun', prefab: 'gta-shotgun', rate: 1.2, auto: false, pellets: 8, spread: 0.07, range: 50, mag: 6, reload: 2.2, recoil: 0.05 },
  rifle: { kind: 'rifle', name: 'Rifle', prefab: 'gta-rifle', rate: 5, auto: true, pellets: 1, spread: 0.005, range: 240, mag: 20, reload: 1.8, recoil: 0.02 },
  'leaf-blower': { kind: 'leaf-blower', name: 'Leaf-Blower Cannon', prefab: 'leaf-blower-cannon', rate: 2.2, auto: true, pellets: 1, spread: 0.05, range: 16, mag: 20, reload: 1.5, recoil: 0.025 },
  'acorn-mortar': { kind: 'acorn-mortar', name: 'Acorn Mortar', prefab: 'acorn-mortar', rate: 0.9, auto: false, pellets: 1, spread: 0.01, range: 70, mag: 4, reload: 2.4, recoil: 0.06 },
  'tow-whip': { kind: 'tow-whip', name: 'Tow-Cable Whip', prefab: 'tow-cable-whip', rate: 1.8, auto: false, pellets: 1, spread: 0, range: 5, mag: 12, reload: 0.8, recoil: 0.015 },
  'dandelion-grenade': { kind: 'dandelion-grenade', name: 'Dandelion Puff-Grenade', prefab: 'dandelion-puff-grenade', rate: 0.8, auto: false, pellets: 1, spread: 0.01, range: 35, mag: 4, reload: 2.0, recoil: 0.02 },
  'trip-mine': { kind: 'trip-mine', name: 'Acorn Trip-Mine', prefab: 'acorn-trip-mine', rate: 1.0, auto: false, pellets: 1, spread: 0, range: 4, mag: 3, reload: 2.0, recoil: 0.01 },
};
export const GUN_ORDER: GunKind[] = [
  'pistol', 'smg', 'shotgun', 'rifle',
  'leaf-blower', 'acorn-mortar', 'tow-whip', 'dandelion-grenade', 'trip-mine',
];
/** Bullet tracer and impact looks. */
export const BULLET = { tracerLife: 0.08, tracerColor: 0xffe9a8, flashLife: 0.05, stepLength: 0.3 } as const;

// ---- Parachute ----------------------------------------------------------------------------------------------------
// Bailing out of a flyer above BAIL_MIN_ALTITUDE puts the gnome in free fall; the chute opens by itself.
export const BAIL_MIN_ALTITUDE = 3;
export const CHUTE = {
  /** Seconds of free fall before the chute opens by itself (if still above minDeployAltitude). */
  deployDelay: 0.9,
  minDeployAltitude: 12,
  /** Free-fall gravity and terminal speed, units/s. */
  fallGravity: 25, terminalFall: 32,
  /** Steady descent under canopy, and the horizontal glide speed (stick steers and glides). */
  descend: 4.5, glideSpeed: 9,
  /** Canopy yaw steering rate, radians/s, and how fast the canopy opens (per second, 0..1). */
  steerRate: 2.2, openRate: 3,
  /** Landing faster than this without a canopy costs this much health (a splat; never fatal on its own below 1). */
  hardLandingSpeed: 14, hardLandingDamage: 0.6,
} as const;

// ---- The Hat Watch (police), the HOA, and the Spade Guard (Fort Sandpit) -------------------------------------------
export const MAX_HEAT = 4;
export const HEAT = {
  crackPedestrian: 0.34,
  stealOccupied: 1,
  crackOfficer: 0.6,
  trespass: 2,
  stealWhirligig: 3,
  /** Heat lost per second once no officer has seen the player for `coolDelay` s. */
  coolRate: 0.08,
  coolDelay: 8,
} as const;
export const WATCH = {
  /** Officers on the street per heat level (level 1, 2, 3, 4). */
  officersPerLevel: [0, 2, 4, 6, 8],
  speed: 6.8,
  shootRange: 9,
  /** Player health lost per second per shooting officer. */
  damagePerSecond: 0.06,
  /** Bullet hits that crack an officer or guard apart. */
  crackHits: 3,
  fleeSeconds: 8,
  spawnDistance: 35,
  hat: 0x1f3a93,
  coat: 0xf2c230,
  guardHat: 0x556b2f,
  guardCoat: 0x6b7a3a,
  hoaHat: 0x18181e,
  hoaCoat: 0xc9b99b,
  porcelainHat: 0xf4f4f8,
  porcelainCoat: 0xe6e8f0,
} as const;
export const CRACKED_TEXT = 'CRACKED';

// ---- Wildlife (critters.ts, Epic 6) ---------------------------------------------------------------------------------
/** Critter runtime tuning. Animals never die: a hit knocks them over in a puff and they get up and run off. */
export const CRITTERS = {
  /** Critters further than this from the player are frozen and their meshes hidden. */
  simRadius: 260,
  /** Meshes are built (lazily) and shown within this distance. */
  meshRadius: 190,
  /** Legs, wings and tails animate only within this distance. */
  animRadius: 70,
  /** A vehicle at least this fast (units/s) that touches a critter knocks it over. */
  knockSpeed: 3,
  /** A vehicle at least this fast within a critter's scareVehicle radius makes it flee. */
  scareSpeed: 2,
  /** Seconds a frightened critter keeps running. */
  fleeSeconds: 3.5,
  /** Seconds it takes to fall over or get up. */
  tipSeconds: 0.35,
} as const;

// ---- Water (water.ts, boats.ts, swim.ts: Epic 4) ----------------------------------------------------------------------
/** The river, the canal, Loch Moss and the Puddle Sea. Lore ruling: gnomes bob like floats, mowers conk out and sink. */
export const WATER = {
  /** Carve the water into the ground. Tests that need the old dry world call setTerrainOptions({ water: false }). */
  carve: true,
  /** The water surface sits this far below the lowest bank beside it, metres. */
  freeboard: 1.0,
  /** No carving within this many metres of the source (the Frozen Birdbath Basin stays a whole ice bowl). */
  sourceClear: 16,
  /** An island feature inside a loch keeps its natural ground sunk by this much (Tessie's island in Loch Moss). */
  islandSink: 3,
  /** Downstream order: each stretch is fed by the one before it, so its surface is never higher. */
  order: ['river-upper', 'water/loch-moss', 'river-ravine', 'canal', 'river-farm', 'water/puddle-sea'],
  /** Rivers and the canal (water path ids): depth in the middle and the bank slope width, metres. */
  courses: {
    'river-upper': { depth: 1.6, bank: 6 },
    'river-ravine': { depth: 2.0, bank: 5 },
    canal: { depth: 0.55, bank: 1.5 },
    'river-farm': { depth: 1.8, bank: 6 },
  },
  /** Still water (water marker ids): depth at the middle; shelf = fraction of the radius the bed shelves over; bank, m. */
  bodies: {
    'water/loch-moss': { depth: 5, shelf: 0.35, bank: 8 },
    'water/puddle-sea': { depth: 3, shelf: 0.6, bank: 10 },
  },
  /** Canal locks, as fractions of the canal's length: the only places the canal steps down. */
  canalLocks: [0.25, 0.75],
  /** Bridge deck: extra width beyond the road each side, and extra length past each bank, metres. */
  bridgeMargin: 1, bridgeOverhang: 2,
  /** The deck stands this far above the road at its ends (a small step up; keeps the deck clear of the bank ground). */
  deckRise: 0.15,
  /** Shallower than this a gnome wades on the bed (and fires); deeper it bobs. */
  wadeDepth: 0.7,
  /** A ground vehicle in water deeper than this conks out and sinks. Shallower water (the canal) only slows it. */
  stallDepth: 0.75,
  /** A sunk mower comes back where it was first parked after this long, once the player is farther than respawnClear. */
  sinkRespawnS: 45, respawnClear: 60,
  /** A bobbing gnome: paddle speed (m/s), bob amplitude (m) and rate (Hz), and how deep its feet hang below the surface. */
  paddleSpeed: 2.2, bobAmp: 0.06, bobHz: 0.8, floatDepth: 0.55,
  /** Boat physics (boats.ts). */
  boat: {
    /** Vertical spring towards the floating height (1/s^2) and its damping (1/s). */
    buoyancy: 18, heaveDamp: 4,
    /** Fraction of forward speed kept per second when coasting; sideways slip decay (1/s). */
    drag: 0.45, sideGrip: 2.5,
    /** Below this water depth under the hull a boat is beached: it stops and cannot be driven. */
    beachDepth: 0.15,
    /** Speed (m/s) at which the rudder reaches full authority. */
    rudderSpeed: 3,
  },
  /** Hat Watch on water: at this many hats, while the player is in a boat, an HOA patrol boat joins in. */
  patrolHats: 3,
  /** River texture flow speed, m/s, downstream. */
  flowSpeed: 0.8,
  colour: 0x3b7d72, deepColour: 0x2a5f6b, foam: 0xe8f1ee,
} as const;
