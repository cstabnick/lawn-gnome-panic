// 3D active turrets (Mk I-III), sweeping searchlights, tracer beams, and autonomous patrolling/fighting camp crew.
import * as THREE from 'three';
import type { GnomeModel } from '@lawn/gnome';
import type { HatlessSystem } from '../game/types';
import { DEFENSE_CATALOG, tickCampProduction, type CampState } from '../base/campSecurity';
import { makeGnome, npcLook } from './gnomes';

interface TurretRuntime {
  id: string;
  kind: string;
  tier: number;
  pos: { x: number; y: number; z: number };
  head: THREE.Object3D;
  range: number;
  damage: number;
  cooldown: number;
  cdLeft: number;
}

interface CrewActor {
  id: string;
  role: string;
  model: GnomeModel;
  home: { x: number; y: number; z: number };
  angle: number;
  attackCd: number;
  swingLeft: number;
}

interface Tracer {
  line: THREE.Line;
  life: number;
}

export interface CampView {
  sync(camp: CampState): void;
  update(dt: number): void;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function createCampView(deps: { scene: THREE.Scene; hatless: HatlessSystem; onToast: (t: string) => void }): CampView {
  const { scene, hatless, onToast } = deps;
  const root = new THREE.Group();
  root.name = 'dayg-player-camp';
  scene.add(root);

  const turrets: TurretRuntime[] = [];
  const searchlights: THREE.Object3D[] = [];
  const crew: CrewActor[] = [];
  const tracers: Tracer[] = [];
  let activeCamp: CampState | null = null;
  let sweepT = 0;

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.9 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x4b5258, metalness: 0.6, roughness: 0.45 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xe8c35a, metalness: 0.5, roughness: 0.35 });
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0x8a7558, roughness: 0.85 });
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });

  function buildDefenseMesh(kind: string, tier: number): { obj: THREE.Object3D; head?: THREE.Object3D; sweepHead?: THREE.Object3D } {
    const g = new THREE.Group();
    if (kind === 'slingshot-turret' || kind === 'nail-turret' || kind === 'auto-crossbow') {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 0.95, 8), tier >= 2 ? ironMat : woodMat);
      base.position.y = 0.48;
      const head = new THREE.Group();
      head.position.y = 1.05;
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.32, 0.56), kind === 'slingshot-turret' ? woodMat : ironMat);
      head.add(box);
      const barrels = tier >= 3 ? 2 : 1;
      for (let b = 0; b < barrels; b++) {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.7, 8), tier >= 3 ? goldMat : ironMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(barrels === 2 ? (b === 0 ? -0.11 : 0.11) : 0, 0.02, 0.44);
        head.add(barrel);
      }
      g.add(base, head);
      return { obj: g, head };
    }
    if (kind === 'searchlight-tower') {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 3.2, 8), ironMat);
      post.position.y = 1.6;
      const sweepHead = new THREE.Group();
      sweepHead.position.y = 3.2;
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.45), goldMat);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 11, 14, 1, true), beamMat);
      cone.rotation.x = -Math.PI / 2 - 0.25;
      cone.position.set(0, -1.3, 5.5);
      sweepHead.add(lamp, cone);
      g.add(post, sweepHead);
      return { obj: g, sweepHead };
    }
    if (kind === 'alarm-bell') {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.8, 8), woodMat);
      post.position.y = 0.9;
      const bell = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.28, 10), goldMat);
      bell.position.set(0, 1.65, 0.12);
      g.add(post, bell);
      return { obj: g };
    }
    if (kind === 'watchtower') {
      const deck = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 2.2), woodMat);
      deck.position.y = 2.6;
      for (const [px, pz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]] as const) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.8, 0.22), woodMat);
        p.position.set(px, 1.4, pz);
        g.add(p);
      }
      const light = new THREE.PointLight(0xffcb7a, 1.3, 18, 2);
      light.position.y = 3.2;
      g.add(deck, light);
      return { obj: g };
    }
    if (kind === 'reinforced-gate') {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.0, 0.32), ironMat);
      wall.position.y = 1.0;
      g.add(wall);
      return { obj: g };
    }
    for (let i = -2; i <= 2; i++) {
      const s = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.65, 6), spikeMat);
      s.position.set(i * 0.42, 0.32, (i % 2) * 0.28);
      g.add(s);
    }
    return { obj: g };
  }

  function spawnTracer(from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }, color = 0xffd56a): void {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(from.x, from.y + 1.1, from.z),
      new THREE.Vector3(to.x, to.y + 0.85, to.z),
    ]);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    tracers.push({ line, life: 0.14 });
  }

  return {
    sync(camp: CampState) {
      activeCamp = camp;
      root.clear();
      turrets.length = 0;
      searchlights.length = 0;
      crew.length = 0;

      if (camp.established && camp.center) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.6, 8), woodMat);
        pole.position.set(camp.center.x, camp.center.y + 1.3, camp.center.z);
        const flag = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.05), goldMat);
        flag.position.set(camp.center.x + 0.45, camp.center.y + 2.3, camp.center.z);
        root.add(pole, flag);

        camp.hired.forEach((h, i) => {
          const ang = (i / Math.max(1, camp.hired.length)) * Math.PI * 2;
          const m = makeGnome(npcLook(hashStr(h.survivorId)));
          m.object.position.set(
            camp.center!.x + Math.cos(ang) * 2.6,
            camp.center!.y,
            camp.center!.z + Math.sin(ang) * 2.6,
          );
          root.add(m.object);
          crew.push({
            id: h.survivorId,
            role: h.role,
            model: m,
            home: { ...camp.center! },
            angle: ang,
            attackCd: 0,
            swingLeft: 0,
          });
        });
      }

      for (const d of camp.defenses) {
        const cat = DEFENSE_CATALOG.find((x) => x.kind === d.kind);
        const tier = d.tier ?? 1;
        const built = buildDefenseMesh(d.kind, tier);
        built.obj.position.set(d.x, d.y, d.z);
        root.add(built.obj);
        if (built.sweepHead) searchlights.push(built.sweepHead);
        if (cat && cat.damage > 0 || d.kind === 'alarm-bell') {
          turrets.push({
            id: d.id,
            kind: d.kind,
            tier,
            pos: { x: d.x, y: d.y, z: d.z },
            head: built.head ?? built.obj,
            range: cat!.range + (tier - 1) * 2,
            damage: cat!.damage * (1 + (tier - 1) * 0.4),
            cooldown: Math.max(0.35, cat!.cooldown * (1 - (tier - 1) * 0.15)),
            cdLeft: 0,
          });
        }
      }
    },
    update(dt: number) {
      sweepT += dt;
      if (activeCamp) tickCampProduction(activeCamp, dt / 300);

      for (const sl of searchlights) sl.rotation.y = Math.sin(sweepT * 0.7) * 1.4;

      for (let i = tracers.length - 1; i >= 0; i--) {
        tracers[i].life -= dt;
        if (tracers[i].life <= 0) {
          scene.remove(tracers[i].line);
          tracers[i].line.geometry.dispose();
          (tracers[i].line.material as THREE.Material).dispose();
          tracers.splice(i, 1);
        }
      }

      // Autonomous patrolling & fighting camp crew
      const tmpVel = new THREE.Vector3();
      for (const c of crew) {
        if (c.attackCd > 0) c.attackCd -= dt;
        const pos = c.model.object.position;
        const target = hatless.nearestPos?.(pos, 7) ?? null;
        if (target) {
          const dx = target.x - pos.x, dz = target.z - pos.z;
          const dist = Math.hypot(dx, dz);
          const yaw = Math.atan2(dx, dz);
          if (dist > 1.7) {
            const spd = 2.6;
            tmpVel.set((dx / dist) * spd, 0, (dz / dist) * spd);
            pos.x += tmpVel.x * dt;
            pos.z += tmpVel.z * dt;
          } else {
            tmpVel.set(0, 0, 0);
            if (c.attackCd <= 0) {
              c.attackCd = 1.0;
              c.swingLeft = 0.25;
              hatless.strike(pos, yaw, 2.4, c.role === 'guard' ? 1.5 : 1.0);
            }
          }
          c.model.update({ position: pos, velocity: tmpVel, facing: yaw, grounded: true, jumpsUsed: 0 }, dt);
        } else {
          c.angle += dt * 0.35;
          const gx = c.home.x + Math.cos(c.angle) * 3.0;
          const gz = c.home.z + Math.sin(c.angle) * 3.0;
          const dx = gx - pos.x, dz = gz - pos.z;
          const dist = Math.hypot(dx, dz);
          const yaw = dist > 0.05 ? Math.atan2(dx, dz) : c.angle + Math.PI / 2;
          if (dist > 0.1) {
            tmpVel.set((dx / dist) * 1.1, 0, (dz / dist) * 1.1);
            pos.x += tmpVel.x * dt;
            pos.z += tmpVel.z * dt;
          } else tmpVel.set(0, 0, 0);
          c.model.update({ position: pos, velocity: tmpVel, facing: yaw, grounded: true, jumpsUsed: 0 }, dt);
        }
        if (c.swingLeft > 0) {
          c.swingLeft = Math.max(0, c.swingLeft - dt);
          c.model.arms.right.rotation.x = -1.4 * Math.sin(Math.PI * (1 - c.swingLeft / 0.25));
        }
      }

      for (const t of turrets) {
        if (t.cdLeft > 0) { t.cdLeft -= dt; continue; }
        if (t.kind === 'alarm-bell') {
          if (hatless.nearCount(t.pos, t.range) > 0) {
            t.cdLeft = t.cooldown;
            onToast('🔔 Camp Alarm Bell! Hatless approaching your camp!');
          }
          continue;
        }
        if (t.kind === 'spike-pit') {
          if (hatless.nearCount(t.pos, t.range) > 0) {
            t.cdLeft = t.cooldown;
            hatless.strike(t.pos, 0, t.range + 0.5, t.damage);
          }
          continue;
        }
        const target = hatless.nearestPos?.(t.pos, t.range) ?? null;
        if (!target) continue;
        const yaw = Math.atan2(target.x - t.pos.x, target.z - t.pos.z);
        t.head.rotation.y = yaw;
        hatless.strike(t.pos, yaw, t.range + 1, t.damage);
        spawnTracer(t.pos, target, t.tier >= 3 ? 0x7bd389 : 0xffd56a);
        t.cdLeft = t.cooldown;
      }
    },
  };
}
