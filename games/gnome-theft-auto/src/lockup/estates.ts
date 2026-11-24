// Builds the two buyable garages into the world: Hangar Two (Desert Airfield, air) and the Mossbank Boathouse (Loch Moss,
// water). Each returns its wall and walkway colliders for world.boxes; the buildings stand whether or not they are owned.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { LAYER, flatLayer } from '@lawn/depth';
import type { Box } from '../types';
import { heightAt } from '../terrain';
import { bodyLevel } from '../water';
import { addGroundToGeometry } from '../terrainMesh';
import { ESTATES } from './config';
import type { LocalRect } from './types';

/** Turn a building-frame point about the origin by yaw, as three.js rotation.y does, then move it to (x, z). */
export function localToWorld(lx: number, lz: number, x: number, z: number, yaw: number): { x: number; z: number } {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return { x: x + lx * c + lz * s, z: z - lx * s + lz * c };
}

/** A building-frame rectangle turned by yaw about (x, z) and moved there; h becomes baseY + rect.h. */
export function placeRect(r: LocalRect, x: number, z: number, yaw: number, baseY: number): Box {
  const corners = [
    localToWorld(r.minX, r.minZ, x, z, yaw),
    localToWorld(r.maxX, r.minZ, x, z, yaw),
    localToWorld(r.minX, r.maxZ, x, z, yaw),
    localToWorld(r.maxX, r.maxZ, x, z, yaw),
  ];
  return {
    minX: Math.min(...corners.map((p) => p.x)),
    maxX: Math.max(...corners.map((p) => p.x)),
    minZ: Math.min(...corners.map((p) => p.z)),
    maxZ: Math.max(...corners.map((p) => p.z)),
    h: baseY + r.h,
  };
}

export interface EstateBuildings {
  /** World colliders of both buildings (app.ts pushes them into world.boxes). */
  boxes: Box[];
}

/** Build a prefab, or return null (with one warning) so the colliders are still built when it is missing. */
function tryPrefab(id: string): THREE.Object3D | null {
  try {
    const obj = buildPrefab(id as Parameters<typeof buildPrefab>[0], { lights: false }) as THREE.Object3D;
    obj.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return obj;
  } catch (err) {
    console.warn(`estates: prefab '${id}' not available`, err);
    return null;
  }
}

/** Build Hangar Two and the Mossbank Boathouse into the scene (always, owned or not). */
export function buildEstates(scene: THREE.Scene): EstateBuildings {
  const boxes: Box[] = [];

  // Hangar Two: floor and apron on the ground, the building on its lowest footprint point.
  const H = ESTATES.hangar;
  const footprint = [
    { lx: 0, lz: 0 },
    { lx: -12, lz: -7 }, { lx: 12, lz: -7 }, { lx: -12, lz: 7 }, { lx: 12, lz: 7 },
  ].map((p) => localToWorld(p.lx, p.lz, H.x, H.z, H.yaw));
  const hangarBaseY = Math.min(...footprint.map((p) => heightAt(p.x, p.z)));

  const hangar = tryPrefab(H.prefab);
  if (hangar) {
    hangar.position.set(H.x, hangarBaseY, H.z);
    hangar.rotation.y = H.yaw;
    scene.add(hangar);
  }
  for (const r of H.walls) boxes.push(placeRect(r, H.x, H.z, H.yaw, hangarBaseY));

  const A = H.apron;
  const floor = new THREE.PlaneGeometry(A.maxX - A.minX, A.maxZ - A.minZ, 8, 12)
    .rotateX(-Math.PI / 2)
    .translate((A.minX + A.maxX) / 2, 0.02, (A.minZ + A.maxZ) / 2) // flush with the airfield apron (biomes.ts, y 0.02)
    .rotateY(H.yaw)
    .translate(H.x, 0, H.z);
  const floorMesh = new THREE.Mesh(
    addGroundToGeometry(floor),
    flatLayer(new THREE.MeshStandardMaterial({ color: 0x8c9196 }), LAYER.area),
  );
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  const sock = tryPrefab('windsock');
  if (sock) {
    const p = localToWorld(H.windsock.dx, H.windsock.dz, H.x, H.z, H.yaw);
    sock.position.set(p.x, heightAt(p.x, p.z), p.z);
    scene.add(sock);
  }

  // The Mossbank Boathouse: its deck stands a little above the loch's surface.
  const B = ESTATES.boathouse;
  const boathouseBaseY = (bodyLevel('water/loch-moss') ?? -0.65) + B.deckAboveWater;
  const boathouse = tryPrefab(B.prefab);
  if (boathouse) {
    // The prefab's origin is the post feet (prefabs sit on y 0); its walkway deck top is 2.5 above that.
    boathouse.position.set(B.x, boathouseBaseY - 2.5, B.z);
    boathouse.rotation.y = B.yaw;
    scene.add(boathouse);
  }
  for (const r of B.walls) boxes.push(placeRect(r, B.x, B.z, B.yaw, boathouseBaseY));
  for (const r of B.walkways) boxes.push(placeRect(r, B.x, B.z, B.yaw, boathouseBaseY));

  return { boxes };
}
