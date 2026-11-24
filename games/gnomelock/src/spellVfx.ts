// Upgraded multi-part 3D animated spell effects for all 32 Gnomelock abilities + bomb explosions.
import * as THREE from 'three';
import { flatLayer, LAYER } from '@lawn/depth';
import type { VfxSystem } from './particles';
import type { AbilitySlot, HeroId } from './sim/config';

export interface SpellFx {
  obj: THREE.Object3D;
  ttl: number;
  maxTtl: number;
  update: (t: number, dt: number) => void; // t = 0..1 progress
}

function ringMesh(radius: number, color: number, opacity = 0.85): THREE.Mesh {
  const geo = new THREE.RingGeometry(Math.max(0.1, radius - 0.28), radius, 32);
  geo.rotateX(-Math.PI / 2);
  const mat = flatLayer(
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide }),
    LAYER.marker,
  );
  return new THREE.Mesh(geo, mat);
}

function beamMesh(
  ox: number,
  oy: number,
  oz: number,
  tx: number,
  ty: number,
  tz: number,
  radius: number,
  color: number,
): THREE.Mesh {
  const start = new THREE.Vector3(ox, oy, oz);
  const end = new THREE.Vector3(tx, ty, tz);
  const dist = Math.max(0.4, start.distanceTo(end));
  const geo = new THREE.CylinderGeometry(radius, radius, dist, 10);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.88 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(start).lerp(end, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
  return mesh;
}

export function createSpellVfx(
  scene: THREE.Scene,
  vfx: VfxSystem,
  heroId: HeroId,
  slot: AbilitySlot,
  ox: number,
  oy: number,
  oz: number,
  tx: number,
  ty: number,
  tz: number,
): SpellFx {
  const grp = new THREE.Group();
  let maxTtl = 0.5;
  let update: (t: number, dt: number) => void = (t) => {
    grp.scale.setScalar(1 + t * 0.6);
  };

  if (heroId === 'hookwort') {
    if (slot === 'Q') {
      // Garden Hook: segmented brass hose links + 3-prong claw + sparks
      maxTtl = 0.44;
      const line = beamMesh(ox, oy, oz, tx, ty, tz, 0.09, 0xd4a017);
      const claw = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.32, 0.07, 6, 14, Math.PI * 1.45),
        new THREE.MeshBasicMaterial({ color: 0xffd54f }),
      );
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.14, 0.45, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      claw.add(ring, spike);
      claw.position.set(tx, ty, tz);
      vfx.burst(tx, ty, tz, 0xffd54f, 10, { speed: 7, up: 3 });
      grp.add(line, claw);
      update = (t) => {
        const s = t < 0.45 ? t / 0.45 : (1 - t) / 0.55;
        claw.position.set(ox + (tx - ox) * s, oy + (ty - oy) * s, oz + (tz - oz) * s);
        claw.rotation.z += 0.35;
      };
    } else if (slot === 'E') {
      maxTtl = 0.45;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(1.7, 2.9, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xff9f43, transparent: true, opacity: 0.78, side: THREE.DoubleSide }),
      );
      const fist = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.55, 0),
        new THREE.MeshBasicMaterial({ color: 0xd9814f }),
      );
      cone.position.set(ox, oy + 0.4, oz);
      fist.position.set(ox, oy + 0.3, oz);
      vfx.burst(ox, oy + 0.6, oz, 0xff9f43, 12, { speed: 7, up: 7 });
      grp.add(cone, fist);
      update = (t) => {
        cone.position.y = oy + 0.4 + t * 2.5;
        fist.position.y = oy + 0.3 + t * 3.2;
        fist.rotation.y += 0.25;
        cone.scale.set(1 + t * 0.9, 1 + t * 0.6, 1 + t * 0.9);
        (cone.material as THREE.MeshBasicMaterial).opacity = 0.78 * (1 - t);
      };
    } else if (slot === 'F') {
      maxTtl = 0.38;
      const ball = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.35, 0),
        new THREE.MeshBasicMaterial({ color: 0xff7a1a }),
      );
      grp.add(ball);
      update = (t, dt) => {
        ball.position.set(
          ox + (tx - ox) * t,
          oy + (ty - oy) * t + Math.sin(t * Math.PI) * 2.8,
          oz + (tz - oz) * t,
        );
        ball.rotation.x += dt * 12;
        ball.rotation.y += dt * 9;
      };
    } else {
      // Hyper Sprinkler: dual-core pressurized water beam
      maxTtl = 0.52;
      const core = beamMesh(ox, oy, oz, tx, ty, tz, 0.14, 0xffffff);
      const outer = beamMesh(ox, oy, oz, tx, ty, tz, 0.34, 0x4fd8ff);
      vfx.burst(tx, ty, tz, 0x4fd8ff, 14, { speed: 9, up: 4 });
      grp.add(outer, core);
      update = (t) => {
        const s = 1 - t * 0.55;
        outer.scale.set(s, 1, s);
        core.scale.set(s, 1, s);
        (outer.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - t);
      };
    }
  } else if (heroId === 'buckshot') {
    if (slot === 'Q') {
      maxTtl = 0.48;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.85, 0.09, 8, 20),
        new THREE.MeshBasicMaterial({ color: 0xffd54f }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(ox, oy, oz);
      vfx.burst(ox, oy, oz, 0xffd54f, 8, { speed: 5, up: 4 });
      grp.add(ring);
      update = (t, dt) => {
        ring.rotation.z += dt * 14;
        ring.position.y = oy + t * 1.25;
        ring.scale.setScalar(1 + t * 0.6);
      };
    } else if (slot === 'E') {
      maxTtl = 0.42;
      const halo = ringMesh(1.5, 0xff7a1a, 0.9);
      halo.position.set(ox, oy - 0.5, oz);
      vfx.burst(ox, oy + 0.2, oz, 0xff7a1a, 10, { speed: 6, up: 3 });
      grp.add(halo);
      update = (t) => {
        halo.scale.setScalar(1 + t * 1.5);
        (halo.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t);
      };
    } else if (slot === 'F') {
      maxTtl = 0.52;
      const r1 = ringMesh(1.3, 0x4fd8ff, 0.85);
      const r2 = ringMesh(1.9, 0x4fd8ff, 0.65);
      r1.position.set(ox, oy - 0.5, oz);
      r2.position.set(ox, oy - 0.2, oz);
      vfx.dustPuff(ox, oy - 0.5, oz, 0x4fd8ff, 6, 2.0);
      grp.add(r1, r2);
      update = (t) => {
        r1.scale.setScalar(1 + t * 2.0);
        r2.scale.setScalar(1 + t * 2.6);
      };
    } else {
      // Full-Auto Overdrive aura + twin brass rings
      maxTtl = 0.78;
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(1.4, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0xff4d6d, transparent: true, opacity: 0.48, wireframe: true }),
      );
      const r1 = new THREE.Mesh(
        new THREE.TorusGeometry(1.3, 0.08, 8, 22),
        new THREE.MeshBasicMaterial({ color: 0xffd54f }),
      );
      dome.position.set(ox, oy, oz);
      r1.position.set(ox, oy, oz);
      vfx.burst(ox, oy + 0.4, oz, 0xffd54f, 16, { speed: 9, up: 5 });
      grp.add(dome, r1);
      update = (t, dt) => {
        dome.rotation.y += dt * 9;
        r1.rotation.x += dt * 7;
        r1.rotation.y -= dt * 6;
        dome.scale.setScalar(1 + Math.sin(t * Math.PI) * 0.9);
        (dome.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - t);
      };
    }
  } else if (heroId === 'thistle') {
    if (slot === 'Q') {
      maxTtl = 0.28;
      const bolt = beamMesh(ox, oy, oz, tx, ty, tz, 0.16, 0xa65cff);
      vfx.burst(tx, ty, tz, 0xa65cff, 9, { speed: 6, up: 3 });
      grp.add(bolt);
      update = (t) => {
        (bolt.material as THREE.MeshBasicMaterial).opacity = 0.92 * (1 - t);
      };
    } else if (slot === 'E') {
      maxTtl = 0.45;
      const pod = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.5, 0),
        new THREE.MeshBasicMaterial({ color: 0x7cc44f }),
      );
      vfx.burst(tx, ty, tz, 0x7cc44f, 10, { speed: 6, up: 3.5 });
      grp.add(pod);
      update = (t) => {
        pod.position.set(ox + (tx - ox) * t, oy + (ty - oy) * t + Math.sin(t * Math.PI) * 2.0, oz + (tz - oz) * t);
        pod.rotation.x += 0.25;
      };
    } else if (slot === 'F') {
      maxTtl = 0.48;
      const ring = ringMesh(1.6, 0x3df5c8, 0.9);
      ring.position.set(ox, oy - 0.5, oz);
      vfx.dustPuff(ox, oy - 0.4, oz, 0x3df5c8, 6, 1.9);
      grp.add(ring);
      update = (t) => {
        ring.scale.setScalar(1 + t * 1.7);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t);
      };
    } else {
      // Bloom Frenzy: multi-petal lotus + magenta sparkles
      maxTtl = 0.8;
      const lotus = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.95, 0.16, 32, 6),
        new THREE.MeshBasicMaterial({ color: 0xff6fd0, transparent: true, opacity: 0.85 }),
      );
      lotus.position.set(ox, oy + 0.35, oz);
      vfx.burst(ox, oy + 0.5, oz, 0xff6fd0, 18, { speed: 8, up: 6 });
      grp.add(lotus);
      update = (t, dt) => {
        lotus.rotation.y += dt * 8;
        lotus.scale.setScalar(1 + t * 1.6);
        (lotus.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - t);
      };
    }
  } else if (heroId === 'loam') {
    if (slot === 'Q') {
      maxTtl = 0.55;
      const r1 = ringMesh(2.4, 0xa65cff, 0.95);
      const r2 = ringMesh(3.6, 0xc084fc, 0.75);
      r1.position.set(ox, oy - 0.5, oz);
      r2.position.set(ox, oy - 0.4, oz);
      vfx.burst(ox, oy + 0.2, oz, 0xa65cff, 16, { speed: 9, up: 7 });
      grp.add(r1, r2);
      update = (t) => {
        r1.scale.setScalar(0.4 + t * 2.6);
        r2.scale.setScalar(0.3 + t * 2.9);
        (r1.material as THREE.MeshBasicMaterial).opacity = 0.95 * (1 - t);
        (r2.material as THREE.MeshBasicMaterial).opacity = 0.75 * (1 - t);
      };
    } else if (slot === 'E') {
      maxTtl = 0.58;
      const p1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.9, 0.11, 8, 22),
        new THREE.MeshBasicMaterial({ color: 0x4fd8ff }),
      );
      p1.position.set(ox, oy, oz);
      const p2 = p1.clone();
      p2.position.set(tx, ty, tz);
      vfx.burst(ox, oy, oz, 0x4fd8ff, 8, { speed: 5, up: 2 });
      vfx.burst(tx, ty, tz, 0xa65cff, 10, { speed: 6, up: 3 });
      grp.add(p1, p2);
      update = (t, dt) => {
        p1.rotation.z += dt * 11;
        p2.rotation.z -= dt * 11;
        p1.scale.setScalar(1 - t * 0.75);
        p2.scale.setScalar(0.5 + t * 0.85);
      };
    } else if (slot === 'F') {
      maxTtl = 0.7;
      const healRing = ringMesh(3.8, 0x5cff7a, 0.82);
      healRing.position.set(ox, oy - 0.5, oz);
      vfx.burst(ox, oy + 0.3, oz, 0x5cff7a, 14, { speed: 5, up: 6 });
      grp.add(healRing);
      update = (t) => {
        healRing.position.y = oy - 0.5 + t * 1.8;
        (healRing.material as THREE.MeshBasicMaterial).opacity = 0.82 * (1 - t);
      };
    } else {
      maxTtl = 0.75;
      const implosion = new THREE.Mesh(
        new THREE.SphereGeometry(3.6, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.6, wireframe: true }),
      );
      implosion.position.set(tx, ty, tz);
      vfx.burst(tx, ty, tz, 0xc084fc, 22, { speed: 11, up: 4 });
      grp.add(implosion);
      update = (t, dt) => {
        implosion.rotation.y += dt * 10;
        implosion.scale.setScalar(Math.max(0.15, 1.5 - t * 1.35));
      };
    }
  } else if (heroId === 'bramble') {
    if (slot === 'Q') {
      maxTtl = 0.45;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, 2.5, 10),
        new THREE.MeshBasicMaterial({ color: 0xff9f43, transparent: true, opacity: 0.75 }),
      );
      cone.rotation.x = Math.PI / 2;
      cone.position.set(ox, oy, oz);
      vfx.dustPuff(ox, oy - 0.4, oz, 0xd9814f, 6, 2.0);
      grp.add(cone);
      update = (t) => {
        cone.position.set(ox + (tx - ox) * t * 0.65, oy, oz + (tz - oz) * t * 0.65);
        (cone.material as THREE.MeshBasicMaterial).opacity = 0.75 * (1 - t);
      };
    } else if (slot === 'E') {
      maxTtl = 0.55;
      const shield = new THREE.Mesh(
        new THREE.CylinderGeometry(1.15, 1.15, 1.5, 14, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xd9814f, transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
      );
      shield.position.set(ox, oy, oz);
      grp.add(shield);
      update = (t) => {
        shield.scale.setScalar(1 + t * 0.55);
        (shield.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - t);
      };
    } else if (slot === 'F') {
      maxTtl = 0.5;
      const ring = ringMesh(2.8, 0x5ca844, 0.9);
      ring.position.set(tx, ty - 0.5, tz);
      vfx.burst(tx, ty, tz, 0x5ca844, 12, { speed: 6, up: 4 });
      grp.add(ring);
      update = (t) => {
        ring.scale.setScalar(0.5 + t * 1.4);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t);
      };
    } else {
      // Lawn-Roller Slam: twin shockwaves + flying clay chunks
      maxTtl = 0.7;
      const w1 = ringMesh(4.6, 0xff6b6b, 0.92);
      const w2 = ringMesh(3.2, 0xffd54f, 0.85);
      w1.position.set(ox, oy - 0.6, oz);
      w2.position.set(ox, oy - 0.5, oz);
      vfx.burst(ox, oy, oz, 0xd9814f, 22, { speed: 12, up: 8 });
      grp.add(w1, w2);
      update = (t) => {
        w1.scale.setScalar(0.3 + t * 2.0);
        w2.scale.setScalar(0.2 + t * 1.6);
        (w1.material as THREE.MeshBasicMaterial).opacity = 0.92 * (1 - t);
        (w2.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - t);
      };
    }
  } else if (heroId === 'tansy') {
    if (slot === 'Q') {
      maxTtl = 0.42;
      const burst = ringMesh(1.5, 0xf2a3c4, 0.9);
      burst.position.set(ox, oy - 0.4, oz);
      vfx.burst(ox, oy, oz, 0xf2a3c4, 10, { speed: 7, up: 3 });
      grp.add(burst);
      update = (t) => {
        burst.scale.setScalar(1 + t * 1.9);
        (burst.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t);
      };
    } else if (slot === 'E') {
      maxTtl = 0.35;
      for (let i = -1; i <= 1; i++) {
        const b = beamMesh(ox, oy, oz, tx + i * 1.4, ty, tz, 0.08, 0x7cc44f);
        grp.add(b);
      }
      vfx.burst(tx, ty, tz, 0x7cc44f, 8, { speed: 6, up: 3 });
      update = (t) => {
        grp.children.forEach((c) => {
          ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t);
        });
      };
    } else if (slot === 'F') {
      maxTtl = 0.68;
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(1.6, 12, 10),
        new THREE.MeshBasicMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.48 }),
      );
      puff.position.set(ox, oy, oz);
      vfx.dustPuff(ox, oy, oz, 0xf4f4f0, 8, 2.2);
      grp.add(puff);
      update = (t) => {
        puff.scale.setScalar(1 + t * 1.4);
        (puff.material as THREE.MeshBasicMaterial).opacity = 0.48 * (1 - t);
      };
    } else {
      // Acorn Barrage: 7 streaking golden bolts in a cone
      maxTtl = 0.58;
      for (let i = -3; i <= 3; i++) {
        const b = beamMesh(ox, oy, oz, tx + i * 1.1, ty + (Math.abs(i) % 2) * 0.4, tz, 0.09, 0xffd54f);
        grp.add(b);
      }
      vfx.burst(tx, ty, tz, 0xffd54f, 16, { speed: 9, up: 4 });
      update = (t) => {
        grp.children.forEach((c) => {
          ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t);
        });
      };
    }
  } else if (heroId === 'fernwick') {
    if (slot === 'Q') {
      maxTtl = 0.38;
      const flask = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffa94d }),
      );
      grp.add(flask);
      update = (t) => {
        flask.position.set(ox + (tx - ox) * t, oy + (ty - oy) * t + Math.sin(t * Math.PI) * 2.4, oz + (tz - oz) * t);
      };
    } else if (slot === 'E') {
      // Glaze Bolt: multi-segment jagged 3D lightning zigzag!
      maxTtl = 0.38;
      const pts: THREE.Vector3[] = [];
      const segs = 6;
      for (let i = 0; i <= segs; i++) {
        const f = i / segs;
        const jx = i === 0 || i === segs ? 0 : (Math.random() - 0.5) * 1.2;
        const jy = i === 0 || i === segs ? 0 : (Math.random() - 0.5) * 1.0;
        pts.push(new THREE.Vector3(ox + (tx - ox) * f + jx, oy + (ty - oy) * f + jy, oz + (tz - oz) * f));
      }
      for (let i = 0; i < segs; i++) {
        grp.add(beamMesh(pts[i].x, pts[i].y, pts[i].z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z, 0.11, 0x4fd8ff));
      }
      vfx.burst(tx, ty, tz, 0x4fd8ff, 12, { speed: 8, up: 4 });
      update = (t) => {
        grp.children.forEach((c) => {
          ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.95 * (1 - t);
        });
      };
    } else if (slot === 'F') {
      maxTtl = 0.58;
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.95, 1.35, 6.0, 14, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.6, side: THREE.DoubleSide }),
      );
      col.position.set(ox, oy + 1.6, oz);
      vfx.burst(ox, oy + 0.5, oz, 0xffd54f, 10, { speed: 5, up: 7 });
      grp.add(col);
      update = (t) => {
        col.scale.set(1 + t * 0.45, 1, 1 + t * 0.45);
        (col.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - t);
      };
    } else {
      // Kiln Overheat: fiery multi-ring dome + embers
      maxTtl = 0.75;
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(2.6, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0xff4d6d, transparent: true, opacity: 0.55, wireframe: true }),
      );
      const r = ringMesh(3.8, 0xffa94d, 0.9);
      dome.position.set(ox, oy, oz);
      r.position.set(ox, oy - 0.5, oz);
      vfx.burst(ox, oy + 0.5, oz, 0xff7a1a, 24, { speed: 12, up: 6 });
      grp.add(dome, r);
      update = (t) => {
        dome.scale.setScalar(1 + t * 3.4);
        r.scale.setScalar(0.5 + t * 2.4);
        (dome.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - t);
      };
    }
  } else {
    // potsworth
    if (slot === 'Q') {
      maxTtl = 0.48;
      const ring = ringMesh(1.7, 0x93c5fd, 0.9);
      ring.position.set(ox, oy - 0.5, oz);
      vfx.burst(ox, oy, oz, 0x93c5fd, 8, { speed: 5, up: 3 });
      grp.add(ring);
      update = (t) => {
        ring.scale.setScalar(0.5 + t * 1.5);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t);
      };
    } else if (slot === 'E') {
      maxTtl = 0.55;
      const tether = beamMesh(ox, oy, oz, tx, ty, tz, 0.14, 0x4fd8ff);
      const cuff = ringMesh(1.4, 0x4fd8ff, 0.9);
      cuff.position.set(tx, ty - 0.4, tz);
      vfx.burst(tx, ty, tz, 0x4fd8ff, 10, { speed: 6, up: 3 });
      grp.add(tether, cuff);
      update = (t) => {
        (tether.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t);
        cuff.scale.setScalar(1.3 - t * 0.6);
      };
    } else if (slot === 'F') {
      maxTtl = 0.55;
      const g1 = ringMesh(2.1, 0xa5d8ff, 0.9);
      const g2 = ringMesh(1.5, 0xffffff, 0.75);
      g1.position.set(ox, oy - 0.4, oz);
      g2.position.set(ox, oy, oz);
      vfx.dustPuff(ox, oy - 0.4, oz, 0xa5d8ff, 7, 2.2);
      grp.add(g1, g2);
      update = (t) => {
        g1.position.y = oy - 0.4 + t * 3.4;
        g2.position.y = oy + t * 4.0;
        g1.scale.setScalar(1 + t * 1.1);
      };
    } else {
      // Golden Tall-Eye railgun beam + 5 concentric shock rings along path
      maxTtl = 0.6;
      const rail = beamMesh(ox, oy, oz, tx, ty, tz, 0.28, 0xffd54f);
      grp.add(rail);
      for (let i = 1; i <= 5; i++) {
        const f = i / 6;
        const sr = new THREE.Mesh(
          new THREE.TorusGeometry(0.55, 0.06, 6, 16),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }),
        );
        sr.position.set(ox + (tx - ox) * f, oy + (ty - oy) * f, oz + (tz - oz) * f);
        sr.lookAt(tx, ty, tz);
        grp.add(sr);
      }
      vfx.burst(tx, ty, tz, 0xffd54f, 18, { speed: 10, up: 5 });
      update = (t) => {
        rail.scale.set(1 - t * 0.7, 1, 1 - t * 0.7);
        (rail.material as THREE.MeshBasicMaterial).opacity = 0.95 * (1 - t);
      };
    }
  }

  scene.add(grp);
  return { obj: grp, ttl: maxTtl, maxTtl, update };
}

export function createBombExplosionVfx(
  scene: THREE.Scene,
  vfx: VfxSystem,
  x: number,
  y: number,
  z: number,
  radius: number,
): SpellFx {
  const grp = new THREE.Group();
  grp.position.set(x, y + 0.5, z);
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1.3, 14, 10),
    new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.85 }),
  );
  const ring = ringMesh(radius, 0xffd54f, 0.95);
  ring.position.y = -0.45;
  vfx.burst(x, y + 0.6, z, 0xff7a1a, 24, { speed: 12, up: 8 });
  vfx.burst(x, y + 0.6, z, 0xffd54f, 14, { speed: 9, up: 6 });
  grp.add(core, ring);
  scene.add(grp);
  return {
    obj: grp,
    ttl: 0.6,
    maxTtl: 0.6,
    update: (t) => {
      core.scale.setScalar(1 + t * 3.0);
      (core.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - t);
      ring.scale.setScalar(0.3 + t * 0.95);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.95 * (1 - t);
    },
  };
}
