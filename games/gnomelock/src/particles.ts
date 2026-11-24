// Physical 3D projectiles, tumbling impact shards, dust puffs, vortex motes, and ambient twilight fireflies.
import * as THREE from 'three';
import type { HeroId, Team } from './sim/config';

interface Projectile3D {
  mesh: THREE.Object3D;
  ox: number;
  oy: number;
  oz: number;
  tx: number;
  ty: number;
  tz: number;
  t: number;
  dur: number;
  hitKind: 'none' | 'body' | 'orb-confirm' | 'orb-deny' | 'structure';
  teamColor: number;
}

interface ShardParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  gravity: number;
  ttl: number;
  maxTtl: number;
  spin: number;
}

interface PuffParticle {
  mesh: THREE.Mesh;
  vy: number;
  ttl: number;
  maxTtl: number;
  maxScale: number;
}

interface VortexParticle {
  mesh: THREE.Mesh;
  cx: number;
  cy: number;
  cz: number;
  angle: number;
  radius: number;
  ttl: number;
  maxTtl: number;
}

interface Firefly {
  mesh: THREE.Mesh;
  bx: number;
  by: number;
  bz: number;
  phase: number;
}

export class VfxSystem {
  private scene: THREE.Scene;
  private projectiles: Projectile3D[] = [];
  private shards: ShardParticle[] = [];
  private puffs: PuffParticle[] = [];
  private vortex: VortexParticle[] = [];
  private fireflies: Firefly[] = [];

