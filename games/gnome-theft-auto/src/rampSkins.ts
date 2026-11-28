// Stunt ramps wear their place (FX04 I5, decision D21). Every ramp keeps its exact wedge (the same top slope, lip face and
// sides ramps.ts collides with), but is skinned for where it stands: timber and turf in the parks, planks and packed earth
// for Dean's Leap, earth and tyres in the dirt, plywood, steel and snow elsewhere. Every skin keeps a painted white lip
// line and three yellow chevrons so a driver can still read it; cyan shows only as a faint ring while the ramp's stunt is
// active (stunts.ts toggles it). Mesh building only: no game logic.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab } from '@lawn/prefabs';
import { coastSign } from './coast/sign';
import { heightAt } from './terrain';
import { addGroundToGeometry } from './terrainMesh';
import type { StuntRamp } from './stunts';

export type RampSkin = 'park' | 'deans' | 'dirt' | 'city' | 'dock' | 'snow';

/** Which skin a ramp wears: park-fountain -> park; deans-leap -> deans; desert, forest and farmland ramps -> dirt;
 *  clay-mart-dock -> dock; tundra -> snow; other city ramps -> city. */
export function rampSkin(ramp: StuntRamp): RampSkin {
  if (ramp.id === 'park-fountain') return 'park';
  if (ramp.id === 'deans-leap') return 'deans';
  if (ramp.id === 'clay-mart-dock') return 'dock';
  switch (ramp.biome) {
    case 'desert':
    case 'forest':
    case 'farmland':
      return 'dirt';
    case 'tundra':
      return 'snow';
    default:
      return 'city';
  }
}

/** Local space: +z is the launch lip, -z the ground entry, +x the ramp's right. */
interface Local { ramp: StuntRamp; hw: number; hl: number; h: number; slopeAngle: number; slopeLen: number }

function localOf(ramp: StuntRamp): Local {
  return {
    ramp, hw: ramp.width / 2, hl: ramp.length / 2, h: ramp.height,
    slopeAngle: Math.atan2(ramp.height, ramp.length), slopeLen: Math.hypot(ramp.length, ramp.height),
  };
}

/** Local -> world, with the ground added (the ramp stands on the terrain). */
function toWorld(geo: THREE.BufferGeometry, ramp: StuntRamp): THREE.BufferGeometry {
  geo.rotateY(ramp.yaw);
  geo.translate(ramp.x, 0, ramp.z);
  return addGroundToGeometry(geo);
}

/** World position and yaw of a local (across, along) spot beside a ramp. */
function worldSpot(ramp: StuntRamp, across: number, along: number): { x: number; z: number } {
  const c = Math.cos(ramp.yaw);
  const s = Math.sin(ramp.yaw);
  return { x: ramp.x + across * c + along * s, z: ramp.z - across * s + along * c };
}

/** Wedge pieces in local space: the sloped top, and the lip face plus the two sides. Wound counter-clockwise seen from
 *  outside, so the normals point out (the old wedge was wound inside out and lit from below: the "black slab"). */
function wedgeTop(l: Local): THREE.BufferGeometry {
  const { hw, hl, h } = l;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    -hw, 0, -hl, hw, h, hl, hw, 0, -hl,
    -hw, 0, -hl, -hw, h, hl, hw, h, hl,
  ]), 3));
  g.computeVertexNormals();
  return g;
}

function wedgeSides(l: Local): THREE.BufferGeometry {
  const { hw, hl, h } = l;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    // Back vertical face (+z lip)
    -hw, 0, hl, hw, h, hl, -hw, h, hl,
    -hw, 0, hl, hw, 0, hl, hw, h, hl,
    // Left side (-x)
    -hw, 0, -hl, -hw, 0, hl, -hw, h, hl,
    // Right side (+x)
    hw, 0, -hl, hw, h, hl, hw, 0, hl,
  ]), 3));
  g.computeVertexNormals();
  return g;
}

/** A box lying on the slope at local (x, z): `lift` above the surface, `len` along the slope. Position and normal only. */
function slopeBox(l: Local, w: number, thick: number, len: number, x: number, z: number, lift: number): THREE.BufferGeometry {
  const y = ((z + l.hl) / l.ramp.length) * l.h + lift;
  return plain(new THREE.BoxGeometry(w, thick, len).rotateX(-l.slopeAngle).translate(x, y, z));
}

/** Drops the uv and the index so every piece merges with the wedge triangles. */
function plain(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const n = g.index ? g.toNonIndexed() : g;
  if (n !== g) g.dispose();
  n.deleteAttribute('uv');
  return n;
}

