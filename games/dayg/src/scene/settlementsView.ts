// Constructed survivor settlements (defensive walls, watchtowers, spikes, crates) & biome/district visual diversity.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { PREFAB_SCALE } from '../config';
import type { RegionDef } from '../sim/types';
import type { BlockoutMap } from '../world/types';
import type { Collider } from '../world/collide';

function safePrefab(id: string): THREE.Object3D {
  try {
    const obj = buildPrefab(id);
    obj.scale.setScalar(PREFAB_SCALE);
    return obj;
  } catch {
    return new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.9 }),
    );
  }
}

export function createSettlementsView(deps: { scene: THREE.Scene; map: BlockoutMap; regions: readonly RegionDef[]; collider: Collider }): { update(dt: number): void } {
  const { scene, map, regions, collider } = deps;
  const root = new THREE.Group();
  root.name = 'dayg-settlements';
  scene.add(root);

  const postMat = new THREE.MeshStandardMaterial({ color: 0x5c3e24, roughness: 0.9 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x735232, roughness: 0.85 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x667060, roughness: 0.95 });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x4b6e3c, roughness: 0.95 });
  const sandbagMat = new THREE.MeshStandardMaterial({ color: 0xa49370, roughness: 0.95 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x2a2e30, roughness: 0.55, metalness: 0.65 });
  const lanternGlowMat = new THREE.MeshStandardMaterial({ color: 0xffd28a, emissive: 0xffa838, emissiveIntensity: 1.1, roughness: 0.3 });
  const reedMat = new THREE.MeshStandardMaterial({ color: 0x5d7a3c, roughness: 0.9 });
  const reedTipMat = new THREE.MeshStandardMaterial({ color: 0x4b3621, roughness: 0.9 });
  const limestoneMat = new THREE.MeshStandardMaterial({ color: 0xc2bea8, roughness: 0.85 });

  // Helper: watchtower ladder on the +x side of the tower
  function addLadder(parent: THREE.Group, x: number, z: number, height: number): void {
    const railGeo = new THREE.BoxGeometry(0.08, height, 0.08);
    for (const rz of [-0.26, 0.26]) {
      const rail = new THREE.Mesh(railGeo, postMat);
      rail.position.set(x, height / 2, z + rz);
      rail.castShadow = true;
      parent.add(rail);
    }
    const rungGeo = new THREE.BoxGeometry(0.06, 0.06, 0.5);
    const steps = Math.max(4, Math.floor(height / 0.42));
    for (let s = 1; s < steps; s++) {
      const rung = new THREE.Mesh(rungGeo, deckMat);
      rung.position.set(x + 0.02, s * 0.42, z);
      parent.add(rung);
    }
  }

  // Helper: covered timber guardhouse (4 pillars + pitched roof + lantern)
  function buildGuardhouse(): THREE.Group {
    const g = new THREE.Group();
    const pillarGeo = new THREE.BoxGeometry(0.2, 2.3, 0.2);
    for (const [px, pz] of [[-0.95, -0.95], [0.95, -0.95], [-0.95, 0.95], [0.95, 0.95]] as const) {
      const p = new THREE.Mesh(pillarGeo, postMat);
      p.position.set(px, 1.15, pz);
      p.castShadow = true;
      g.add(p);
    }
    // Pitched roof slopes (offset slightly at peak so they never share a coplanar face)
    const slopeGeo = new THREE.BoxGeometry(1.45, 0.14, 2.45);
    const leftSlope = new THREE.Mesh(slopeGeo, deckMat);
    leftSlope.position.set(-0.56, 2.58, 0);
    leftSlope.rotation.z = 0.42;
    leftSlope.castShadow = true;
    const rightSlope = new THREE.Mesh(slopeGeo, deckMat);
    rightSlope.position.set(0.56, 2.58, 0);
    rightSlope.rotation.z = -0.42;
    rightSlope.castShadow = true;
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 2.5), postMat);
    ridge.position.set(0, 2.88, 0);
    g.add(leftSlope, rightSlope, ridge);

    // Hanging lantern
    const cord = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.04), ironMat);
    cord.position.set(0, 2.52, 0);
    const globe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.22), lanternGlowMat);
    globe.position.set(0, 2.22, 0);
    const light = new THREE.PointLight(0xffb45a, 1.0, 12, 2);
    light.position.set(0, 2.15, 0);
    g.add(cord, globe, light);
    return g;
  }

  // Helper: campfire log seating ring
  function buildLogRing(): THREE.Group {
    const g = new THREE.Group();
    const logGeo = new THREE.CylinderGeometry(0.16, 0.18, 1.15, 7);
    const count = 5;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const log = new THREE.Mesh(logGeo, postMat);
      log.position.set(Math.cos(a) * 1.9, 0.16, Math.sin(a) * 1.9);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = a + Math.PI / 2;
      log.castShadow = true;
      g.add(log);
    }
    return g;
  }

  // Helper: sandbag/crate bunker
  function buildBunker(): THREE.Group {
    const g = new THREE.Group();
    const bagGeo = new THREE.BoxGeometry(0.62, 0.24, 0.34);
    for (let row = 0; row < 3; row++) {
      const count = row === 2 ? 2 : 3;
      const startX = -((count - 1) * 0.66) / 2;
      for (let col = 0; col < count; col++) {
        const bag = new THREE.Mesh(bagGeo, sandbagMat);
        bag.position.set(startX + col * 0.66, 0.12 + row * 0.25, 0);
        bag.castShadow = true;
        g.add(bag);
      }
    }
    const crate = safePrefab('crate');
    crate.position.set(0.45, 0, -0.65);
    crate.rotation.y = 0.25;
    g.add(crate);
    return g;
  }

  // 1. Fortify every haven with perimeter barricades, spike lines, supply crates, guardhouses, log rings, bunkers, and a corner watchtower with ladder.
  for (const h of map.havens) {
    const { x0, x1, z0, z1 } = h.rect;
    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    const baseY = collider.groundAt(cx, cz, h.minY + 4);

    // Corner watchtower on the NW corner of the haven
    const tx = x0 + 2.5;
    const tz = z0 + 2.5;
    const ty = collider.groundAt(tx, tz, h.minY + 4);
    const tower = new THREE.Group();
    tower.position.set(tx, ty, tz);
    const postGeo = new THREE.BoxGeometry(0.28, 3.6, 0.28);
    for (const [px, pz] of [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]] as const) {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(px, 1.8, pz);
      post.castShadow = true;
      tower.add(post);
    }
    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.22, 2.7), deckMat);
    deck.position.set(0, 3.3, 0);
    deck.castShadow = true;
    tower.add(deck);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.2, 2.9), postMat);
    roof.position.set(0, 5.1, 0);
    tower.add(roof);
    addLadder(tower, 1.42, 0, 3.35);
    const lantern = new THREE.PointLight(0xffb86a, 1.4, 16, 2);
    lantern.position.set(0, 4.3, 0);
    tower.add(lantern);
    root.add(tower);

    // Covered timber guardhouse near the east entryway
    const gx = x1 - 2.4;
    const gz = cz;
    if (collider.inBounds(gx, gz)) {
      const gy = collider.groundAt(gx, gz, h.minY + 4);
      const guardhouse = buildGuardhouse();
      guardhouse.position.set(gx, gy, gz);
      root.add(guardhouse);
    }

    // Campfire log seating ring inside the haven
    const ringX = cx + 2.2;
    const ringZ = cz + 2.2;
    if (collider.inBounds(ringX, ringZ)) {
      const ring = buildLogRing();
      ring.position.set(ringX, collider.groundAt(ringX, ringZ, h.minY + 4), ringZ);
      root.add(ring);
    }

    // Sandbag/crate bunker near south-west edge
    const bkx = x0 + 3.2;
    const bkz = z1 - 2.2;
    if (collider.inBounds(bkx, bkz)) {
      const bunker = buildBunker();
      bunker.position.set(bkx, collider.groundAt(bkx, bkz, h.minY + 4), bkz);
      bunker.rotation.y = 0.4;
      root.add(bunker);
    }

    // Perimeter defensive walls & spikes along the ground around the haven (leaving wide 4+ gm entryways).
    const edges: [number, number, number][] = [
      [x0 - 2.2, cz - 5, 0],
      [x0 - 2.2, cz + 5, 0],
      [x1 + 2.2, cz - 5, 0],
      [x1 + 2.2, cz + 5, 0],
      [cx - 5, z0 - 2.2, Math.PI / 2],
      [cx + 5, z0 - 2.2, Math.PI / 2],
    ];
    edges.forEach(([ex, ez, rot], i) => {
      if (!collider.inBounds(ex, ez)) return;
      const ey = collider.groundAt(ex, ez, 4);
      if (ey > 4) return;
      const wall = safePrefab(i % 2 === 0 ? 'barricade' : 'plank-wall');
      wall.position.set(ex, ey, ez);
      wall.rotation.y = rot;
      root.add(wall);

      const spike = safePrefab('spike-line');
      const sx = ex + (rot === 0 ? (ex < cx ? -1.4 : 1.4) : 0);
      const sz = ez + (rot !== 0 ? (ez < cz ? -1.4 : 1.4) : 0);
      if (collider.inBounds(sx, sz)) {
        spike.position.set(sx, collider.groundAt(sx, sz, 4), sz);
        spike.rotation.y = rot;
        root.add(spike);
      }

      // Register a compact collider block for the defensive barricade (never overlapping doorways).
      collider.addBlock({
        id: `settle-${h.id}-${i}`,
        kind: 'wall',
        x0: ex - 0.8, x1: ex + 0.8,
        z0: ez - 0.8, z1: ez + 0.8,
        y: ey, h: 1.8,
      });
    });

    // Supply crates inside the haven
    for (const [ox, oz] of [[4, -4], [-4, 4]] as const) {
      const bx = cx + ox, bz = cz + oz;
      const crate = safePrefab('crate');
      crate.position.set(bx, baseY, bz);
      root.add(crate);
    }
  }

  // 2. Biome / district visual diversity props across regions.
  const rockGeo = new THREE.DodecahedronGeometry(0.65, 0);
  regions.forEach((r, idx) => {
    const cx = (r.rect.x0 + r.rect.x1) / 2;
    const cz = (r.rect.z0 + r.rect.z1) / 2;
    const dx = (idx % 2 === 0 ? 1 : -1) * 9;
    const dz = (idx % 3 === 0 ? 1 : -1) * 9;
    const px = Math.min(r.rect.x1 - 3, Math.max(r.rect.x0 + 3, cx + dx));
    const pz = Math.min(r.rect.z1 - 3, Math.max(r.rect.z0 + 3, cz + dz));
    if (!collider.inBounds(px, pz)) return;
    const py = collider.groundAt(px, pz, 4);
    if (py > 4) return;
    if (r.traits.includes('FLOODS') || r.id === 'the-sinks') {
      // Wooden boardwalk + tall reeds
      const walk = new THREE.Group();
      walk.position.set(px, py, pz);
      walk.rotation.y = (idx % 2) * 0.6;
      const beamGeo = new THREE.BoxGeometry(0.14, 0.14, 4.4);
      for (const bx of [-0.55, 0.55]) {
        const beam = new THREE.Mesh(beamGeo, postMat);
        beam.position.set(bx, 0.08, 0);
        walk.add(beam);
      }
      const plankGeo = new THREE.BoxGeometry(1.4, 0.07, 0.34);
      for (let p = 0; p < 10; p++) {
        const plank = new THREE.Mesh(plankGeo, deckMat);
        plank.position.set(0, 0.19, -1.95 + p * 0.43);
        walk.add(plank);
      }
      for (let c = 0; c < 6; c++) {
        const rx = (c % 2 === 0 ? -1.15 : 1.15) + ((c * 0.17) % 0.3);
        const rz = -1.6 + c * 0.65;
        const h = 1.15 + (c % 3) * 0.32;
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, h, 5), reedMat);
        stalk.position.set(rx, h / 2, rz);
        const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.24, 5), reedTipMat);
        tip.position.set(rx, h + 0.06, rz);
        walk.add(stalk, tip);
      }
      root.add(walk);
    } else if (r.traits.includes('MOSSY') || r.id === 'ivy-rows') {
      // Mossy stone arch
      const arch = new THREE.Group();
      arch.position.set(px, py, pz);
      arch.rotation.y = (idx * 0.7) % Math.PI;
      const colGeo = new THREE.BoxGeometry(0.55, 2.2, 0.55);
      for (const ax of [-1.0, 1.0]) {
        const col = new THREE.Mesh(colGeo, rockMat);
        col.position.set(ax, 1.1, 0);
        col.castShadow = true;
        arch.add(col);
      }
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.45, 0.62), rockMat);
      lintel.position.set(0, 2.44, 0);
      lintel.castShadow = true;
      const mossCap = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 0.52), mossMat);
      mossCap.position.set(-0.15, 2.74, 0);
      arch.add(lintel, mossCap);
      root.add(arch);
    } else if (r.id === 'masons-corner') {
      // Mason plinth stacks
      const stack = new THREE.Group();
      stack.position.set(px, py, pz);
      const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.5), limestoneMat);
      basePlinth.position.set(0, 0.25, 0);
      const midPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.48, 1.05), limestoneMat);
      midPlinth.position.set(0.05, 0.75, -0.04);
      midPlinth.rotation.y = 0.22;
      const topBlock = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.44, 0.6), limestoneMat);
      topBlock.position.set(-0.08, 1.22, 0.06);
      topBlock.rotation.y = -0.35;
      stack.add(basePlinth, midPlinth, topBlock);
      root.add(stack);
    } else if (r.id === 'forecourt') {
      // Iron streetlamp post
      const lamp = new THREE.Group();
      lamp.position.set(px, py, pz);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.2, 8), ironMat);
      pole.position.set(0, 1.6, 0);
      pole.castShadow = true;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.08), ironMat);
      arm.position.set(0.28, 3.12, 0);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.34, 0.26), lanternGlowMat);
      head.position.set(0.54, 2.9, 0);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.34), ironMat);
      cap.position.set(0.54, 3.12, 0);
      const glow = new THREE.PointLight(0xffcb78, 1.1, 14, 2);
      glow.position.set(0.54, 2.85, 0);
      lamp.add(pole, arm, head, cap, glow);
      root.add(lamp);
    } else if (r.traits.includes('HUSH')) {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(px, py + 0.35, pz);
      rock.scale.set(1.3, 0.8, 1.1);
      root.add(rock);
    } else {
      const prop = safePrefab(idx % 2 === 0 ? 'wooden-chest' : 'crate');
      prop.position.set(px, py, pz);
      prop.rotation.y = (idx * 1.1) % Math.PI;
      root.add(prop);
    }
  });

  return { update() {} };
}
