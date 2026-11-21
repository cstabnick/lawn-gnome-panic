// Ambient life for the town and the park: three cars drive a loop round the fountain, and a basketball bounces on the court.
// Purely visual: nothing here adds a blocker, so it never stops a gnome walking.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { MapExtra } from './glow';
import type { MapDef } from './config';

const LOOP_HALF_X = 9.5;
const LOOP_HALF_Z = 4.8;
const LOOP_R = 2;
const LOOP_STRAIGHT_X = LOOP_HALF_X - LOOP_R; // 7.5: where the top and bottom straights end
const LOOP_STRAIGHT_Z = LOOP_HALF_Z - LOOP_R; // 2.8: where the side straights end
const ARC = (Math.PI * LOOP_R) / 2;
const SIDE_LEN = LOOP_STRAIGHT_Z * 2;
const TOP_LEN = LOOP_STRAIGHT_X * 2;

type Segment =
  | { kind: 'line'; x: number; z: number; dx: number; dz: number; len: number }
  | { kind: 'arc'; cx: number; cz: number; a0: number; len: number };

// Counter-clockwise (in x/z) rounded rectangle, starting at the bottom of the right side.
const SEGMENTS: Segment[] = [
  { kind: 'line', x: LOOP_HALF_X, z: -LOOP_STRAIGHT_Z, dx: 0, dz: 1, len: SIDE_LEN },
  { kind: 'arc', cx: LOOP_STRAIGHT_X, cz: LOOP_STRAIGHT_Z, a0: 0, len: ARC },
  { kind: 'line', x: LOOP_STRAIGHT_X, z: LOOP_HALF_Z, dx: -1, dz: 0, len: TOP_LEN },
  { kind: 'arc', cx: -LOOP_STRAIGHT_X, cz: LOOP_STRAIGHT_Z, a0: Math.PI / 2, len: ARC },
  { kind: 'line', x: -LOOP_HALF_X, z: LOOP_STRAIGHT_Z, dx: 0, dz: -1, len: SIDE_LEN },
  { kind: 'arc', cx: -LOOP_STRAIGHT_X, cz: -LOOP_STRAIGHT_Z, a0: Math.PI, len: ARC },
  { kind: 'line', x: -LOOP_STRAIGHT_X, z: -LOOP_HALF_Z, dx: 1, dz: 0, len: TOP_LEN },
  { kind: 'arc', cx: LOOP_STRAIGHT_X, cz: -LOOP_STRAIGHT_Z, a0: (3 * Math.PI) / 2, len: ARC },
];

/** Total length of the loop in metres. */
export const LOOP_LENGTH = SEGMENTS.reduce((sum, seg) => sum + seg.len, 0);

/**
 * A point on the loop, s in [0, 1) (wraps). yaw is the heading in radians, the way a prefab (facing +z) must turn.
 * Pure: depends only on s.
 */
export function loopPoint(s: number): { x: number; z: number; yaw: number } {
  const wrapped = ((s % 1) + 1) % 1;
  let d = wrapped * LOOP_LENGTH;
  for (const seg of SEGMENTS) {
    if (d <= seg.len || seg === SEGMENTS[SEGMENTS.length - 1]) {
      const u = Math.min(Math.max(d, 0), seg.len);
      if (seg.kind === 'line') {
        const x = seg.x + seg.dx * u;
        const z = seg.z + seg.dz * u;
        return { x, z, yaw: Math.atan2(seg.dx, seg.dz) };
      }
      const a = seg.a0 + u / LOOP_R;
      const x = seg.cx + LOOP_R * Math.cos(a);
      const z = seg.cz + LOOP_R * Math.sin(a);
      // Counter-clockwise tangent at angle a.
      return { x, z, yaw: Math.atan2(-Math.sin(a), Math.cos(a)) };
    }
    d -= seg.len;
  }
  return { x: LOOP_HALF_X, z: -LOOP_STRAIGHT_Z, yaw: 0 };
}

const STOP_RADIUS = 1.2;
const STOP_TIME = 1.5;
const CAR_EASE = 4;

interface Driver {
  root: THREE.Group;
  speed: number;
  dist: number;
  /** 1 = full speed, 0 = stopped. */
  factor: number;
  /** Seconds left to stay stopped. */
  hold: number;
  wasNear: boolean;
  siren?: THREE.Object3D;
  sign?: THREE.Object3D;
}

/** Three cars on a loop round the fountain. Stops for a moment when a gnome stands next to one. */
export function addTownTraffic(
  g: THREE.Group,
  _map: MapDef,
  getPlayer?: () => { x: number; z: number } | null,
): MapExtra {
  const specs: { id: string; speed: number }[] = [
    { id: 'gta-getaway-car', speed: 2.2 },
    { id: 'gta-taxi', speed: 1.8 },
    { id: 'gta-ambulance', speed: 2.8 },
  ];
  const drivers: Driver[] = specs.map((spec, i) => {
    const root = buildPrefab(spec.id);
    g.add(root);
    return {
      root,
      speed: spec.speed,
      dist: (LOOP_LENGTH * i) / specs.length,
      factor: 1,
      hold: 0,
      wasNear: false,
      siren: root.getObjectByName('siren') ?? undefined,
      sign: root.getObjectByName('sign') ?? undefined,
    };
  });

  return {
    update(dt: number, t: number) {
      const player = getPlayer ? getPlayer() : null;
      for (const d of drivers) {
        const here = loopPoint(d.dist / LOOP_LENGTH);
        if (player) {
          const near = Math.hypot(player.x - here.x, player.z - here.z) <= STOP_RADIUS;
          if (near && !d.wasNear) d.hold = STOP_TIME;
          d.wasNear = near;
        }
        d.hold = Math.max(0, d.hold - dt);
        const target = d.hold > 0 ? 0 : 1;
        d.factor += (target - d.factor) * Math.min(1, dt * CAR_EASE);
        d.dist += d.speed * d.factor * dt;

        const p = loopPoint(d.dist / LOOP_LENGTH);
        d.root.position.set(p.x, 0, p.z);
        d.root.rotation.y = p.yaw;

        if (d.siren) d.siren.rotation.y = t * 8;
        if (d.sign) d.sign.scale.setScalar(1 + 0.06 * (0.5 + 0.5 * Math.sin(t * 4)));
      }
    },
  };
}

/** A basketball bouncing on the court spot 'spot-gjam'. Does nothing when the map has no such spot. */
export function addCourtBall(g: THREE.Group, map: MapDef): MapExtra {
  const spot = map.spots.find((s) => s.id === 'spot-gjam');
  if (!spot) return { update() {} };
  const ball = buildPrefab('gba-basketball');
  ball.position.set(spot.x, 0.15, spot.z);
  g.add(ball);
  return {
    update(_dt: number, t: number) {
      ball.position.y = Math.abs(Math.sin(t * 3)) * 1.1 + 0.15;
      ball.rotation.y = t * 2;
    },
  };
}
