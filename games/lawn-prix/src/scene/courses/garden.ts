// The garden course's own scenery and background show. Scenery: flower beds, pots, trees and hay bales on the
// outside of the sharpest bends. Show ("someone is playing that game over there"): two gnomes tossing a red ball
// across the grass off the track, and a lawn sprinkler beside a flower bed. Everything is seeded (no Math.random).
import * as THREE from 'three';
import { TRACK } from '../../config';
import { headingOf, pointAt, type Track } from '../../track';
import { createActor, distFromTrackEdge, mulberry32, offTrackSpot, type Actor } from './util';
import type { CourseShow } from './index';

const TAU = Math.PI * 2;

/** Signed turn (radians, + = left) of the track over a 15 m window centred on s. */
function turnAt(track: Track, s: number): number {
  const a = pointAt(track, s - 7.5), b = pointAt(track, s + 7.5);
  const d = headingOf(b.tx, b.tz) - headingOf(a.tx, a.tz);
  return Math.atan2(Math.sin(d), Math.cos(d));
}

export function buildGardenShow(scene: THREE.Scene, track: Track): CourseShow {
  const rand = mulberry32(0x2b3c4d);
  const half = TRACK.width / 2;
  const group = new THREE.Group();
  group.name = 'garden';

  // Calls make() for `count` props; `radius` adds to the clearance so big props stay off the track.
  const scatter = (count: number, radius: number, make: (x: number, z: number, yaw: number) => void): void => {
    for (let k = 0; k < count; k++) {
      const s = offTrackSpot(track, rand, 0.8 + radius, 2);
      if (s) make(s.x, s.z, rand() * TAU);
    }
  };

  // Flower beds (remembered for the sprinkler).
  const beds: { x: number; z: number }[] = [];
  const bedMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2b });
  const bedGeo = new THREE.BoxGeometry(2.4, 0.35, 1.4);
  const flowerGeo = new THREE.SphereGeometry(0.14, 6, 4);
  const flowerMats = [0xf2c230, 0xf05aa0, 0xffffff, 0xd8342c, 0x8a4fd0]
    .map((hex) => new THREE.MeshLambertMaterial({ color: hex }));
  scatter(10, 1.3, (x, z, yaw) => {
    beds.push({ x, z });
    const bed = new THREE.Group();
    bed.position.set(x, 0, z);
    bed.rotation.y = yaw;
    const soil = new THREE.Mesh(bedGeo, bedMat);
    soil.position.y = 0.175;
    soil.receiveShadow = true;
    bed.add(soil);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const f = new THREE.Mesh(flowerGeo, flowerMats[Math.floor(rand() * flowerMats.length)]);
        f.position.set(-1.05 + c * 0.7, 0.36, -0.35 + r * 0.35);
        bed.add(f);
      }
    }
    group.add(bed);
  });

  // Terracotta pots.
  const potGeo = new THREE.CylinderGeometry(0.35, 0.25, 0.6, 8);
  const potMat = new THREE.MeshLambertMaterial({ color: 0xc8643c });
  scatter(4, 0.35, (x, z) => {
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.set(x, 0.3, z);
    pot.castShadow = true;
    group.add(pot);
  });

  // Trees.
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 2.2, 6);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2b });
  const canopyGeo = new THREE.IcosahedronGeometry(2.4, 0);
  const canopyMat = new THREE.MeshLambertMaterial({ color: 0x2f7d32 });
  scatter(6, 2.4, (x, z) => {
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 1.1, z);
    trunk.castShadow = true;
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(x, 3.4, z);
    canopy.castShadow = true;
    group.add(trunk, canopy);
  });

  // Hay bales on the outside of the four sharpest bends: three per bend, just outside the outer edge.
  const corners: { s: number; turn: number }[] = [];
  const sharpest = track.points.map((p) => ({ s: p.s, turn: turnAt(track, p.s) }))
    .sort((u, v) => Math.abs(v.turn) - Math.abs(u.turn));
  for (const c of sharpest) {
    if (corners.length === 4) break;
    const apart = corners.every((k) => {
      const d = Math.abs(c.s - k.s);
      return Math.min(d, track.length - d) >= 30;
    });
    if (apart) corners.push(c);
  }
  const baleGeo = new THREE.BoxGeometry(1.2, 0.8, 0.8);
  const baleMat = new THREE.MeshLambertMaterial({ color: 0xe0c060 });
  for (const c of corners) {
    const side = c.turn > 0 ? -1 : 1; // a left bend has its outer edge on the right
    for (let k = -1; k <= 1; k++) {
      const p = pointAt(track, c.s + k * 1.4);
      const lat = side * (half + 1.4);
      const bale = new THREE.Mesh(baleGeo, baleMat);
      bale.position.set(p.x + p.tz * lat, 0.4, p.z - p.tx * lat);
      bale.rotation.y = headingOf(p.tx, p.tz);
      bale.castShadow = true;
      group.add(bale);
    }
  }

  scene.add(group);

  // Ball toss: two gnomes 8 m apart on the grass, 12 m or more off the track.
  const c = offTrackSpot(track, rand, 12, 6);
  if (!c) return { update() {} };
  const A = { x: c.x - 4, z: c.z }, B = { x: c.x + 4, z: c.z };
  const gnomeA: Actor = createActor(scene, A.x, A.z, Math.PI / 2); // faces +x
  const gnomeB: Actor = createActor(scene, B.x, B.z, -Math.PI / 2); // faces -x
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0xd8342c }),
  );
  ball.castShadow = true;
  group.add(ball);

  // Lawn sprinkler beside the first flower bed: a spinning arm with a fan of water droplets.
  const sprinkler = new THREE.Group();
  const bed = beds[0];
  if (bed) {
    const side = distFromTrackEdge(track, bed.x + 1.8, bed.z) >= 1 ? 1 : -1;
    sprinkler.position.set(bed.x + side * 1.8, 0, bed.z);
  } else {
    sprinkler.position.set(c.x, 0, c.z + 3);
  }
  const metal = new THREE.MeshLambertMaterial({ color: 0x8a8f94 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.5, 8), metal);
  base.position.y = 0.25;
  base.castShadow = true;
  sprinkler.add(base);
  const arm = new THREE.Group();
  arm.position.y = 0.5;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.3), metal);
  arm.add(head);
  const N = 40;
  const fan = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const a = (i / (N - 1) - 0.5) * 1.1;
    const r = 1.6 + (2.2 * ((i * 7) % N)) / N;
    fan.set([Math.sin(a) * r, (-0.3 * (r - 1.6)) / 2.2, Math.cos(a) * r], i * 3);
  }
  const sprayGeo = new THREE.BufferGeometry();
  sprayGeo.setAttribute('position', new THREE.BufferAttribute(fan, 3));
  const sprayMat = new THREE.PointsMaterial({
    color: 0x9fd8ff, size: 0.14, transparent: true, opacity: 0.6, depthWrite: false,
  });
  arm.add(new THREE.Points(sprayGeo, sprayMat));
  sprinkler.add(arm);
  group.add(sprinkler);

  // Own clock: the show runs the same before GO (raceT = 0) and during the race.
  let t = 0;
  return {
    update(_raceT: number, dt: number) {
      t += dt;
      gnomeA.update(dt);
      gnomeB.update(dt);

      // One throw every 1.2 s, alternating direction. The thrower winds up; the catcher holds its arms up in flight.
      const n = Math.floor(t / 1.2);
      const u = t / 1.2 - n;
      const fromA = n % 2 === 0;
      const from = fromA ? A : B, to = fromA ? B : A;
      const thrower = fromA ? gnomeA : gnomeB, catcher = fromA ? gnomeB : gnomeA;
      ball.position.set(from.x + (to.x - from.x) * u, 1 + 2.8 * u * (1 - u), from.z + (to.z - from.z) * u);

      // Arms go from back (+0.8) to forward (-1.8) over the first quarter of the throw, then rest at 0.
      const windUp = u < 0.25 ? 0.8 - 2.6 * (u / 0.25) : 0;
      thrower.model.arms.left.rotation.x = windUp;
      thrower.model.arms.right.rotation.x = windUp;
      catcher.model.arms.left.rotation.x = -2.6;
      catcher.model.arms.right.rotation.x = -2.6;

      arm.rotation.y = t * 2.2;
      sprayMat.opacity = 0.5 + 0.2 * Math.sin(t * 14);
    },
  };
}
