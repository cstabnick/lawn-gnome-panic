// The NPC gnomes the player sees: survival combat state (HP, fighting Hatless back, falling), name labels, and idle breathing.
import * as THREE from 'three';
import type { GnomeModel } from '@lawn/gnome';
import { GNOME_HEIGHT } from '../config';
import type { NpcId } from '../sim/types';
import type { HatlessSystem, NpcActors, PlayerState } from '../game/types';
import type { SpotDef } from '../world/types';
import type { Collider } from '../world/collide';
import { makeGnome, npcLook } from './gnomes';

const FACE_RANGE = 10;   // gm: turn to face the player inside this
const LABEL_RANGE = 8;   // gm: show the name label inside this
const NPC_RADIUS = 0.35;
const NPC_STEP_UP = 0.5;
const PATROL_RADIUS = 4.2;
const PATROL_SPEED = 1.25;
const ENGAGE_SPEED = 2.5;
const FLEE_SPEED = 2.9;

export type NpcAiState = 'patrol' | 'engage' | 'flee' | 'recover' | 'fallen';

interface Actor {
  id: NpcId;
  name: string;
  root: THREE.Group;
  model: GnomeModel;
  body: THREE.Object3D;
  baseScale: number;
  label: THREE.Sprite;
  labelTex: THREE.CanvasTexture;
  labelMat: THREE.SpriteMaterial;
  hpBar: THREE.Sprite;
  hpCanvas: HTMLCanvasElement;
  hpTex: THREE.CanvasTexture;
  hpMat: THREE.SpriteMaterial;
  lastHpRatio: number;
  phase: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  aiState: NpcAiState;
  home: { x: number; y: number; z: number };
  patrolTarget: { x: number; z: number };
  patrolWait: number;
  combatTimer: number;
  attackCd: number;
  swingLeft: number;
}

function makeLabel(name: string): { sprite: THREE.Sprite; tex: THREE.CanvasTexture; mat: THREE.SpriteMaterial } {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const g = canvas.getContext('2d');
  if (g) {
    g.font = 'bold 30px sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.strokeText(name, 128, 32);
    g.fillStyle = '#f4efe0'; g.fillText(name, 128, 32);
  }
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.6, 0.4, 1);
  sprite.position.y = GNOME_HEIGHT + 0.35;
  return { sprite, tex, mat };
}

function makeHpBar(): { sprite: THREE.Sprite; canvas: HTMLCanvasElement; tex: THREE.CanvasTexture; mat: THREE.SpriteMaterial } {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 12;
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.95, 0.18, 1);
  sprite.position.y = GNOME_HEIGHT + 0.62;
  sprite.visible = false;
  return { sprite, canvas, tex, mat };
}

function drawHpBar(a: Actor): void {
  const ratio = Math.max(0, Math.min(1, a.hp / a.maxHp));
  if (Math.abs(ratio - a.lastHpRatio) < 0.02) return;
  a.lastHpRatio = ratio;
  const g = a.hpCanvas.getContext('2d');
  if (!g) return;
  g.clearRect(0, 0, 64, 12);
  g.fillStyle = 'rgba(12,16,12,0.85)';
  g.fillRect(0, 0, 64, 12);
  g.fillStyle = ratio > 0.45 ? '#66c96e' : ratio > 0.25 ? '#e8c35a' : '#d9534f';
  g.fillRect(2, 2, Math.round(60 * ratio), 8);
  a.hpTex.needsUpdate = true;
}

