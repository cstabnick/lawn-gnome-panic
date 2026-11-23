// The NPC gnomes the player sees: one idle gnome per promoted-region NPC, on its own spot, with a name label up close.
import * as THREE from 'three';
import { GNOME_HEIGHT } from '../config';
import type { NpcId } from '../sim/types';
import type { NpcActors, PlayerState } from '../game/types';
import type { SpotDef } from '../world/types';
import type { Collider } from '../world/collide';
import { makeGnome, npcLook } from './gnomes';

const FACE_RANGE = 10;   // gm: turn to face the player inside this
const LABEL_RANGE = 8;   // gm: show the name label inside this

interface Actor { id: NpcId; root: THREE.Group; body: THREE.Object3D; baseScale: number; label: THREE.Sprite; labelTex: THREE.CanvasTexture; labelMat: THREE.SpriteMaterial; phase: number }

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

export function createNpcActors(deps: { scene: THREE.Scene; collider: Collider; getPlayer: () => PlayerState }): NpcActors {
  const { scene, getPlayer } = deps;
  const actors = new Map<NpcId, Actor>();
  let spots: readonly SpotDef[] = [];
  let clockT = 0;

  const remove = (id: NpcId): void => {
    const a = actors.get(id);
    if (!a) return;
    scene.remove(a.root);
    a.labelTex.dispose();
    a.labelMat.dispose();
    actors.delete(id);
  };

  return {
    nearest(pos, radius) {
      let best: NpcId | null = null;
      let bestD = radius;
      for (const [id, a] of actors) {
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
        root.position.set(spot?.x ?? 0, spot?.y ?? 0, spot?.z ?? 0);
        scene.add(root);
        actors.set(npc.id, {
          id: npc.id, root, body: model.object, baseScale: model.object.scale.y,
          label: label.sprite, labelTex: label.tex, labelMat: label.mat, phase: npc.id * 1.37,
        });
      }
    },
    remove,
    clear() { for (const id of [...actors.keys()]) remove(id); },
    update(dt: number) {
      clockT += dt;
      const p = getPlayer();
      for (const a of actors.values()) {
        const dx = p.pos.x - a.root.position.x;
        const dz = p.pos.z - a.root.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < FACE_RANGE) a.root.rotation.y = Math.atan2(dx, dz);
        // Breathing sway: a slow stretch of the body's height.
        a.body.scale.y = a.baseScale * (1 + 0.015 * Math.sin(clockT * 2.2 + a.phase));
        a.label.visible = dist <= LABEL_RANGE;
      }
    },
    ids: () => [...actors.keys()],
  };
}
