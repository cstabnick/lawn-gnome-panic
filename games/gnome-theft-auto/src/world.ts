// STUB (Epic 1 fills this in): builds Turfton, the roads and Fort Sandpit.
import * as THREE from 'three';
import { BASE, COLORS, LANE_OFFSET, SPAWN, WORLD_HALF } from './config';
import type { World } from './types';

export function buildWorld(scene: THREE.Scene, _renderer: THREE.WebGLRenderer): World {
  scene.background = new THREE.Color(COLORS.sky);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x446633, 1.2));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_HALF * 2, WORLD_HALF * 2), new THREE.MeshStandardMaterial({ color: COLORS.grass }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  return {
    boxes: [],
    roads: { nodes: [{ id: 0, x: 0, z: 0, links: [1] }, { id: 1, x: 0, z: 50, links: [0] }], laneOffset: LANE_OFFSET },
    walkPoints: [{ x: -7.5, z: 10 }, { x: -7.5, z: 30 }],
    spawn: { ...SPAWN },
    parked: [{ x: -10, z: 20, yaw: 0, kind: 'ride-on' }],
    base: {
      minX: BASE.minX, maxX: BASE.maxX, minZ: BASE.minZ, maxZ: BASE.maxZ,
      padX: BASE.padX, padZ: BASE.padZ, gateX: BASE.gateX, gateZ: BASE.gateZ,
      guardPosts: BASE.guardPosts.map((p) => ({ ...p })),
    },
    half: WORLD_HALF,
    update() {},
  };
}
