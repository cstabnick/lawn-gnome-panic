import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LAYER, flatLayer } from '@lawn/depth';
import {
  BODEGA,
  CITY_HALF,
  CLAY_MART,
  ROAD_WIDTH,
  SIDE_VALVE,
} from './config';
import type { Box } from './types';

export type DistrictId =
  | 'downtown'
  | 'greenhouse'
  | 'patio-heights'
  | 'old-brick'
  | 'park-arts'
  | 'industrial';

export const DISTRICT_NAMES: Record<DistrictId, string> = {
  downtown: 'Downtown Turfton',
  greenhouse: 'Greenhouse Strip',
  'patio-heights': 'Patio Heights',
  'old-brick': 'Old Brick Quarter',
  'park-arts': 'Turfton Park & Arts',
  industrial: 'Clay-Mart Industrial',
};

/**
 * Pure lookup of which Turfton district contains `(x, z)`, or `null` outside Turfton.
 * Priority order ensures the central downtown core and outer specialty districts never overlap ambiguously.
 */
export function districtAt(x: number, z: number): DistrictId | null {
  if (Math.abs(x) > CITY_HALF || Math.abs(z) > CITY_HALF) return null;
  if (Math.abs(x) <= 45 && Math.abs(z) <= 45) return 'downtown';
  if (x >= 45 && x <= 135 && z >= -65 && z <= 65) return 'greenhouse';
  if (x >= 115 && x <= 215 && z >= -215 && z <= -115) return 'patio-heights';
  if (x >= -215 && x <= -115 && z >= 115 && z <= 215) return 'industrial';
  if (x >= -185 && x <= -45 && z >= 45 && z <= 125) return 'old-brick';
  if (x >= -135 && x <= -5 && z >= -125 && z <= 65) return 'park-arts';
  if (Math.abs(x) <= 95 && Math.abs(z) <= 95) return 'downtown';
  return null;
}

function addMerged(
  scene: THREE.Scene,
  geos: THREE.BufferGeometry[],
  material: THREE.Material,
  castShadow = false,
): THREE.Mesh | null {
  if (geos.length === 0) return null;
  const geo = mergeGeometries(geos, false);
  for (const g of geos) g.dispose();
  if (!geo) return null;
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function boxGeo(w: number, h: number, d: number, x: number, y: number, z: number, ry = 0): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  if (ry !== 0) g.rotateY(ry);
  g.translate(x, y, z);
  return g;
}

function cylGeo(rt: number, rb: number, h: number, seg: number, x: number, y: number, z: number): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg);
  g.translate(x, y, z);
  return g;
}

function pushCollider(boxes: Box[], x: number, z: number, halfW: number, halfD: number, h: number): void {
  boxes.push({ minX: x - halfW, maxX: x + halfW, minZ: z - halfD, maxZ: z + halfD, h });
}

function makeWelcomeTexture(title: string, subtitle: string, bg: string, accent: string): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText(title, canvas.width / 2, 46);

  ctx.fillStyle = accent;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(subtitle, canvas.width / 2, 88);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

interface SignalGroup {
  nsRed: THREE.MeshStandardMaterial;
  nsAmber: THREE.MeshStandardMaterial;
  nsGreen: THREE.MeshStandardMaterial;
  ewRed: THREE.MeshStandardMaterial;
  ewAmber: THREE.MeshStandardMaterial;
  ewGreen: THREE.MeshStandardMaterial;
}

function overlapsBoxes(minX: number, maxX: number, minZ: number, maxZ: number, boxes: Box[], pad = 0.4): boolean {
  for (const b of boxes) {
    if (minX < b.maxX + pad && maxX > b.minX - pad && minZ < b.maxZ + pad && maxZ > b.minZ - pad) return true;
  }
  return false;
}

