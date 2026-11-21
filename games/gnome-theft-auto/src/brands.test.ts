import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CITY_HALF, HIGHWAYS, ROAD_LINES, ROAD_WIDTH, SPAWN } from './config';
import {
  BILLBOARD_SPOTS,
  BRANDS,
  billboardTexture,
  brandForVehicle,
  placeBillboards,
  type BrandId,
} from './brands';
import type { Box } from './types';

const ALL_BRAND_IDS: BrandId[] = [
  'buck-iron',
  'razor-back',
  'husky-blade',
  'black-dew',
  'stink-gro',
  'pure-loam',
  'acorn-cola',
  'dandelion-fizz',
  'chirp-and-crumb',
  'clay-mart',
  'thorne-lawn',
  'pay-n-glaze',
  'kiln-shield',
  'snail-mail',
  'pigeon-drop',
];

function pointToSegmentDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax;
  const dz = bz - az;
  const lenSq = dx * dx + dz * dz;
  if (lenSq === 0) return Math.hypot(px - ax, pz - az);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / lenSq));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

function minDistanceToHighways(x: number, z: number): number {
  let min = Infinity;
  for (const hw of HIGHWAYS) {
    for (let i = 0; i + 1 < hw.points.length; i++) {
      const [ax, az] = hw.points[i];
      const [bx, bz] = hw.points[i + 1];
      min = Math.min(min, pointToSegmentDist(x, z, ax, az, bx, bz));
    }
  }
  return min;
}

function minDistanceToRoadLines(x: number, z: number): number {
  let min = Infinity;
  if (Math.abs(z) <= CITY_HALF) {
    for (const rx of ROAD_LINES) min = Math.min(min, Math.abs(x - rx));
  }
  if (Math.abs(x) <= CITY_HALF) {
    for (const rz of ROAD_LINES) min = Math.min(min, Math.abs(z - rz));
  }
  return min;
}

describe('BRANDS registry', () => {
  it('defines all 15 brands with non-empty names, slogans, and valid hex colours', () => {
    expect(Object.keys(BRANDS).sort()).toEqual([...ALL_BRAND_IDS].sort());
    for (const id of ALL_BRAND_IDS) {
      const b = BRANDS[id];
      expect(b.id).toBe(id);
      expect(b.name.trim().length).toBeGreaterThan(0);
      expect(b.slogan.trim().length).toBeGreaterThan(0);
      expect(Number.isInteger(b.primary)).toBe(true);
      expect(b.primary).toBeGreaterThanOrEqual(0);
      expect(b.primary).toBeLessThanOrEqual(0xffffff);
      expect(Number.isInteger(b.secondary)).toBe(true);
      expect(b.secondary).toBeGreaterThanOrEqual(0);
      expect(b.secondary).toBeLessThanOrEqual(0xffffff);
    }
  });

  it('has symmetric corporate rivalries', () => {
    for (const id of ALL_BRAND_IDS) {
      const rival = BRANDS[id].rival;
      if (rival) {
        expect(BRANDS[rival]).toBeDefined();
        expect(BRANDS[rival].rival).toBe(id);
        expect(rival).not.toBe(id);
      }
    }
    expect(BRANDS['buck-iron'].rival).toBe('razor-back');
    expect(BRANDS['stink-gro'].rival).toBe('pure-loam');
    expect(BRANDS['acorn-cola'].rival).toBe('dandelion-fizz');
    expect(BRANDS['snail-mail'].rival).toBe('pigeon-drop');
  });
});

describe('brandForVehicle', () => {
  it('maps ground mower classes to their canonical manufacturers', () => {
    expect(brandForVehicle('ride-on', 0x3fa34d).id).toBe('buck-iron');
    expect(brandForVehicle('combine', 0xd8342c).id).toBe('buck-iron');
    expect(brandForVehicle('zero-turn', 0xf08a24).id).toBe('razor-back');
    expect(brandForVehicle('push-bike', 0x2f64c9).id).toBe('husky-blade');
    expect(brandForVehicle('whirligig', 0xeeeeee).id).toBe('thorne-lawn');
    expect(brandForVehicle('plane', 0xeeeeee).id).toBe('thorne-lawn');
  });
});

describe('BILLBOARD_SPOTS & placement', () => {
  it('has 16 non-overlapping spots with rivalry pairs and safe clearances', () => {
    expect(BILLBOARD_SPOTS).toHaveLength(16);
    const ids = new Set(BILLBOARD_SPOTS.map((s) => s.id));
    expect(ids.size).toBe(16);

    const hwClearance = ROAD_WIDTH / 2 + 5;
    const roadClearance = ROAD_WIDTH / 2 + 2;

    for (let i = 0; i < BILLBOARD_SPOTS.length; i++) {
      const spot = BILLBOARD_SPOTS[i];
      expect(BRANDS[spot.brand]).toBeDefined();
      expect(spot.scale).toBeGreaterThan(0);

      // Clear of SPAWN.
      expect(Math.hypot(spot.x - SPAWN.x, spot.z - SPAWN.z)).toBeGreaterThanOrEqual(12);

      // Clear of CITY grid roads.
      expect(minDistanceToRoadLines(spot.x, spot.z)).toBeGreaterThanOrEqual(roadClearance);

      // Ground-level boards must stay clear of HIGHWAYS segments.
      if (!spot.rooftop) {
        expect(minDistanceToHighways(spot.x, spot.z)).toBeGreaterThanOrEqual(hwClearance);
      }

      // Non-overlapping with every other billboard.
      for (let j = i + 1; j < BILLBOARD_SPOTS.length; j++) {
        const other = BILLBOARD_SPOTS[j];
        const dist = Math.hypot(spot.x - other.x, spot.z - other.z);
        expect(dist).toBeGreaterThanOrEqual(15);
      }
    }

    // Rivalry pairs exist along highways.
    const southPair = BILLBOARD_SPOTS.filter((s) => s.id.startsWith('south-') && (s.brand === 'buck-iron' || s.brand === 'razor-back'));
    expect(southPair).toHaveLength(2);
    const westPair = BILLBOARD_SPOTS.filter((s) => s.id.startsWith('west-') && (s.brand === 'stink-gro' || s.brand === 'pure-loam'));
    expect(westPair).toHaveLength(2);
  });

  it('caches billboardTexture per BrandId and places boards with ground colliders', () => {
    const texA = billboardTexture('buck-iron');
    const texB = billboardTexture('buck-iron');
    expect(texA).toBeInstanceOf(THREE.CanvasTexture);
    expect(texA).toBe(texB);

    const scene = new THREE.Scene();
    const boxes: Box[] = [];
    placeBillboards(scene, boxes);

    const groundCount = BILLBOARD_SPOTS.filter((s) => !s.rooftop).length;
    expect(scene.children).toHaveLength(16);
    expect(boxes).toHaveLength(groundCount);
  });
});
