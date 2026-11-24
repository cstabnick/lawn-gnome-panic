// 3D animated spell effects for all 32 Gnomelock abilities (8 heroes × 4 slots) + bomb explosions.
import * as THREE from 'three';
import { flatLayer, LAYER } from '@lawn/depth';
import type { AbilitySlot, HeroId } from './sim/config';

export interface SpellFx {
  obj: THREE.Object3D;
  ttl: number;
  maxTtl: number;
  update: (t: number, dt: number) => void; // t = 0..1 progress
}

function ringMesh(radius: number, color: number, opacity = 0.8): THREE.Mesh {
  const geo = new THREE.RingGeometry(Math.max(0.1, radius - 0.25), radius, 28);
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
  const geo = new THREE.CylinderGeometry(radius, radius, dist, 8);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(start).lerp(end, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
  return mesh;
}

export function createSpellVfx(
  scene: THREE.Scene,
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
  let maxTtl = 0.45;
  let update: (t: number, dt: number) => void = (t) => {
    grp.scale.setScalar(1 + t * 0.6);
  };

  if (heroId === 'hookwort') {
    if (slot === 'Q') {
      // Garden Hook: extending & retracting hose line + brass claw
      maxTtl = 0.38;
      const line = beamMesh(ox, oy, oz, tx, ty, tz, 0.08, 0xd4a017);
      const claw = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.06, 6, 12, Math.PI * 1.4),
        new THREE.MeshBasicMaterial({ color: 0xffd54f }),
      );
      claw.position.set(tx, ty, tz);
      grp.add(line, claw);
      update = (t) => {
        const s = t < 0.5 ? t * 2 : (1 - t) * 2;
        claw.position.set(ox + (tx - ox) * s, oy + (ty - oy) * s, oz + (tz - oz) * s);
        claw.rotation.z += 0.25;
      };
    } else if (slot === 'E') {
      // Mulch Uppercut: rising amber shock cone
      maxTtl = 0.4;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(1.6, 2.6, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xff9f43, transparent: true, opacity: 0.75, side: THREE.DoubleSide }),
      );
      cone.position.set(ox, oy + 0.4, oz);
      grp.add(cone);
      update = (t) => {
        cone.position.y = oy + 0.4 + t * 2.2;
        cone.scale.set(1 + t * 0.8, 1 + t * 0.5, 1 + t * 0.8);
        (cone.material as THREE.MeshBasicMaterial).opacity = 0.75 * (1 - t);
      };
    } else if (slot === 'F') {
      // Sticky Seed-Bomb: arcing toss
      maxTtl = 0.35;
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xff7a1a }),
      );
      grp.add(ball);
      update = (t) => {
        ball.position.set(
          ox + (tx - ox) * t,
          oy + (ty - oy) * t + Math.sin(t * Math.PI) * 2.6,
          oz + (tz - oz) * t,
        );
      };
    } else {
      // Hyper Sprinkler: thick pressurized water jet
      maxTtl = 0.45;
      const jet = beamMesh(ox, oy, oz, tx, ty, tz, 0.28, 0x4fd8ff);
      grp.add(jet);
      update = (t) => {
        jet.scale.set(1 - t * 0.6, 1, 1 - t * 0.6);
        (jet.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - t);
      };
    }
  } else if (heroId === 'buckshot') {
    if (slot === 'Q') {
      maxTtl = 0.45;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.8, 0.08, 8, 18),
        new THREE.MeshBasicMaterial({ color: 0xffd54f }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(ox, oy, oz);
      grp.add(ring);
      update = (t, dt) => {
        ring.rotation.z += dt * 12;
        ring.position.y = oy + t * 1.1;
        ring.scale.setScalar(1 + t * 0.5);
      };
    } else if (slot === 'E') {
      maxTtl = 0.4;
      const halo = ringMesh(1.4, 0xff7a1a, 0.85);
      halo.position.set(ox, oy - 0.5, oz);
      grp.add(halo);
      update = (t) => {
        halo.scale.setScalar(1 + t * 1.4);
        (halo.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - t);
      };
    } else if (slot === 'F') {
      maxTtl = 0.5;
      const r1 = ringMesh(1.2, 0x4fd8ff, 0.8);
      const r2 = ringMesh(1.8, 0x4fd8ff, 0.6);
      r1.position.set(ox, oy - 0.5, oz);
      r2.position.set(ox, oy - 0.3, oz);
      grp.add(r1, r2);
      update = (t) => {
        r1.scale.setScalar(1 + t * 1.8);
        r2.scale.setScalar(1 + t * 2.4);
      };
    } else {
      // Full-Auto Overdrive aura
      maxTtl = 0.7;
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(1.3, 14, 10),
        new THREE.MeshBasicMaterial({ color: 0xff4d6d, transparent: true, opacity: 0.45, wireframe: true }),
      );
      dome.position.set(ox, oy, oz);
      grp.add(dome);
      update = (t, dt) => {
        dome.rotation.y += dt * 8;
        dome.scale.setScalar(1 + Math.sin(t * Math.PI) * 0.8);
        (dome.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - t);
      };
    }
  } else if (heroId === 'thistle') {
    if (slot === 'Q') {
      // Briar Bolt projectile
      maxTtl = 0.25;
      const bolt = beamMesh(ox, oy, oz, tx, ty, tz, 0.14, 0xa65cff);
      grp.add(bolt);
      update = (t) => {
        (bolt.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t);
      };
    } else if (slot === 'E') {
      // Spore Pop cluster
      maxTtl = 0.45;
      const pod = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.45, 0),
        new THREE.MeshBasicMaterial({ color: 0x7cc44f }),
      );
      grp.add(pod);
      update = (t) => {
        pod.position.set(ox + (tx - ox) * t, oy + (ty - oy) * t + Math.sin(t * Math.PI) * 1.8, oz + (tz - oz) * t);
        pod.rotation.x += 0.2;
      };
    } else if (slot === 'F') {
      // Dew-Hop Reset
      maxTtl = 0.45;
      const ring = ringMesh(1.5, 0x3df5c8, 0.85);
      ring.position.set(ox, oy - 0.5, oz);
      grp.add(ring);
      update = (t) => {
        ring.scale.setScalar(1 + t * 1.6);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - t);
      };
    } else {
      // Bloom Frenzy expanding lotus
      maxTtl = 0.75;
      const lotus = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.9, 0.15, 28, 6),
        new THREE.MeshBasicMaterial({ color: 0xff6fd0, transparent: true, opacity: 0.8 }),
      );
      lotus.position.set(ox, oy + 0.3, oz);
      grp.add(lotus);
      update = (t, dt) => {
        lotus.rotation.y += dt * 7;
        lotus.scale.setScalar(1 + t * 1.5);
        (lotus.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - t);
      };
    }
  } else if (heroId === 'loam') {
    if (slot === 'Q') {
      // Gravity Pulse shockwave
      maxTtl = 0.5;
      const ring = ringMesh(3.2, 0xa65cff, 0.9);
      ring.position.set(ox, oy - 0.5, oz);
      grp.add(ring);
      update = (t) => {
        ring.scale.setScalar(0.4 + t * 2.4);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t);
      };
    } else if (slot === 'E') {
      // Wormhole Blink twin portals
      maxTtl = 0.55;
      const p1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.85, 0.1, 8, 20),
        new THREE.MeshBasicMaterial({ color: 0x4fd8ff }),
      );
      p1.position.set(ox, oy, oz);
      const p2 = p1.clone();
      p2.position.set(tx, ty, tz);
      grp.add(p1, p2);
      update = (t, dt) => {
        p1.rotation.z += dt * 10;
        p2.rotation.z -= dt * 10;
        const s = 1 - t * 0.7;
        p1.scale.setScalar(s);
        p2.scale.setScalar(0.5 + t * 0.8);
      };
    } else if (slot === 'F') {
      // Compost Mend healing aura
      maxTtl = 0.65;
      const healRing = ringMesh(3.5, 0x5cff7a, 0.75);
      healRing.position.set(ox, oy - 0.5, oz);
      grp.add(healRing);
      update = (t) => {
        healRing.position.y = oy - 0.5 + t * 1.6;
        (healRing.material as THREE.MeshBasicMaterial).opacity = 0.75 * (1 - t);
      };
    } else {
      // Singularity Sinkhole cast burst
      maxTtl = 0.7;
      const implosion = new THREE.Mesh(
        new THREE.SphereGeometry(3.2, 14, 12),
        new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.55, wireframe: true }),
      );
      implosion.position.set(tx, ty, tz);
      grp.add(implosion);
      update = (t, dt) => {
        implosion.rotation.y += dt * 9;
        implosion.scale.setScalar(Math.max(0.15, 1.4 - t * 1.25));
      };
    }
  } else if (heroId === 'bramble') {
    if (slot === 'Q') {
      maxTtl = 0.4;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(1.1, 2.2, 10),
        new THREE.MeshBasicMaterial({ color: 0xff9f43, transparent: true, opacity: 0.7 }),
      );
      cone.rotation.x = Math.PI / 2;
      cone.position.set(ox, oy, oz);
      grp.add(cone);
      update = (t) => {
        cone.position.set(ox + (tx - ox) * t * 0.6, oy, oz + (tz - oz) * t * 0.6);
        (cone.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - t);
      };
    } else if (slot === 'E') {
      maxTtl = 0.5;
      const shield = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 1.1, 1.4, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xd9814f, transparent: true, opacity: 0.65, side: THREE.DoubleSide }),
      );
      shield.position.set(ox, oy, oz);
      grp.add(shield);
      update = (t) => {
        shield.scale.setScalar(1 + t * 0.5);
        (shield.material as THREE.MeshBasicMaterial).opacity = 0.65 * (1 - t);
      };
    } else if (slot === 'F') {
      maxTtl = 0.45;
      const ring = ringMesh(2.5, 0x5ca844, 0.85);
      ring.position.set(tx, ty - 0.5, tz);
      grp.add(ring);
      update = (t) => {
        ring.scale.setScalar(0.5 + t * 1.3);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - t);
      };
    } else {
      // Lawn-Roller Slam
      maxTtl = 0.65;
      const wave = ringMesh(4.5, 0xff6b6b, 0.9);
      wave.position.set(ox, oy - 0.6, oz);
      grp.add(wave);
      update = (t) => {
        wave.scale.setScalar(0.3 + t * 1.8);
        (wave.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t);
      };
    }
  } else if (heroId === 'tansy') {
    if (slot === 'Q') {
      maxTtl = 0.4;
      const burst = ringMesh(1.4, 0xf2a3c4, 0.85);
      burst.position.set(ox, oy - 0.4, oz);
      grp.add(burst);
      update = (t) => {
        burst.scale.setScalar(1 + t * 1.8);
        (burst.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - t);
      };
    } else if (slot === 'E') {
      maxTtl = 0.32;
      const fan = beamMesh(ox, oy, oz, tx, ty, tz, 0.16, 0x7cc44f);
      grp.add(fan);
      update = (t) => {
        (fan.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t);
      };
    } else if (slot === 'F') {
      maxTtl = 0.65;
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.45 }),
      );
      puff.position.set(ox, oy, oz);
      grp.add(puff);
      update = (t) => {
        puff.scale.setScalar(1 + t * 1.3);
        (puff.material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - t);
      };
    } else {
      maxTtl = 0.55;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(2.8, 6.0, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
      );
      cone.position.set((ox + tx) * 0.5, oy, (oz + tz) * 0.5);
      cone.lookAt(tx, ty, tz);
      cone.rotateX(Math.PI / 2);
      grp.add(cone);
      update = (t) => {
        (cone.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - t);
      };
    }
  } else if (heroId === 'fernwick') {
    if (slot === 'Q') {
      maxTtl = 0.35;
      const flask = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffa94d }),
      );
      grp.add(flask);
      update = (t) => {
        flask.position.set(ox + (tx - ox) * t, oy + (ty - oy) * t + Math.sin(t * Math.PI) * 2.2, oz + (tz - oz) * t);
      };
    } else if (slot === 'E') {
      maxTtl = 0.35;
      const bolt = beamMesh(ox, oy, oz, tx, ty, tz, 0.2, 0x4fd8ff);
      grp.add(bolt);
      update = (t) => {
        bolt.scale.set(1 + t, 1, 1 + t);
        (bolt.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t);
      };
    } else if (slot === 'F') {
      maxTtl = 0.55;
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 1.3, 5.5, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
      );
      col.position.set(ox, oy + 1.5, oz);
      grp.add(col);
      update = (t) => {
        col.scale.set(1 + t * 0.4, 1, 1 + t * 0.4);
        (col.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - t);
      };
    } else {
      // Kiln Overheat dome
      maxTtl = 0.7;
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(2.5, 14, 10),
        new THREE.MeshBasicMaterial({ color: 0xff4d6d, transparent: true, opacity: 0.5, wireframe: true }),
      );
      dome.position.set(ox, oy, oz);
      grp.add(dome);
      update = (t) => {
        dome.scale.setScalar(1 + t * 3.2);
        (dome.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - t);
      };
    }
  } else {
    // potsworth
    if (slot === 'Q') {
      maxTtl = 0.45;
      const ring = ringMesh(1.6, 0x93c5fd, 0.85);
      ring.position.set(ox, oy - 0.5, oz);
      grp.add(ring);
      update = (t) => {
        ring.scale.setScalar(0.5 + t * 1.4);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - t);
      };
    } else if (slot === 'E') {
      maxTtl = 0.5;
      const tether = beamMesh(ox, oy, oz, tx, ty, tz, 0.12, 0x4fd8ff);
      grp.add(tether);
      update = (t) => {
        (tether.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t);
      };
    } else if (slot === 'F') {
      maxTtl = 0.5;
      const gale = ringMesh(2.0, 0xa5d8ff, 0.85);
      gale.position.set(ox, oy - 0.4, oz);
      grp.add(gale);
      update = (t) => {
        gale.position.y = oy - 0.4 + t * 3.0;
        gale.scale.setScalar(1 + t);
        (gale.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - t);
      };
    } else {
      // Golden Tall-Eye railgun beam
      maxTtl = 0.55;
      const rail = beamMesh(ox, oy, oz, tx, ty, tz, 0.24, 0xffd54f);
      grp.add(rail);
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
  x: number,
  y: number,
  z: number,
  radius: number,
): SpellFx {
  const grp = new THREE.Group();
  grp.position.set(x, y + 0.5, z);
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.8 }),
  );
  const ring = ringMesh(radius, 0xffd54f, 0.9);
  ring.position.y = -0.45;
  grp.add(core, ring);
  scene.add(grp);
  return {
    obj: grp,
    ttl: 0.55,
    maxTtl: 0.55,
    update: (t) => {
      core.scale.setScalar(1 + t * 2.8);
      (core.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - t);
      ring.scale.setScalar(0.3 + t * 0.9);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t);
    },
  };
}