export function buildDistrictDressing(
  scene: THREE.Scene,
  boxes: Box[],
): { update(dt: number, nightFactor: number): void } {
  const emissiveBoostables: { mat: THREE.MeshStandardMaterial; base: number; night: number }[] = [];

  // 1. Crosswalks at the 9 central downtown intersections ([-60, 0, 60] x [-60, 0, 60])
  const crosswalkGeos: THREE.BufferGeometry[] = [];
  const stripeOffsets = [-3.6, -2.2, -0.8, 0.8, 2.2, 3.6];
  for (const ix of [-60, 0, 60]) {
    for (const iz of [-60, 0, 60]) {
      for (const s of [-1, 1]) {
        for (const off of stripeOffsets) {
          // North/South approaches
          crosswalkGeos.push(
            new THREE.PlaneGeometry(0.7, 2.6)
              .rotateX(-Math.PI / 2)
              .translate(ix + off, 0.042, iz + s * 7.2),
          );
          // East/West approaches
          crosswalkGeos.push(
            new THREE.PlaneGeometry(2.6, 0.7)
              .rotateX(-Math.PI / 2)
              .translate(ix + s * 7.2, 0.042, iz + off),
          );
        }
      }
    }
  }
  addMerged(
    scene,
    crosswalkGeos,
    flatLayer(new THREE.MeshStandardMaterial({ color: 0xf4f1de, roughness: 0.9 }), LAYER.marking),
  );

  // 2. Traffic-light gantries at the 4 core intersections (±60, 0) and (0, ±60)
  const postOffset = ROAD_WIDTH / 2 + 2.0; // 7.0m from centerline (outside lanes & sidewalks)
  const gantryPostGeos: THREE.BufferGeometry[] = [];
  const gantryBoxGeos: THREE.BufferGeometry[] = [];
  const nsRedGeos: THREE.BufferGeometry[] = [];
  const nsAmberGeos: THREE.BufferGeometry[] = [];
  const nsGreenGeos: THREE.BufferGeometry[] = [];
  const ewRedGeos: THREE.BufferGeometry[] = [];
  const ewAmberGeos: THREE.BufferGeometry[] = [];
  const ewGreenGeos: THREE.BufferGeometry[] = [];

  const coreIntersections: [number, number][] = [
    [60, 0],
    [-60, 0],
    [0, 60],
    [0, -60],
  ];
  for (const [ix, iz] of coreIntersections) {
    // Two opposite corner posts with cantilevered arms (non-coplanar: arm 0.22m < post 0.34m)
    for (const [sx, sz] of [
      [-1, -1],
      [1, 1],
    ] as const) {
      const px = ix + sx * postOffset;
      const pz = iz + sz * postOffset;
      gantryPostGeos.push(cylGeo(0.16, 0.2, 5.8, 8, px, 2.9, pz));
      pushCollider(boxes, px, pz, 0.28, 0.28, 5.8);
      // Cantilever arm toward intersection center along X
      gantryPostGeos.push(boxGeo(5.2, 0.2, 0.2, px - sx * 2.6, 5.5, pz));
      // Signal housing (proud of arm)
      const hx = px - sx * 3.8;
      gantryBoxGeos.push(boxGeo(0.46, 1.35, 0.46, hx, 5.1, pz));
      // NS lenses on +Z / -Z faces (proud by 0.05m)
      nsRedGeos.push(boxGeo(0.24, 0.24, 0.08, hx, 5.45, pz + sz * 0.24));
      nsAmberGeos.push(boxGeo(0.24, 0.24, 0.08, hx, 5.1, pz + sz * 0.24));
      nsGreenGeos.push(boxGeo(0.24, 0.24, 0.08, hx, 4.75, pz + sz * 0.24));
      // EW lenses on +X / -X faces (proud by 0.05m)
      ewRedGeos.push(boxGeo(0.08, 0.24, 0.24, hx + sx * 0.24, 5.45, pz));
      ewAmberGeos.push(boxGeo(0.08, 0.24, 0.24, hx + sx * 0.24, 5.1, pz));
      ewGreenGeos.push(boxGeo(0.08, 0.24, 0.24, hx + sx * 0.24, 4.75, pz));
    }
  }

  addMerged(scene, gantryPostGeos, new THREE.MeshStandardMaterial({ color: 0x3b4248, metalness: 0.5, roughness: 0.5 }), true);
  addMerged(scene, gantryBoxGeos, new THREE.MeshStandardMaterial({ color: 0x1e2226, roughness: 0.7 }), true);

  const signals: SignalGroup = {
    nsRed: new THREE.MeshStandardMaterial({ color: 0x3a0b0b, emissive: 0xff2b2b, emissiveIntensity: 0.1 }),
    nsAmber: new THREE.MeshStandardMaterial({ color: 0x3a2a06, emissive: 0xffb703, emissiveIntensity: 0.1 }),
    nsGreen: new THREE.MeshStandardMaterial({ color: 0x0b3a1a, emissive: 0x2ee66b, emissiveIntensity: 1.4 }),
    ewRed: new THREE.MeshStandardMaterial({ color: 0x3a0b0b, emissive: 0xff2b2b, emissiveIntensity: 1.4 }),
    ewAmber: new THREE.MeshStandardMaterial({ color: 0x3a2a06, emissive: 0xffb703, emissiveIntensity: 0.1 }),
    ewGreen: new THREE.MeshStandardMaterial({ color: 0x0b3a1a, emissive: 0x2ee66b, emissiveIntensity: 0.1 }),
  };
  addMerged(scene, nsRedGeos, signals.nsRed);
  addMerged(scene, nsAmberGeos, signals.nsAmber);
  addMerged(scene, nsGreenGeos, signals.nsGreen);
  addMerged(scene, ewRedGeos, signals.ewRed);
  addMerged(scene, ewAmberGeos, signals.ewAmber);
  addMerged(scene, ewGreenGeos, signals.ewGreen);

  // 3a. Greenhouse Strip: neon pink/cyan festoon arches & glowing planter bollards
  const ghPostGeos: THREE.BufferGeometry[] = [];
  const ghPinkGeos: THREE.BufferGeometry[] = [];
  const ghCyanGeos: THREE.BufferGeometry[] = [];
  for (const z of [-45, -15, 15, 45]) {
    for (const s of [-1, 1]) {
      ghPostGeos.push(cylGeo(0.12, 0.14, 6.4, 8, 60 + s * 6.8, 3.2, z));
      // Glowing planter bollard at sidewalk edge
      ghPostGeos.push(boxGeo(0.7, 0.6, 0.7, 60 + s * 6.8, 0.3, z + 3.2));
      ghCyanGeos.push(boxGeo(0.56, 0.18, 0.56, 60 + s * 6.8, 0.69, z + 3.2));
    }
    // Overhead neon arch beam at y = 6.3m
    ghPinkGeos.push(boxGeo(13.2, 0.24, 0.24, 60, 6.3, z));
    ghCyanGeos.push(boxGeo(11.4, 0.14, 0.32, 60, 6.08, z));
  }
  addMerged(scene, ghPostGeos, new THREE.MeshStandardMaterial({ color: 0x2b3a36, roughness: 0.6 }), true);
  const neonPinkMat = new THREE.MeshStandardMaterial({ color: 0xff4fa3, emissive: 0xff4fa3, emissiveIntensity: 0.8 });
  const neonCyanMat = new THREE.MeshStandardMaterial({ color: 0x3be8ff, emissive: 0x3be8ff, emissiveIntensity: 0.8 });
  emissiveBoostables.push({ mat: neonPinkMat, base: 0.7, night: 2.2 }, { mat: neonCyanMat, base: 0.7, night: 2.2 });
  addMerged(scene, ghPinkGeos, neonPinkMat);
  addMerged(scene, ghCyanGeos, neonCyanMat);

  // 3b. Patio Heights: manicured boxwood hedge borders & ornate bollards (clear of walls & buildings)
  const hedgeGeos: THREE.BufferGeometry[] = [];
  const patioBollardGeos: THREE.BufferGeometry[] = [];
  const patioGoldGeos: THREE.BufferGeometry[] = [];
  for (const x of [136, 164, 196]) {
    for (const z of [-136, -164]) {
      if (overlapsBoxes(x - 8, x + 8, z - 0.7, z + 0.7, boxes, 0.5)) continue;
      hedgeGeos.push(boxGeo(16, 1.0, 1.4, x, 0.5, z));
      if (z === -136) {
        for (const dx of [-8.8, 8.8]) {
          if (overlapsBoxes(x + dx - 0.3, x + dx + 0.3, z - 0.3, z + 0.3, boxes, 0.3)) continue;
          patioBollardGeos.push(cylGeo(0.22, 0.26, 1.15, 8, x + dx, 0.575, z));
          patioGoldGeos.push(cylGeo(0.25, 0.25, 0.16, 8, x + dx, 1.23, z));
        }
      }
    }
  }
  addMerged(scene, hedgeGeos, new THREE.MeshStandardMaterial({ color: 0x2f6e34, roughness: 0.9 }), true);
  addMerged(scene, patioBollardGeos, new THREE.MeshStandardMaterial({ color: 0xd8d1c2, roughness: 0.7 }), true);
  addMerged(scene, patioGoldGeos, new THREE.MeshStandardMaterial({ color: 0xd4a843, metalness: 0.6, roughness: 0.35 }));

  // 3c. Old Brick Quarter: striped shop awnings & warm string-light poles near Bodega & Side-Valve
  const awningRedGeos: THREE.BufferGeometry[] = [];
  const awningCreamGeos: THREE.BufferGeometry[] = [];
  const warmBulbGeos: THREE.BufferGeometry[] = [];
  const warmPoleGeos: THREE.BufferGeometry[] = [];

  // Bodega storefront (+X side facing road, clear of giver at BODEGA.x + 8)
  for (let i = 0; i < 4; i++) {
    const target = i % 2 === 0 ? awningRedGeos : awningCreamGeos;
    target.push(boxGeo(2.2, 0.16, 2.4, BODEGA.x + 10.2, 3.2, BODEGA.z - 4.2 + i * 2.8));
  }
  // Side-Valve storefront (-Z side facing bay)
  for (let i = 0; i < 4; i++) {
    const target = i % 2 === 0 ? awningRedGeos : awningCreamGeos;
    target.push(boxGeo(2.6, 0.16, 2.2, SIDE_VALVE.x - 4.5 + i * 3.0, 3.3, SIDE_VALVE.z - 13.2));
  }
  for (const [px, pz] of [
    [BODEGA.x + 12, BODEGA.z - 8],
    [BODEGA.x + 12, BODEGA.z + 8],
    [SIDE_VALVE.x - 10, SIDE_VALVE.z - 15],
    [SIDE_VALVE.x + 10, SIDE_VALVE.z - 15],
  ]) {
    warmPoleGeos.push(cylGeo(0.08, 0.1, 4.2, 8, px, 2.1, pz));
    warmBulbGeos.push(boxGeo(0.32, 0.32, 0.32, px, 4.35, pz));
  }
  addMerged(scene, awningRedGeos, new THREE.MeshStandardMaterial({ color: 0xb5342b, roughness: 0.85 }), true);
  addMerged(scene, awningCreamGeos, new THREE.MeshStandardMaterial({ color: 0xf0e4c8, roughness: 0.85 }), true);
  addMerged(scene, warmPoleGeos, new THREE.MeshStandardMaterial({ color: 0x3b2f26, roughness: 0.8 }), true);
  const warmBulbMat = new THREE.MeshStandardMaterial({ color: 0xffd27d, emissive: 0xffb347, emissiveIntensity: 0.7 });
  emissiveBoostables.push({ mat: warmBulbMat, base: 0.6, night: 2.0 });
  addMerged(scene, warmBulbGeos, warmBulbMat);

  // 3d. Clay-Mart Industrial: hazard apron strips (LAYER.decal), shipping containers & stacked pallets
  const hazardGeos: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    hazardGeos.push(
      new THREE.PlaneGeometry(3.2, 0.9)
        .rotateX(-Math.PI / 2)
        .translate(CLAY_MART.x - 10 + i * 4.0, 0.046, CLAY_MART.z - 21),
    );
  }
  addMerged(
    scene,
    hazardGeos,
    flatLayer(new THREE.MeshStandardMaterial({ color: 0xf4b41a, roughness: 0.85 }), LAYER.decal),
  );

  const containerGeos: THREE.BufferGeometry[] = [];
  const palletGeos: THREE.BufferGeometry[] = [];
  const containerSpots: [number, number, number][] = [
    [-195, 145, 0],
    [-195, 155, 0],
    [-138, 195, Math.PI / 2],
  ];
  for (const [cx, cz, ry] of containerSpots) {
    const hw = ry === 0 ? 3.1 : 1.25;
    const hd = ry === 0 ? 1.25 : 3.1;
    if (overlapsBoxes(cx - hw, cx + hw, cz - hd, cz + hd, boxes, 0.5)) continue;
    containerGeos.push(boxGeo(6.2, 2.7, 2.5, cx, 1.35, cz, ry));
    pushCollider(boxes, cx, cz, hw, hd, 2.7);
  }
  for (const [px, pz] of [
    [-195, 165],
    [-192, 165],
    [-145, 195],
  ]) {
    if (overlapsBoxes(px - 0.8, px + 0.8, pz - 0.8, pz + 0.8, boxes, 0.4)) continue;
    palletGeos.push(boxGeo(1.6, 0.45, 1.6, px, 0.225, pz));
    palletGeos.push(boxGeo(1.4, 0.45, 1.4, px, 0.675, pz));
  }
  addMerged(scene, containerGeos, new THREE.MeshStandardMaterial({ color: 0x3c6e8f, roughness: 0.7 }), true);
  addMerged(scene, palletGeos, new THREE.MeshStandardMaterial({ color: 0x9c7244, roughness: 0.9 }), true);

  // 3e. Turfton Park (-30, +30): decorative park gateway pillars & flowerbed strips (clear of fountain & picnic tables)
  const parkPillarGeos: THREE.BufferGeometry[] = [];
  const parkCapGeos: THREE.BufferGeometry[] = [];
  const flowerBedGeos: THREE.BufferGeometry[] = [];
  for (const [px, pz] of [
    [-14, 50],
    [-22, 50],
    [-50, 14],
    [-50, 22],
  ]) {
    if (overlapsBoxes(px - 0.7, px + 0.7, pz - 0.7, pz + 0.7, boxes, 0.5)) continue;
    parkPillarGeos.push(boxGeo(1.2, 3.0, 1.2, px, 1.5, pz));
    parkCapGeos.push(boxGeo(1.45, 0.3, 1.45, px, 3.15, pz));
    pushCollider(boxes, px, pz, 0.65, 0.65, 3.3);
  }
  for (const [fx, fz, w, d] of [
    [-35, 48, 14, 2.2],
    [-48, 35, 2.2, 14],
  ] as const) {
    if (overlapsBoxes(fx - w / 2, fx + w / 2, fz - d / 2, fz + d / 2, boxes, 0.3)) continue;
    flowerBedGeos.push(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2).translate(fx, 0.025, fz));
  }
  addMerged(scene, parkPillarGeos, new THREE.MeshStandardMaterial({ color: 0x8f8272, roughness: 0.85 }), true);
  addMerged(scene, parkCapGeos, new THREE.MeshStandardMaterial({ color: 0xc2b59b, roughness: 0.75 }), true);
  addMerged(
    scene,
    flowerBedGeos,
    flatLayer(new THREE.MeshStandardMaterial({ color: 0xd94e7a, roughness: 0.9 }), LAYER.decal),
  );

  // 3f. Snail-Coach Bus Shelters: 4 kerbside shelters along x = 0 and z = 0 (outside road lanes)
  const shelterFrameGeos: THREE.BufferGeometry[] = [];
  const shelterGlassGeos: THREE.BufferGeometry[] = [];
  const shelterSpots: [number, number, number][] = [
    [7.8, -36, 0],
    [-7.8, 36, Math.PI],
    [36, 7.8, Math.PI / 2],
    [-36, -7.8, -Math.PI / 2],
  ];
  for (const [sx, sz, ry] of shelterSpots) {
    // Frame posts & roof
    shelterFrameGeos.push(boxGeo(0.18, 2.6, 3.6, sx, 2.65, sz, ry)); // roof slab? No, rotate properly:
    const gRoof = boxGeo(1.6, 0.16, 3.8, 0, 2.68, 0).rotateY(ry).translate(sx, 0, sz);
    const gBack = boxGeo(0.12, 2.6, 3.6, 0.68, 1.3, 0).rotateY(ry).translate(sx, 0, sz);
    const gBench = boxGeo(0.5, 0.45, 2.6, 0.2, 0.225, 0).rotateY(ry).translate(sx, 0, sz);
    shelterFrameGeos.pop(); // replace placeholder
    shelterFrameGeos.push(gRoof, gBench);
    shelterGlassGeos.push(gBack);
    pushCollider(boxes, sx, sz, 0.9, 1.9, 2.7);
  }
  addMerged(scene, shelterFrameGeos, new THREE.MeshStandardMaterial({ color: 0x2f5d46, roughness: 0.6 }), true);
  addMerged(
    scene,
    shelterGlassGeos,
    new THREE.MeshStandardMaterial({ color: 0x9be2f5, transparent: true, opacity: 0.55, roughness: 0.2 }),
  );

  // 4. 4 Biome Highway Welcome Arches (clearance >= 7.5m, pillars >= 7.5m from centerline)
  const archFrameGeos: THREE.BufferGeometry[] = [];
  const archConfigs: {
    x: number;
    z: number;
    ry: number;
    title: string;
    sub: string;
    bg: string;
    accent: string;
  }[] = [
    {
      x: 222,
      z: 0,
      ry: Math.PI / 2,
      title: 'THE DUST FLATS',
      sub: 'MIND THE SANDPIT & LOW-FLYING PLANES',
      bg: '#4a3520',
      accent: '#f4c56a',
    },
    {
      x: -222,
      z: -12,
      ry: Math.PI / 2 + Math.atan2(-20, -70),
      title: 'MOSSY WOOD',
      sub: 'PLEASE DO NOT LICK THE FERNS',
      bg: '#1c3b24',
      accent: '#7de38b',
    },
    {
      x: 0,
      z: -225,
      ry: 0,
      title: 'FROSTBITE FELLS',
      sub: 'GLAZE MAY CRACK BELOW ZERO',
      bg: '#1d354d',
      accent: '#9be7ff',
    },
    {
      x: 0,
      z: 225,
      ry: 0,
      title: 'CLOVERFIELD FARMS',
      sub: 'YIELD FOR COMBINES & PRIZE PUMPKINS',
      bg: '#384a1c',
      accent: '#d8f065',
    },
  ];

  for (const a of archConfigs) {
    const halfSpan = 8.5; // pillars at ±8.5m from road centerline (>= 7.5m clearance)
    const cos = Math.cos(a.ry);
    const sin = Math.sin(a.ry);
    for (const s of [-1, 1]) {
      const px = a.x + s * halfSpan * cos;
      const pz = a.z - s * halfSpan * sin;
      archFrameGeos.push(boxGeo(1.0, 9.2, 1.0, px, 4.6, pz, a.ry));
      pushCollider(boxes, px, pz, 0.55, 0.55, 9.2);
    }
    // Crossbeam from y = 8.0m to y = 9.0m (clearance 8.0m >= 7.5m)
    archFrameGeos.push(boxGeo(halfSpan * 2 + 1.4, 1.0, 0.72, a.x, 8.5, a.z, a.ry));

    // Welcome sign board proud on both faces of crossbeam
    const tex = makeWelcomeTexture(a.title, a.sub, a.bg, a.accent);
    const signMat = new THREE.MeshStandardMaterial({
      color: tex ? 0xffffff : 0x2f3b35,
      map: tex ?? undefined,
      roughness: 0.6,
    });
    const signGeo = new THREE.BoxGeometry(11.0, 2.2, 0.14);
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(a.x, 8.5, a.z);
    signMesh.rotation.y = a.ry;
    // Offset slightly proud? Actually sign is 2.2m tall vs beam 1.0m tall, and 11.0m wide,
    // wait: beam depth is 0.72m and sign depth is 0.14m? If sign sits centered at z=0 inside beam depth 0.72,
    // the beam would cover the sign! Let's make sign depth 0.88m (proud by 0.08m on both front and back!).
    signMesh.geometry.dispose();
    signMesh.geometry = new THREE.BoxGeometry(11.0, 2.2, 0.88);
    scene.add(signMesh);
  }
  addMerged(scene, archFrameGeos, new THREE.MeshStandardMaterial({ color: 0x5c4734, roughness: 0.8 }), true);

  let clock = 0;
  return {
    update(dt: number, nightFactor: number): void {
      clock = (clock + dt) % 24;
      // 0..10: NS green, 10..12: NS amber, 12..22: EW green, 22..24: EW amber
      const nsG = clock < 10;
      const nsA = clock >= 10 && clock < 12;
      const nsR = clock >= 12;
      const ewG = clock >= 12 && clock < 22;
      const ewA = clock >= 22;
      const ewR = clock < 12;

      const glow = 1.2 + nightFactor * 1.4;
      const dim = 0.08;
      signals.nsGreen.emissiveIntensity = nsG ? glow : dim;
      signals.nsAmber.emissiveIntensity = nsA ? glow : dim;
      signals.nsRed.emissiveIntensity = nsR ? glow : dim;
      signals.ewGreen.emissiveIntensity = ewG ? glow : dim;
      signals.ewAmber.emissiveIntensity = ewA ? glow : dim;
      signals.ewRed.emissiveIntensity = ewR ? glow : dim;

      for (const item of emissiveBoostables) {
        item.mat.emissiveIntensity = item.base + (item.night - item.base) * nightFactor;
      }
    },
  };
}