export function createNpcActors(deps: { scene: THREE.Scene; collider: Collider; getPlayer: () => PlayerState }): NpcActors {
  const { scene, collider, getPlayer } = deps;
  const actors = new Map<NpcId, Actor>();
  let spots: readonly SpotDef[] = [];
  let clockT = 0;
  let hatless: HatlessSystem | null = null;
  const fallenListeners: ((id: NpcId, name: string) => void)[] = [];
  const moveOut = { x: 0, y: 0, z: 0 };

  const remove = (id: NpcId): void => {
    const a = actors.get(id);
    if (!a) return;
    scene.remove(a.root);
    a.labelTex.dispose();
    a.labelMat.dispose();
    a.hpTex.dispose();
    a.hpMat.dispose();
    actors.delete(id);
  };

  return {
    nearest(pos, radius) {
      let best: NpcId | null = null;
      let bestD = radius;
      for (const [id, a] of actors) {
        if (!a.alive) continue;
        const d = Math.hypot(a.root.position.x - pos.x, a.root.position.z - pos.z);
        if (d <= bestD) { bestD = d; best = id; }
      }
      return best;
    },
    positionOf(id) {
      const a = actors.get(id);
      return a ? { x: a.root.position.x, y: a.root.position.y, z: a.root.position.z } : null;
    },
    show(npcs, spotList) {
      if (spotList.length > 0) spots = spotList;
      for (const npc of npcs) {
        if (actors.has(npc.id)) continue;
        const spot = spots.length > 0 ? spots[actors.size % spots.length] : undefined;
        const root = new THREE.Group();
        const model = makeGnome(npcLook(npc.lookSeed));
        root.add(model.object);
        const label = makeLabel(npc.name);
        label.sprite.visible = false;
        root.add(label.sprite);
        const hpBar = makeHpBar();
        root.add(hpBar.sprite);
        const hx = spot?.x ?? 0;
        const hy = spot?.y ?? 0;
        const hz = spot?.z ?? 0;
        root.position.set(hx, hy, hz);
        scene.add(root);
        actors.set(npc.id, {
          id: npc.id, name: npc.name, root, model, body: model.object, baseScale: model.object.scale.y,
          label: label.sprite, labelTex: label.tex, labelMat: label.mat,
          hpBar: hpBar.sprite, hpCanvas: hpBar.canvas, hpTex: hpBar.tex, hpMat: hpBar.mat, lastHpRatio: -1,
          phase: npc.id * 1.37,
          hp: 6, maxHp: 6, alive: true, aiState: 'patrol',
          home: { x: hx, y: hy, z: hz },
          patrolTarget: { x: hx, z: hz },
          patrolWait: (npc.id % 5) * 0.6,
          combatTimer: 0,
          attackCd: 0, swingLeft: 0,
        });
      }
    },
    remove,
    clear() { for (const id of [...actors.keys()]) remove(id); },
    combatTargets() {
      const out: { key: string; pos: { x: number; y: number; z: number } }[] = [];
      for (const a of actors.values()) {
        if (!a.alive) continue;
        out.push({ key: `npc:${a.id}`, pos: { x: a.root.position.x, y: a.root.position.y, z: a.root.position.z } });
      }
      return out;
    },
    receiveHit(key, strength, from) {
      const id = Number(key.replace('npc:', '')) as NpcId;
      const a = actors.get(id);
      if (!a || !a.alive) return;
      a.hp -= Math.max(0.5, strength * 1.2);
      a.combatTimer = 4.0;
      // Knockback slightly away from attacker
      const dx = a.root.position.x - from.x;
      const dz = a.root.position.z - from.z;
      const d = Math.hypot(dx, dz);
      if (d > 1e-4) {
        collider.move(a.root.position, (dx / d) * 0.35, (dz / d) * 0.35, NPC_RADIUS, GNOME_HEIGHT, NPC_STEP_UP, moveOut);
        a.root.position.x = moveOut.x;
        a.root.position.z = moveOut.z;
        a.root.position.y = collider.groundAt(moveOut.x, moveOut.z, a.root.position.y + 0.5);
      }
      if (a.hp <= 0) {
        a.hp = 0;
        a.alive = false;
        a.aiState = 'fallen';
        a.model.setDead(true);
        a.label.visible = false;
        a.hpBar.visible = false;
        for (const fn of fallenListeners) fn(a.id, a.name);
      }
    },
    setHatless(h) { hatless = h; },
    onFallen(fn) { fallenListeners.push(fn); },
    update(dt: number) {
      clockT += dt;
      const p = getPlayer();
      const stepMove = (a: Actor, dx: number, dz: number, speed: number): void => {
        const d = Math.hypot(dx, dz);
        if (d < 1e-4) return;
        const step = Math.min(d, speed * dt);
        const mx = (dx / d) * step;
        const mz = (dz / d) * step;
        collider.move(a.root.position, mx, mz, NPC_RADIUS, GNOME_HEIGHT, NPC_STEP_UP, moveOut);
        a.root.position.x = moveOut.x;
        a.root.position.z = moveOut.z;
        a.root.position.y = collider.groundAt(moveOut.x, moveOut.z, a.root.position.y + 0.6);
        a.root.rotation.y = Math.atan2(dx, dz);
      };

      for (const a of actors.values()) {
        if (!a.alive) {
          a.aiState = 'fallen';
          a.hpBar.visible = false;
          continue;
        }
        if (a.attackCd > 0) a.attackCd -= dt;
        if (a.combatTimer > 0) a.combatTimer -= dt;
        if (a.swingLeft > 0) {
          a.swingLeft = Math.max(0, a.swingLeft - dt);
          a.model.arms.right.rotation.x = -1.4 * Math.sin(Math.PI * (1 - a.swingLeft / 0.28));
        } else {
          a.model.arms.right.rotation.x = 0;
        }

        const threat = hatless?.nearestPos?.(a.root.position, 10) ?? null;
        if (threat) {
          a.combatTimer = 3.0;
          const tdx = threat.x - a.root.position.x;
          const tdz = threat.z - a.root.position.z;
          const td = Math.hypot(tdx, tdz);

          if (a.hp > 2) {
            a.aiState = 'engage';
            if (td > 1.8) {
              stepMove(a, tdx, tdz, ENGAGE_SPEED);
            } else {
              a.root.rotation.y = Math.atan2(tdx, tdz);
            }
            if (a.attackCd <= 0 && td <= 2.4 && hatless) {
              a.attackCd = 1.1;
              a.swingLeft = 0.28;
              hatless.strike(a.root.position, a.root.rotation.y, 2.6, 1.0);
            }
          } else {
            a.aiState = 'flee';
            stepMove(a, -tdx, -tdz, FLEE_SPEED);
          }
        } else {
          // Safe out of combat: slowly regenerate HP
          if (a.hp < a.maxHp && a.combatTimer <= 0) {
            a.aiState = 'recover';
            a.hp = Math.min(a.maxHp, a.hp + 0.25 * dt);
          } else {
            a.aiState = 'patrol';
          }

          // Gentle patrol around home spot
          const pdx = a.patrolTarget.x - a.root.position.x;
          const pdz = a.patrolTarget.z - a.root.position.z;
          if (Math.hypot(pdx, pdz) > 0.35) {
            stepMove(a, pdx, pdz, PATROL_SPEED);
          } else {
            a.patrolWait -= dt;
            if (a.patrolWait <= 0) {
              a.patrolWait = 2.0 + ((a.id * 7) % 3);
              const ang = (clockT * 0.7 + a.phase) % (Math.PI * 2);
              const rad = 1.5 + ((a.id % 3) * 0.9);
              a.patrolTarget.x = a.home.x + Math.cos(ang) * Math.min(PATROL_RADIUS, rad);
              a.patrolTarget.z = a.home.z + Math.sin(ang) * Math.min(PATROL_RADIUS, rad);
            }
          }
        }

        const dx = p.pos.x - a.root.position.x;
        const dz = p.pos.z - a.root.position.z;
        const dist = Math.hypot(dx, dz);
        if (!threat && dist < FACE_RANGE && a.patrolWait > 0.2) a.root.rotation.y = Math.atan2(dx, dz);
        a.body.scale.y = a.baseScale * (1 + 0.015 * Math.sin(clockT * 2.2 + a.phase));
        a.label.visible = dist <= LABEL_RANGE;

        if (a.hp < a.maxHp) {
          drawHpBar(a);
          a.hpBar.visible = true;
        } else {
          a.hpBar.visible = false;
        }
      }
    },
    ids: () => [...actors.keys()],
  };
}
