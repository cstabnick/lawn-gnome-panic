// Soft glows on the ground at every place that does something (portals and game spots), so they are easy to find.
import * as THREE from 'three';
import type { MapDef, SpotDef } from './config';

export interface MapExtra {
  /** dt = seconds since the last frame, t = seconds since the page loaded. */
  update(dt: number, t: number): void;
}

interface Pulse {
  group: THREE.Group;
  disc: THREE.MeshBasicMaterial;
  ring: THREE.MeshBasicMaterial;
  shaft?: THREE.MeshBasicMaterial;
  phase: number;
}

const GOLD = 0xffd37a;
const CASINO = 0x7dff9a;
const GOLF = 0x9dffd0;
const CYAN = 0x7fe3ff;

const GLOW_Y = 0.03;
const PULSE_SPEED = 1.6;

/** A soft white-to-transparent radial gradient, tinted per glow by the material colour. */
function makeGradientTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  return new THREE.CanvasTexture(canvas);
}

function glowColor(spot: SpotDef): { color: number; scale: number } {
  const game = spot.game as string;
  if (game === 'blackjack' || game === 'blackjackHigh') return { color: CASINO, scale: 1 };
  if (game === 'golf') return { color: GOLF, scale: 1.4 };
  return { color: CYAN, scale: 1 };
}

/** Adds meshes to g; never touches the map data. */
export function addGlows(g: THREE.Group, map: MapDef): MapExtra {
  const texture = makeGradientTexture();
  const pulses: Pulse[] = [];
  let index = 0;

  const add = (x: number, z: number, r: number, color: number, withShaft: boolean) => {
    const phase = index * 0.7;
    index++;

    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const discMat = new THREE.MeshBasicMaterial({
      map: texture,
      color,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.55,
    });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 40), discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = GLOW_Y;
    disc.renderOrder = 1;
    disc.raycast = () => {};
    group.add(disc);

    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.55,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.6, r * 0.68, 48), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = GLOW_Y + 0.002;
    ring.renderOrder = 1;
    ring.raycast = () => {};
    group.add(ring);

    let shaft: THREE.MeshBasicMaterial | undefined;
    if (withShaft) {
      shaft = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.12,
        side: THREE.DoubleSide,
      });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.5, 2.5, 24, 1, true), shaft);
      beam.position.y = 2.5 / 2 + GLOW_Y;
      beam.renderOrder = 1;
      beam.raycast = () => {};
      group.add(beam);
    }

    g.add(group);
    pulses.push({ group, disc: discMat, ring: ringMat, shaft, phase });
  };

  for (const p of map.portals) {
    add(p.x, p.z, p.r * 1.1, GOLD, false);
  }
  for (const s of map.spots) {
    const { color, scale } = glowColor(s);
    add(s.x, s.z, s.r * 1.1 * scale, color, true);
  }

  return {
    update(_dt: number, t: number) {
      for (const p of pulses) {
        const wave = Math.sin(t * PULSE_SPEED + p.phase);
        const k = 0.5 + 0.5 * wave; // 0..1
        p.disc.opacity = 0.35 + 0.35 * k;
        p.ring.opacity = Math.min(1, 0.45 + 0.4 * k);
        p.group.scale.setScalar(1 + 0.06 * k);
      }
    },
  };
}