/** The faded painted wheelchair symbol (white on transparent), or null without a DOM. */
function wheelchairTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.clearRect(0, 0, 256, 256);
  ctx.strokeStyle = '#f1ead8';
  ctx.fillStyle = '#f1ead8';
  ctx.lineWidth = 17;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Head, back and seat, leg and foot, then the wheel.
  ctx.beginPath(); ctx.arc(110, 52, 18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(108, 88); ctx.lineTo(108, 150); ctx.lineTo(168, 150); ctx.lineTo(196, 214); ctx.lineTo(218, 214); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(108, 112); ctx.lineTo(160, 112); ctx.stroke();
  ctx.beginPath(); ctx.arc(104, 168, 54, Math.PI * 0.35, Math.PI * 1.4); ctx.stroke();
  // Weathered: knock a few flecks out of the paint.
  ctx.globalCompositeOperation = 'destination-out';
  let seed = 7;
  const rnd = (): number => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 70; i++) {
    ctx.beginPath(); ctx.arc(rnd() * 256, rnd() * 256, 2 + rnd() * 7, 0, Math.PI * 2); ctx.fill();
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

/** Dean's Leap's wheelchair symbol: local along-slope centre, between the first two chevrons. */
const SYMBOL_Z = -0.85;

const std = (color: number, roughness = 0.85): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color, roughness });

/** Build every ramp's dressed mesh into the scene (geometry merged per material across ramps: about 12 draw calls in
 *  total) and return the faint cyan activity rings, one per ramp id, hidden. */