  private unitBox = new THREE.BoxGeometry(0.14, 0.14, 0.14);
  private unitSphere = new THREE.SphereGeometry(0.22, 8, 6);
  private unitOcta = new THREE.OctahedronGeometry(0.26, 0);

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initAmbientFireflies();
  }

  private initAmbientFireflies(): void {
    const geo = new THREE.SphereGeometry(0.08, 6, 6);
    for (let i = 0; i < 42; i++) {
      const z = (Math.random() - 0.5) * 195;
      const x = (Math.random() - 0.5) * 64;
      const y = 1.4 + Math.random() * 4.5;
      const col = z < 0 ? 0xffb347 : 0x5cc8ff;
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col }));
      mesh.position.set(x, y, z);
      this.scene.add(mesh);
      this.fireflies.push({ mesh, bx: x, by: y, bz: z, phase: Math.random() * Math.PI * 2 });
    }
  }

  muzzleFlash(x: number, y: number, z: number, color: number): void {
    const core = new THREE.Mesh(
      this.unitOcta,
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 }),
    );
    core.position.set(x, y, z);
    core.scale.set(0.8, 0.8, 1.4);
    this.scene.add(core);
    this.puffs.push({ mesh: core, vy: 0.2, ttl: 0.065, maxTtl: 0.065, maxScale: 1.3 });

    for (const rotZ of [0, Math.PI / 2]) {
      const m = new THREE.Mesh(
        this.unitOcta,
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }),
      );
      m.position.set(x, y, z);
      m.rotation.set(0, 0, rotZ);
      m.scale.set(1.6, 0.4, 0.5);
      this.scene.add(m);
      this.puffs.push({ mesh: m, vy: 0.3, ttl: 0.075, maxTtl: 0.075, maxScale: 1.75 });
    }
  }

  burst(
    x: number,
    y: number,
    z: number,
    color: number,
    count: number,
    opts?: { speed?: number; up?: number; gravity?: number; scale?: number; ttl?: number },
  ): void {
    const speed = opts?.speed ?? 8;
    const up = opts?.up ?? 3.5;
    const gravity = opts?.gravity ?? 18;
    const scale = opts?.scale ?? 1.0;
    const ttl = opts?.ttl ?? 0.55;

    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(this.unitBox, new THREE.MeshBasicMaterial({ color }));
      m.position.set(x, y, z);
      m.scale.setScalar(scale * (0.7 + Math.random() * 0.6));
      this.scene.add(m);
      const ang = Math.random() * Math.PI * 2;
      const rad = (0.35 + Math.random() * 0.65) * speed;
      this.shards.push({
        mesh: m,
        vx: Math.cos(ang) * rad,
        vy: up + Math.random() * speed * 0.55,
        vz: Math.sin(ang) * rad,
        gravity,
        ttl: ttl * (0.7 + Math.random() * 0.5),
        maxTtl: ttl,
        spin: (Math.random() - 0.5) * 14,
      });
    }
  }

  dustPuff(x: number, y: number, z: number, color = 0xd9cbb8, count = 5, maxScale = 1.8): void {
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(
        this.unitSphere,
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 }),
      );
      m.position.set(x + (Math.random() - 0.5) * 0.55, y + 0.15, z + (Math.random() - 0.5) * 0.55);
      this.scene.add(m);
      this.puffs.push({
        mesh: m,
        vy: 0.8 + Math.random() * 1.4,
        ttl: 0.32 + Math.random() * 0.15,
        maxTtl: 0.45,
        maxScale,
      });
    }
  }

  spawnVortexMote(cx: number, cy: number, cz: number, radius: number, color = 0xc084fc): void {
    const m = new THREE.Mesh(
      this.unitBox,
      new THREE.MeshBasicMaterial({ color }),
    );
    m.scale.setScalar(0.85);
    const angle = Math.random() * Math.PI * 2;
    const r = radius * (0.65 + Math.random() * 0.35);
    m.position.set(cx + Math.cos(angle) * r, cy + 0.5 + Math.random() * 1.8, cz + Math.sin(angle) * r);
    this.scene.add(m);
    this.vortex.push({ mesh: m, cx, cy: cy + 1.4, cz, angle, radius: r, ttl: 0.48, maxTtl: 0.48 });
  }

  spawnProjectile(
    heroId: HeroId,
    team: Team,
    ox: number,
    oy: number,
    oz: number,
    tx: number,
    ty: number,
    tz: number,
    hitKind: 'none' | 'body' | 'orb-confirm' | 'orb-deny' | 'structure',
  ): void {
    const teamColor = team === 0 ? 0xff9f43 : 0x4fd8ff;
    const dist = Math.max(0.5, Math.hypot(tx - ox, ty - oy, tz - oz));
    const dir = new THREE.Vector3(tx - ox, ty - oy, tz - oz).normalize();

    this.muzzleFlash(ox + dir.x * 0.5, oy + dir.y * 0.5, oz + dir.z * 0.5, teamColor);

    const makeProj = (endX: number, endY: number, endZ: number, speed: number, buildMesh: () => THREE.Object3D, hk: typeof hitKind, tailColor = teamColor) => {
      const root = new THREE.Group();
      root.add(buildMesh());
      const tail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.012, 1.35, 5),
        new THREE.MeshBasicMaterial({ color: tailColor, transparent: true, opacity: 0.85 }),
      );
      tail.rotation.x = Math.PI / 2;
      tail.position.z = -0.72;
      const core = new THREE.Mesh(
        this.unitSphere,
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      core.scale.set(0.32, 0.32, 0.5);
      root.add(tail, core);

      root.position.set(ox, oy, oz);
      root.lookAt(endX, endY, endZ);
      this.scene.add(root);
      this.projectiles.push({
        mesh: root,
        ox,
        oy,
        oz,
        tx: endX,
        ty: endY,
        tz: endZ,
        t: 0,
        dur: Math.max(0.035, Math.min(0.42, dist / speed)),
        hitKind: hk,
        teamColor,
      });
    };

    if (heroId === 'bramble' || heroId === 'loam') {
      // 3 physical pinecone slugs fanning slightly
      for (let i = -1; i <= 1; i++) {
        const off = i * 0.45;
        makeProj(
          tx + off,
          ty + (i === 0 ? 0 : 0.12),
          tz,
          82,
          () => {
            const g = new THREE.Group();
            const cone = new THREE.Mesh(
              new THREE.ConeGeometry(0.11, 0.34, 6),
              new THREE.MeshBasicMaterial({ color: i === 0 ? teamColor : 0x8b5a2b }),
            );
            cone.rotation.x = Math.PI / 2;
            g.add(cone);
            return g;
          },
          i === 0 ? hitKind : 'none',
        );
      }
    } else if (heroId === 'tansy' || heroId === 'buckshot') {
      makeProj(
        tx,
        ty,
        tz,
        118,
        () => {
          const capsule = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.07, 0.55, 6),
            new THREE.MeshBasicMaterial({ color: heroId === 'buckshot' ? 0xffd54f : 0x7cc44f }),
          );
          capsule.rotation.x = Math.PI / 2;
          return capsule;
        },
        hitKind,
      );
    } else if (heroId === 'fernwick' || heroId === 'hookwort') {
      makeProj(
        tx,
        ty,
        tz,
        110,
        () => {
          const g = new THREE.Group();
          const acorn = new THREE.Mesh(
            new THREE.SphereGeometry(0.13, 8, 6),
            new THREE.MeshBasicMaterial({ color: 0xffd54f }),
          );
          const tail = new THREE.Mesh(
            new THREE.ConeGeometry(0.09, 0.45, 6),
            new THREE.MeshBasicMaterial({ color: teamColor }),
          );
          tail.rotation.x = -Math.PI / 2;
          tail.position.z = -0.22;
          g.add(acorn, tail);
          return g;
        },
        hitKind,
      );
    } else {
      // potsworth / thistle high-velocity glowing orb + ring
      makeProj(
        tx,
        ty,
        tz,
        140,
        () => {
          const g = new THREE.Group();
          const orb = new THREE.Mesh(
            new THREE.SphereGeometry(0.14, 8, 8),
            new THREE.MeshBasicMaterial({ color: heroId === 'thistle' ? 0xa65cff : 0x7cc44f }),
          );
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.2, 0.03, 6, 12),
            new THREE.MeshBasicMaterial({ color: 0xffffff }),
          );
          g.add(orb, ring);
          return g;
        },
        hitKind,
      );
    }
  }

  update(dt: number, timeS: number): void {
    // 1. Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.t += dt / p.dur;
      if (p.t >= 1) {
        this.scene.remove(p.mesh);
        if (p.hitKind !== 'none') {
          const ring = new THREE.Mesh(
            this.unitOcta,
            new THREE.MeshBasicMaterial({ color: p.hitKind === 'orb-confirm' ? 0xffd54f : p.hitKind === 'orb-deny' ? 0xff4d6d : 0xffffff, transparent: true, opacity: 0.8 }),
          );
          ring.position.set(p.tx, p.ty, p.tz);
          this.scene.add(ring);
          this.puffs.push({ mesh: ring, vy: 0.2, ttl: 0.12, maxTtl: 0.12, maxScale: 2.2 });
        }
        if (p.hitKind === 'orb-confirm') {
          this.burst(p.tx, p.ty, p.tz, 0xffd54f, 10, { speed: 7, up: 4 });
        } else if (p.hitKind === 'orb-deny') {
          this.burst(p.tx, p.ty, p.tz, 0xff4d6d, 12, { speed: 8, up: 4.5 });
        } else if (p.hitKind === 'body') {
          this.burst(p.tx, p.ty, p.tz, 0xf1c27d, 5, { speed: 5, up: 2, scale: 0.7, ttl: 0.3 });
        } else if (p.hitKind === 'structure') {
          this.burst(p.tx, p.ty, p.tz, p.teamColor, 6, { speed: 6, up: 2.5, scale: 0.85, ttl: 0.35 });
        }
        this.projectiles.splice(i, 1);
      } else {
        p.mesh.position.set(
          p.ox + (p.tx - p.ox) * p.t,
          p.oy + (p.ty - p.oy) * p.t,
          p.oz + (p.tz - p.oz) * p.t,
        );
        p.mesh.rotation.z += dt * 18;
      }
    }

    // 2. Shards
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i];
      s.ttl -= dt;
      s.vy -= s.gravity * dt;
      s.mesh.position.x += s.vx * dt;
      s.mesh.position.y += s.vy * dt;
      s.mesh.position.z += s.vz * dt;
      s.mesh.rotation.x += s.spin * dt;
      s.mesh.rotation.y += s.spin * dt;
      if (s.ttl <= 0) {
        this.scene.remove(s.mesh);
        this.shards.splice(i, 1);
      } else {
        s.mesh.scale.multiplyScalar(Math.max(0.85, 1 - dt * 1.4));
      }
    }

    // 3. Puffs
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const pf = this.puffs[i];
      pf.ttl -= dt;
      if (pf.ttl <= 0) {
        this.scene.remove(pf.mesh);
        this.puffs.splice(i, 1);
      } else {
        const prog = 1 - pf.ttl / pf.maxTtl;
        pf.mesh.position.y += pf.vy * dt;
        pf.mesh.scale.setScalar(0.6 + prog * pf.maxScale);
        (pf.mesh.material as THREE.MeshBasicMaterial).opacity = 0.65 * (1 - prog);
      }
    }

    // 4. Vortex motes (sucked into Black Hole)
    for (let i = this.vortex.length - 1; i >= 0; i--) {
      const v = this.vortex[i];
      v.ttl -= dt;
      if (v.ttl <= 0) {
        this.scene.remove(v.mesh);
        this.vortex.splice(i, 1);
      } else {
        v.angle += dt * 9.5;
        v.radius = Math.max(0.2, v.radius - dt * 12);
        v.mesh.position.set(
          v.cx + Math.cos(v.angle) * v.radius,
          v.cy + (v.mesh.position.y - v.cy) * 0.9,
          v.cz + Math.sin(v.angle) * v.radius,
        );
      }
    }

    // 5. Ambient fireflies
    for (const f of this.fireflies) {
      f.mesh.position.x = f.bx + Math.sin(timeS * 0.9 + f.phase) * 1.2;
      f.mesh.position.y = f.by + Math.sin(timeS * 1.4 + f.phase * 1.7) * 0.55;
      f.mesh.position.z = f.bz + Math.cos(timeS * 0.8 + f.phase) * 1.2;
    }
  }
}
