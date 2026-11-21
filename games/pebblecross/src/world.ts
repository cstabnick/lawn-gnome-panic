// The town's 3D scene: ground, roads, ponds, buildings, props, and the place and forage markers the player taps.
// Lights are not added here (main owns them), and the scene is never cleared.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { Town } from './town';

export interface WorldView {
  pickables: THREE.Object3D[];          // place and forage meshes; userData.placeId (string) on each; forage also userData.forage = true
  update(dt: number): void;             // gentle bob for forage patches, pond shimmer
  dispose(): void;
}

const ROAD_COLOR = 0xc9b89a;
const POND_COLOR = 0x3f7fbf;
const RIM_COLOR = 0x9a9a8a;
const PLACE_COLOR = 0xffffff;
const PLACE_OPACITY = 0.18;
const FORAGE_COLOR = 0x5c7a3a;
const FORAGE_RADIUS = 0.25;
const FORAGE_LIFT = 0.3;
const ROAD_LIFT = 0.02;
const POND_LIFT = 0.03;
const RIM_LIFT = 0.035;
const PLACE_LIFT = 0.04;

/** Height of a building's pitched roof, metres. */
export function roofHeight(h: number): number {
  return h * 0.45;
}

/** Vertical bob of a forage patch at `time` seconds, offset by `phase`. Stays within plus or minus 0.06 m. */
export function forageBobOffset(time: number, phase: number): number {
  return Math.sin(time * 2 + phase) * 0.06;
}

