import * as THREE from 'three';
import { CHARACTERS, type GnomeModel, type PlayerState, type PuppetState, type PuppetSystem } from '../config';
import { createGnome, createGnomeModel } from '../gnome';
import { createNameTag } from '../br/bots';
import { heightAt } from '../terrain';

// Copies of the bot colour palettes from src/br/bots.ts (not exported there).
const HAT_COLORS = [0xd93636, 0x8e24aa, 0x1e88e5, 0x43a047, 0xfb8c00, 0xfdd835, 0x00acc1, 0xec407a, 0x6d4c41, 0x212121];
const SHIRT_COLORS = [0x2f64c9, 0xc62828, 0x2e7d32, 0x6a1b9a, 0xef6c00, 0x455a64, 0xad1457, 0x00838f];

const TAG_OFFSET_Y = 2.1;
const EASE_RATE = 12;          // per second; k = 1 - exp(-EASE_RATE * dt)
const JUMP_DISTANCE = 15;      // farther than this, snap instead of easing
const MOVING_SPEED = 0.3;      // horizontal speed above which a bot faces its movement

interface Puppet {
  key: string;
  target: PuppetState;
  model: GnomeModel;
  tag: THREE.Sprite;
  state: PlayerState;
  alive: boolean;
}

/** Unsigned 32-bit FNV-1a style hash of a string. */
function hashName(name: string): number {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h = Math.imul(h ^ name.charCodeAt(i), 16777619) >>> 0;
  }
  return h;
}

/** Disposes every geometry and material of a gnome model. */
function disposeModel(model: GnomeModel): void {
  model.object.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) m.dispose();
    }
  });
}

/** Disposes a name tag sprite's texture and material. */
function disposeTag(tag: THREE.Sprite): void {
  const mat = tag.material as THREE.SpriteMaterial;
  mat.map?.dispose();
  mat.dispose();
}

/** Gnomes driven by the network: other players and the host's bots as seen by other clients. */
export function createPuppetSystem(scene: THREE.Scene): PuppetSystem {
  const puppets = new Map<string, Puppet>();

  const build = (s: PuppetState): Puppet => {
    const model = s.look
      ? createGnomeModel(s.color !== null ? { ...s.look, hat: s.color } : s.look)
      : s.character && s.color !== null
      ? createGnomeModel({ ...CHARACTERS[s.character].look, hat: s.color })
      : s.character
        ? createGnomeModel(CHARACTERS[s.character].look)
        : (() => {
            const h = hashName(s.name);
            return createGnome(HAT_COLORS[h % HAT_COLORS.length], SHIRT_COLORS[(h >>> 4) % SHIRT_COLORS.length]);
          })();
    const tag = createNameTag(s.name, s.color);
    scene.add(model.object);
    scene.add(tag);
    model.object.position.set(s.x, s.y, s.z);
    model.object.rotation.set(0, s.facing ?? 0, 0);
    const state: PlayerState = {
      position: new THREE.Vector3(s.x, s.y, s.z),
      velocity: new THREE.Vector3(),
      facing: s.facing ?? 0,
      grounded: true,
      jumpsUsed: 0,
      stamina: 1,
      staminaDelay: 0,
      sprinting: false,
      exhausted: false,
    };
    return { key: s.key, target: { ...s }, model, tag, state, alive: s.alive };
  };

  return {
    set(s: PuppetState): void {
      const existing = puppets.get(s.key);
      if (existing) {
        existing.target = { ...s };
        return;
      }
      puppets.set(s.key, build(s));
    },

    remove(key: string): void {
      const p = puppets.get(key);
      if (!p) return;
      scene.remove(p.model.object);
      scene.remove(p.tag);
      disposeTag(p.tag);
      disposeModel(p.model);
      puppets.delete(key);
    },

    keys(): string[] {
      return [...puppets.keys()];
    },

    update(dt: number): void {
      if (dt <= 0) return;
      const k = 1 - Math.exp(-EASE_RATE * dt);
      for (const p of puppets.values()) {
        const { state, target } = p;
        const pos = state.position;
        const old = pos.clone();

        // Position: ease toward the target, or snap if it is far away.
        const tx = target.x;
        const ty = target.y;
        const tz = target.z;
        if (Math.hypot(tx - pos.x, ty - pos.y, tz - pos.z) > JUMP_DISTANCE) {
          pos.set(tx, ty, tz);
        } else {
          pos.x += (tx - pos.x) * k;
          pos.y += (ty - pos.y) * k;
          pos.z += (tz - pos.z) * k;
        }

        // Velocity from the actual movement this frame (horizontal only).
        state.velocity.set((pos.x - old.x) / dt, 0, (pos.z - old.z) / dt);
        const speed = Math.hypot(state.velocity.x, state.velocity.z);
        state.grounded = pos.y - heightAt(pos.x, pos.z) < 0.15;

        // Facing: follow the target yaw if given, else the movement direction when moving.
        let want: number | null = null;
        if (target.facing !== null) want = target.facing;
        else if (speed > MOVING_SPEED) want = Math.atan2(state.velocity.x, state.velocity.z);
        if (want !== null) {
          const d = want - state.facing;
          state.facing += Math.atan2(Math.sin(d), Math.cos(d)) * k;
        }

        // Dead-state transitions, then the gnome's own animation.
        if (target.alive !== p.alive) {
          p.alive = target.alive;
          p.model.setDead(!p.alive);
        }
        p.model.update(state, dt);
        p.model.object.position.copy(pos);
        p.model.object.rotation.y = state.facing;

        p.tag.position.set(pos.x, pos.y + TAG_OFFSET_Y, pos.z);
        p.tag.visible = p.alive;
      }
    },

    living(prefix: string): THREE.Vector3[] {
      const out: THREE.Vector3[] = [];
      for (const p of puppets.values()) {
        if (p.alive && p.key.startsWith(prefix)) out.push(p.state.position);
      }
      return out;
    },

    position(key: string): THREE.Vector3 | null {
      const p = puppets.get(key);
      return p && p.alive ? p.state.position : null;
    },

    reset(): void {
      for (const key of [...puppets.keys()]) this.remove(key);
    },
  };
}
