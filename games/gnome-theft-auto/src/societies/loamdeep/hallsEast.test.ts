// Loamdeep's east halls (E17 B10) in node: every collider stays inside the halls and tunnels, clear of the interact spots
// and lamp points, and each hall keeps a walking line between its tunnel mouths.
import { describe, expect, it } from 'vitest';
import type { PlacedInterior } from '../../interiors/registry';
import { INTERIOR_THEMES } from '../../interiors/registry';
import { createKit } from '../../interiors/kit';
import type { Box } from '../../types';
import { LOAMDEEP } from '../config';
import { buildHallsEast } from './hallsEast';

type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };

function fakePlaced(): PlacedInterior {
  return {
    def: {
      id: 'loamdeep-test',
      name: 'Loamdeep',
      door: { x: 0, z: 0, yaw: 0 },
      exit: { x: 0, z: 0, yaw: 0 },
      size: LOAMDEEP.size,
      theme: 'burrow',
      build() {},
    },
    origin: { x: 5100, y: 0, z: 5100 },
    large: true,
    theme: INTERIOR_THEMES.burrow,
  };
}

const HALLS: Rect[] = Object.values(LOAMDEEP.halls);
const TUNNELS: Rect[] = Object.values(LOAMDEEP.tunnels);
const OPEN: Rect[] = [...HALLS, ...TUNNELS];

/** Spot points (every interact spot in config, flattened). */
function spotPoints(): [number, number][] {
  const s = LOAMDEEP.spots;
  const pts: [number, number][] = [
    s.tumblesoil, s.tumblesoilFront, s.rootPickup, s.taper, s.sortingDesk, s.decks, s.danceFloor, s.longTunnel, s.longTunnelArrive,
  ].map((p) => [p[0], p[1]] as [number, number]);
  for (const p of Object.values(s.rootDrops)) pts.push([p[0], p[1]]);
  for (const p of s.digFaces) pts.push([p[0], p[1]]);
  return pts;
}

const LAMP_PTS: [number, number][] = Object.values(LOAMDEEP.lamps).flatMap((list) => list.map((p) => [p[0], p[1]] as [number, number]));

/** The speakers are placed on their own spots by the brief; they are exempt from the spot clearance. */
const SPEAKER_PTS: [number, number][] = LOAMDEEP.spots.speakers.map((p) => [p[0], p[1]] as [number, number]);

/** Distance from a point to a rectangle (0 when inside). */
function distToRect(px: number, pz: number, r: Rect): number {
  const dx = Math.max(r.minX - px, 0, px - r.maxX);
  const dz = Math.max(r.minZ - pz, 0, pz - r.maxZ);
  return Math.hypot(dx, dz);
}

function inRect(px: number, pz: number, r: Rect): boolean {
  return px >= r.minX && px <= r.maxX && pz >= r.minZ && pz <= r.maxZ;
}

/** A box is inside the open area when every sampled point of it lies in some hall or tunnel. */
function insideOpenArea(b: Box): boolean {
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    for (let j = 0; j <= steps; j++) {
      const x = b.minX + ((b.maxX - b.minX) * i) / steps;
      const z = b.minZ + ((b.maxZ - b.minZ) * j) / steps;
      if (!OPEN.some((r) => inRect(x, z, r))) return false;
    }
  }
  return true;
}

function built(): { boxes: Box[] } {
  const { kit, build } = createKit(fakePlaced());
  kit.room({ theme: 'burrow' });
  const shell = build.boxes.length;
  buildHallsEast(kit);
  return { boxes: build.boxes.slice(shell) as Box[] };
}

describe('Loamdeep east halls', () => {
  const { boxes } = built();

  it('adds furniture and props', () => {
    expect(boxes.length).toBeGreaterThan(0);
  });

  it('keeps every collider inside the halls and tunnels', () => {
    const outside = boxes.filter((b) => !insideOpenArea(b));
    expect(outside).toEqual([]);
  });

  it('keeps colliders 1.0 m clear of every spot and lamp (speakers excepted)', () => {
    const pts = [...spotPoints(), ...LAMP_PTS];
    const bad: string[] = [];
    for (const b of boxes) {
      const rect: Rect = { minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ };
      const onSpeaker = SPEAKER_PTS.some(([x, z]) => distToRect(x, z, rect) < 0.01);
      if (onSpeaker) continue;
      for (const [x, z] of pts) {
        if (SPEAKER_PTS.some(([sx, sz]) => sx === x && sz === z)) continue;
        if (distToRect(x, z, rect) < 1.0) bad.push(`(${x}, ${z}) near box x ${b.minX}..${b.maxX} z ${b.minZ}..${b.maxZ}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('keeps a 2 m walking line between each hall\'s tunnel mouths', () => {
    const lines: [[number, number], [number, number]][] = [
      [[30, 18], [40, 12]], // Lamplight Hall: eastGallery mouth to eastRise mouth
      [[30, -30], [40, -22]], // Hearth Hall: northEast mouth to eastRise mouth
      [[0, -18], [14, -30]], // Under-Chorus Hall: mothersNorth mouth to northEast mouth
    ];
    for (const [[ax, az], [bx, bz]] of lines) {
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const x = ax + (bx - ax) * t;
        const z = az + (bz - az) * t;
        for (const b of boxes) {
          const rect: Rect = { minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ };
          expect(distToRect(x, z, rect)).toBeGreaterThanOrEqual(1.0);
        }
      }
    }
  });
});