export function buildWorld(scene: THREE.Scene, town: Town): WorldView {
  const owned: THREE.Object3D[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const pickables: THREE.Object3D[] = [];
  const bobbing: { mesh: THREE.Object3D; base: number; phase: number }[] = [];
  const propRoots: THREE.Object3D[] = [];
  let time = 0;

  const own = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const lambert = (color: number): THREE.MeshLambertMaterial => {
    const m = new THREE.MeshLambertMaterial({ color });
    materials.push(m);
    return m;
  };
  const add = (o: THREE.Object3D): void => {
    scene.add(o);
    owned.push(o);
  };

  // Ground: one vertex per metre, raised to the town's height field.
  const groundGeo = own(new THREE.PlaneGeometry(town.w, town.d, Math.round(town.w), Math.round(town.d)));
  groundGeo.rotateX(-Math.PI / 2);
  const gpos = groundGeo.attributes.position;
  for (let i = 0; i < gpos.count; i++) {
    gpos.setY(i, town.heightAt(gpos.getX(i), gpos.getZ(i)));
  }
  gpos.needsUpdate = true;
  groundGeo.computeVertexNormals();
  const ground = new THREE.Mesh(groundGeo, lambert(town.ground));
  ground.name = 'ground';
  ground.userData.ground = true;
  ground.receiveShadow = true;
  add(ground);

  // Roads: a flat ribbon per segment, all in one mesh.
  const roadPos: number[] = [];
  const roadNormal: number[] = [];
  const roadIdx: number[] = [];
  for (const road of town.roads) {
    for (let i = 0; i + 1 < road.points.length; i++) {
      const a = road.points[i];
      const b = road.points[i + 1];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len = Math.hypot(dx, dz);
      if (len === 0) continue;
      const nx = (-dz / len) * (road.width / 2);
      const nz = (dx / len) * (road.width / 2);
      const corners: [number, number][] = [
        [a.x + nx, a.z + nz],
        [a.x - nx, a.z - nz],
        [b.x - nx, b.z - nz],
        [b.x + nx, b.z + nz],
      ];
      const base = roadPos.length / 3;
      for (const [x, z] of corners) {
        roadPos.push(x, town.heightAt(x, z) + ROAD_LIFT, z);
        roadNormal.push(0, 1, 0);
      }
      roadIdx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  if (roadIdx.length > 0) {
    const roadGeo = own(new THREE.BufferGeometry());
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPos, 3));
    roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormal, 3));
    roadGeo.setIndex(roadIdx);
    const roadMat = lambert(ROAD_COLOR);
    roadMat.side = THREE.DoubleSide;
    const roads = new THREE.Mesh(roadGeo, roadMat);
    roads.name = 'roads';
    roads.receiveShadow = true;
    add(roads);
  }

  // Ponds: a water disc with a pebble rim.
  for (const pond of town.ponds) {
    const y = town.heightAt(pond.x, pond.z);
    const waterGeo = own(new THREE.CircleGeometry(pond.r, 28));
    waterGeo.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(waterGeo, lambert(POND_COLOR));
    water.name = 'pond';
    water.position.set(pond.x, y + POND_LIFT, pond.z);
    water.receiveShadow = true;
    add(water);

    const rimGeo = own(new THREE.RingGeometry(pond.r, pond.r + 0.15, 28));
    rimGeo.rotateX(-Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, lambert(RIM_COLOR));
    rim.name = 'pond-rim';
    rim.position.set(pond.x, y + RIM_LIFT, pond.z);
    rim.receiveShadow = true;
    add(rim);
  }

  // Buildings: a box with a four-sided pitched roof, grouped so the id is on the group.
  for (const b of town.buildings) {
    const group = new THREE.Group();
    group.name = `building:${b.id}`;
    group.userData.buildingId = b.id;
    group.position.set(b.x, town.heightAt(b.x, b.z), b.z);

    const bodyGeo = own(new THREE.BoxGeometry(b.w, b.h, b.d));
    bodyGeo.translate(0, b.h / 2, 0);
    const body = new THREE.Mesh(bodyGeo, lambert(b.color));
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const rh = roofHeight(b.h);
    const roofGeo = own(new THREE.ConeGeometry(Math.hypot(b.w, b.d) / 2, rh, 4));
    roofGeo.rotateY(Math.PI / 4);
    roofGeo.translate(0, b.h + rh / 2, 0);
    const roof = new THREE.Mesh(roofGeo, lambert(b.roof));
    roof.castShadow = true;
    group.add(roof);

    add(group);
  }

  // Props: prefabs from @lawn/prefabs. Their geometry is shared, so only the root is removed on dispose.
  const warnedProps = new Set<string>();
  for (const p of town.props) {
    let root: THREE.Group;
    try {
      root = buildPrefab(p.prefab, { scale: p.scale });
    } catch (err) {
      if (!warnedProps.has(p.prefab)) {
        warnedProps.add(p.prefab);
        console.warn(`pebblecross: prefab "${p.prefab}" not found, skipped`, err);
      }
      continue;
    }
    root.position.set(p.x, town.heightAt(p.x, p.z), p.z);
    root.rotation.y = p.rot;
    scene.add(root);
    propRoots.push(root);
  }

  // Places: a faint disc so the player can see where each one is. Tapping the disc uses the place.
  const placeMat = new THREE.MeshBasicMaterial({
    color: PLACE_COLOR,
    transparent: true,
    opacity: PLACE_OPACITY,
    depthWrite: false,
  });
  materials.push(placeMat);
  for (const place of Object.values(town.places)) {
    const geo = own(new THREE.CircleGeometry(place.r, 24));
    geo.rotateX(-Math.PI / 2);
    const disc = new THREE.Mesh(geo, placeMat);
    disc.name = `place:${place.id}`;
    disc.userData.placeId = place.id;
    disc.position.set(place.x, town.heightAt(place.x, place.z) + PLACE_LIFT, place.z);
    add(disc);
    pickables.push(disc);
  }

  // Forage: small green-brown spheres that bob.
  const forageGeo = own(new THREE.SphereGeometry(FORAGE_RADIUS, 12, 8));
  const forageMat = lambert(FORAGE_COLOR);
  town.forage.forEach((f, i) => {
    const mesh = new THREE.Mesh(forageGeo, forageMat);
    const base = town.heightAt(f.x, f.z) + FORAGE_LIFT;
    mesh.name = `forage:${f.id}`;
    mesh.userData.placeId = f.id;
    mesh.userData.forage = true;
    mesh.position.set(f.x, base, f.z);
    add(mesh);
    pickables.push(mesh);
    bobbing.push({ mesh, base, phase: i * 1.7 });
  });

  return {
    pickables,
    update(dt: number): void {
      time += dt;
      for (const b of bobbing) {
        b.mesh.position.y = b.base + forageBobOffset(time, b.phase);
      }
    },
    dispose(): void {
      for (const o of owned) scene.remove(o);
      for (const r of propRoots) scene.remove(r);
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      owned.length = 0;
      propRoots.length = 0;
      bobbing.length = 0;
      pickables.length = 0;
      geometries.length = 0;
      materials.length = 0;
    },
  };
}
