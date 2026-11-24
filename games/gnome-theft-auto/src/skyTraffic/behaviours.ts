// The data table of NPC flights (docs/roadmaps/gta-npc-planes.md). Each entry says what flies, where, when, and its route.
import { SKY } from './config';
import { SKY_SOUNDS } from './sounds';
import { airfieldCircuit, cropPasses, dropRoute, orbitRoute, polyRoute, skyWriterRoute } from './routes';
import type { Pt, SkyBehaviourDef, SkyBehaviourId, SkyWaypoint } from './types';

/** Where the mail drop lands. */
export const DROP_ZONES: readonly Pt[] = [{ x: -60, z: 330 }, { x: 120, z: 430 }, { x: -200, z: 260 }];

/** Where the air ambulance stops to collect a patient. */
export const AMBULANCE_STOPS: readonly Pt[] = [{ x: -300, z: 40 }, { x: 200, z: 320 }, { x: -150, z: -295 }];

export const SKY_BEHAVIOURS: readonly SkyBehaviourDef[] = [
  {
    id: 'banner-tow',
    title: 'Sky-Sign Banner Tow',
    kind: 'plane',
    sound: SKY_SOUNDS.prop,
    anchor: { x: 0, z: 0 },
    radius: 700,
    cooldown: 30,
    priority: 10,
    repeat: 'loop',
    startAirborne: true,
    banner: true,
    route: () => polyRoute([
      { x: -170, z: -170 }, { x: 170, z: -170 }, { x: 280, z: -60 }, { x: 280, z: 60 },
      { x: 170, z: 170 }, { x: -170, z: 170 }, { x: -280, z: 60 }, { x: -280, z: -60 },
    ], 75, 24),
  },
  {
    id: 'airfield-circuit',
    title: 'Flight School Circuit',
    kind: 'hedge-hopper',
    sound: SKY_SOUNDS.sport,
    anchor: { x: 480, z: -110 },
    radius: 600,
    cooldown: 60,
    priority: 6,
    repeat: 'loop',
    startAirborne: false,
    route: (c) => airfieldCircuit(c.airfield, { x: c.airfield.x - 40, z: c.airfield.z - 22, yaw: c.airfield.yaw }),
  },
  {
    id: 'crop-duster',
    title: 'Cloverfield Crop Duster',
    kind: 'plane',
    sound: SKY_SOUNDS.prop,
    anchor: { x: 40, z: 440 },
    radius: 650,
    cooldown: 45,
    priority: 7,
    repeat: 'loop',
    startAirborne: true,
    puff: SKY.sprayColour,
    route: () => cropPasses({ x: 40, z: 440, w: 160, d: 90 }, 4, 7, 26),
  },
  {
    id: 'scenic-copter',
    title: 'Turfton Sightseeing Copter',
    kind: 'sycamore-copter',
    sound: SKY_SOUNDS.copter,
    anchor: { x: 0, z: 0 },
    radius: 600,
    cooldown: 60,
    priority: 5,
    repeat: 'loop',
    startAirborne: true,
    route: () => {
      const route = polyRoute([
        { x: -90, z: -90 }, { x: 60, z: -110 }, { x: 110, z: -30 }, { x: 90, z: 150 },
        { x: -90, z: 90 }, { x: -150, z: 150 }, { x: -150, z: -30 },
      ], 60, 16);
      route[0] = { ...route[0], hold: 6 };
      return route;
    },
  },
  {
    id: 'sky-writer',
    title: 'Sky-Writer',
    kind: 'hedge-hopper',
    sound: SKY_SOUNDS.sport,
    anchor: { x: 220, z: 160 },
    radius: 750,
    cooldown: 90,
    priority: 4,
    repeat: 'loop',
    startAirborne: true,
    puff: SKY.smokeColour,
    route: () => skyWriterRoute({ x: 220, z: 160 }, 90, 120, 34),
  },
  {
    id: 'news-copter',
    title: 'Lawn-Dart Eye-in-the-Sky',
    kind: 'sycamore-copter',
    sound: SKY_SOUNDS.copter,
    anchor: { x: 0, z: 0 },
    radius: 3000,
    cooldown: 90,
    priority: 8,
    repeat: 'rebuild',
    startAirborne: true,
    when: (c) => c.eventActive || c.heat >= 3,
    route: (c) => orbitRoute({ x: c.playerX, z: c.playerZ }, 70, 50, 14, 8),
    toast: 'The Lawn-Dart Eye-in-the-Sky is covering this live!',
  },
  {
    id: 'mail-drop',
    title: 'Pigeon-Drop Air Mail',
    kind: 'plane',
    sound: SKY_SOUNDS.prop,
    anchor: { x: -40, z: 330 },
    radius: 700,
    cooldown: 150,
    priority: 5,
    repeat: 'once',
    startAirborne: true,
    route: (c) => {
      const zone = DROP_ZONES[Math.floor(c.rng() * DROP_ZONES.length)];
      return dropRoute({ x: zone.x - 450, z: zone.z - 150 }, zone, { x: zone.x + 450, z: zone.z + 150 }, 45, 30);
    },
  },
  {
    id: 'balloon',
    title: 'Dandelion Drifter Balloon Ride',
    kind: 'dandelion-drifter',
    sound: SKY_SOUNDS.balloon,
    anchor: { x: -450, z: 520 },
    radius: 700,
    cooldown: 120,
    priority: 3,
    repeat: 'loop',
    startAirborne: true,
    route: () => polyRoute([{ x: -600, z: 600 }, { x: -420, z: 520 }, { x: -260, z: 470 }, { x: -380, z: 640 }], 70, 5),
  },
  {
    id: 'watch-copter',
    title: 'Hat Watch Air Unit',
    kind: 'sycamore-copter',
    sound: SKY_SOUNDS.copter,
    anchor: { x: 0, z: 0 },
    radius: 3000,
    cooldown: 45,
    priority: 20,
    repeat: 'rebuild',
    startAirborne: true,
    when: (c) => c.heat >= 2,
    route: (c) => orbitRoute({ x: c.playerX, z: c.playerZ }, 40, 35, 16, 8),
    toast: 'A Hat Watch Air Unit is circling overhead!',
  },
  {
    id: 'air-ambulance',
    title: 'Glaze Clinic Air Ambulance',
    kind: 'sycamore-copter',
    sound: SKY_SOUNDS.copter,
    anchor: { x: 30, z: 30 },
    radius: 650,
    cooldown: 150,
    priority: 4,
    repeat: 'once',
    startAirborne: true,
    route: (c): SkyWaypoint[] => {
      const stop = AMBULANCE_STOPS[Math.floor(c.rng() * AMBULANCE_STOPS.length)];
      return [
        { x: 30, z: 30, agl: 70, speed: 24 },
        { x: stop.x, z: stop.z, agl: 25, speed: 28, hold: 8 },
        { x: 30, z: 30, agl: 70, speed: 28 },
        { x: 630, z: 30, agl: 80, speed: 30 },
      ];
    },
  },
];

const BY_ID = new Map<SkyBehaviourId, SkyBehaviourDef>(SKY_BEHAVIOURS.map((b) => [b.id, b]));

export function skyBehaviour(id: string): SkyBehaviourDef | undefined {
  return BY_ID.get(id as SkyBehaviourId);
}
