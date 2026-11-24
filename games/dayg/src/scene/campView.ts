// 3D active turrets, camp defenses, tracer beams, and hired camp NPCs.
import * as THREE from 'three';
import type { HatlessSystem } from '../game/types';
import { DEFENSE_CATALOG, type CampState } from '../base/campSecurity';
import { makeGnome, npcLook } from './gnomes';

interface TurretRuntime {
  id: string;
  kind: string;
  pos: { x: number; y: number; z: number };
  head: THREE.Object3D;
  range: number;
  damage: number;
  cooldown: number;
  cdLeft: number;
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
  const tracers: Tracer[] = [];

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.9 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x4b5258, metalness: 0.6, roughness: 0.45 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xe8c35a, metalness: 0.5, roughness: 0.35 });
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0x8a7558, roughness: 0.85 });

  function buildDefenseMesh(kind: string): { obj: THREE.Object3D; head?: THREE.Object3D } {
    const g = new THREE.Group();
    if (kind === 'slingshot-turret' || kind === 'nail-turret') {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 0.95, 8), woodMat);
      base.position.y = 0.48;
      const head = new THREE.Group();
      head.position.y = 1.05;
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.32, 0.56), kind === 'nail-turret' ? ironMat : woodMat);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.65, 8), ironMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, 0.42);
      head.add(box, barrel);
      g.add(base, head);
      return { obj: g, head };
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
      const light = new THREE.PointLight(0xffcb7a, 1.3, 16, 2);
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
    // spike-pit
    for (let i = -2; i <= 2; i++) {
      const s = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.65, 6), spikeMat);
      s.position.set(i * 0.42, 0.32, (i % 2) * 0.28);
      g.add(s);
    }
    return { obj: g };
  }

  function spawnTracer(from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }): void {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(from.x, from.y + 1.1, from.z),
      new THREE.Vector3(to.x, to.y + 0.85, to.z),
    ]);
    const mat = new THREE.LineBasicMaterial({ color: 0xffd56a, transparent: true, opacity: 0.95 });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    tracers.push({ line, life: 0.14 });
  }

  return {
    sync(camp: CampState) {
      root.clear();
      turrets.length = 0;

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
            camp.center!.x + Math.cos(ang) * 2.5,
            camp.center!.y,
            camp.center!.z + Math.sin(ang) * 2.5,
          );
          m.object.rotation.y = ang + Math.PI;
          root.add(m.object);
        });
      }

      for (const d of camp.defenses) {
        const cat = DEFENSE_CATALOG.find((x) => x.kind === d.kind);
        const built = buildDefenseMesh(d.kind);
        built.obj.position.set(d.x, d.y, d.z);
        root.add(built.obj);
        if (cat && cat.range > 0) {
          turrets.push({
            id: d.id,
            kind: d.kind,
            pos: { x: d.x, y: d.y, z: d.z },
            head: built.head ?? built.obj,
            range: cat.range,
            damage: cat.damage,
            cooldown: cat.cooldown,
            cdLeft: 0,
          });
        }
      }
    },
    update(dt: number) {
      for (let i = tracers.length - 1; i >= 0; i--) {
        tracers[i].life -= dt;
        if (tracers[i].life <= 0) {
          scene.remove(tracers[i].line);
          tracers[i].line.geometry.dispose();
          (tracers[i].line.material as THREE.Material).dispose();
          tracers.splice(i, 1);
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
        spawnTracer(t.pos, target);
        t.cdLeft = t.cooldown;
      }
    },
  };
}