export function buildRampMeshes(scene: THREE.Scene, ramps: readonly StuntRamp[]): Map<string, THREE.Object3D> {
  const mats = {
    timber: std(0x9a6b3c, 0.9),
    earth: std(0x6e5136, 0.95),
    darkSteel: std(0x2f3640, 0.6),
    galvanised: std(0x7d8791, 0.55),
    kerb: std(0xc9a227, 0.7),
    turf: std(0x3f6e30, 1),
    planks: std(0x7d6a55, 0.95),
    dirtTop: std(0x8a6a45, 0.95),
    plywood: std(0xc9a24f, 0.85),
    checker: std(0x8b9199, 0.45),
    snow: std(0xe8f0f8, 0.9),
    // On the marking layer too: a chevron's underside sits 2 cm over the slope and flickered with it from far off.
    chevron: flatLayer(new THREE.MeshStandardMaterial({ color: 0xffc82c, emissive: 0xffa600, emissiveIntensity: 0.1, roughness: 0.5 }), LAYER.marking),
    lipLine: flatLayer(std(0xf2f2ea, 0.7), LAYER.marking),
    seams: flatLayer(std(0x4a3e30, 1), LAYER.marking),
  };
  const topMat: Record<RampSkin, THREE.Material> = {
    park: mats.turf, deans: mats.planks, dirt: mats.dirtTop, city: mats.plywood, dock: mats.checker, snow: mats.snow,
  };
  const sideMat: Record<RampSkin, THREE.Material> = {
    park: mats.timber, deans: mats.earth, dirt: mats.earth, city: mats.galvanised, dock: mats.kerb, snow: mats.timber,
  };

  const parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const add = (m: THREE.Material, g: THREE.BufferGeometry): void => {
    const list = parts.get(m);
    if (list) list.push(g); else parts.set(m, [g]);
  };

  const rings = new Map<string, THREE.Object3D>();
  const ringMat = flatLayer(new THREE.MeshBasicMaterial({
    color: 0x38f2ff, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide,
  }), LAYER.decal);
  const wheelchairMap = wheelchairTexture();
  const symbolMat = wheelchairMap
    ? flatLayer(new THREE.MeshBasicMaterial({ map: wheelchairMap, transparent: true, opacity: 0.75, depthWrite: false }), LAYER.decal)
    : null;
  const props: THREE.Object3D[] = [];

  for (const ramp of ramps) {
    const l = localOf(ramp);
    const skin = rampSkin(ramp);
    const { hw, hl } = l;

    add(topMat[skin], toWorld(wedgeTop(l), ramp));
    add(sideMat[skin], toWorld(wedgeSides(l), ramp));

    // Painted white lip line, 2 cm proud, and the three yellow chevrons (0.045 lift, as ever).
    add(mats.lipLine, toWorld(slopeBox(l, ramp.width * 0.92, 0.02, 0.32, 0, hl - 0.42, 0.03), ramp));
    for (const frac of [0.3, 0.58, 0.82]) {
      add(mats.chevron, toWorld(slopeBox(l, ramp.width * 0.58, 0.05, 0.7, 0, -hl + frac * ramp.length, 0.045), ramp));
    }

    if (skin === 'park') {
      // Slim timber edge boards along each top edge, tucked just inside the side faces.
      for (const s of [-1, 1]) {
        const b = plain(new THREE.BoxGeometry(0.12, 0.14, l.slopeLen - 0.4).rotateX(-l.slopeAngle).translate(s * (hw - 0.08), ramp.height / 2 + 0.04, 0));
        add(mats.timber, toWorld(b, ramp));
      }
    }

    if (skin === 'deans') {
      // Plank seams across the slope, a hair proud.
      const chevZ = [0.3, 0.58, 0.82].map((f) => -hl + f * ramp.length);
      for (let z = -hl + 0.9; z < hl - 0.8; z += 0.95) {
        // Not under a chevron or the painted symbol: two flat layers in one place flicker.
        if (chevZ.some((c) => Math.abs(z - c) < 0.5) || Math.abs(z - SYMBOL_Z) < 1) continue;
        add(mats.seams, toWorld(slopeBox(l, ramp.width - 0.1, 0.02, 0.05, 0, z, 0.02), ramp));
      }
    }

    if (skin === 'dock') {
      // Black hazard blocks on the yellow kerb sides, on the side face but below the slope.
      for (let z = -hl + 2; z < hl - 0.5; z += 1.6) {
        const top = ((z - 0.45 + hl) / ramp.length) * ramp.height;
        if (top < 0.6) continue;
        for (const s of [-1, 1]) {
          const b = plain(new THREE.BoxGeometry(0.03, Math.min(0.5, top - 0.15), 0.8).translate(s * (hw + 0.012), 0.1 + Math.min(0.5, top - 0.15) / 2, z));
          add(mats.darkSteel, toWorld(b, ramp));
        }
      }
    }

    // Props: signs and tyres sit outside the footprint.
    const groundAt = (across: number, along: number): { x: number; y: number; z: number } => {
      const p = worldSpot(ramp, across, along);
      return { ...p, y: heightAt(p.x, p.z) };
    };
    const standSign = (text: string, opts: Parameters<typeof coastSign>[1], across: number, along: number): void => {
      const sign = coastSign(text, opts);
      const p = groundAt(across, along);
      sign.position.set(p.x, p.y, p.z);
      sign.rotation.y = ramp.yaw + Math.PI;
      props.push(sign);
    };
    if (skin === 'park') {
      standSign('NO RAMPING\n(PLEASE)', { w: 1.6, h: 0.6, post: 0.8, bg: 0xf4f1e6, fg: 0x1f4d2b }, -(hw + 1.2), -hl + 1.4);
    }
    if (skin === 'deans') {
      standSign('DONATED BY THE\nCLASS OF ——', { w: 0.9, h: 0.35, post: 0.6, bg: 0xb08d3c, fg: 0x3b2a10 }, -(hw + 1.2), -hl + 1.4);
    }
    if (skin === 'dirt') {
      const SCALE = 0.9;
      const gap = 0.8 * SCALE + 0.18;
      for (const [across, along] of [[-(hw + gap), hl - 2.2], [hw + gap, hl - 3.8], [-(hw + gap), -hl + 0.8]] as const) {
        const pile = buildPrefab('tyre-pile', { scale: SCALE });
        const p = groundAt(across, along);
        pile.position.set(p.x, p.y, p.z);
        pile.rotation.y = (across + along) * 1.7;
        props.push(pile);
      }
    }

    // The faint cyan ring: only while this ramp's stunt is active.
    const R = Math.max(ramp.width, ramp.length) / 2 + 1;
    const ring = new THREE.Mesh(new THREE.RingGeometry(R - 0.22, R, 48).rotateX(-Math.PI / 2), ringMat);
    ring.position.set(ramp.x, heightAt(ramp.x, ramp.z) + 0.06, ramp.z);
    ring.visible = false;
    ring.name = `ramp-ring-${ramp.id}`;
    scene.add(ring);
    rings.set(ramp.id, ring);
  }

  // Dean's Leap symbol: one canvas plane lying on the slope, up = launch direction.
  if (symbolMat) {
    for (const ramp of ramps) {
      if (rampSkin(ramp) !== 'deans') continue;
      const l = localOf(ramp);
      const z = SYMBOL_Z;
      const y = ((z + l.hl) / ramp.length) * l.h + 0.05;
      const geo = new THREE.PlaneGeometry(1.6, 1.6);
      geo.rotateX(-Math.PI / 2);
      geo.rotateY(Math.PI);
      geo.rotateX(-l.slopeAngle);
      geo.translate(0, y, z);
      const mesh = new THREE.Mesh(toWorld(geo, ramp), symbolMat);
      mesh.name = 'ramp-wheelchair';
      scene.add(mesh);
    }
  }

  for (const [mat, geos] of parts) {
    const merged = mergeGeometries(geos, false);
    for (const g of geos) g.dispose();
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, mat);
    const flat = mat === mats.lipLine || mat === mats.seams;
    mesh.castShadow = !flat;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  for (const p of props) {
    p.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(p);
  }
  return rings;
}
